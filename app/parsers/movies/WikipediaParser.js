const fs = require('fs')
const cheerio = require('cheerio');

var request = require('request');

var obj = JSON.parse(fs.readFileSync('../../guide.json', 'utf8'))
console.log("oi")

function extractGenrePt(body) {
    // TODO: Pode ser género
    const $ = cheerio.load(body);
    return $('td:contains("Gênero")').next().children('a').map(function(i, node) {
        return $(node).text();
});
}

function extractStarringPt(body) {
    const $ = cheerio.load(body);
    return $('td:contains("Elenco")').next().children('a').map(function(i, node) {
        return $(node).text();
});
}

function getWikipediaCleanerHtml(title) {
    let wikipediaEndpoint = 'https://pt.wikipedia.org/api/rest_v1/page/html/';
    let reqUrl = wikipediaEndpoint + title;
    request.get({uri: reqUrl,
                json: true,
                encoding: 'utf-8'}, function (error, response, body) {
                if(!error && response.statusCode == '200') {
                    let objRet = {};
                    let genre = extractGenrePt(body);
                    if (genre != null && genre.length != 0) {
                        // console.log("o gênero de " + title + "é : " + genre.toArray().toString());
                        objRet.genre = genre.toArray();
                    }
                    let starring = extractStarringPt(body);
                    if (starring != null && starring.length != 0) {
                        // console.log("o elenco de " + title + "é : " + starring.toArray().toString());
                        objRet.starring = starring.toArray();
                    }
                    objRet.title = title;
                    objRet.source = 'wikipedia';
                    console.log(objRet)
                    pushToDB(objRet);
                }
                else {
                }
                // let genero = $('td').filter((i,el) => $(el).text() == 'Gênero')
            })

}

function pushToDB(objRet) {
    endPoint = "http://thecallbacks.ddns.net:8080/hack/data";
    request.post({uri: endPoint,
                  json: objRet}, function(err, resp) {
    console.log(err, resp.body)
}
);
}

function scrape(titulo) {
    reqUrl = "https://pt.wikipedia.org/w/api.php?action=opensearch&search=" + titulo + "&limit=5&namespace=0&format=json";
    request.get({uri: reqUrl,
                json: true,
                encoding: 'utf-8'}, function (error, response, body) {
                 if(!error) {
                    hasFirstResult = body.length > 0 && body[1].length > 0;
                    if(hasFirstResult) {
                        let title = body[1][0];
                        getWikipediaCleanerHtml(title);
                        // console.log(title);
                    }
                }
            })
}

obj.hits.forEach(function(element) {
    scrape(element._source.programTitle);
}, this);

