import { Component, OnInit, HostListener } from '@angular/core';
import { MapService } from '../map.service';
import { UtilService } from '../util.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {

  constructor(private mapService: MapService, private U: UtilService) { }

  public ngOnInit() {
    console.log(new Date().toLocaleTimeString("ch"));
  }
}
