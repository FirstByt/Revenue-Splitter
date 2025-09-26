import { Component, effect, inject, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent } from "@ionic/angular/standalone";
import { HeaderComponent } from 'src/app/components/header/header.component';
import { StepInfoComponent } from 'src/app/components/step-info/step-info.component';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VaultComponent } from 'src/app/components/vault/vault.component';
import { Vault } from 'src/app/models/vault/vault';
import { SplitterService } from 'src/app/solana/splitter.service';
import { WalletService } from 'src/app/solana/wallet.service';

@Component({
  templateUrl: 'my-vaults.page.html',
  styleUrl: 'my-vaults.page.scss',
  imports: [CommonModule, IonContent, HeaderComponent, StepInfoComponent, RouterModule, FormsModule, VaultComponent],
})
export class MyVaultsPage implements OnDestroy {
  private svc = inject(SplitterService);
  private ws  = inject(WalletService);

  vaults  = signal<Vault[]>([]);
  loading = signal(false);
  connected = computed(() => this.ws.connected());

  private inFlight = false;

  private loadOnConnect = effect(() => {
    const pk = this.ws.publicKey()?.toBase58() ?? '';
    if (!pk) {
      this.vaults.set([]);
      this.loading.set(false);
      return;
    }
    this.load();
  });

  ngOnDestroy() {
    this.loadOnConnect.destroy();
  }

  private async load() {
    if (this.inFlight) return;
    this.inFlight = true;
    this.loading.set(true);
    try {
      this.vaults.set(await this.svc.listMyVaults());
      console.log(this.vaults());
    } catch (e) {
      console.error('[MyVaults] load failed', e);
      this.vaults.set([]);
    } finally {
      this.inFlight = false;
      this.loading.set(false);
    }
  }

  async connect() {
    try { await this.ws.connect(); } catch {}
  }
}
