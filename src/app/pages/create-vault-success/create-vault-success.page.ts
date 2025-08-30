import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonContent } from "@ionic/angular/standalone";

import { HeaderComponent } from 'src/app/components/header/header.component';
import { StepInfoComponent } from 'src/app/components/step-info/step-info.component';
import { VaultRadialComponent } from 'src/app/components/vault-radial/vault-radial.component';

@Component({
  templateUrl: 'create-vault-success.page.html',
  styleUrl: 'create-vault-success.page.scss',
  imports: [ IonContent, HeaderComponent, StepInfoComponent, RouterModule, VaultRadialComponent ]
})

export class CreateVaultSuceessPage implements OnInit {
  
  constructor() { }

  ngOnInit() { }
}