var profanity = require('profanity-util');

var fs = require('fs');
var forbiddenList = fs.readFileSync('palavroes.txt').toString().split("\n");
for(i in forbiddenList) {
    console.log(forbiddenList[i]);
}

function hasProfanify(str) {
    return profanity.purify(str.toLowerCase(), { forbiddenList: forbiddenList })[1].find(isNotEmpty) != null;
}

function isNotEmpty(str) {
    return str != "";
}

module.exports = hasProfanify;