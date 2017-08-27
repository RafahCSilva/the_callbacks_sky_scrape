function TwitterParser(termo, callback) {
    var Twitter = require('twitter');

    var client = new Twitter({
        consumer_key: '22y8KxH86Q5nnrI4ZyMNnw5wZ',
        consumer_secret: 'LprIzM7A6d0HpbhiEa9i8CoIm10L3Za2dke5FuyBrQJ3JyuodP',
        access_token_key: '901631610776416256-ibaS6oyYWTMQmkwh3KhQDTwRniAcj1l',
        access_token_secret: '2IJdMwIN1GVE3Be844iMnDIt90KXvWrwHAQGkFIXJp6qp'
    });

    let query = {
        q: termo,
        count: 10,
        lang: 'pt',
        result_type: 'recent'
    };

    client.get('search/tweets', query, function (error, tweets, response) {
        if (error) {
            console.err('[ERROR] search/tweets error');
            return;
        }
        let tweetas = [];

        tweets.statuses.forEach(function (el, i) {
            tweetas.push({
                user: '@' + el.user.screen_name,
                text: el.text
            });
        });
        callback(tweetas);
    });
}


TwitterParser('Game of Thrones', (tweets) => {
    console.log(tweets);
});
