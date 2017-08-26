const request = require('request');
const cheerio = require('cheerio');
const movie = require('./../../models/movie.js');

request('http://www.imdb.com/title/tt0076759/', function (error, response, html) {
    console.log(movie);
    if (!error && response.statusCode == 200) {
        const $ = cheerio.load(html);
        
        //movie.technicalDetails.movieName can be duplicated. Get from other sites.
        movie.technicalDetails.releaseYear = $('#titleYear > a').text();
        movie.technicalDetails.originalName = $('#title-overview-widget > div.vital > div.title_block > div > div.titleBar > div.title_wrapper > h1').text();
        movie.technicalDetails.duration = $('#title-overview-widget > div.vital > div.title_block > div > div.titleBar > div.title_wrapper > div.subtext > time').text();
        
        console.log(movieTitle);
    }
});