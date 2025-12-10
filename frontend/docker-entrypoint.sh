#!/bin/sh
set -eu

: "${BACKEND_BASE_URL:=http://backend:8000}" 
: "${NGINX_RESOLVER:=127.0.0.11}" 

export BACKEND_BASE_URL NGINX_RESOLVER

envsubst '${BACKEND_BASE_URL} ${NGINX_RESOLVER}' \
  < /etc/nginx/templates/default.conf.template \
  > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
