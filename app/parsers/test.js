const parser = require('./ImdbParser.js');

var result = parser.scrape('Game of Thrones').then(function (result) {
  console.log(JSON.stringify(result, null, 2));
}).catch(function (err) {
  console.log(err);
});

// const cheerio = require('cheerio');
// var request = require('request');

// request('http://www.adorocinema.com/busca/?q=Rick+and+Morty', function (error, response, html) {
//   if (!error && response.statusCode == 200) {
//     const $ = cheerio.load(html);

//     console.log();
//   }
// });


// let yt = require('./youtubeParser');
// (async function () {
//   let a = await yt('oi');
//   console.log(a);
// })()