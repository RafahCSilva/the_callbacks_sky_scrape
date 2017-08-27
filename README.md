# The Callbacks - Hackathon Sky - Sky Scraper

## Integrantes
- **André Tavares**
- **Felipe Augusto**
- **Giulio Denardi**
- **Matheus Santos**
- **Rafael Cardoso**

## O projeto

Este repositório possui o projeto de *[scraper/crawler](https://en.wikipedia.org/wiki/Web_crawler)* do time **The Callbacks** que irá, a partir de um JSON de entrada, buscar dados em diversas fontes, com o objetivo de aumentar a qualidade dos dados da [SKY](https://www.sky.com.br/)..

Foram criados 5 crawlers para diferentes fontes ([Adoro Cinema](http://www.adorocinema.com/), [Wikipedia](https://pt.wikipedia.org/), [Mega Filmes HD](http://megafilmes.org/), [Filmow](https://filmow.com/), [IMDB](http://www.imdb.com/)) e foram usadas 2 APIs estáveis ([Youtube API](https://developers.google.com/youtube/v3/) e [Twitter API](https://dev.twitter.com/rest/public)).

Com isso, fomos capazes de trazer dados como: distribuidores, trailers, vídeos promocionais (teasers), avaliações de usuários, **principalmente de sites brasileiros, obtendo dados enviados por brasileiros** e alguns em inglês, para aumentar a diversificação dos dados (principalmente em possíveis buscas).  A estrutura de nosso retorno pode ser encontrada [aqui](http://f4aaj0.axshare.com/#g=1&p=metadados_da_programa__o).

Assim, iremos garantir uma melhor experiência aos clientes SKY ao utilizar qualquer um de seus produtos.

## O projeto - aspectos técnicos
Para a realização deste projetos, utilizamos [Node JS v8.4.0](https://nodejs.org/en/) como pré-requisito.
Para montar os crawlers, utilizamos principalmente as bibliotecas [request-promise](https://github.com/request/request-promise), e [Cheerio](https://github.com/cheeriojs/cheerio),
Utilizamos o [MongoDB](https://www.mongodb.com/) para a realização de buscas rápidas e processamentos temporários, enviando todos os dados para um bucket no *AWS S3* ao final do processamento dos crawlers.
Utilizamos também o YARN para o gerenciamento parcial do projeto.


Finalmente, o mais importante: este projeto irá rodar on-line em uma instância *EC2* como uma *API JSON RPC*. Isso possibilita que qualquer sistema possa se integrar com o projeto de forma simples e padronizada pelo mercado, independente de qual tecnologia o cliente utilizar.


## As Fontes
### IMDB Parser
Esta estrutura trata de parsear séries e filmes do [IMDB](http://www.imdb.com/).
De forma automática, ele fará a validação do arquivo para série ou filme, e preencherá os dados do objeto de acordo com este dado.
As informações salvas do parser estão em inglês, porém possui uma fonte rica de atributos independentes de língua (tais como Diretores, Distribuidores, etc.).
Este parser inclusive buscará algumas novelas brasileiras (mais antigas), porém as informações da novela também estarão em inglês e formatadas como séries.

### Mega Filmes HD Parser
Este script foi criado para obter primariamente a classificação etária e realizar o filtro dos filmes adultos, baseado na classificação indicativa do [Mega Filmes HD](http://megafilmeshd.org/). A partir dele, podemos adquirir de forma simples a faixa etária (l, 12, 14, 16, 18...) e filtrar os filmes para o público desejado.
Futuramente, este parser ainda poderá auxiliar como mais uma forma de input para aprimorar os dados retornados pela API.

### Wikipedia Parser
A Wikipedia pode uma fonte muito rica de informações de programas de TV e filmes brasileiros.
Além disso, sua API é bastante estável e o parsing de HTML simplificado pode ser facilmente incrementado.

### Adoro Cinema Parser
Esta rotina faz o parser de séries e informações básicas de filmes do site [Adoro Cinema](http://www.adorocinema.com/). Com o nome da mídia, ele faz uma busca para descobrir se trata-se de um filme ou uma série. Se for um filme, ele buscará as informações básicas do mesmo. Caso seja uma série, a rotina buscará diversas informações sobre a série, no geral, e cada uma de suas temporadas especificamente. Finalmente, ele obtém também um conjunto de imagens da série e a avaliação do público brasileiro.

### Filmow Parser
O Filmow é um site brasileiro. Extraímos dele os comentários mais relevantes de cada título dado. Cada comentário passa por um filtro de palavras de cunho sexual e de baixo calão para ser persistido. Além disso, usamos seus ratings.

### YouTube Parser
Este método receber como entrada um texto (nome de seriado ou do filme) e utiliza a [API do Google](https://developers.google.com/youtube/v3/docs/search) para buscar e retornar os trailers e teasers da midia no [YouTube](https://www.youtube.com/).

### Twitter Parser
Este método receber como entrada um texto (nome de seriado ou do filme) e utiliza a [API do Twitter](https://dev.twitter.com/rest/public/search) para buscar e retornar comentários do [Twitter](https://twitter.com/) de usuários brasileiros.


# Pré-Requisitos
- NodeJS v8.4.0
- NPM v
- MongoDB
- [RESTHeart](https://github.com/SoftInstigate/restheart)


# Instalação
Instale as dependências do NodeJS:
```bash
npm install
```

Criamos um banco de dados e uma coleção através do RESTHeart:
```bash
PUT /hack {"descr": "descricao do meu banco de dados"}
PUT /hack/data {"descr": "minha primeira colecao"}	
```
O endereço do RESTHeart está hardcoded no arquivo Committer.js, que pode ser substituído, se ele for executado localmente.
Por exemplo,
```bash
http://localhost:8080/hack/data
```


Para executar o servidor:
```bash
npm start
```
