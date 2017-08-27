const request = require('request')
const rp = require('request-promise')

const DB_BASE_URL = 'http://thecallbacks.ddns.net:8080/hack/data/'

class Committer {
  async getCollection() {
    let resp = await rp.get(DB_BASE_URL)
    return JSON.parse(resp)._embedded
  }

  async getByTitle(title) {
    if(title == null) return
    let resp = await 
      rp.get(DB_BASE_URL + `?filter={'title': '${title}'}`)
    return JSON.parse(resp)._embedded
  }

  async getBySource(title, source) {
    if(title == null || source == null) return
    let resp = await 
      rp.get(DB_BASE_URL + `?filter={'title': '${title}', 'source' : '${source}'}`)
    return JSON.parse(resp)._embedded
  }

  async post(payload) {
    // validata
    if(payload.title == null || payload.source == null || payload.result == null) {
      return
    }

    // check if document exists
    let exists = await this.getBySource(payload.title, payload.source)
    let resp

    if(exists[0] != null) {
      let data = exists[0]
      payload._id = data._id.$oid
      resp = await rp.post({url: DB_BASE_URL, json: payload})
    } else {
      let resp = await rp.post({url: DB_BASE_URL, json: payload})
    }
    
    return resp
  }
}

module.exports = Committer