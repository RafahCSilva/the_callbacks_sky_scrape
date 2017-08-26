const request = require('request')
var rp = require('request-promise')
const cheerio = require('cheerio')
const async = require('async')

async function process (query) {
  let searchLink = 'https://filmow.com/buscar/'
  var propertiesObject = { q: query, movie_type : 'f' }

  let resp = await rp.get({ url: searchLink, qs: propertiesObject })
  let $ = cheerio.load(resp)

  let title = $('.search-result-item .title')

  async.map(title, async.asyncify(calculate), function(err, results) {
    console.log(results)
  });

  async function calculate(el) {
    let text = $(el).text().replace(/\r?\n|\r/g, ' ')

    let link = $($(el).find('a')[0]).attr('href')

    let parallel = await Promise.all([getStars(link), getComments(link)])

    // comments
    findInstanceId(link)

    let data = splitText(text)
    data.stars = parallel[0]
    data.comments = parallel[1]
    return data
  }
}

(async function execute() {
  await process('os embalos de sábado a noite')
})()


async function getComments(link){
  let commentsLink = 'https://filmow.com/async/comments/'
  
  propertiesObject = {
    content_type: '22',
    object_pk : findInstanceId(link),
    user: 'all',
    order_by: '-likes_confidence_score',
    page: 1
  };

  resp = await rp.get({ url: commentsLink, qs: propertiesObject })
  let info = JSON.parse(resp)
  $ = cheerio.load(info.html)
  return $('.comment-text')
    .text()
    .replace(/\t/g, "")
    .split("\n")
    .filter(item => item != '')
}

async function getStars(link) {
  let detail = 'https://filmow.com' + link
  resp = await rp.get({ url: detail })
  $ = cheerio.load(resp)
  return $('.average').html()
}

function splitText(title) {
  var generalMatcher = /(.*)\s*(\(\d*\))\s*-(.*)/g
  var match = generalMatcher.exec(title)

  var temporadaMatcher = /(.*)(\(\d*.*Temporada\))/g
  var secondMatch = temporadaMatcher.exec(match[1])

  let obj = {
    year: match[2].replace('(', '').replace(')', ''),
    type: match[3].trim()
  }

  if(secondMatch) {
    obj.title = secondMatch[1].trim()
    obj.temporada = secondMatch[2].trim().replace('(', '').replace(')', '')
  } else {
    obj.title = match[1].trim()
  }
  
  return obj
}

function findInstanceId(link){
  var myRegexp = /.*(t\d*)/g
  var match = myRegexp.exec(link)
  return match[1].replace('t', '')
}