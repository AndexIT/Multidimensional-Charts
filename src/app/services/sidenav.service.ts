import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SidenavService {

  private subject = new Subject<null>();

  sendEvent(){
    this.subject.next(null);
  }

  receiveMessage(){
    return this.subject.asObservable();
  }

  constructor() { }
}

