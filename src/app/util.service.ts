import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilService {

  /**
   * Accesses a nested property.
   * @param id The point delimited string of properties.
   * @param res The property itself.
   */
  accessProperty(id: string, res: any) {
    var properties = id.split(".").reverse();

    while (properties.length > 0) res = res[properties.pop()];

    return res;
  }

  /**
   * Waits a given amount of milliseconds.
   * @param ms The milliseconds to wait.
   */
  sleep(ms: number) {
    return new Promise(res => {
      setTimeout(res, ms);
    });
  }

  waitForChange(oldValue: any, getNewValue: () => any, cb: (newValue: any) => void, interval = 50) {
    if (oldValue === getNewValue()) {
      setTimeout(this.waitForChange, interval);
    } else {
      cb(getNewValue());
    }
  }

  deepCompare = (obj: any, comp: any): boolean => JSON.stringify(obj).toLowerCase() === JSON.stringify(comp).toLowerCase();

  printToBody = (...args: any[]): void => args.forEach((arg, i) => typeof arg === (typeof "" ? arg : JSON.stringify(arg)) + (i - 1 === args.length ? "<br>" : " "));
}
