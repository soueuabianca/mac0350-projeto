# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements e instalar dependências Python
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copiar o código do backend
COPY app/ ./app/

# Copiar .env se existir (opcional)
COPY .env* ./

# Expor a porta do FastAPI
EXPOSE 8000

# Comando para rodar o servidor
CMD ["fastapi", "dev", "app/main.py", "--host", "0.0.0.0", "--port", "8000"]