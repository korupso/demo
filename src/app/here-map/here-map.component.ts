import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';

import { Platform } from '@ionic/angular';

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

  public constructor(public mapService: MapService, private platform: Platform) { }

  public ngOnInit() { }

  public ngAfterViewInit() {
    this.platform.ready().then(state => {
      this.mapService.mapElement = this.mapElement;
      this.mapService.resetMap();
    });
  }
}