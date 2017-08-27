function TwitterParser(pesquisa) {
    return new Promise(function (resolve, reject) {
        let Twitter = require('twitter');

        let twitter = new Twitter({
            consumer_key: '22y8KxH86Q5nnrI4ZyMNnw5wZ',
            consumer_secret: 'LprIzM7A6d0HpbhiEa9i8CoIm10L3Za2dke5FuyBrQJ3JyuodP',
            access_token_key: '901631610776416256-ibaS6oyYWTMQmkwh3KhQDTwRniAcj1l',
            access_token_secret: '2IJdMwIN1GVE3Be844iMnDIt90KXvWrwHAQGkFIXJp6qp'
        });

        let query = {
            q: pesquisa,
            count: 10,
            lang: 'pt',
            result_type: 'recent'
        };

        twitter.get('search/tweets', query, function (error, tweets, response) {
            if (error) {
                reject('[ERROR] search/tweets error: ', error);
            } else {
                let tweetas = [];
                tweets.statuses.forEach(function (el, i) {
                    tweetas.push({
                        user: '@' + el.user.screen_name,
                        text: el.text
                    });
                });
                resolve(tweetas);
            }
        });
    });
}

module.exports = TwitterParser;
