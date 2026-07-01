from fastapi import FastAPI
from contextlib import asynccontextmanager
from driver import driver, DATABASE_NAME
from schemas import *
from aux import *

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    driver.close()

app = FastAPI(lifespan=lifespan)


@app.get("/")
async def health_check() -> dict:
    """
    Check the connection with the server and database. 
    """
    with driver.session(database=DATABASE_NAME) as session:
        query = """
        MATCH (a:Person)-[r]->(m:Movie)
        WHERE m.title = $movie_title 
        RETURN m, a, r
        """
        graph = session.run(query, movie_title="Ainda Estou Aqui").graph()
        return format(graph)
        

@app.get("/movie/{movie_id}", response_model=MovieGraph)
def movie_graph(movie_id: int):
    """
    Return the graph of the movie as a MovieGraph object.
    """
    with driver.session(database=DATABASE_NAME) as session:
        query = """
        MATCH (a:Person)-[r]->(m:Movie)
        WHERE m.tmdbId = $movie_id 
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
    with driver.session(database=DATABASE_NAME) as session:
        query = """
        MATCH (p:Person)-[r]->(m:Movie)
        WHERE m.tmdbId <> $movie_id AND p.tmdbId = $person_id
        RETURN p, m, r        
        """
        graph = session.run(query, person_id=person_id, movie_id=movie_id).graph()
        return format(graph)


@app.get("/popular", response_model=MovieCatalog)
def popular_movies(skip: int = 0, limit: int = 10):
    """
    Return a list of movies ordered by vote average. 
    """
    with driver.session(database=DATABASE_NAME) as session:
        query = """
        MATCH (m:Movie)
        WHERE m.voteAverage >= 8.0
        RETURN m.tmdbId as tmdbId, m.title as title, m.voteAverage as vote_average,
                m.posterPath as poster_path, m.overview as overview
        ORDER BY m.voteAverage DESC
        SKIP $skip
        LIMIT $limit + 1
        """
        records = session.run(query, skip=skip, limit=limit)
        return catalog(records, limit)
    

@app.get("/genre/{genre}", response_model=MovieCatalog)
def with_genre(genre: Genre, skip: int = 0, limit: int = 10):
    """
    Return a list of movies of a certain `genre`.   
    """
    with driver.session(database=DATABASE_NAME) as session:
        query = """
        MATCH (m:Movie)
        WHERE $genre_id IN m.genreIds
        RETURN m.tmdbId as tmdbId, m.title as title, m.voteAverage as vote_average,
                m.posterPath as poster_path, m.overview as overview
        ORDER BY m.voteAverage DESC
        SKIP $skip
        LIMIT $limit + 1
        """
        records = session.run(query, skip=skip, limit=limit, genre_id=getId[genre])
        return catalog(records, limit)
    
@app.get("/search/", response_model=MovieCatalog)
def search_movie(q: str, limit: int = 10):
    with driver.session(database=DATABASE_NAME) as session:
        query = """
        CALL db.index.fulltext.queryNodes(
            "movieTitleIndex",
            $text
        )
        YIELD node, score
        RETURN node.tmdbId as tmdbId, node.title as title, node.voteAverage as vote_average,
                node.posterPath as poster_path, node.overview as overview, score
        ORDER BY score DESC
        LIMIT 10
        """
        records = session.run(query, text=q)
        return catalog(records, limit)
    
@app.get("/search/combined", response_model=SearchResponse)
def search_combined(q: str, limit: int = 10):
    """
    Busca textual combinada: retorna filmes e pessoas cujo título/nome
    corresponda à consulta 'q', ordenados por relevância.
    """
    with driver.session(database=DATABASE_NAME) as session:
        # Busca em filmes
        query_movies = """
        CALL db.index.fulltext.queryNodes("movieTitleIndex", $text)
        YIELD node, score
        RETURN node.tmdbId AS id, "Movie" AS label, node.title AS name,
               node.posterPath AS poster_path, node.overview AS overview, score
        ORDER BY score DESC
        LIMIT $limit
        """
        movies = session.run(query_movies, text=q, limit=limit).data()

        # Busca em pessoas
        query_persons = """
        CALL db.index.fulltext.queryNodes("personNameIndex", $text)
        YIELD node, score
        RETURN node.tmdbId AS id, "Person" AS label, node.name AS name,
               node.profilePath AS poster_path, null AS overview, score
        ORDER BY score DESC
        LIMIT $limit
        """
        persons = session.run(query_persons, text=q, limit=limit).data()

        # Unir, ordenar por score (já ordenados individualmente) e limitar
        results = movies + persons
        results.sort(key=lambda x: x["score"], reverse=True)
        results = results[:limit]

        return {"results": results}