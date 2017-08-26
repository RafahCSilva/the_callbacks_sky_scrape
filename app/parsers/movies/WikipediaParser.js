const fs = require('fs')
var obj = JSON.parse(fs.readFileSync('../../guide.json', 'utf8'))
console.log("oi")
obj.hits.forEach(function(element) {
    console.log(element._source.programTitle)
}, this);

