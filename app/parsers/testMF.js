const parser = require('./MegaFilmesHPparser');

var result = parser.scrape('vampire diaries').then(function (result) {
    console.log(result[0].result);
}).catch(function (err) {
    console.log(err);
});