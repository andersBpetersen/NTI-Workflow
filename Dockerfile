FROM node:22-alpine AS simulator-builder
WORKDIR /simulator
COPY tools/vault-job-config-simulator/package*.json ./
RUN npm ci
COPY tools/vault-job-config-simulator/ ./
RUN npm run build

FROM python:3.13-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY static ./static
COPY --from=simulator-builder /simulator/dist ./tools/vault-job-config-simulator/dist

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
