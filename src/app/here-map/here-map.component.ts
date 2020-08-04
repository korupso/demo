import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';

import { Platform } from '@ionic/angular';

// import { AndroidPermissions } from '@ionic-native/android-permissions/ngx';

import { MapService } from '../map.service';

declare var H: any;

@Component({
  selector: 'here-map',
  templateUrl: 'here-map.component.html'
})
export class HereMapComponent implements OnInit {

  @ViewChild("map")
  public mapElement: ElementRef;

  @Input()
  public apiKey: String;

  @Input()
  public appId: string;

  @Input()
  public appCode: string;

  public constructor(public mapService: MapService, private platform: Platform, /* private permissions: AndroidPermissions */) { }

  public ngOnInit() { }

  public ngAfterViewInit() {
    this.platform.ready().then(state => {
      /* console.log("start");
      this.permissions.checkPermission(this.permissions.PERMISSION.LOCATION).then(res => {
        console.log("permission");
        console.log(res);
      }).catch(rejected => {
        console.log("rejected");
        console.log(rejected);
      }); */
      this.mapService.mapElement = this.mapElement;
      this.mapService.resetMap();
    });
  }
}