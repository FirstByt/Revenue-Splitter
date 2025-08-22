import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';

import { CreateVaultProgressComponent } from 'src/app/components/create-vault-progress/create-vault-progress.component';
import { HeaderComponent } from 'src/app/components/header/header.component';
import { StepInfoComponent } from 'src/app/components/step-info/step-info.component';
import { WlletComponent } from 'src/app/components/wallet/wallet.component';

@Component({
  templateUrl: 'create-vault.page.html',
  styleUrl: 'create-vault.page.scss',
  imports: [ IonContent, HeaderComponent, CreateVaultProgressComponent, StepInfoComponent, RouterModule, WlletComponent ]
})

export class CreateVaultPage implements OnInit {
  constructor() { }

  ngOnInit() { }
}