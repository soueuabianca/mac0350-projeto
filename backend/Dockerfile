FROM python:3.11-slim

WORKDIR /app

# Instala dependências do sistema
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copia e instala as dependências do Python
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copia a pasta app com os códigos para dentro do container
COPY app/ ./app/

EXPOSE 8000

# Executa o servidor apontando corretamente para dentro da subpasta app
CMD ["fastapi", "dev", "app/main.py", "--host", "0.0.0.0", "--port", "8000"]