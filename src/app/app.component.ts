import { Component } from '@angular/core';
import { SidenavService } from './services/sidenav.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  contentMargin = 240;
  isMenuOpen = false;

  constructor(private sidenavServ: SidenavService) { }

  ToolbarMenuToggle() {
    this.isMenuOpen = !this.isMenuOpen;
    this.sidenavServ.sendEvent();

    if(!this.isMenuOpen) {
      this.contentMargin = 60;
    } else {
      this.contentMargin = 240;
    }
  }

}
