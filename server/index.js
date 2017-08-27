const express = require('express')
const app = express()
const imdbParser = require('./../app/parsers/ImdbParser');
var bodyParser = require('body-parser')
const Committer = require('../app/lib/committer')

const filmow = require('../app/lib/filmow')

app.set('port', (process.env.PORT || 5000));

app.use(bodyParser.json({limit: '50mb'}));
app.use(express.static(__dirname + '/public'));

app.get('/', function (request, response) {
    response.send('Hello World! The Callbacks')
});


var sendJsonResponse = function(res, status, content) {
  res.status(status);
  res.json(content);
};

app.post('/processOne',  async (req, res, next) => {
  if(req.body == null || req.body._source == null) {
    sendJsonResponse(res , 400, {error: 'Body not found'})
    return
  }

  // this assumes the sky strucutre
  let title = req.body._source.programTitle
  let releaseDate = req.body._source.releaseYear

  filmow(title).then();
  //imdbParser.scrape(title).then();
  
  res.json({test: 'felipe'});
});

app.get('/obtainData',  async (req, res, next) => {
  if(req.query == null) {
    sendJsonResponse(res , 400, {error: 'Body not found'})
  }

  // this assumes the sky strucutre
  let title = req.query.title

  let committer = new Committer()
  let resp = await committer.getByTitle(title)

  sendJsonResponse(res, 200, { result : resp })
});

app.listen(app.get('port'), function () {
    console.log("Node app is running at localhost:" + app.get('port'))
});

function createSleepPromise(timeout) {
    return new Promise(function(resolve) {
        setTimeout(resolve, timeout);
    });
};

function sleep(timeout) {
    // Pass value through, if used in a promise chain
    function promiseFunction(value) {
        return createSleepPromise(timeout).then(function() {
            return value;
        });
    };

    // Normal promise
    promiseFunction.then = function() {
        var sleepPromise = createSleepPromise(timeout);

        return sleepPromise.then.apply(sleepPromise, arguments);
    };
    promiseFunction.catch = Promise.resolve().catch;

    return promiseFunction;
}