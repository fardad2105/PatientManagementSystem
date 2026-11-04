#!/usr/bin/env bash
# Local dev runner for the Java backend (sandbox verification only).
cd /app/backend-java
export PORT="${PORT:-8090}" DATABASE_URL=jdbc:postgresql://localhost:5432/thyrocare DATABASE_USERNAME=thyrocare \
  DATABASE_PASSWORD=thyrocare_dev JWT_SECRET=a51e6871280bb65e24ad101b265701c051dab119a3e248aacb69fa00ae96b4b9 \
  ADMIN_EMAIL=gillianarchuleta90119@outlook.com 'ADMIN_PASSWORD=ThyroAdmin#2026' SEED_DEMO_DATA=true \
  CORS_ORIGINS=https://thyro-care--4q5zstcg.preview.emergentagent.com COOKIE_SECURE="${COOKIE_SECURE:-false}"
exec java -jar target/thyrocare-backend-0.2.0.jar
