#!/usr/bin/env bash
# Sandbox only: bring up PostgreSQL + the Java backend on 8001 after a preview pod reset.
set -e
sudo service postgresql start
until pg_isready -q; do sleep 1; done
cd /tmp
sudo -u postgres psql -tAc "select 1 from pg_roles where rolname='thyrocare'" | grep -q 1 || \
  sudo -u postgres psql -c "create role thyrocare login password 'thyrocare_dev'"
sudo -u postgres psql -tAc "select 1 from pg_database where datname='thyrocare'" | grep -q 1 || \
  sudo -u postgres psql -c "create database thyrocare owner thyrocare"
sudo supervisorctl stop backend || true
pkill -f thyrocare-backend || true
cd /app/backend-java
PORT=8001 COOKIE_SECURE=true nohup ./run-local.sh > /tmp/java.log 2>&1 &
echo "java backend starting (log: /tmp/java.log)"
