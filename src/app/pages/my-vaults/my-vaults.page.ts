import { Component, effect, inject, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent } from "@ionic/angular/standalone";

import { HeaderComponent } from 'src/app/components/header/header.component';
import { StepInfoComponent } from 'src/app/components/step-info/step-info.component';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VaultComponent } from 'src/app/components/vault/vault.component';
import { WalletService } from 'src/app/solana/wallet.service';
import { SolsplitsApiService } from 'src/app/solsplits/solsplits-api.service';
import { SplitterListItemDto } from 'src/app/solsplits/models';

@Component({
  templateUrl: 'my-vaults.page.html',
  styleUrl: 'my-vaults.page.scss',
  imports: [CommonModule, IonContent, HeaderComponent, StepInfoComponent, RouterModule, FormsModule, VaultComponent],
})
export class MyVaultsPage implements OnDestroy {
  private ws  = inject(WalletService);
  private api = inject(SolsplitsApiService);

  vaults: SplitterListItemDto[] = [];
  loading = signal(false);
  connected = computed(() => this.ws.connected());

  private inFlight = false;

  private loadOnConnect = effect(() => {
    const pk = this.ws.publicKey()?.toBase58() ?? '';
    if (!pk) {
      this.vaults = [];
      this.loading.set(false);
      return;
    }
    this.load();
  });

  ngOnDestroy() {
    this.loadOnConnect.destroy();
  }

  async load() {
    const me = this.ws.publicKey()?.toBase58();
    if (!me) { this.vaults = []; return; }

    this.api.getSplitters({
      publicKey: me,
      page: 0,
      limit: 50,
      sortingField: 'createdTimestamp',
      sortingDirection: 'DESC',
    })
    .subscribe({
      next: (resp) => { this.vaults = resp.splitters; },
      error: (e) => { console.error('[api splitters] error', e); this.vaults = []; },
    });
  }

  // private async load() {
  //   if (this.inFlight) return;
  //   this.inFlight = true;
  //   this.loading.set(true);
  //   try {
  //     this.vaults.set(await this.svc.listMyVaults());
  //     console.log(this.vaults());
  //   } catch (e) {
  //     console.error('[MyVaults] load failed', e);
  //     this.vaults.set([]);
  //   } finally {
  //     this.inFlight = false;
  //     this.loading.set(false);
  //   }
  // }

  async connect() {
    try { await this.ws.connect(); } catch {}
  }
}
