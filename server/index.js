const express = require('express')
const app = express()
const imdbParser = require('./../app/parsers/ImdbParser');
var bodyParser = require('body-parser')
const Committer = require('../app/lib/committer')
const mfhdParser = require('../app/parsers/MegaFilmesHDParser');
const _ = require('lodash')

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

let queue = []

setInterval(function () {
  let title = queue.shift()
  if(title != null) {
    console.log('Processando ' + title);
    filmow(title);
    imdbParser.scrape(title);
    mfhdParser.scrape(title);
  }
}, 500)

app.post('/processOne',  async (req, res, next) => {
  if(req.body == null || req.body._source == null) {
    sendJsonResponse(res , 400, {error: 'Body not found'})
    return
  }

  // this assumes the sky strucutre
  let title = req.body._source.programTitle
  let releaseDate = req.body._source.releaseYear

  queue.push(title)
  //filmow(title).then();
  //imdbParser.scrape(title);
  
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


  let compose = {}

  resp.forEach(item => {
    compose = _.merge(compose, item)
  })

  sendJsonResponse(res, 200, { result : compose })
});

const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
  });
} else {
  // Workers can share any TCP connection
  // In this case it is an HTTP server
  app.listen(app.get('port'), function () {
    console.log("Node app is running at localhost:" + app.get('port'))
  });
}

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