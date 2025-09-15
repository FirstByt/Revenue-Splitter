import { Injectable, signal, computed } from '@angular/core';
import {
  WalletAdapterNetwork,
  WalletDisconnectedError,
  WalletError,
  WalletNotReadyError,
  WalletReadyState,
} from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { BackpackWalletAdapter } from '@solana/wallet-adapter-backpack';
import { PublicKey } from '@solana/web3.js';
import { getAppConfig } from '../app.config';

type AnyAdapter = PhantomWalletAdapter | SolflareWalletAdapter | BackpackWalletAdapter;

const INSTALL_URL: Record<string, string> = {
  Phantom:  'https://phantom.app/download',
  Solflare: 'https://solflare.com/download',
  Backpack: 'https://backpack.app/',
};

function isConnectable(state: WalletReadyState) {
  return state === WalletReadyState.Installed || state === WalletReadyState.Loadable;
}

@Injectable({ providedIn: 'root' })
export class WalletService {
  private adapters = signal<AnyAdapter[]>([]);
  private selected: AnyAdapter | null = null;

  connected  = signal(false);
  connecting = signal(false);
  publicKey  = signal<PublicKey | null>(null);
  walletName = signal<string | null>(null);

  shortPubkey = computed(() => {
    const s = this.publicKey()?.toBase58();
    return s ? `${s.slice(0,4)}…${s.slice(-4)}` : '';
  });

  constructor() {
    const cfg = getAppConfig()!;
    const network = cfg.network === 'devnet' ? WalletAdapterNetwork.Devnet : WalletAdapterNetwork.Mainnet;

    const adapters: AnyAdapter[] = [
      new PhantomWalletAdapter({ network }),
      new SolflareWalletAdapter({ network }),
      new BackpackWalletAdapter(),
    ];

    adapters.forEach((a) => {
      a.on('connect', () => {
        this.connected.set(true);
        this.publicKey.set(a.publicKey ?? null);
        this.walletName.set(a.name);
        localStorage.setItem('lastWallet', a.name);
      });
      a.on('disconnect', () => {
        this.connected.set(false);
        this.publicKey.set(null);
        this.walletName.set(null);
        if (localStorage.getItem('lastWallet') === a.name) localStorage.removeItem('lastWallet');
      });
      a.on('error', (e: WalletError) => console.error('[wallet]', e));

      a.on('readyStateChange', () => {
        this.adapters.set([...this.adapters()]);
      });
      a.on('error', (e: WalletError) => {
        if (e?.name === 'WalletDisconnectedError' || e instanceof WalletDisconnectedError) return;
        if (e?.name === 'WalletNotReadyError'    || e instanceof WalletNotReadyError)    return;
        console.error('[wallet]', e);
      });
    });

    this.adapters.set(adapters);

    const last = localStorage.getItem('lastWallet');
    if (last) this.selected = adapters.find(a => a.name === last) ?? null;
  }

  listWallets(): { name: string; readyState: WalletReadyState; connectable: boolean }[] {
    return this.adapters().map(a => ({
      name: a.name,
      readyState: a.readyState,
      connectable: isConnectable(a.readyState),
    }));
  }

  select(name: string) {
    this.selected = this.adapters().find(a => a.name === name) ?? null;
  }

  async connect() {
    if (!this.selected) this.select(this.adapters()[0]?.name);
    if (!this.selected) throw new Error('No wallet adapters available');

    if (!isConnectable(this.selected.readyState)) {
      const url = INSTALL_URL[this.selected.name] ?? 'https://solana.com';
      window.open(url, '_blank', 'noopener');
      throw new Error(`${this.selected.name} is not installed`);
    }

    this.connecting.set(true);
    try {
      await this.selected.connect();
    } catch (e: any) {
      if (e?.name === 'WalletDisconnectedError') return;
      throw e;
    } finally {
      this.connecting.set(false);
    }
  }

  async disconnect() {
    if (this.selected) await this.selected.disconnect();
  }

  get adapter(): AnyAdapter | null {
    return this.selected;
  }
}
