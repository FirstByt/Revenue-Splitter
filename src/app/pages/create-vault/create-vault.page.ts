import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonContent, IonToggle } from '@ionic/angular/standalone';
import { PublicKey, SystemProgram } from '@solana/web3.js';

import { HeaderComponent } from 'src/app/components/header/header.component';
import { CreateVaultProgressComponent } from 'src/app/components/create-vault-progress/create-vault-progress.component';
import { StepInfoComponent } from 'src/app/components/step-info/step-info.component';
import { WlletComponent } from 'src/app/components/wallet/wallet.component';

import { WalletService } from 'src/app/solana/wallet.service';
import { SplitterService } from 'src/app/solana/splitter.service';
import { NetworkService } from 'src/app/solana/network.service';

type RecipientFG = FormGroup<{
  address: FormControl<string>;
  percentage: FormControl<number>;
}>;

@Component({
  templateUrl: 'create-vault.page.html',
  styleUrl: 'create-vault.page.scss',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    IonContent,
    IonToggle,
    HeaderComponent,
    CreateVaultProgressComponent,
    StepInfoComponent,
    WlletComponent,
  ],
})
export class CreateVaultPage implements OnInit {
  private fb      = inject(FormBuilder);
  private router  = inject(Router);
  private ws      = inject(WalletService);
  private net     = inject(NetworkService);
  private svc     = inject(SplitterService);

  busy = signal(false);

  form = this.fb.group({
    mutable: this.fb.nonNullable.control(true),
    recipients: this.fb.array<RecipientFG>([
      this.makeRecipientGroup(),
      this.makeRecipientGroup(),
    ]),
  });

  ngOnInit() {}

  // ---------- Helpers ----------
  private makeRecipientGroup(): RecipientFG {
    return this.fb.group({
      address: this.fb.nonNullable.control('', {
        validators: [
          Validators.required,
          // base58 Solana pubkey: 32..44 chars
          Validators.pattern(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/),
        ],
      }),
      percentage: this.fb.nonNullable.control(0, {
        validators: [Validators.required, Validators.min(1), Validators.max(100)],
      }),
    });
  }

  get recipientsArray(): FormArray<RecipientFG> {
    return this.form.get('recipients') as FormArray<RecipientFG>;
  }

  get totalPct(): number {
    return this.recipientsArray.controls.reduce((s, c) => s + (Number(c.value.percentage) || 0), 0);
  }

  get hasDuplicates(): boolean {
    const filled = this.recipientsArray.controls
      .map(c => (c.value.address || '').trim())
      .filter(Boolean);
    return new Set(filled).size !== filled.length;
  }

  addRecipient() {
    if (this.recipientsArray.length < 10) {
      this.recipientsArray.push(this.makeRecipientGroup());
    }
  }

  removeRecipient(i: number) {
    if (this.recipientsArray.length > 1) {
      this.recipientsArray.removeAt(i);
    }
  }

  setMyAddress() {
    const me = this.ws.publicKey()?.toBase58();
    if (me) this.recipientsArray.at(0).patchValue({ address: me });
  }

  // ---------- Actions ----------
  private ensureConnected() {
    if (!this.ws.connected()) {
      throw new Error('Please connect your wallet first.');
    }
  }

  private async preflightRecipients(addresses: string[]) {
    const conn = await this.net.getConnection();
    for (const raw of addresses) {
      const pk = new PublicKey(raw.trim());
      const info = await conn.getAccountInfo(pk);
      if (!info) {
        throw new Error(`Recipient not found on devnet: ${pk.toBase58()}`);
      }
      if (!info.owner.equals(SystemProgram.programId)) {
        throw new Error(`Recipient is not a System account: ${pk.toBase58()}`);
      }
    }
  }

  async create() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.ws.connected()) {
      console.error('Connect your wallet first.');
      return;
    }
    if (this.hasDuplicates) {
      console.error('Recipient addresses must be unique.');
      return;
    }
    if (this.totalPct !== 100) {
      console.error('Total percentage must be 100%.');
      return;
    }

    const recipients = this.recipientsArray.controls
      .map(c => ({
        address: (c.value.address || '').trim(),
        percentage: Number(c.value.percentage || 0),
      }))
      .filter(r => r.address);

    this.busy.set(true);
    try {
      await this.preflightRecipients(recipients.map(r => r.address));

      const res = await this.svc.createVault({
        recipients,
        mutable: !!this.form.value.mutable,
      });

      console.log('Created vault:', {
        signature: res.signature,
        splitter: res.splitter.toBase58(),
        index: Number(res.index),
      });

      this.router.navigate(['/my-vaults']);
    } catch (e: any) {
      console.error('Create vault error:', e?.message ?? e);
    } finally {
      this.busy.set(false);
    }
  }
}
