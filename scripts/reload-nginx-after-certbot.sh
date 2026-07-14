#!/usr/bin/env bash

set -euo pipefail

NGINX="/www/server/nginx/sbin/nginx"

"$NGINX" -t
"$NGINX" -s reload
