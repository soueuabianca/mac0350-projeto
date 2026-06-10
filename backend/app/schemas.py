from pydantic import BaseModel


class Node(BaseModel):
    id: str
    label: str
    properties: dict


class Edge(BaseModel):
    source: str
    target: str
    type: str


class MovieGraph(BaseModel):
    nodes: list[Node]
    edges: list[Edge]
