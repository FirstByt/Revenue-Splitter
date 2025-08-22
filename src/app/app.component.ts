import { Component, inject } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {

  private router = inject(Router);
  constructor() {
    this.router.events.pipe(filter(e => e instanceof NavigationStart)).subscribe(() => (document.activeElement as HTMLElement | null)?.blur());
  }
}
