from pydantic import BaseModel
from enum import Enum


class Genre(str, Enum):
    Action = "action"
    Adventure = "adventure"
    Animation = "animation"
    Comedy = "comedy"
    Crime = "crime"
    Documentary = "documentary"
    Drama = "drama"
    Family = "family"
    Fantasy = "fantasy"
    History = "history"
    Horror = "horror"
    Music = "music"
    Mystery = "mystery"
    Romance = "romance"
    ScienceFiction = "sciencefiction"
    TVMovie = "tvmovie"
    Thriller = "thriller"
    War = "war"
    Western = "western"

class Node(BaseModel):
    id: int
    label: str
    properties: dict


class Edge(BaseModel):
    source: int
    target: int
    type: str


class MovieGraph(BaseModel):
    nodes: list[Node]
    edges: list[Edge]


class Movie(BaseModel):
    tmdbId: int
    title: str
    vote_average: float
    poster_path: str
    overview: str
    score: float | None = None


class MovieCatalog(BaseModel):
    movies: list[Movie]
    hasMore: bool

class SearchResult(BaseModel):
    id: int          # tmdbId da entidade
    label: str       # "Movie" ou "Person"
    name: str        # título do filme ou nome da pessoa
    poster_path: str | None = None
    overview: str | None = None
    score: float     # score do fulltext

class SearchResponse(BaseModel):
    results: list[SearchResult]