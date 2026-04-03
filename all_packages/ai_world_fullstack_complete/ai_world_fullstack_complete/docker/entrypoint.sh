#!/usr/bin/env bash
set -e

echo "[entrypoint] waiting for postgres..."
python - <<'PY'
import os
import time
import psycopg
url = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@db:5432/ai_world")
if "+psycopg" in url:
    url = url.replace("+psycopg", "")
for i in range(60):
    try:
        with psycopg.connect(url):
            print("postgres ready")
            break
    except Exception as exc:
        print(f"wait {i+1}/60: {exc}")
        time.sleep(2)
else:
    raise SystemExit("postgres unavailable")
PY

echo "[entrypoint] running migrations..."
alembic upgrade head

if [ "${AUTO_SEED:-true}" = "true" ]; then
  echo "[entrypoint] running seed.py..."
  python seed.py || true
fi

if [ "${AUTO_SEED_MORE:-true}" = "true" ]; then
  echo "[entrypoint] running seed_more.py..."
  python seed_more.py || true
fi

echo "[entrypoint] starting api..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
