import sys
import os
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

# Injeta a pasta 'app' no path do sistema para mascarar o erro de importação do main.py
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../app')))

# Com o diretório forçado, a importação volta a ser local em vez de 'app.main'
from main import app 

client = TestClient(app)

# O mock também volta ao escopo local (main.driver)
@patch("main.driver")
def test_health_check_retorna_200_e_grafo_vazio(mock_driver):
    mock_session = MagicMock()
    mock_driver.session.return_value.__enter__.return_value = mock_session
    
    mock_result = MagicMock()
    mock_graph = MagicMock()
    mock_graph.nodes = []
    mock_graph.relationships = []
    
    mock_result.graph.return_value = mock_graph
    mock_session.run.return_value = mock_result
    
    response = client.get("/")
    
    assert response.status_code == 200
    assert response.json() == {"nodes": [], "edges": []}
    mock_session.run.assert_called_once()


@patch("main.driver")
def test_popular_movies_retorna_lista_formatada(mock_driver):
    mock_session = MagicMock()
    mock_driver.session.return_value.__enter__.return_value = mock_session
    
    mock_record = {
        "tmdbId": 123, 
        "title": "O Auto da Compadecida", 
        "vote_average": 9.5, 
        "poster_path": "/caminho_poster.jpg", 
        "overview": "Sinopse do filme."
    }
    
    mock_session.run.return_value = [mock_record]
    
    response = client.get("/popular?skip=0&limit=10")
    
    assert response.status_code == 200
    data = response.json()
    
    assert "movies" in data
    assert "hasMore" in data
    assert len(data["movies"]) == 1
    assert data["movies"][0]["title"] == "O Auto da Compadecida"
    assert data["hasMore"] is False


def test_busca_invalida_retorna_422():
    response = client.get("/genre/genero_inexistente")
    assert response.status_code == 422