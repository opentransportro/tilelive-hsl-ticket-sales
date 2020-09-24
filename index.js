"use strict"
const geojsonVt = require('geojson-vt');
const vtPbf = require('vt-pbf');
const request = require('requestretry');
const zlib = require('zlib');
const fs = require('fs')
const path = require("path");

const TICKET_SALES_SOURCE = "https://opendata.arcgis.com/datasets/79fe2db71b254edda68c47d2629a962e_0.geojson"
const TICKET_SALES_SOURCE_LOCAL_BACKUP = "79fe2db71b254edda68c47d2629a962e_0-2020-09-23.geojson"

const getTileIndex = (url, callback) => {
  request({
    url: url,
    maxAttempts: 20,
    retryDelay: 30000,
    followAllRedirects: true,
    retryStrategy: (err, response) => (request.RetryStrategies.HTTPOrNetworkError(err, response) || (response && 202 === response.statusCode))
  }, handleResponse)

  function handleResponse(err, res, body) {
    if (err || res.statusCode !== 200) {
      console.log("ERROR retrieving ticket sales data from default source: ", url)
      if (err) { console.log(err) }
      console.log("NOTE! Using baked in (and most likely dated!) frozen copy of the data as a hotfix backup instead. See https://github.com/HSLdevcom/tilelive-hsl-ticket-sales/ for more details!\nBackup file:", TICKET_SALES_SOURCE_LOCAL_BACKUP)
      const backupFile = path.resolve(__dirname, TICKET_SALES_SOURCE_LOCAL_BACKUP)
      if (!fs.existsSync(backupFile)) {
        console.log("Local baked in backup data not found:", TICKET_SALES_SOURCE_LOCAL_BACKUP)
      } else {
        const localData = fs.readFileSync(backupFile)
        callback(null, geojsonVt(JSON.parse(localData), { maxZoom: 20 }));
      }
      return;
    }
    console.log("Ticket sales points loaded from: ", url)
    callback(null, geojsonVt(JSON.parse(body), { maxZoom: 20 })); //TODO: this should be configurable)
  }
}

class GeoJSONSource {
  constructor(uri, callback) {
    getTileIndex(TICKET_SALES_SOURCE, (err, tileIndex) => {
      if (err) {
        callback(err);
        return;
      }
      this.tileIndex = tileIndex;
      callback(null, this);
    })
  };

  getTile(z, x, y, callback) {
    let tile = this.tileIndex.getTile(z, x, y)

    if (tile === null) {
      tile = { features: [] }
    }

    const data = Buffer.from(vtPbf.fromGeojsonVt({ 'ticket-sales': tile }));

    zlib.gzip(data, function (err, buffer) {
      if (err) {
        callback(err);
        return;
      }

      callback(null, buffer, { "content-encoding": "gzip" })
    })
  }

  getInfo(callback) {
    callback(null, {
      format: "pbf",
      maxzoom: 20,
      vector_layers: [{
        description: "",
        id: "ticket-sales"
      }]
    })
  }
}

module.exports = GeoJSONSource

module.exports.registerProtocols = (tilelive) => {
  tilelive.protocols['hslticketsales:'] = GeoJSONSource
}
