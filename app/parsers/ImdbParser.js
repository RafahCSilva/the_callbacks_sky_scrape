const request = require('request');
const rp = require('request-promise');
const cheerio = require('cheerio');
const movie = require('./../models/movie');
const serie = require('./../models/serie');
const Committer = require('./../lib/committer');

module.exports.scrape = async function (title) {
  let html = null

  try {
    html = await rp.get('http://www.imdb.com/find?q=' + title.toLowerCase().trim().replace(/ +/g, '+'))
  } catch (e) {
    return null
  }
  
  const $list = cheerio.load(html);

  let found = false;
  let movieUrl = '';
  let arr = []

  $list('.result_text a').each((i, item) => {
    arr.push('http://www.imdb.com' + $list(item).attr('href').split('/?ref')[0])
  })
  
  if(arr.length != 0) {
    let scrapped = await scrapePage(arr[0], title)

    return scrapped
  }
}

async function scrapePage (url, query) {
  let html = null
  try {
    html = await rp.get(url)
  } catch (e) {
    return
  }

  const $ = cheerio.load(html);

  let mediaType = $('#title-overview-widget > div.vital > div.title_block > div > div.titleBar > div.title_wrapper > div > a:nth-child(9)');
  //TODO check the common attrs between series and movies and use them to also put series information.
  if (mediaType.text().indexOf('TV Series') >= 0) {
    serie.technicalDetails.releaseYear = $(mediaType).text().match(/\d{4}/)[0];
  } else {
    //get soundtrack
    let soundtrackUrl = url + '/soundtrack';
    let soundHtml = null
    try {
      soundHtml = await rp.get(soundtrackUrl)
      const $2 = cheerio.load(soundHtml);
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

      //TODO change for image base64 and download
      movie.media.poster = $('#title-overview-widget > div.vital > div.slate_wrapper > div.poster > a > img').attr('src');
    } catch (e) {
      console.log("fail second")
    }


    // distributors
    let distributorsHtml = null
    try {
      distributorsHtml = await rp.get(url + '/companycredits')
      const $cred = cheerio.load(html);

      $cred('h4#production').next().find('li a').each(function (i, elm) {
        movie.cast.production.push($(elm).text());
      });

      $cred('h4#distributors').next().find('li').each(function (i, elm) {
        movie.cast.distributors.push($(elm).text().replace(/\s+/g, ' ').trim());
      });


    } catch (e) {
      console.log("fail third")
    }

    let committer = new Committer();

    let payload = {
      title: query,
      source: 'IMDB',
      result : movie
    }

    committer.post(payload);

    return payload
  }
}