import os
from dotenv import load_dotenv
load_dotenv()
from neo4j import GraphDatabase

URI = os.getenv('NEO4J_URI')
AUTH = (os.getenv('NEO4J_USERNAME'), os.getenv('NEO4J_PASSWORD'))
DATABASE_NAME = os.getenv('NEO4J_DATABASE')

driver = GraphDatabase.driver(URI, auth=AUTH)