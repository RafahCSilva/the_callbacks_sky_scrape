const request = require('request');
const rp = require('request-promise');
const cheerio = require('cheerio');
const _ = require('lodash');
let serie = _.cloneDeep(require('./../models/serie.js'));
letmovie = _.cloneDeep(require('./../models/movie.js')); 
const Committer = require('./../lib/committer');
const yt = require('./youtubeParser');
var obj;

module.exports.scrape = async function (title) {
  try {
    let html = await rp.get('http://www.imdb.com/find?q=' + title.toLowerCase().trim().replace(/ +/g, '+'))
    if (html) {
      const $list = cheerio.load(html);

      let movieUrls = [];
      $list('#main > div > div:nth-child(3) > table > tbody > tr.findResult').each(function (i, elm) {
        movieUrls.push('http://www.imdb.com' + $list(elm).find('.result_text a').attr('href').split('/?ref')[0]);
      });

      let scrapeds = [];
      movieUrls.forEach(function (elm, i) {
        scrapeds.push(scrapePage(elm, title).then(function (result) {
          return result;
        }));
      });

      let result = Promise.all(scrapeds);

      return result;
    } else {
      console.log('Not HTML')
    }
  } catch (err) {
    console.log('Failed parsing website: ' + err.message);
  }
}

async function findSeasonInfo(seasonUrl) {
  try {
    let html = await rp.get(seasonUrl);

    if (html) {
      const $ssn = cheerio.load(html);
      let season = {};
      season.number = Number($ssn('#bySeason').val());
      season.year = $ssn('#byYear option').eq(Number(season.number)).val();
      season.totalEpisodes = $ssn('#episodes_content > div.clear > div.list.detail.eplist > div').length;

      season.media = {};
      season.media.poster = $ssn('#main > div.article.listo.list > div.subpage_title_block > a > img').attr('src');

      season.media.trailers = await yt(obj.technicalDetails.movieName + ' + ' + season.number + ' temporada + trailer');
      season.media.promoVideos = await yt(obj.technicalDetails.movieName + ' + ' + season.number + ' temporada + promo');

      season.media.screenshots = [];
      $ssn('#episodes_content > div.clear > div.list.detail.eplist > div .image img').each(function (i, elm) {
        season.media.screenshots.push($ssn(elm).attr('src'));
      });

      season.episodes = [];
      $ssn('#episodes_content > div.clear > div.list.detail.eplist > div').each(function (i, elm) {
        season.episodes.push({
          name: $ssn(elm).find('div.info strong a').text(),
          number: $ssn(elm).find('div.image a div div').text().toLowerCase().split('ep')[1].trim(),
          director: "",
          creator: "",
          sinopsis: $ssn(elm).find('div.info > div.item_description').text().trim(),
          screenshots: []
        });
      });

      return season;
    } else {
      console.log('No HTML found');
    }
  } catch (err) {
    console.log('failed to fetch season: ' + err.message);
  }
}

async function getSeasons(seasonUrls) {
  let seasonPromises = [];
  seasonUrls.forEach(function (sUrl) {
    seasonPromises.push(findSeasonInfo(sUrl).then(function (result) {
      return result;
    }));
  });

  let seasons = await Promise.all(seasonPromises);

  return seasons;
}

async function scrapePage(url, query) {
  let html
  try {
    html = await rp.get(url)
  } catch (e) {
    return
  }


  const $ = cheerio.load(html);

  let mediaType = $('#title-overview-widget > div.vital > div.title_block > div > div.titleBar > div.title_wrapper > div > a:nth-child(9)');
  obj = (mediaType.text().indexOf('TV Series') >= 0) ? serie : movie;

  //get soundtrack
  let soundtrackUrl = url + '/soundtrack';
  let soundHtml

  try {
    soundHtml = await rp.get(soundtrackUrl)
  } catch (e) {
    return
  }

  const $2 = cheerio.load(soundHtml);
  $2('#soundtracks_content .soundTrack').each(function (i, elm) {
    let name = $2(elm).text().split('\n')[0];
    let writer = $2(elm).text().split('\n')[1].replace('Written by ', '');
    obj.technicalDetails.soundtrack.push({
      name: name.substr(0, name.length - 1),
      writer: writer.substr(0, writer.length - 1)
    });
  });

  obj.technicalDetails.movieName = $('.title_wrapper h1').text().replace('&nbsp;', '').trim();
  obj.technicalDetails.originalName = $('.title_wrapper h1').text().replace('&nbsp;', '').trim();
  obj.technicalDetails.duration = $('#title-overview-widget > div.vital > div.title_block > div > div.titleBar > div.title_wrapper > div.subtext > time').text().replace('\n', '').trim();
  obj.technicalDetails.originalLanguage = $('#titleDetails > div:nth-child(5) > a').text();

  obj.about.sinopsis = $('#titleStoryLine .inline.canwrap p').text();
  $('#titleStoryLine > div:nth-child(6) a').each(function (i, elm) {
    if ($(elm).text().indexOf('See All') < 0) {
      obj.about.keywords.push($(elm).text());
    }
  });

  $('.title_wrapper .subtext a').each(function (i, elm) {
    if ($(elm).attr('href').indexOf('genre') > 0) {
      obj.about.genre.push($(elm).find('span').text());
    }
  });

  $('#titleDetails > div:nth-child(17)').find('a span').each(function (i, j) {
    obj.technicalDetails.producers.push($(j).text());
  });

  //TODO change for image base64 and download
  obj.media.poster = $('#title-overview-widget > div.vital > div.slate_wrapper > div.poster > a > img').attr('src');


  if (mediaType.text().indexOf('TV Series') >= 0) {
    obj.technicalDetails.releaseYear = $(mediaType).text().match(/\d{4}/)[0];

    let seasonUrls = [];
    $('#title-episode-widget > div.seasons-and-year-nav > div:nth-child(4) a').each(function (i, elm) {
      seasonUrls.push('http://www.imdb.com' + $(elm).attr('href').split('&ref')[0]);
    });

    obj.seasons = await getSeasons(seasonUrls);
  } else { //for movies
    obj.technicalDetails.releaseYear = $('#titleYear > a').text();

    obj.cast = {};
    obj.cast.directors = [];
    // console.log(obj);
    $('#title-overview-widget > div.plot_summary_wrapper > div.plot_summary > div:nth-child(2) > span a > span').each(function (i, elm) {
      obj.cast.directors.push($(elm).text());
    });

    obj.cast.creators = [];
    $('#title-overview-widget > div.plot_summary_wrapper > div.plot_summary > div:nth-child(3) > span').find('a > span').each(function (i, elm) {
      obj.cast.creators.push($(elm).text());
    });

    let distributorsHtml;
    try {
      distributorsHtml = await rp.get(url + '/companycredits')
    } catch (e) {
      return
    }
    const $cred = cheerio.load(html);

    $cred('h4#production').next().find('li a').each(function (i, elm) {
      obj.cast.production.push($(elm).text());
    });

    $cred('h4#distributors').next().find('li').each(function (i, elm) {
      obj.cast.distributors.push($(elm).text().replace(/\s+/g, ' ').trim());
    });
  }

  let committer = new Committer();

  let payload = {
    title: query,
    source: 'IMDB',
    result: movie
  }

  committer.post(payload);

  return payload
}