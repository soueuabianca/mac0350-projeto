# Como rodar o servidor para desenvolvimento com `venv`

Esse documento é um guia provisório para executar o servidor back-end na máquina do usuário, fazendo o uso do **ambiente virtual** do Python. Isto é, sem Docker e de forma independente do front-end.

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

## Credenciais

Para executar o servidor, é necessário possuir as credenciais de conexão com a base de dados do projeto. Adicione o arquivo `.env` com essas credenciais presentes na pasta raiz do projeto. 

## Executar o servidor

```bash
cd app  # Entra na pasta `app`, supondo que o usuário esteja na `backend`
fastapi dev  # Executa o servidor
```

## Acesso à API

A interação com a API pode ser feita na página de documentação gerada automaticamente pelo FastAPI: http://127.0.0.1:8000/docs
Nessa página, é possível encontrar a descrição e detalhes de cada rota da API.