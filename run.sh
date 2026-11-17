#!/usr/bin/env bash
# Usage: ./run.sh [start|test|stop|logs|reset]
set -euo pipefail
cd "$(dirname "$0")"

WEB_PORT="${WEB_PORT:-5173}"
URL="http://localhost:${WEB_PORT}"

die() { echo "Error: $*" >&2; exit 1; }

ensure_docker() {
  command -v docker >/dev/null || die "Docker is not installed: https://www.docker.com/products/docker-desktop"
  if docker info >/dev/null 2>&1; then return; fi
  if [[ "$(uname)" == "Darwin" ]]; then
    echo "Starting Docker Desktop..."
    open -a Docker || die "Could not start Docker Desktop"
  fi
  for _ in $(seq 1 60); do
    docker info >/dev/null 2>&1 && return
    sleep 2
  done
  die "Docker daemon is not running"
}

wait_for_web() {
  echo "Waiting for the site (first start installs packages, ~1 min)..."
  for _ in $(seq 1 120); do
    if curl -sf "$URL" >/dev/null 2>&1; then return; fi
    if [[ -z "$(docker compose ps -q --status running web)" ]]; then
      docker compose logs --tail 40 web
      die "Container 'web' stopped, logs above"
    fi
    sleep 2
  done
  docker compose logs --tail 40 web
  die "Site did not respond at $URL"
}

case "${1:-start}" in
  start)
    ensure_docker
    docker compose up -d
    wait_for_web
    echo ""
    echo "Site:     $URL"
    echo "Database: postgres://ppap:ppap@localhost:${DB_PORT:-5432}/ppap"
    echo "Logs: ./run.sh logs   Stop: ./run.sh stop"
    [[ "$(uname)" == "Darwin" ]] && open "$URL"
    ;;
  test)
    ensure_docker
    docker compose run --rm --no-deps web sh -c "npm install --no-audit --no-fund && npm run check"
    ;;
  stop)
    docker compose down
    ;;
  logs)
    docker compose logs -f
    ;;
  reset)
    read -r -p "Delete containers, installed packages and ALL database data? [y/N] " answer
    [[ "$answer" == "y" ]] || exit 0
    docker compose down -v
    ;;
  *)
    die "Unknown command '$1'. Use: start | test | stop | logs | reset"
    ;;
esac
