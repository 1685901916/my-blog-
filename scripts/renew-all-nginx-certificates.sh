#!/usr/bin/env bash

set -uo pipefail

THRESHOLD_DAYS="${THRESHOLD_DAYS:-20}"
THRESHOLD_SECONDS=$((THRESHOLD_DAYS * 24 * 60 * 60))
ACME="${ACME:-/root/.acme.sh/acme.sh}"
NGINX="${NGINX:-/www/server/nginx/sbin/nginx}"
VHOST_DIR="${VHOST_DIR:-/www/server/panel/vhost/nginx}"
BACKUP_ROOT="${BACKUP_ROOT:-/root/cert-backups/automatic}"
LOCK_FILE="${LOCK_FILE:-/run/lock/renew-all-nginx-certificates.lock}"
DRY_RUN=0
FAILURES=0
RENEWED=0

if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=1
fi

log() {
  printf '%s %s\n' "$(date '+%Y-%m-%d %H:%M:%S%z')" "$*"
}

valid_domain() {
  local domain="$1"
  [[ "$domain" != "_" ]] &&
    [[ "$domain" != "localhost" ]] &&
    [[ "$domain" != "127.0.0.1" ]] &&
    [[ "$domain" != *"*"* ]] &&
    [[ "$domain" == *.* ]]
}

restore_site() {
  local cert_dir="$1"
  local config="$2"
  local backup_dir="$3"

  if [[ -d "$backup_dir/cert" ]]; then
    rm -rf -- "$cert_dir"
    cp -a -- "$backup_dir/cert" "$cert_dir"
  fi
  if [[ -f "$backup_dir/site.conf" ]]; then
    cp -a -- "$backup_dir/site.conf" "$config"
  fi
  "$NGINX" -t && "$NGINX" -s reload || true
}

challenge_preflight() {
  local root="$1"
  shift
  local domains=("$@")
  local challenge_dir="$root/.well-known/acme-challenge"
  local token="codex-cert-check-$(date +%s)-$$"
  local token_file="$challenge_dir/$token"
  local domain
  local response

  mkdir -p -- "$challenge_dir" || return 1
  printf '%s' "$token" >"$token_file" || return 1

  for domain in "${domains[@]}"; do
    response="$(
      curl -kfsSL \
        --connect-timeout 8 \
        --max-time 20 \
        "http://$domain/.well-known/acme-challenge/$token" 2>/dev/null
    )" || {
      rm -f -- "$token_file"
      return 1
    }
    if [[ "$response" != "$token" ]]; then
      rm -f -- "$token_file"
      return 1
    fi
  done

  rm -f -- "$token_file"
  return 0
}

renew_site() {
  local config="$1"
  local cert_path="$2"
  local key_path="$3"
  local root="$4"
  shift 4
  local domains=("$@")
  local main_domain="${domains[0]}"
  local cert_dir
  local backup_dir
  local timestamp
  local acme_cert
  local acme_key
  local issue_args
  local domain

  cert_dir="$(dirname -- "$cert_path")"
  timestamp="$(date +%Y%m%d-%H%M%S)"
  backup_dir="$BACKUP_ROOT/${main_domain}-${timestamp}"

  if ! challenge_preflight "$root" "${domains[@]}"; then
    log "ERROR domain=$main_domain challenge_preflight_failed root=$root"
    return 1
  fi

  mkdir -p -- "$backup_dir" || return 1
  chmod 700 "$BACKUP_ROOT" "$backup_dir" 2>/dev/null || true
  if [[ -d "$cert_dir" ]]; then
    cp -a -- "$cert_dir" "$backup_dir/cert" || return 1
  fi
  cp -a -- "$config" "$backup_dir/site.conf" || return 1
  log "BACKUP domain=$main_domain path=$backup_dir"

  issue_args=(
    --issue
    --server letsencrypt
    --webroot "$root"
    --keylength ec-256
    --force
  )
  for domain in "${domains[@]}"; do
    issue_args+=(--domain "$domain")
  done

  if ! "$ACME" "${issue_args[@]}"; then
    log "ERROR domain=$main_domain acme_issue_failed"
    restore_site "$cert_dir" "$config" "$backup_dir"
    return 1
  fi

  acme_cert="/root/.acme.sh/${main_domain}_ecc/fullchain.cer"
  acme_key="/root/.acme.sh/${main_domain}_ecc/${main_domain}.key"
  if [[ ! -s "$acme_cert" || ! -s "$acme_key" ]]; then
    log "ERROR domain=$main_domain issued_files_missing"
    restore_site "$cert_dir" "$config" "$backup_dir"
    return 1
  fi
  if ! openssl x509 -checkend "$THRESHOLD_SECONDS" -noout -in "$acme_cert"; then
    log "ERROR domain=$main_domain issued_certificate_too_short"
    restore_site "$cert_dir" "$config" "$backup_dir"
    return 1
  fi

  mkdir -p -- "$cert_dir" || return 1
  if ! "$ACME" --install-cert \
    --domain "$main_domain" \
    --ecc \
    --key-file "$key_path" \
    --fullchain-file "$cert_path" \
    --reloadcmd "$NGINX -t && $NGINX -s reload"; then
    log "ERROR domain=$main_domain certificate_install_failed"
    restore_site "$cert_dir" "$config" "$backup_dir"
    return 1
  fi

  if ! "$NGINX" -t; then
    log "ERROR domain=$main_domain nginx_test_failed"
    restore_site "$cert_dir" "$config" "$backup_dir"
    return 1
  fi

  log "RENEWED domain=$main_domain expires=$(openssl x509 -in "$cert_path" -noout -enddate | cut -d= -f2-)"
  return 0
}

if [[ ! -x "$ACME" ]]; then
  log "FATAL acme_not_executable path=$ACME"
  exit 1
fi
if [[ ! -x "$NGINX" ]]; then
  log "FATAL nginx_not_executable path=$NGINX"
  exit 1
fi
if [[ ! -d "$VHOST_DIR" ]]; then
  log "FATAL vhost_directory_missing path=$VHOST_DIR"
  exit 1
fi

if [[ "$DRY_RUN" -eq 0 ]]; then
  mkdir -p -- "$(dirname -- "$LOCK_FILE")" "$BACKUP_ROOT"
  exec 9>"$LOCK_FILE"
  if ! flock -n 9; then
    log "SKIP another_run_is_active"
    exit 0
  fi
fi

log "START threshold_days=$THRESHOLD_DAYS dry_run=$DRY_RUN"

shopt -s nullglob
for config in "$VHOST_DIR"/*.conf; do
  cert_path="$(
    awk '
      $1 == "ssl_certificate" {
        gsub(/;/, "", $2)
        print $2
        exit
      }
    ' "$config"
  )"
  key_path="$(
    awk '
      $1 == "ssl_certificate_key" {
        gsub(/;/, "", $2)
        print $2
        exit
      }
    ' "$config"
  )"
  root="$(
    awk '
      $1 == "root" {
        gsub(/;/, "", $2)
        print $2
        exit
      }
    ' "$config"
  )"
  server_names="$(
    awk '
      $1 == "server_name" {
        for (i = 2; i <= NF; i++) {
          gsub(/;/, "", $i)
          print $i
        }
        exit
      }
    ' "$config"
  )"

  [[ -n "$cert_path" && -n "$key_path" && -n "$root" && -n "$server_names" ]] || continue
  [[ "$cert_path" == /www/server/panel/vhost/cert/* ]] || continue
  [[ -d "$root" ]] || {
    log "SKIP config=$config reason=webroot_missing root=$root"
    continue
  }

  domains=()
  while IFS= read -r domain; do
    if valid_domain "$domain"; then
      domains+=("$domain")
    fi
  done <<<"$server_names"
  [[ "${#domains[@]}" -gt 0 ]] || continue

  main_domain="${domains[0]}"
  if [[ -s "$cert_path" ]] &&
    openssl x509 -checkend "$THRESHOLD_SECONDS" -noout -in "$cert_path" >/dev/null 2>&1; then
    expires="$(openssl x509 -in "$cert_path" -noout -enddate 2>/dev/null | cut -d= -f2-)"
    log "OK domain=$main_domain expires=$expires"
    continue
  fi

  if [[ "$DRY_RUN" -eq 1 ]]; then
    if [[ -s "$cert_path" ]]; then
      expires="$(openssl x509 -in "$cert_path" -noout -enddate 2>/dev/null | cut -d= -f2-)"
      log "DUE domain=$main_domain expires=$expires root=$root"
    else
      log "DUE domain=$main_domain expires=missing root=$root"
    fi
    continue
  fi

  log "PROCESS domain=$main_domain config=$config"
  if renew_site "$config" "$cert_path" "$key_path" "$root" "${domains[@]}"; then
    RENEWED=$((RENEWED + 1))
  else
    FAILURES=$((FAILURES + 1))
  fi
done

if [[ "$DRY_RUN" -eq 0 ]]; then
  find "$BACKUP_ROOT" -mindepth 1 -maxdepth 1 -type d -mtime +120 -exec rm -rf -- {} + 2>/dev/null || true
fi

log "DONE renewed=$RENEWED failures=$FAILURES"
if [[ "$FAILURES" -gt 0 ]]; then
  exit 1
fi
