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

def constraints():
    with driver.session(database=DATABASE_NAME) as session:
        query = """
        CREATE CONSTRAINT movie_id IF NOT EXISTS FOR (m:Movie) REQUIRE m.tmdbId IS UNIQUE;
        """
        session.run(query)
        query = """
        CREATE CONSTRAINT person_id IF NOT EXISTS FOR (p:Person) REQUIRE p.tmdbId IS UNIQUE;
        """
        session.run(query)

def moviePages(P: int):
    page = 1
    while page <= P:
        urlBR = f"https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&language=pt-BRS&page={page}&sort_by=popularity.desc&vote_average.gte=6.9&vote_count.gte=50&with_origin_country=BR&with_original_language=pt"
        urlUS = f"https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&language=pt-BR&page={page}&sort_by=vote_average.desc&vote_average.gte=8&vote_count.gte=4000&with_origin_country=US&with_original_language=en"
        addMovies(urlBR)
        page+=1

def addMovies(movieURL: str):

    response = requests.get(movieURL, headers=headers)
    if response.status_code == 200:
        data = response.json() 
        with driver.session(database=DATABASE_NAME) as session:
            #i = 1
            for movie in data["results"]:
                title = movie["original_title"]
                tmdbId = movie["id"]
                overview = movie["overview"]
                posterPath = movie["poster_path"]
                releaseDate = movie["release_date"] 
                voteAverage = movie["vote_average"]
                
                query = """
                MERGE (m:Movie {tmdbId:$tmdbId}) ON CREATE SET m.title=$title, m.overview=$overview,
                m.posterPath=$posterPath, m.releaseDate=$releaseDate, m.voteAverage=$voteAverage   
                """
                records = session.run(query, title=title, tmdbId=tmdbId, overview=overview, 
                                    posterPath=posterPath, releaseDate=releaseDate, voteAverage=voteAverage)
                moviesID.append(tmdbId)
                print(f"Movie added: {title} (id: {tmdbId})")
                #i += 1
                #if i>M: # Add the first M movies sorted by popularity 
                #    break

    else:
        print(f"Erro: {response.status_code}")
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
            print(f"Erro: {response.status_code}")
        
            

def execute(deleteDB: bool = True, createMovies: bool = True, createArtists: bool = True):
    if deleteDB:
        delete()
        constraints()
    if createMovies:
        moviePages(P=7)
        if createArtists:
            credits(N=7)


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

