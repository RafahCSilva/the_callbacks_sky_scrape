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

function extractDuracaoPt(body) {
    const $ = cheerio.load(body);
    return $('td:contains("Duração")').next().text();
}

function extractIdiomaPt(body) {
    const $ = cheerio.load(body);
    return $('td:contains("Idioma")').next().children('a').map(function(i, node) {
        return $(node).text().toLocaleLowerCase();
    })
}


function extractStarringPt(body) {
    const $ = cheerio.load(body);
    return $('td:contains("Elenco")').next().children('a').map(function(i, node) {
        return $(node).text();
});
}

function extractFormatPtOld(body) {
    const $ = cheerio.load(body);
    let format = $('td:contains("Formato")').next().children('a').first().text();
    let returnFormat = "";
    if (format != "NTSC" && format != "480i" && format != "1080i" && format != "SDTV"
        && format != "16:9") {
        returnFormat = format;
    }
    return returnFormat;
}

function getWikipediaCleanerHtml(title) {
    let wikipediaEndpoint = 'https://pt.wikipedia.org/api/rest_v1/page/html/';
    let reqUrl = wikipediaEndpoint + title;
    request.get({uri: reqUrl,
                json: true,
                encoding: 'utf-8'}, function (error, response, body) {
                if(!error && response.statusCode == '200') {
                    extractedSomeDataSucessfully = false;
                    let objRet = {'result': {}};

                    let genre = extractGenrePt(body);
                    if (genre != null && genre.length != 0) {
                        objRet.result.genre = genre.toArray();
                        extractedSomeDataSucessfully = true;
                    }

                    let starring = extractStarringPt(body);
                    if (starring != null && starring.length != 0) {
                        objRet.result.starring = starring.toArray();
                        extractedSomeDataSucessfully = true;
                    }

                    let format = extractFormatPtOld(body);
                    if (format != null && format.length != 0) {
                        objRet.result.format = format
                        extractedSomeDataSucessfully = true;
                    }

                    let idioma = extractIdiomaPt(body);
                    if (idioma != null && idioma.length != 0) {
                        objRet.result.language = idioma.toArray();
                        console.log(idioma.toArray().toString());
                        extractedSomeDataSucessfully = true;
                    }

                    let duration = extractDuracaoPt(body);
                    if (duration != null && duration.length != 0) {
                        parsedDuration = parseDuration(duration);
                        objRet.result.duration = duration;
                        extractedSomeDataSucessfully = true;
                    }

                    objRet.title = title;
                    objRet.source = 'wikipedia';
                    if (extractedSomeDataSucessfully) {
                        pushToDB(objRet);
                        console.log()
                    }
                }
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
    let reqUrl = "https://pt.wikipedia.org/w/api.php?action=opensearch&search=" + titulo + "&limit=5&namespace=0&format=json";
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

function parseDuration(raw) {
    let myRegexp = /(\d+) [Mm]in/;
    let match = myRegexp.exec(raw);
    retorno = "";
    if (match != null && match.length > 0) {
        retorno = match[1];
    }
    return retorno;
}
