# /frontend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Instalar dependências aproveitando cache
COPY package*.json ./
RUN npm install

# Copia o restante do código
COPY . .

# Expõe a porta correta do Vite
EXPOSE 5173

# Roda o Vite liberando o acesso para o Docker (0.0.0.0)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]