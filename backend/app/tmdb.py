import requests
import os
from dotenv import load_dotenv
load_dotenv()


TOKEN = os.getenv('TMDB_TOKEN')
headers = {
    "accept": "application/json",
    "Authorization": f"Bearer {TOKEN}"
}
moviesID = []

def delete():
    with driver.session(database=DATABASE_NAME) as session:
        query = """
        MATCH (n) DETACH DELETE n
        """
        session.run(query)

def createConstraints():
    with driver.session(database=DATABASE_NAME) as session:
        query = """
        CREATE CONSTRAINT movie_id IF NOT EXISTS FOR (m:Movie) REQUIRE m.tmdbId IS UNIQUE;
        """
        session.run(query)
        query = """
        CREATE CONSTRAINT person_id IF NOT EXISTS FOR (p:Person) REQUIRE p.tmdbId IS UNIQUE;
        """
        session.run(query)
    
def createFulltextIndex():
    with driver.session(database=DATABASE_NAME) as session:
        query = """
        CREATE FULLTEXT INDEX movieTitleIndex IF NOT EXISTS FOR (m:Movie)
        ON EACH [m.title]
        """
        session.run(query)

def selectPage(page: int, language: str) -> str:
    url_pt = f"https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&language=pt-BR&page={page}&sort_by=vote_average.desc&vote_average.gte=6.4&vote_count.gte=50&with_origin_country=BR&with_original_language=pt"
    url_en = f"https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&language=pt-BR&page={page}&sort_by=vote_average.desc&vote_average.gte=6.9&vote_count.gte=4000&with_original_language=en"    
    if language == "en":
        return url_en
    else:
        return url_pt

def moviePages(P: int, language: str):
    page = 1
    while page <= P:
        url = selectPage(page, language)
        addMovies(url)
        page+=1

def addMovies(movieURL: str):
    response = requests.get(movieURL, headers=headers)
    if response.status_code == 200:
        data = response.json() 
        with driver.session(database=DATABASE_NAME) as session:
            for movie in data["results"]:
                title = movie["title"]
                tmdbId = movie["id"]
                overview = movie["overview"]
                posterPath = movie["poster_path"]
                releaseDate = movie["release_date"] 
                voteAverage = movie["vote_average"]
                genreIds = movie["genre_ids"]
                query = """
                MERGE (m:Movie {tmdbId:$tmdbId}) ON CREATE SET m.title=$title, m.overview=$overview,
                m.posterPath=$posterPath, m.releaseDate=$releaseDate, m.voteAverage=$voteAverage,
                m.genreIds=$genreIds   
                """
                session.run(query, title=title, tmdbId=tmdbId, overview=overview, posterPath=posterPath,
                            genreIds=genreIds, releaseDate=releaseDate, voteAverage=voteAverage)
                moviesID.append(tmdbId)
                print(f"Movie added: {title} (id: {tmdbId})")
    else:
        print(f"ERRO: {response.status_code}")
        raise response.status_code
    
def addActor(name, character, tmdbId, profilePath, movieID):
    with driver.session(database=DATABASE_NAME) as session:
        query = """
        MATCH (m:Movie) WHERE m.tmdbId = $movieID 
        MERGE (p:Person {tmdbId:$tmdbId}) ON CREATE SET p.name=$name, p.profilePath=$profilePath
        MERGE (p)-[:ACTED_IN {roles:[$character]}]->(m)
        """
        session.run(query, movieID=movieID, tmdbId=tmdbId, name=name, character=character, profilePath=profilePath)

def addDirector(name, tmdbId, profilePath, movieID):
    with driver.session(database=DATABASE_NAME) as session:
        query = """
        MATCH (m:Movie) WHERE m.tmdbId = $movieID 
        MERGE (p:Person {tmdbId:$tmdbId}) ON CREATE SET p.name=$name, p.profilePath=$profilePath
        MERGE (p)-[:DIRECTED]->(m)
        """
        session.run(query, movieID=movieID, tmdbId=tmdbId, name=name, profilePath=profilePath)

def credits(N: int):
    for movieID in moviesID:
        creditsURL = f"https://api.themoviedb.org/3/movie/{movieID}/credits?language=pt-BR"
        response = requests.get(creditsURL, headers=headers)
        if response.status_code == 200:
            data = response.json()
            with driver.session(database=DATABASE_NAME) as session:
                i = 1
                for actor in data["cast"]:
                    addActor(actor["name"], actor["character"], actor["id"], actor["profile_path"], movieID)  
                    i+=1
                    if i>N: # Add only the first N actors  
                        break
                for member in data["crew"]: # Add directors 
                    if member.get("job") == "Director":
                        addDirector(member["name"], member["id"], member["profile_path"], movieID) 
                        pass
            print(f"Cast added (id: {movieID})")
        else:
            print(f"ERRO: {response.status_code}")
        
            

def execute(deleteDB: bool = True, createMovies: bool = True, createArtists: bool = True):
    if deleteDB:
        delete()
        createConstraints()
        createFulltextIndex()
    if createMovies:
        moviePages(P=39, language="en")
        if createArtists:
            credits(N=5)


def main():
    try: 
        execute()
    except Exception as e:
        print(f"Error: {e}")
        raise
    finally:
        driver.close()


if __name__ == "__main__":
    from driver import driver, DATABASE_NAME
    main()

