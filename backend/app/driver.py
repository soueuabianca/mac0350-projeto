import os
from pathlib import Path
from dotenv import load_dotenv
from neo4j import GraphDatabase

# 1. Achar o .env na raiz (backend)
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# 2. Puxar as variáveis secretas (.env)
URI = os.getenv('NEO4J_URI')
AUTH = (os.getenv('NEO4J_USERNAME'), os.getenv('NEO4J_PASSWORD'))
DATABASE_NAME = os.getenv('NEO4J_DATABASE')

# 3. Se não achar a senha, retornar erro
if not URI or not AUTH[0]:
    raise ValueError("⚠️ ERRO: Credenciais não encontradas! Verifique se o arquivo '.env' está na pasta 'backend'.")

# 4. Ligar a conexão com o banco de dados
driver = GraphDatabase.driver(URI, auth=AUTH)