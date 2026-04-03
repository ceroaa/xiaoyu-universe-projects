FROM python:3.11-slim AS base
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    APP_HOME=/app
WORKDIR ${APP_HOME}
RUN apt-get update && apt-get install -y --no-install-recommends \
    bash \
    build-essential \
    curl \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*
COPY requirements.txt ./
RUN pip install --upgrade pip && pip install -r requirements.txt
COPY . .

FROM base AS dev
EXPOSE 8000
CMD ["/bin/bash", "/app/docker/entrypoint.sh"]

FROM base AS prod
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
