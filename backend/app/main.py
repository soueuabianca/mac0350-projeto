from fastapi import FastAPI
from contextlib import asynccontextmanager
from driver import driver, DATABASE_NAME
from schemas import *


def format(graph) -> MovieGraph:
    nodes = [
        {
            "id": node["id"],
            "label": next(iter(node.labels)),
            "properties": dict(node)
        }
        for node in graph.nodes
    ]
    edges = [
        {
            "source": rel.start_node["id"],
            "target": rel.end_node["id"],
            "type": rel.type
        }
        for rel in graph.relationships
    ]    
    return {"nodes": nodes, "edges": edges}


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    driver.close()

app = FastAPI(lifespan=lifespan)


@app.get("/")
async def healthcheck() -> dict:
    """
    Check the connection with the server. 
    """
    return {"message": "Hello World"}


@app.get("/testdb")
def test_db_conn():
    """
    Check the connection with the database.
    """
    with driver.session(database=DATABASE_NAME) as session:
        query = """
        MATCH (a:Person)-[r:ACTED_IN]->(m:Movie)
        WHERE m.title = $movie_title 
        RETURN a.name AS name, a.born as BORN
        """
        records = session.run(query, movie_title="The Devil's Advocate")
        for record in records:
            print(record["name"]) 


@app.get("/movie/{movie_id}", response_model=MovieGraph)
def moviegraph(movie_id: str):
    """
    Return the graph of the movie as a MovieGraph object.
    """
    with driver.session(database=DATABASE_NAME) as session:
        query = """
        MATCH (a:Person)-[r]->(m:Movie)
        WHERE m.id = $movie_id 
        RETURN m, a, r
        """
        graph = session.run(query, movie_id=movie_id).graph()
        return format(graph)
    
@app.get("/person/{person_id}/related-movies", response_model=MovieGraph)
def related_movies(person_id: str, movie_id: str):
    """
    Return the the nodes of movies that the person with id=person_id worked on,
    and the edges connecting them to this person. The query excludes the node 
    of the movie given in the query parameter.
    """
    print(person_id, movie_id)
    with driver.session(database=DATABASE_NAME) as session:
        query = """
        MATCH (p:Person)-[r]->(m:Movie)
        WHERE m.id <> $movie_id AND p.id = $person_id
        RETURN p, m, r        
        """
        graph = session.run(query, person_id=person_id, movie_id=movie_id).graph()
        return format(graph)


