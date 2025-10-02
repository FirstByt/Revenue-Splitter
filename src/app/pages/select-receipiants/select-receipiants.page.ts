import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { IonSelect, IonSelectOption } from '@ionic/angular/standalone';

import { CreateVaultProgressComponent } from 'src/app/components/create-vault-progress/create-vault-progress.component';
import { HeaderComponent } from 'src/app/components/header/header.component';
import { StepInfoComponent } from 'src/app/components/step-info/step-info.component';
import { WalletService } from 'src/app/solana/wallet.service';

@Component({
  templateUrl: 'select-receipiants.page.html',
  styleUrl: 'select-receipiants.page.scss',
  imports: [ 
    IonContent, HeaderComponent, RouterModule, CreateVaultProgressComponent, StepInfoComponent, IonSelect, IonSelectOption,
    CommonModule, ReactiveFormsModule
   ],
})

export class SelectReceipiantsPage implements OnInit {
  
  private router  = inject(Router);
  private ws  = inject(WalletService);

  form = new FormGroup({
    count: new FormControl(1, Validators.required)
  })

  counts = Array.from({ length: 10 }, (_, i) => i + 1);

  connected = computed(() => this.ws.connected());

  constructor() { }

  ngOnInit() { }

  onSubmit() {
    if (this.form.invalid) {
      return;
    }
    const count = this.form.value.count ?? 1;
    this.router.navigate(['/create-vault'], { queryParams: { count } });
  }

}