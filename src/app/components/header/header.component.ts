import { Component, HostListener, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { WalletService } from 'src/app/solana/wallet.service';

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
    // DOM-lib підключена, тож window.open типізований коректно
    window.open(url, '_blank', 'noopener');
  }

  @HostListener('document:click')
  closeOnOutside() {
    this.menuOpen.set(false);
  }
}
