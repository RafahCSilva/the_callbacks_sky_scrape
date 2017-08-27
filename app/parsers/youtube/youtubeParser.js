function YouTubeParser(pesquisa) {
  return new Promise (function (resolve, reject) {
    let YouTube = require('youtube-node');
    let youTube = new YouTube();

    youTube.setKey('AIzaSyBQMJGymUzMLG75-R3MH0IYMQc61InGGgc');

    youTube.search(pesquisa + ' + trailer', 2, function (error, result) {
      if (error) {
        reject('[ERROR] YouTube search error: ', error);
      } else {
        if (typeof result === 'undefined') {
        reject('[ERROR] YouTube results undefined');
        }
        let items = result.items;
        if (items.length === 0) {
          reject('[ERROR] YouTube empty result');
        }

        let link = 'https://www.youtube.com/watch?v=';
        let item = result.items[0];
        link += item.id.videoId;
        resolve(link);
      }
    });
  })
}

module.exports = YouTubeParser