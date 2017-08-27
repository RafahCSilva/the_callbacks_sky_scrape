const request = require('request')
var rp = require('request-promise')
const cheerio = require('cheerio')
const async = require('async')
const Committer = require('../lib/committer')
const _ = require('lodash')

var DB_URL = 'http://thecallbacks.ddns.net:8080/hack/data/hack/data/'

async function process (query) {
  let searchLink = 'https://filmow.com/buscar/'
  var propertiesObject = { q: query }
  let resp

  try {
    resp = await rp.get({ url: searchLink, qs: propertiesObject })
  } catch (e) {
    console.log(e)
    return []
  }
  let $ = cheerio.load(resp)

  let title = $('.search-result-item .title')
  
  //console.log("Starting process in parallel")

  let arr = []

  title.each(function (i, el) {
    arr.push(calculate(el).then(function(result) { 
        return result
    }))
  })

  if(arr.length == 0) {
    //console.log("Nao encontramos nada, vida que segue!")
    return
  }
  
  let join = await Promise.all(arr)

  let commiter = new Committer()

  let final = join.map(function(item) {
    if(item.type = 'Série') {
      const serie = _.cloneDeep(require('./../models/serie'))
      serie.technicalDetails.releaseYear = item.year
      serie.technicalDetails.movieName = item.title
      serie.about.rating = item.stars
      serie.comments = item.comments
      return serie
    }

    else {
      const movie = _.cloneDeep(require('./../models/serie'))
      movie.technicalDetails.releaseYear = item.year
      movie.technicalDetails.movieName = item.title
      movie.about.rating = item.stars
      movie.comments = item.comments
      return movie
    }
  })

  final.forEach(function(item) {
    commiter.post({
      title: query,
      source: 'filmow',
      result : item
    })
  })

  return join

  async function calculate(el) {
    let text = $(el).text().replace(/\r?\n|\r/g, ' ')

    let link = $($(el).find('a')[0]).attr('href')

    let parallel = await Promise.all([getStars(link), getComments(link)])

    let data = splitText(text)
    data.stars = parallel[0]
    data.comments = parallel[1]

    return data
  }
}

module.exports = process

async function getComments(link){
  let commentsLink = 'https://filmow.com/async/comments/'

  let instanceId = findInstanceId(link)

  if(instanceId == null) {
    return null
  }
  
  propertiesObject = {
    content_type: '22',
    object_pk : instanceId,
    user: 'all',
    order_by: '-likes_confidence_score',
    page: 1
  };

  try {
    resp = await rp.get({ url: commentsLink, qs: propertiesObject })
    let info = JSON.parse(resp)
    $ = cheerio.load(info.html)
    return $('.comment-text')
      .text()
      .replace(/\t/g, "")
      .split("\n")
      .filter(item => item != '')
  } catch (e) {
    console.log(e)
    return []
  }

}

async function getStars(link) {
  try {
    let detail = 'https://filmow.com' + link
    resp = await rp.get({ url: detail })
    $ = cheerio.load(resp)
    return $('.average').html()
  } catch (e) {
    console.log(e)
    return []
  }

}

function splitText(title) {
  var generalMatcher = /(.*)\s*(\(\d*\))\s*-(.*)/g
  var match = generalMatcher.exec(title)
  let secondMatch = false

  let obj = {}

  var temporadaMatcher = /(.*)(\(\d*.*Temporada\))/g
  if(match && match[1]) secondMatch = temporadaMatcher.exec(match[1])
  if(match && match[2]) obj.year = match[2].replace('(', '').replace(')', '');
  if(match && match[3]) obj.type = match[3].trim();

  if(secondMatch != null) {
    if(secondMatch[1]) obj.title = secondMatch[1].trim()
    if(secondMatch[2]) obj.temporada = secondMatch[2].trim().replace('(', '').replace(')', '')
  } else {
    obj.title = match[1].trim()
  }
  
  return obj
}

function findInstanceId(link){
  var myRegexp = /.*(t\d*)/g
  var match = myRegexp.exec(link)
  if(match && match[1]) {
    return match[1].replace('t', '')
  } else {
    return null
  }
  
}