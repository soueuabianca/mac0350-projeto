from fastapi import FastAPI
from contextlib import asynccontextmanager
from driver import driver, DATABASE_NAME
from schemas import *
from aux import *
from fastapi.middleware.cors import CORSMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    driver.close()

app = FastAPI(lifespan=lifespan)

# Liberar conversa entre portas diferentes (5173: Vite e 8000: FastAPI)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Liberar tudo para teste local
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
        graph = session.run(query, movie_title="Um Sonho de Liberdade").graph()
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
        center_node = next((node for node in graph.nodes if next(iter(node.labels)) == "Movie"), None)
        return format(graph, center_node=center_node)
        
    
@app.get("/person/{person_id}/related-movies", response_model=MovieGraph)
def related_movies(person_id: int, movie_id: int):
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
        center_node = next((node for node in graph.nodes if next(iter(node.labels)) == "Person"), None)
        return format(graph, center_node=center_node)


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
    
@app.get("/searchTitle/", response_model=MovieCatalog, deprecated=True)
def search_movie_title(q: str, limit: int = 10):
    """
    Returns a list of movies whose title matches the query. Simpler than GET /search. 
    """
    with driver.session(database=DATABASE_NAME) as session:
        query = """
        CALL db.index.fulltext.queryNodes(
            "movieTitleIndex",
            $text
        )
        YIELD node, score
        RETURN node.tmdbId as tmdbId, node.title as title, node.voteAverage as vote_average,
                node.posterPath as poster_path, node.overview as overview
        ORDER BY score DESC
        LIMIT 10
        """
        records = session.run(query, text=q)
        return catalog(records, limit)
    
@app.get("/search/", response_model=MovieCatalog)
def search(q: str, skip: int = 0,limit: int = 10):
    """
    Oficial search route. Return a list of movies whose title matches the query or that 
    feature an actor whose name matches the query.
    """
    with driver.session(database=DATABASE_NAME) as session:
        query = """
        CALL () {
            CALL db.index.fulltext.queryNodes("movieTitleIndex", $text)
            YIELD node, score
            RETURN collect({
                tmdbId: node.tmdbId,
                title: node.title,
                voteAverage: node.voteAverage,
                posterPath: node.posterPath,
                overview: node.overview
        }) AS titleMovies
        }
        CALL () {
            CALL db.index.fulltext.queryNodes("personNameIndex", $text)
            YIELD node, score
            WITH node, score
            ORDER BY score DESC
            MATCH (node)-[:ACTED_IN]->(m:Movie)
            RETURN collect({
                tmdbId: m.tmdbId,
                title: m.title,
                voteAverage: m.voteAverage,
                posterPath: m.posterPath,
                overview: m.overview
        }) AS actorMovies
        }
        WITH titleMovies + actorMovies AS movies
        UNWIND movies AS movie
        RETURN DISTINCT movie.tmdbId as tmdbId, movie.title as title, movie.voteAverage as vote_average,
                        movie.posterPath as poster_path, movie.overview as overview        
        SKIP $skip
        LIMIT $limit + 1
        """
        records = session.run(query, text=q, skip=skip, limit=limit)
        return catalog(records, limit)