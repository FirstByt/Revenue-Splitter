import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { CreateVaultProgressComponent } from 'src/app/components/create-vault-progress/create-vault-progress.component';
import { HeaderComponent } from 'src/app/components/header/header.component';
import { StepInfoComponent } from 'src/app/components/step-info/step-info.component';

@Component({
  templateUrl: 'select-receipiants.page.html',
  styleUrl: 'select-receipiants.page.scss',
  imports: [ IonContent, HeaderComponent, RouterModule, CreateVaultProgressComponent, StepInfoComponent ],
})

export class SelectReceipiantsPage implements OnInit {
  constructor() { }

  ngOnInit() { }
}