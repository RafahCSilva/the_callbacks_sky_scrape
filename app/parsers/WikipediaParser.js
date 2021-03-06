const fs = require('fs')
const cheerio = require('cheerio');
let _ = require('lodash')

let generico = _.cloneDeep(require('./../models/generico.js'));
let movie = _.cloneDeep(require('./../models/movie.js')); 

const Committer = require('../lib/committer')

var request = require('request');
var rp = require('request-promise');


function extractGenrePt(body) {
    // TODO: Pode ser género
    const $ = cheerio.load(body);
    return $('td:contains("Gênero")').next().children('a').map(function (i, node) {
        return $(node).text();
    });
}

function extractDuracaoPt(body) {
    const $ = cheerio.load(body);
    return $('td:contains("Duração")').next().text();
}

function extractIdiomaPt(body) {
    const $ = cheerio.load(body);
    return $('td:contains("Idioma")').next().children('a').map(function (i, node) {
        return $(node).text().toLocaleLowerCase();
    })
}

async function extractAlternativeNames(title) {
    let reqUrl = "http://en.wikipedia.org/w/api.php?action=query&format=json&list=backlinks&bltitle=" + title + "&blfilterredir=redirects&bllimit=5";
    let body = await rp.get({
        uri: reqUrl,
        json: true,
        encoding: 'utf-8'
    });
    const $ = cheerio.load(body);
    return uniq(body.query.backlinks.map(function (node, i) {
        return node.title.toLowerCase();
    }));
}



function extractStarringPt(body) {
    const $ = cheerio.load(body);
    return $('td:contains("Elenco")').next().children('a').map(function (i, node) {
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

async function getWikipediaCleanerHtml(title) {
    let wikipediaEndpoint = 'https://pt.wikipedia.org/api/rest_v1/page/html/';
    let reqUrl = wikipediaEndpoint + title;
    let body = await rp.get({
        uri: reqUrl,
        json: true,
        encoding: 'utf-8'
    });
    return body;
}

async function getObject(body, title) {
    let extractedSomeDataSucessfully = 0;
    let objRet = { 'result': {} };

    let genre = extractGenrePt(body);
    if (genre != null && genre.length != 0) {
        objRet.result.genre = genre.toArray();
        extractedSomeDataSucessfully++;
    }

    let starring = extractStarringPt(body);
    if (starring != null && starring.length != 0) {
        objRet.result.starring = starring.toArray();
        extractedSomeDataSucessfully++;
    }

    let format = extractFormatPtOld(body);
    if (format != null && format.length != 0) {
        objRet.result.format = format
        extractedSomeDataSucessfully++;
    }

    let idioma = extractIdiomaPt(body);
    if (idioma != null && idioma.length != 0) {
        objRet.result.language = idioma.toArray();
        extractedSomeDataSucessfully++;
    }

    let duration = extractDuracaoPt(body);
    if (duration != null && duration.length != 0) {
        parsedDuration = parseDuration(duration);
        objRet.result.duration = duration;
        extractedSomeDataSucessfully++;
    }

    let alternativeNames = await extractAlternativeNames(title);
    if (alternativeNames != null && alternativeNames.length != 0) {
        objRet.result.alternativeNames = alternativeNames;
        extractedSomeDataSucessfully++;
    }

    if (extractedSomeDataSucessfully > 2) {
        let novo = convertToGeneric(objRet)
        let com = new Committer()
        com.post({
            title: title,
            source: 'wikipedia',
            result: novo
        })
        return objRet;
    }
    return null;
}

function convertToMovie(objRet) {
    movie.technicalDetails.movieName = objRet.result.title;
    movie.technicalDetails.duration = objRet.result.duration;
    movie.technicalDetails.genre = objRet.result.genre;
    movie.technicalDetails.availableLanguages = objRet.result.language;
    movie.technicalDetails.duration = objRet.result.duration;
    movie.about.keywords = objRet.result.alternativeNames;
    movie.cast.list = objRet.result.starring;
}

function convertToGeneric(objRet) {
    generico.technicalDetails.movieName = objRet.title;
    generico.technicalDetails.duration = objRet.result.duration;
    generico.technicalDetails.genre = objRet.result.genre;
    generico.technicalDetails.availableLanguages = objRet.result.language;
    generico.technicalDetails.duration = objRet.result.duration;
    generico.about.keywords = objRet.result.alternativeNames;
    generico.cast.list = objRet.result.starring;
    generico.type = objRet.result.format;
    return generico;
}

function pushToDB(objRet) {
    endPoint = "http://thecallbacks.ddns.net:8080/hack/data";
    rp.post({
        uri: endPoint,
        json: objRet
    });
}

async function getWikipediaMatches(titulo) {
    let reqUrl = "https://pt.wikipedia.org/w/api.php?action=opensearch&search=" + titulo + "&limit=5&namespace=0&format=json";
    let body = await rp.get({
        uri: reqUrl,
        json: true,
        encoding: 'utf-8'
    });
    return body;
}

async function scrape(titulo) {
    let matches = await getWikipediaMatches(titulo);
    let bestMatch = getTitle(matches);
    if (bestMatch != null) {
        let title = bestMatch;
        let cleanHtml = await getWikipediaCleanerHtml(title);
        return await getObject(cleanHtml, title);
    }
}

function getTitle(matches) {
    let descriptions = matches[2];
    let firstMatch = matches[1][0]
    if (!descriptions || descriptions.length == 0 ||
        (descriptions.length == 1 && descriptions[0] == "")) {
        return firstMatch;
    }
    let iMovie = descriptions.findIndex(function (description, i) {
        return description.toLowerCase().includes('filme');
    });
    let iSerie = descriptions.findIndex(function (description, i) {
        return description.toLowerCase().includes('série');
    });
    if (iMovie != -1) {
        return matches[1][iMovie];
    }
    if (iSerie != -1) {
        return matches[1][iSerie];
    }
    return firstMatch;
}

// (async function execute() {
//     let obj = JSON.parse(fs.readFileSync('../../guide.json', 'utf8'))
//    console.log("oi")
//    obj.hits.forEach(function (element, i) {
//        if (i < 200) {
//            scrape(element._source.programTitle);
//        }
//    }, this);
// })()

function parseDuration(raw) {
    let myRegexp = /(\d+) [Mm]in/;
    let match = myRegexp.exec(raw);
    retorno = "";
    if (match != null && match.length > 0) {
        retorno = match[1];
    }
    return retorno;
}

function uniq(a) {
    return Array.from(new Set(a));
}

module.exports = scrape