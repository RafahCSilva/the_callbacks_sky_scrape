const request = require('request');
const cheerio = require('cheerio');

request('http://www.imdb.com/title/tt0076759/', function (error, response, html) {
  if (!error && response.statusCode == 200) {
    console.log(html);
  }
});