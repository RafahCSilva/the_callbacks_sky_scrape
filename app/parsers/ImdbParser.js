const request = require('request');
const cheerio = require('cheerio');
const movie = require('./../models/movie.js');
const serie = require('./../models/serie.js');


module.exports.scrape = function (title) {
    request('http://www.imdb.com/find?q=' + title.toLowerCase().trim().replace(/ +/g, '+'), function (error, response, html) {
        if (!error && response.statusCode == 200) {
            const $list = cheerio.load(html);
            
            let found = false;
            $list('#main > div > div:nth-child(3) > table tr').each(function (idx, elm) {
                // pega o que tiver titulo igual
                if ($list(elm).find('.result_text a').text() == title && found == false) {
                    found = true;
                    let url = 'http://www.imdb.com' + $list(elm).find('.result_text a').attr('href').split('/?ref')[0];
                    scrapePage(url, title);
                }
            });
        }
    });
}

var scrapePage = function (url, query) {
    request(url, function (error, response, html) {
        if (!error && response.statusCode == 200) {
            const $ = cheerio.load(html);
            
            let mediaType = $('#title-overview-widget > div.vital > div.title_block > div > div.titleBar > div.title_wrapper > div > a:nth-child(9)');
            
            //TODO check the common attrs between series and movies and use them to also put series information.
            if (mediaType.text().indexOf('TV Series') >= 0) {
                serie.technicalDetails.releaseYear = $(mediaType).text().match(/\d{4}/)[0];
            } else {
                //get soundtrack
                let soundtrackUrl = url + '/soundtrack';
                request(soundtrackUrl, function (error, response, html) {
                    const $2 = cheerio.load(html);
                    $2('#soundtracks_content .soundTrack').each(function (i, elm) {
                        let name = $2(elm).text().split('\n')[0];
                        let writer = $2(elm).text().split('\n')[1].replace('Written by ', '');
                        movie.technicalDetails.soundtrack.push({
                            name: name.substr(0, name.length-1),
                            writer: writer.substr(0, writer.length-1)
                        });
                    });
                    
                    movie.technicalDetails.movieName = $('.title_wrapper h1').text().replace('&nbsp;', '').trim();
                    movie.technicalDetails.releaseYear = $('#titleYear > a').text();
                    movie.technicalDetails.originalName = $('.title_wrapper h1').text().replace('&nbsp;', '').trim();
                    movie.technicalDetails.duration = $('#title-overview-widget > div.vital > div.title_block > div > div.titleBar > div.title_wrapper > div.subtext > time').text();
                    movie.technicalDetails.originalLanguage = $('#titleDetails > div:nth-child(5) > a').text();
                    
                    movie.about.sinposis = $('#titleStoryLine .inline.canwrap p').text();
                    $('#titleStoryLine > div:nth-child(6) a').each(function (i, elm) {
                        if ($(elm).text().indexOf('See All') < 0) {
                            movie.about.keywords.push($(elm).text());
                        }
                    });
                    
                    $('.title_wrapper .subtext a').each(function (i, elm) {
                        if ($(elm).attr('href').indexOf('genre') > 0) {
                            movie.about.genre.push($(elm).find('span').text());
                        }
                    });
                    
                    $('#titleDetails > div:nth-child(17)').find('a span').each(function (i,j) {
                        movie.technicalDetails.producers.push($(j).text());
                    });
                    
                    $('#title-overview-widget > div.plot_summary_wrapper > div.plot_summary > div:nth-child(2) > span').find('a > span').each(function (i, elm) {
                        movie.cast.directors = $(elm).text();
                    });
                    
                    $('#title-overview-widget > div.plot_summary_wrapper > div.plot_summary > div:nth-child(3) > span').find('a > span').each(function (i, elm) {
                        movie.cast.creators.push($(elm).text());
                    });
                    
                    $('#titleDetails > div:nth-child(11) span[itemprop=creator] a span').each(function (i,j) {
                        movie.cast.production.push($(j).text());
                    });
                    
                    //TODO change for image base64
                    movie.media.poster = $('#title-overview-widget > div.vital > div.slate_wrapper > div.poster > a > img').attr('src');
                    
                    return {
                        title: query,
                        source: 'IMDB',
                        result : movie
                    }
                });
            }
            
        }
    });
}