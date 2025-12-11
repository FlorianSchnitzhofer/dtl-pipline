#!/bin/sh
set -eu

: "${BACKEND_BASE_URL:=http://dtlpipe-epcbdpbhatcdcqgk.germanywestcentral-01.azurewebsites.net:8000}"

# Ensure the backend URL always includes a scheme so Nginx does not error with
# "invalid URL prefix" when a bare host name is provided (e.g., when set via
# an Azure App Service app setting without http/https).
case "$BACKEND_BASE_URL" in
  http://*|https://*) ;;
  *)
    BACKEND_BASE_URL="http://$BACKEND_BASE_URL"
    ;;
esac

# Extract the backend host (including port, if any) for loop protection inside
# the Nginx template. When the backend is accidentally pointed at the same
# host/port as the frontend, requests would be proxied back to the public site,
# causing a redirect loop in the browser. Comparing against $http_host inside
# Nginx lets us short-circuit with a 502 instead of entering that loop.
BACKEND_BASE_HOST="$(printf '%s' "$BACKEND_BASE_URL" | sed -E 's#^[^/]+//([^/]+).*#\1#')"

# Derive a sensible resolver if one was not provided. This keeps the Docker
# Compose default (Docker DNS at 127.0.0.11) while allowing platforms like
# Azure App Service to use the nameservers defined in /etc/resolv.conf so the
# backend host can be resolved successfully at runtime.
if [ -z "${NGINX_RESOLVER:-}" ]; then
  resolvers="$(awk '/^nameserver/{print $2}' /etc/resolv.conf | tr '\n' ' ' | xargs)"
  if [ -n "$resolvers" ]; then
    NGINX_RESOLVER="$resolvers"
  else
    NGINX_RESOLVER="127.0.0.11"
  fi
fi

export BACKEND_BASE_URL BACKEND_BASE_HOST NGINX_RESOLVER

envsubst '${BACKEND_BASE_URL} ${BACKEND_BASE_HOST} ${NGINX_RESOLVER}' \
  < /etc/nginx/templates/default.conf.template \
  > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
