# Como rodar o servidor para desenvolvimento

Esse documento é um guia provisório para executar o servidor na máquina do usuário e testar a API, fazendo o uso do ambiente virtual do Python (sem Docker, por enquanto).

**OBS**: A versão Python utilizada deve ser igual ou superior a 3.10. 

## Criar o ambiente virtual

```bash
cd backend  # Entre na pasta `backend` para executar os comandos
python -m venv .venv  # Cria o ambiente virtual
source .venv/bin/activate  # Ativa o ambiente virtual
python -m pip install --upgrade pip  # Upgrade do pip para instalar os pacotes 
```

## Instalar os pacotes necessários

Confira se o Python que você está utilizando é o que está dentro do `.venv`, e se a versão dele é 3.10+:
```bash
which python  # Confere qual o interpretador de Python utilizado
python --version 
```

Prossiga para a instalação dos pacotes:
```bash
pip install -r requirements.txt  # Instala os pacotes presentes no requirements.txt
```

## Executar o servidor

```bash
cd app  # Entra na pasta `app`, supondo que o usuário esteja na `backend`
fastapi dev  # Executa o servidor
```

## Acesso à API

A interação com a API pode ser feita na página de documentação gerada automaticamente pelo FastAPI: http://127.0.0.1:8000/docs

# Base de Dados

A base de dados foi criada executando a query `mock.cypher`, presente na pasta `backend/app/queries`. Ela monta uma base provisória, com poucas entidades, apenas para depurar a interação do servidor com ela. Os identificadores dos filmes são `movie-1`, `movie-2`, ..., e dos artistas são `person-1`, `person-2`, ..., e podem ser utilizados nas rotas `GET /movie/{movie_id}` e `GET /person/{person_id}/related-movies`.   