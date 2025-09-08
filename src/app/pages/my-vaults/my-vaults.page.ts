import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonContent,  } from "@ionic/angular/standalone";

import { HeaderComponent } from 'src/app/components/header/header.component';
import { StepInfoComponent } from 'src/app/components/step-info/step-info.component';
import { VaultComponent } from 'src/app/components/vault/vault.component';

@Component({
  templateUrl: 'my-vaults.page.html',
  styleUrl: 'my-vaults.page.scss',
  imports: [ IonContent, HeaderComponent, StepInfoComponent, RouterModule, FormsModule, VaultComponent ]
})

export class MyVaultsPage implements OnInit {

  history: unknown | undefined;
  
  constructor() { }

  ngOnInit() { }
}