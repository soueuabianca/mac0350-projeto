# Feito com IA Gemini
FROM python:3.11-slim

WORKDIR /app

# Instalar dependências antes do código para otimizar cache das camadas do Docker
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Expor a porta definida no compose e iniciar o servidor uvicorn
EXPOSE 8080
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
