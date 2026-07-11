from schemas import *

getId = {
    "action": 28,
    "adventure": 12,
    "animation": 16,
    "comedy": 35,
    "crime": 80,
    "documentary": 99,
    "drama": 18,
    "family": 10751,
    "fantasy": 14,
    "history": 36,
    "horror": 27,
    "music": 10402,
    "mystery": 9648,
    "romance": 10749,
    "sciencefiction": 878,
    "tvmovie": 10770,
    "thriller": 53,
    "war": 10752,
    "western": 37
}

def format(graph) -> MovieGraph:
    """
    Process the neo4j graph object to return a dict 
    that contains a list of nodes and a list of 
    edges, which is similar to the Cytoscape format. 
    """
    nodes = [
        {
            "id": node["tmdbId"],
            "label": next(iter(node.labels)),
            "properties": dict(node)
        }
        for node in graph.nodes
    ]
    edges = [
        {
            "source": rel.start_node["tmdbId"],
            "target": rel.end_node["tmdbId"],
            "type": rel.type
        }
        for rel in graph.relationships
    ]    
    return {"nodes": nodes, "edges": edges}


def catalog(records, limit) -> MovieCatalog:
    """
    Append each item of the records in a list. Return
    a dict with this list an a boolean that indicates if
    there are more movies in the catalog to load. 
    """
    movies = []
    for movie in records:
        movies.append(movie)
    return {
        "movies": movies[:limit],
        "hasMore": len(movies) > limit
    }
