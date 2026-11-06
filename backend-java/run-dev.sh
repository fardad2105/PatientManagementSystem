#!/usr/bin/env bash
# Local dev runner for the Java backend on the host machine.
# Requires: PostgreSQL running in Docker (pms-postgres on localhost:5434) and
# the jar built:  mvn -B package -DskipTests
set -euo pipefail
cd "$(dirname "$0")"

export PORT="${PORT:-8080}"
export DATABASE_URL="${DATABASE_URL:-jdbc:postgresql://localhost:5432/thyrocare}"
export DATABASE_USERNAME="${DATABASE_USERNAME:-postgres}"
export DATABASE_PASSWORD="${DATABASE_PASSWORD:-postgres}"
export JWT_SECRET="${JWT_SECRET:-661f632dc7b8b26b8cc665a7d289a4f35dba102c4403b4130c04696f59d49b32}"
export ADMIN_EMAIL="${ADMIN_EMAIL:-gillianarchuleta90119@outlook.com}"
export ADMIN_PASSWORD="${ADMIN_PASSWORD:-ThyroAdmin#2026}"
export SEED_DEMO_DATA="${SEED_DEMO_DATA:-true}"
export CORS_ORIGINS="${CORS_ORIGINS:-http://localhost:3000}"
export COOKIE_SECURE="${COOKIE_SECURE:-false}"

exec java -jar target/thyrocare-backend-0.2.0.jar
