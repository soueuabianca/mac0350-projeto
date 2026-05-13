#Feito com IA Gemini
FROM node:18-alpine

WORKDIR /app

# Instalar dependências aproveitando cache
COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000
CMD ["npm", "start"] # Altere para "npm run dev" se usar Vite
