import { Injectable, ElementRef } from '@angular/core';

import { Geolocation } from '@ionic-native/geolocation/ngx';

import { UtilService } from './util.service';

import markers from './markers.json';

declare var H: any;

type Coords = {
  lat: number;
  lng: number;
};

@Injectable({
  providedIn: 'root'
})
export class MapService {

  map: any;
  mapElement: ElementRef;
  mapStyle: any;
  mapObjects: {
    name: string,
    objects: any[]
  }[] = [];

  defaultLayers: any;

  userCoords: Coords;

  router: any;

  ui: any;

  layers: {
    id: string,
    color: string
  }[] = [];

  servicePlatform = new H.service.Platform({
    "apiKey": "wMf9ma7exbMTZgkYuj1alATsY2ae9fYC5dq9S2JeM04",
    "app_id": "qAMCTJGPeltVqBKe46Eh",
    "app_code": "c3REcMU3S-XYbmBR94s8wA"
  });

  selectedMarkers: string[] = [
    "parking_garage"
  ];

  constructor(private U: UtilService, private geolocation: Geolocation) { }

  /**
   * This function is called, whenever the map needs a reset.
   */
  resetMap() {
    var start = new Date().getTime();
    this.fetchCoords(coords => {
      this.userCoords = coords;
      this.defaultLayers = this.servicePlatform.createDefaultLayers();
      this.map = new H.Map(
        this.mapElement.nativeElement,
        this.defaultLayers.vector.normal.map,
        {
          zoom: 17,
          center: {
            lat: coords.lat,
            lng: coords.lng
          }
        }
      );

      this.fetchCoords(coords => {
        if (this.U.deepCompare(this.userCoords, coords)) {
          this.userCoords = { ...coords };
          console.log(this.userCoords);
        }
      });

      var mapViewListener = mapEvent => {
        console.log("mapEvent (updateVisibility)");
        console.log(JSON.stringify(this.defaultLayers.vector));
        this.updateVisibility(this.map.getViewModel().getLookAtData().bounds.getBoundingBox());
      };
      this.map.addEventListener("mapviewchangeend", mapViewListener);

      var mapListener = mapEvent => {
        console.log("mapEvent (parseData)");
        console.log(JSON.stringify(mapEvent));
        this.map.removeEventListener("mapviewchangeend", mapListener);
        this.selectedMarkers.forEach(selectedMarker => {
          this.parseData(selectedMarker, layer => {
            this.map.addLayer(layer.setMin(16));
          });
        });
      };
      this.map.addEventListener("mapviewchangeend", mapListener);
      this.ui = H.ui.UI.createDefault(this.map, this.defaultLayers);
      this.router = this.servicePlatform.getRoutingService({}, 8);
      var mapEvents = new H.mapevents.MapEvents(this.map);
      var behavior = new H.mapevents.Behavior(mapEvents);

      var provider = this.map.getBaseLayer().getProvider();
      this.mapStyle = provider.getStyle();

      var changeListener = evt => {
        if (this.mapStyle.getState() === H.map.Style.State.READY) {
          this.mapStyle.removeEventListener('change', changeListener);
          this.markLayers();
        }
      };
      this.mapStyle.addEventListener('change', changeListener);
    });
    console.log("resetMap", new Date().getTime() - start);
  }

  route(origin: Coords, dest: Coords) {
    var start = new Date().getTime();

    var routeRequestParams = {
      transportMode: "car",
      origin: origin.lat + "," + origin.lng,
      destination: dest.lat + "," + dest.lng,
      routingMode: "fast",
      alternatives: 2,
      lang: "ch-DE",
      return: [
        "polyline",
        "actions",
        "instructions",
        "summary",
        "travelSummary",
        "turnByTurnActions",
        "elevation",
        "routeHandle",
        "incidents"
      ],
      spans: [
        "walkAttributes",
        "streetAttributes",
        "carAttributes",
        "truckAttributes",
        "names",
        "length",
        "duration",
        "baseDuration",
        "countryCode",
        "functionalClass",
        "routeNumbers",
        "speedLimit",
        "dynamicSpeedInfo",
        "segmentId",
        "consumption"
      ]
    };

    this.router.calculateRoute(routeRequestParams,
      route => {
        console.log(route);
      },
      err => {
        console.log(err);
      }
    );

    console.log("route", new Date().getTime() - start);
  }

  /**
   * Parses the data for the current geoJSON file and makes only the markers visible, which should be visible.
   * @param bounds Contains the coordinates of the top right and bottom left corners of the visible map.
   */
  parseData(selectedMarker: string, cb: (layer: any) => void) {
    var start = new Date().getTime();
    var marker = markers.find(marker => marker.name === selectedMarker);
    var icon = new H.map.Icon(marker.icon, {
      size: {
        w: 24,
        h: 24
      },
      anchor: {
        x: 12,
        y: 12
      }
    });
    var reader = new H.data.geojson.Reader("/assets/geoJSON/" + selectedMarker + ".json", {
      disableLegacyMode: true,
      style: markerObj => markerObj.setIcon(icon)
    });
    var geoListener = stateEvent => {
      if (stateEvent.state === 2) {
        reader.removeEventListener("statechange", geoListener);
        reader.getParsedObjects()[0].getObjects().forEach(object => {
          object.addEventListener("tap", evt => {
            this.removeBubbles();

            var bubble = this.createBubble(object.getGeometry(), this.infoToHTML(object, marker.info));

            this.ui.addBubble(bubble);

            /*var o: DOMRect = bubble.getElement().firstElementChild.getBoundingClientRect();
            var gSP = this.getGeoScreenPixel();*/
            var g = object.getGeometry();

            this.route({ lat: g.lat, lng: g.lng }, { lat: g.lat, lng: g.lng });

            /*this.map.setCenter(new H.geo.Point(
              (g.lat + gSP.lat * o.top + g.lat + gSP.lat * o.bottom) / 2,
              (g.lng + gSP.lng * o.left * 2 + g.lng + gSP.lng * o.right) / 2
            ), true);*/
          });
        });
        this.mapObjects.push({ name: selectedMarker, objects: reader.getParsedObjects()[0].getObjects() });
        console.log("parseData", new Date().getTime() - start);
        cb(reader.getLayer());
      }
    };
    reader.addEventListener("statechange", geoListener);
    reader.parse();
  }

  offsetCenter(geometry: Coords, offset: Coords) {
    var start = new Date().getTime();
    var geoScreenPercent = this.getGeoScreenPercent();

    console.log("offsetCenter", new Date().getTime() - start);
    return new H.geo.Point(
      geometry.lat - geoScreenPercent.lat * offset.lat,
      geometry.lng - geoScreenPercent.lng * offset.lng
    );
  }

  createBubble(geometry: Coords, content: string | Node) {
    return new H.ui.InfoBubble(geometry, { content: content });
  }

  removeBubbles = () => this.ui.getBubbles().forEach(bubble => this.ui.removeBubble(bubble));

  getGeoScreenPercent() {
    var start = new Date().getTime();
    var geoLow = this.map.screenToGeo(0, 0);
    var geoHigh = this.map.screenToGeo(window.innerWidth / 100, window.innerHeight / 100);
    console.log("getGeoScreenPercent", new Date().getTime() - start);
    return { lat: geoHigh.lat - geoLow.lat, lng: geoHigh.lng - geoLow.lng };
  }

  getGeoScreenPixel() {
    var start = new Date().getTime();
    var geoLow = this.map.screenToGeo(0, 0);
    var geoHigh = this.map.screenToGeo(window.innerWidth, window.innerHeight);
    console.log("getGeoScreenPixel", new Date().getTime() - start);
    return { lat: (geoHigh.lat - geoLow.lat) / 1000, lng: (geoHigh.lng - geoLow.lng) / 1000 };
  }

  geoToMetric(start: Coords, end: Coords) {
    var R = 6378.137;
    var dLat = end.lat * Math.PI / 180 - start.lat * Math.PI / 180;
    var dLon = end.lng * Math.PI / 180 - start.lng * Math.PI / 180;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(start.lat * Math.PI / 180) * Math.cos(end.lat * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return d * 1000;
  }

  infoToHTML(marker, info): string {
    var start = new Date().getTime();
    var html = "";

    if (info.name) {
      html += "<h3>";
      info.name.forEach(name => html += marker.data[name] + " ");
      html = html.slice(0, html.length - 1) + "</h3><br>";
    }

    if (info.parking_spaces) {
      html += "<span style=\"color:#444444\"><b>" + info.parking_spaces[0] + ": " + marker.data[info.parking_spaces[0]] + "</b><br>";
      if (info.parking_spaces.length > 1) {
        html += "</span><span style=\"color:#666666\">";
        info.parking_spaces.forEach((parking_spaces, i) => {
          if (i > 0) html += parking_spaces + ": " + marker.data[parking_spaces] + "<br>";
        });
      }
      html += "</span><br>";
    }

    if (info.misc) {
      html += "<span style=\"color:#333333\">";
      info.misc.forEach(misc => html += misc + ": " + marker.data[misc] + "<br>");
      html += "</span><br>";
    }

    if (info.links) {
      info.links.forEach(link => html += "<a href=\"" + marker.data[link] + "\">" + link + "</a><br>");
    }

    html = html.slice(0, html.length - 4);

    console.log("infoToHTML", new Date().getTime() - start);
    return html;
  }

  /**
   * Updates the visibility of all markers on the map.
   * @param bounds The current view bounds of the map.
   */
  updateVisibility = (bounds: any) => {
    var start = new Date().getTime();
    this.mapObjects.forEach(mapObject => mapObject.objects.forEach(obj => obj.setVisibility(bounds.containsPoint(obj.b) && this.map.getZoom() >= 16)));
    console.log("updateVisibility", (new Date().getTime() - start).toString());
  }

  /**
   * Get the user's coordinates, using the gps permission.
   * @param cb Callback function to return the coordinates asynchronously.
   */
  fetchCoords(cb: (coords: Coords) => void, watch = false) {
    var start = new Date().getTime();
    /* if (this.geolocation) if (watch) this.geolocation.watchPosition().subscribe(pos => cb({
      lat: pos.coords.latitude,
      lng: pos.coords.longitude
    }));
    else this.geolocation.getCurrentPosition().then(pos => cb({
      lat: pos.coords.latitude,
      lng: pos.coords.longitude
    })); */
    cb({ lat: 47.37666, lng: 8.5389 });
    console.log("fetchCoords", new Date().getTime() - start);
  }

  /**
   * Marks all layers, that are defined in the layers array.
   */
  markLayers() {
    var start = new Date().getTime();
    this.layers.forEach(layer => {
      var layerConfig = this.mapStyle.extractConfig([layer.id]);
      var draw = this.U.accessProperty(layer.id, layerConfig.layers).draw;
      draw[draw["polygons"] ? "polygons" : "lines"].color = layer.color;
      this.mapStyle.mergeConfig(layerConfig);
    });
    console.log("markLayers", new Date().getTime() - start);
  }
}