function YouTubeParser(pesquisa, call) {
    let YouTube = require('youtube-node');
    let youTube = new YouTube();

    youTube.setKey('AIzaSyBQMJGymUzMLG75-R3MH0IYMQc61InGGgc');

    youTube.search(pesquisa + ' + trailer', 2, function (error, result) {
        if (error) {
            console.error('[ERROR] YouTube search error: ', error);
        } else {
            call(result);
            // console.log(JSON.stringify(result, null, 2));
        }
    });
}

// Example
YouTubeParser('A Grande Familia + serie', function (res) {
    if (typeof res === 'undefined') {
        console.error('[ERROR] YouTube results undefined');
        return;
    }
    let items = res.items;
    if (items.length === 0) {
        console.error('[ERROR] YouTube empty result');
        return;
    }

    let link = 'https://www.youtube.com/watch?v=';
    let item = res.items[0];
    link += item.id.videoId;
    console.log(link);
});
