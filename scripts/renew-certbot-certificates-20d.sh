#!/usr/bin/env bash

set -uo pipefail

THRESHOLD_DAYS="${THRESHOLD_DAYS:-20}"
THRESHOLD_SECONDS=$((THRESHOLD_DAYS * 24 * 60 * 60))
RENEWAL_DIR="${RENEWAL_DIR:-/etc/letsencrypt/renewal}"
DEPLOY_HOOK="${DEPLOY_HOOK:-/etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh}"
LOCK_FILE="${LOCK_FILE:-/run/lock/renew-certbot-certificates-20d.lock}"
DRY_RUN=0
FAILURES=0
RENEWED=0

if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=1
fi

log() {
  printf '%s %s\n' "$(date '+%Y-%m-%d %H:%M:%S%z')" "$*"
}

if ! command -v certbot >/dev/null 2>&1; then
  log "FATAL certbot_not_found"
  exit 1
fi
if [[ ! -x "$DEPLOY_HOOK" ]]; then
  log "FATAL deploy_hook_not_executable path=$DEPLOY_HOOK"
  exit 1
fi
if [[ ! -d "$RENEWAL_DIR" ]]; then
  log "FATAL renewal_directory_missing path=$RENEWAL_DIR"
  exit 1
fi

if [[ "$DRY_RUN" -eq 0 ]]; then
  mkdir -p -- "$(dirname -- "$LOCK_FILE")"
  exec 9>"$LOCK_FILE"
  if ! flock -n 9; then
    log "SKIP another_run_is_active"
    exit 0
  fi
fi

log "START threshold_days=$THRESHOLD_DAYS dry_run=$DRY_RUN"

shopt -s nullglob
for renewal_config in "$RENEWAL_DIR"/*.conf; do
  cert_name="$(basename -- "$renewal_config" .conf)"
  cert_path="$(
    awk -F= '
      /^[[:space:]]*cert[[:space:]]*=/ {
        value = $2
        sub(/^[[:space:]]+/, "", value)
        sub(/[[:space:]]+$/, "", value)
        print value
        exit
      }
    ' "$renewal_config"
  )"

  if [[ -z "$cert_path" || ! -s "$cert_path" ]]; then
    log "ERROR cert_name=$cert_name certificate_missing path=$cert_path"
    FAILURES=$((FAILURES + 1))
    continue
  fi

  if openssl x509 -checkend "$THRESHOLD_SECONDS" -noout -in "$cert_path" >/dev/null 2>&1; then
    expires="$(openssl x509 -in "$cert_path" -noout -enddate | cut -d= -f2-)"
    log "OK cert_name=$cert_name expires=$expires"
    continue
  fi

  expires="$(openssl x509 -in "$cert_path" -noout -enddate 2>/dev/null | cut -d= -f2-)"
  if [[ "$DRY_RUN" -eq 1 ]]; then
    log "DUE cert_name=$cert_name expires=$expires"
    continue
  fi

  log "PROCESS cert_name=$cert_name expires=$expires"
  if ! certbot renew \
    --cert-name "$cert_name" \
    --force-renewal \
    --non-interactive \
    --deploy-hook "$DEPLOY_HOOK"; then
    log "ERROR cert_name=$cert_name certbot_renew_failed"
    FAILURES=$((FAILURES + 1))
    continue
  fi

  if ! openssl x509 -checkend "$THRESHOLD_SECONDS" -noout -in "$cert_path"; then
    log "ERROR cert_name=$cert_name renewed_certificate_too_short"
    FAILURES=$((FAILURES + 1))
    continue
  fi

  expires="$(openssl x509 -in "$cert_path" -noout -enddate | cut -d= -f2-)"
  log "RENEWED cert_name=$cert_name expires=$expires"
  RENEWED=$((RENEWED + 1))
done

log "DONE renewed=$RENEWED failures=$FAILURES"
if [[ "$FAILURES" -gt 0 ]]; then
  exit 1
fi
