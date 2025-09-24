import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';

import { HeaderComponent } from 'src/app/components/header/header.component';
import { StepInfoComponent } from 'src/app/components/step-info/step-info.component';
import { WalletService } from 'src/app/solana/wallet.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [ IonContent, HeaderComponent, RouterModule, StepInfoComponent],
})
export class HomePage {

  protected ws = inject(WalletService);

  constructor() {
  }
}
