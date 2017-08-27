var profanity = require('profanity-util');

var fs = require('fs');
var forbiddenList = fs.readFileSync('./app/lib/palavroes.txt').toString().split("\n");

function hasProfanify(str) {
    return profanity.purify(str.toLowerCase(), { forbiddenList: forbiddenList })[1].find(isNotEmpty) != null;
}

function isNotEmpty(str) {
    return str != "";
}

module.exports = hasProfanify;