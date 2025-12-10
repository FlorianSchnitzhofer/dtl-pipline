#!/usr/bin/env sh
set -e

: "${BACKEND_HOST:=backend}"
: "${BACKEND_PORT:=8000}"

export BACKEND_HOST BACKEND_PORT

envsubst '${BACKEND_HOST} ${BACKEND_PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

exec nginx -g 'daemon off;'
