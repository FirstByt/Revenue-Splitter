import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonContent,  } from "@ionic/angular/standalone";

import { HeaderComponent } from 'src/app/components/header/header.component';
import { StepInfoComponent } from 'src/app/components/step-info/step-info.component';
import { VaultComponent } from 'src/app/components/vault/vault.component';
import { SplitterService } from 'src/app/solana/splitter.service';

@Component({
  templateUrl: 'my-vaults.page.html',
  styleUrl: 'my-vaults.page.scss',
  imports: [ IonContent, HeaderComponent, StepInfoComponent, RouterModule, FormsModule, VaultComponent ]
})

export class MyVaultsPage implements OnInit {

  private svc = inject(SplitterService);
  vaults = signal<any[]>([]); // todo: add model here

  history: unknown | undefined;
   
  constructor() { }

  ngOnInit() { 
    this.load();
  }

  async load() {
    this.vaults.set(await this.svc.listMyVaults());
  }
}