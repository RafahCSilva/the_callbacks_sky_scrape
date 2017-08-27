const parser = require('./MegaFilmesHDparser.js');

var result = parser.scrape('Homem Aranha').then(function (result) {
    console.log(result);
}).catch(function (err) {
    console.log(err);
});