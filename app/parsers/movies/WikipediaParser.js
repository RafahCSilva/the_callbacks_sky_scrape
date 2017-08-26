const fs = require('fs')
const cheerio = require('cheerio');

var request = require('request');

var obj = JSON.parse(fs.readFileSync('../../guide.json', 'utf8'))
console.log("oi")

function extractGenre(body) {
    // TODO: Pode ser género
    const $ = cheerio.load(body);
    return $('td:contains("Gênero")').next().children('a').map(function(i, node) {
        return $(node).text();
});
}

function extractStarring(body) {

}

function getWikipediaCleanerHtml(title) {
    let wikipediaEndpoint = 'https://pt.wikipedia.org/api/rest_v1/page/html/';
    let reqUrl = wikipediaEndpoint + title;
    request.get({uri: reqUrl,
                json: true,
                encoding: 'utf-8'}, function (error, response, body) {
                if(!error && response.statusCode == '200') {
                    let genre = extractGenre(body);
                    if (genre != null && genre.length != 0) {
                        console.log("o gênero de " + reqUrl + "é : " + genre.toArray().toString());
                    }
                }
                else {
                }
                // let genero = $('td').filter((i,el) => $(el).text() == 'Gênero')
            })

}

obj.hits.forEach(function(element) {
    let titulo = element._source.programTitle;
    reqUrl = "https://pt.wikipedia.org/w/api.php?action=opensearch&search=" + titulo + "&limit=5&namespace=0&format=json";
    request.get({uri: reqUrl,
                json: true,
                encoding: 'utf-8'}, function (error, response, body) {
                //   console.log('error:', error); // Print the error if one occurred
                 if(!error) {
                    // console.log(body);
                    hasFirstResult = body.length > 0 && body[1].length > 0;
                    if(hasFirstResult) {
                        let title = body[1][0];
                        getWikipediaCleanerHtml(title);
                        // console.log(title);
                    }
                }
            })
}, this);

