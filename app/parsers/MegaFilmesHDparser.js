const rp = require('request-promise');
const cheerio = require('cheerio');
const movie = require('./../models/movie');
const serie = require('./../models/serie');
const Committer = require('./../lib/committer');

const baseUrl = 'http://megafilmeshd.org';

const parseMedia = async function (urls, query) {
    try {
        
        let payloads = [];
        for (let url in urls) {
            let movieHtml = await rp.get(urls[url]);
            let $m = cheerio.load(movieHtml);
            
            movie.technicalDetails.parentalRating = $m('.ic-idade').text();
            movie.technicalDetails.movieName = $m('.t_arc').text().split(/\s\(\d{4}/)[0];
            
            let committer = new Committer();
            
            let payload = {
                title: query,
                source: 'Mega Filmes HD',
                result : movie
            };
            
            payloads.push(payload);
        
            committer.post(payload);
        }
        
        return payloads;
    } catch (err) {
        console.error('Can\'t parse movie.', err);
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