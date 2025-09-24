import { Component, HostListener, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { WalletService } from 'src/app/solana/wallet.service';
import { NetworkService } from 'src/app/solana/network.service';

const INSTALL_URL: Record<string, string> = {
  Phantom:  'https://phantom.app/download',
  Solflare: 'https://solflare.com/download',
  Backpack: 'https://backpack.app/'
};

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: 'header.component.html',
  styleUrl: 'header.component.scss',
  imports: [CommonModule, RouterModule],
})
export class HeaderComponent {
  ws = inject(WalletService);
  net = inject(NetworkService);

  menuOpen = signal(false);
  wallets = computed(() => this.ws.listWallets());

  toggleMenu(e: MouseEvent) {
    e.stopPropagation();
    this.menuOpen.update(v => !v);
  }

  async selectAndConnect(name: string) {
    this.ws.select(name);
    await this.ws.connect();
    this.menuOpen.set(false);
  }

  async disconnect() {
    await this.ws.disconnect();
    this.menuOpen.set(false);
  }

  onInstall(name: string, e?: Event) {
    e?.stopPropagation();
    const url = INSTALL_URL[name] ?? 'https://solana.com';
    window.open(url, '_blank', 'noopener');
  }

  @HostListener('document:click')
  closeOnOutside() {
    this.menuOpen.set(false);
  }

  async testRpc() {
    const conn = await this.net.getConnection();
    const { blockhash } = await conn.getLatestBlockhash({ commitment: 'confirmed' });
    console.log('Devnet blockhash:', blockhash);

    const pk = this.ws.publicKey();
    if (pk) {
      const lamports = await conn.getBalance(pk, 'confirmed');
      console.log('Balance (lamports):', lamports);
    }
  }

  async airdrop1() {
    const pk = this.ws.publicKey();
    if (!pk) return;
    try {
      const conn = await this.net.getConnection();
      const sig = await conn.requestAirdrop(pk, 1e9); 
      console.log('Airdrop tx:', sig, '→ Explorer:', `https://explorer.solana.com/tx/${sig}?cluster=devnet`);

      await conn.confirmTransaction(sig, 'confirmed');

      const bal = await conn.getBalance(pk, 'confirmed');
      console.log('New balance (lamports):', bal);
    } catch (e: any) {
      console.error('Airdrop failed:', e?.message ?? e);
    }
  }
}
