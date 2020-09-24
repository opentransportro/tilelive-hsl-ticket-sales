# tilelive-hsl-ticket-sales

A [tilelive](https://github.com/mapbox/tilelive) vector tile source for [hsl-map-server](https://github.com/HSLdevcom/hsl-map-server) for creating vector tiles from live [HSL tickets sales point dataset](https://public-transport-hslhrt.opendata.arcgis.com/datasets/hsln-myyntipisteet) served by ArcGIS Online API in GeoJSON format.

hsl-map-server uses tilelive-hsl-ticket-sales as a dependency.

> :warning: **Note!**: As a hackish contingency plan for ArcGIS Online API unresponsiviness / downtime,  a local static copy of the dataset is stored in this repository as GeoJSON-file and used as a last measure if the ArcGIS API Online request retries fail. The local data is most likely not up-to-date and should not be used as long-time substitute.
