// src/app/pages/create-vault.page.ts
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { IonContent, IonToggle } from '@ionic/angular/standalone';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { AnchorProgramService } from 'src/app/solana/anchor-program.service';

import { CreateVaultProgressComponent } from 'src/app/components/create-vault-progress/create-vault-progress.component';
import { HeaderComponent } from 'src/app/components/header/header.component';
import { StepInfoComponent } from 'src/app/components/step-info/step-info.component';
import { WlletComponent } from 'src/app/components/wallet/wallet.component';

import { SplitterService } from 'src/app/solana/splitter.service';
import { WalletService } from 'src/app/solana/wallet.service';
import { CommonModule } from '@angular/common';

type RecipientFG = FormGroup<{
  address: FormControl<string>;
  percentage: FormControl<number>;
}>;

@Component({
  templateUrl: 'create-vault.page.html',
  styleUrl: 'create-vault.page.scss',
  standalone: true,
  imports: [
    IonContent, HeaderComponent, CreateVaultProgressComponent, StepInfoComponent,
    RouterModule, WlletComponent, IonToggle, FormsModule, ReactiveFormsModule, CommonModule
  ],
})
export class CreateVaultPage implements OnInit {

  private svc = inject(SplitterService);
  private ws = inject(WalletService);
  private router = inject(Router);
  private anchor = inject(AnchorProgramService);
  private fb = inject(FormBuilder);

  busy = signal(false);

  private static readonly SECOND_DEVNET_ADDRESS = 'DySJHqRF5hmAsB7zB3kKceQM2earLrFcfFmea1juTuBS';

  form = this.fb.group({
    mutable: this.fb.nonNullable.control(true),
    recipients: this.fb.array<RecipientFG>([
      this.makeRecipientGroup(),
      this.makeRecipientGroup(),
    ])
  });

  get recipientsArray(): FormArray<RecipientFG> {
    return this.form.get('recipients') as FormArray<RecipientFG>;
  }

  ngOnInit() {}

  private makeRecipientGroup(): RecipientFG {
    return this.fb.group({
      address: this.fb.nonNullable.control('', { validators: [] }),
      percentage: this.fb.nonNullable.control(0, { validators: [Validators.min(1), Validators.max(100)] }),
    });
  }

  setMyAddress() {
    const me = this.ws.publicKey()?.toBase58();
    if (me) this.recipientsArray.at(0).patchValue({ address: me });
  }

  addRecipient() {
    if (this.recipientsArray.length < 10) {
      this.recipientsArray.push(this.makeRecipientGroup());
    }
  }

  removeRecipient(i: number) {
    if (this.recipientsArray.length > 1) this.recipientsArray.removeAt(i);
  }

  totalPct = computed(() =>
    this.recipientsArray.controls.reduce((s, c) => s + (Number(c.value.percentage) || 0), 0)
  );

  hasDuplicates = computed(() => {
    const filled = this.recipientsArray.controls.map(c => (c.value.address || '').trim()).filter(Boolean);
    return new Set(filled).size !== filled.length;
  });

  private ensureConnected() {
    if (!this.ws.connected()) {
      throw new Error('Please connect your wallet first.');
    }
  }

  async create() {
    if (!this.ws.connected()) throw new Error('Connect your wallet first.');
    if (this.totalPct() !== 100) throw new Error('Total percentage must be 100%.');
    if (this.hasDuplicates()) throw new Error('Recipient addresses must be unique.');

    const recipients = this.recipientsArray.controls
      .map(c => ({ address: (c.value.address || '').trim(), percentage: Number(c.value.percentage || 0) }))
      .filter(r => r.address);

    const res = await this.svc.createVault({ recipients, mutable: !!this.form.value.mutable });
    console.log('Created vault:', { signature: res.signature, splitter: res.splitter.toBase58(), index: Number(res.index) });

    this.router.navigate(['/my-vaults']);
  }

  // old code
  async onCreateVault() {
    this.busy.set(true);
    try {
      this.ensureConnected();

      const me = this.ws.publicKey()!.toBase58(); 
      const other = CreateVaultPage.SECOND_DEVNET_ADDRESS.trim();

      if (!other || other.length < 32) throw new Error('Second recipient address is empty/invalid');
      if (other === me) throw new Error('Recipients must be unique');

      await this.preflightRecipients([me, other]);

      // todo remove hardcoded values
      const recipients = [
        { address: me,    percentage: 60 },
        { address: other, percentage: 40 },
      ]; 

      console.log(recipients);

      const res = await this.svc.createVault({ recipients, mutable: false });
      console.log('✅ Created vault:', res);

      this.router.navigate(['/create-vault-success']);
    } catch (e: any) {
      console.error('Create vault error:', e?.message ?? e);
    } finally {
      this.busy.set(false);
    }
  }

  private async preflightRecipients(addresses: string[]) {
    const conn = this.anchor.getConnection();
    for (const a of addresses) {
      const pk = new PublicKey(a.trim());
      const info = await conn.getAccountInfo(pk);
      if (!info) {
        throw new Error(`Recipient not found on devnet: ${pk.toBase58()}`);
      }
      if (!info.owner.equals(SystemProgram.programId)) {
        throw new Error(`Recipient is not a System account: ${pk.toBase58()}`);
      }
    }
  }
}
