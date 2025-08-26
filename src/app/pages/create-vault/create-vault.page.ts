import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonContent, IonToggle } from '@ionic/angular/standalone';

import { CreateVaultProgressComponent } from 'src/app/components/create-vault-progress/create-vault-progress.component';
import { HeaderComponent } from 'src/app/components/header/header.component';
import { StepInfoComponent } from 'src/app/components/step-info/step-info.component';
import { WlletComponent } from 'src/app/components/wallet/wallet.component';

@Component({
  templateUrl: 'create-vault.page.html',
  styleUrl: 'create-vault.page.scss',
  imports: [ IonContent, HeaderComponent, CreateVaultProgressComponent, StepInfoComponent, RouterModule, WlletComponent, IonToggle, FormsModule ]
})

export class CreateVaultPage implements OnInit {

  isImMutable = false;

  constructor() { }

  ngOnInit() { }
}