const request = require('request');
const cheerio = require('cheerio');
const serie = require('./../../models/serie.js');

request('http://www.adorocinema.com/series/serie-7157/', function (error, response, html) {
    if (!error && response.statusCode == 200) {
        const $ = cheerio.load(html);
        
        serie.technicalDetails.movieName = $('#title > span.tt_r26.j_entities').text();
        
        console.log(serie.technicalDetails.movieName);
    }
});
