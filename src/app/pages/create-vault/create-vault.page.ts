import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { IonContent, IonToggle } from '@ionic/angular/standalone';

import { CreateVaultProgressComponent } from 'src/app/components/create-vault-progress/create-vault-progress.component';
import { HeaderComponent } from 'src/app/components/header/header.component';
import { StepInfoComponent } from 'src/app/components/step-info/step-info.component';
import { WlletComponent } from 'src/app/components/wallet/wallet.component';
import { SplitterService } from 'src/app/solana/splitter.service';

@Component({
  templateUrl: 'create-vault.page.html',
  styleUrl: 'create-vault.page.scss',
  imports: [ IonContent, HeaderComponent, CreateVaultProgressComponent, StepInfoComponent, RouterModule, WlletComponent, IonToggle, FormsModule ]
})

export class CreateVaultPage implements OnInit {

  private svc = inject(SplitterService);
  busy = signal(false);

  recipients = signal<{ address: string; percentage: number }[]>([
    // { address: '...', percentage: 50 }, { address: '...', percentage: 50 }
  ]);
  mutable = signal(true);

  isImMutable = true;

  constructor(private router: Router) { }

  ngOnInit() { }

  async onCreateVault() {
    this.busy.set(true);
    try {
      const res = await this.svc.createVault({
        recipients: this.recipients(),
        mutable: this.mutable()
      });
      console.log('Created vault:', res);
      // todo: success toast
    } catch (e:any) {
      console.error(e?.message ?? e);
      // TODO: user-friendly error
    } finally {
      this.busy.set(false);
    }
    this.router.navigate(['/create-vault-success']);
  }
}