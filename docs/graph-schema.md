# Modelagem de Dados para os Grafos

Esse documento é uma proposta inicial para modelar os grafos, com uso do Neo4j, que serão exibidos nos projetos. Vamos utilizar as convenções e a sintaxe descrita pela linguagem Cypher, utilizado pelo Neo4j.

## Nós

A proposta é criar apenas as entidades (nós) Movie e Person, já que uma pessoa pode atuar em um filme e dirigi-lo ao mesmo tempo. Inicialmente, poderíamos dispor apenas atores/atrizes e diretores/diretoras. 

#### Movie

Vamos adicionar algumas propriedades importantes para os filmes. É importante adicionar informações básicas, como o título, que será impresso no nó, a sinopse (`overview`), a ser exibida num painel lateral ao clicar no filme e um poster do filme, que pode ser acessado com `posterPath`. É importante colocar um identificador único, que já vem junto com a base de dados do TMDB.

| Property    | Type   | Description            |
| ----------- | ------ | ---------------------- |
| tmdbId      | number | Unique TMDB identifier |
| title       | string | Movie title            |
| releaseYear | number | Release year           |
| overview    | string | Movie synopsis         |
| posterPath  | string | TMDB poster path       |
| tmdbUrl     | string | TMDB movie URL         |

#### Person

Analogamente aos filmes, queremos exibir uma foto do cineasta (acessado com `profilePath`)e a sua biografia num painel lateral, ao clicar no nó da pessoa.

| Property    | Type   | Description             |
| ----------- | ------ | ----------------------- |
| tmdbId      | number | Unique TMDB identifier  |
| name        | string | Person name             |
| biography   | string | Person biography        |
| profilePath | string | TMDB profile image path |
| tmdbUrl     | string | TMDB person URL         |

## Relacionamentos

Nessa modelagem, a escolha é a de que, dado um filme e uma pessoa, é possível que: 
+ A pessoa **atuou** em um filme: `ACTED_IN`
+ A pessoa **dirigiu** um filme: `DIRECTED`

Isto é, a _orientação_ da relação é da pessoa para o filme. 

```mermaid  
graph LR  
Person -->|ACTED_IN| Movie  
Person -->|DIRECTED| Movie  
```

#### `ACTED_IN`

Pode ser importante coletar o nome do personagem interpretado pela artista. Vamos definir isso como uma propriedade da relação `ACTED_IN`:

| Property  | Type   | Description    |
| --------- | ------ | -------------- |
| character | string | Character name |

#### `DIRECTED`

Sem prorpiedades.

## Constraints

É importante delimitar que a propriedade `tmdbId` seja única para cada nó de filme e pessoa.

```cypher
CREATE CONSTRAINT movie_tmdb IF NOT EXISTS
FOR (m:Movie)
REQUIRE m.tmdbId IS UNIQUE;

CREATE CONSTRAINT person_tmdb IF NOT EXISTS
FOR (p:Person)
REQUIRE p.tmdbId IS UNIQUE;
```

