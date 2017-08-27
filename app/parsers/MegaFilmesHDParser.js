const rp = require('request-promise');
const cheerio = require('cheerio');
let _ = require('lodash')
let serie = _.cloneDeep(require('./../models/serie.js'));
let movie = _.cloneDeep(require('./../models/movie.js')); 
const Committer = require('./../lib/committer');

const baseUrl = 'http://megafilmeshd.org';

const parseMedia = async function (urls, query) {
    try {
        
        let payloads = [];
        for (let url in urls) {
            let movieHtml = await rp.get(urls[url]);
            let $m = cheerio.load(movieHtml);
            
            let genres = [];
            $m('.si-itens li a').each(function (i, elm) {
                genres.push($m(elm).text());
            });
            
            let obj;
            if (genres.indexOf('Séries') >= 0) {
                obj = serie;
            } else {
                obj = movie;
            }
            
            obj.about.genre = genres;
            obj.technicalDetails.movieName = $m('.t_arc').text().split(' – ')[0];
            obj.technicalDetails.parentalRating = $m('.ic-idade').text();
            
            let committer = new Committer();
            
            let payload = {
                title: query,
                source: 'Mega Filmes HD',
                result : obj
            };
            
            payloads.push(payload);
        
            committer.post(payload);
        }
        
        return payloads;
    } catch (err) {
        console.error('Can\'t parse object.', err);
    }
}

module.exports.scrape = async function (query) {
    try {
        const searchHtml = await rp.get(baseUrl + '/?s=' + query.toLowerCase().trim().replace(' ', '+'));
        const $ = cheerio.load(searchHtml);
        
        let urls = [];
        $('h2.titulo-box-link a').each(function (i, elm) {
            urls.push($(elm).attr('href'));
        });

        return await parseMedia(urls, query);
    } catch (err) {
        console.error('Can\'t parse query. ', err);
    }
}