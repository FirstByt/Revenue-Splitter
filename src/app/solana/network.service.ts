import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { clusterApiUrl, Connection } from '@solana/web3.js';

export type Cluster = 'devnet' | 'mainnet-beta';

const TIMEOUT_MS = 5000;

const CANDIDATES: Record<Cluster, string[]> = {
  devnet: [
    // 'https://devnet.helius-rpc.com/?api-key=YOUR_KEY',
    clusterApiUrl('devnet'),           
    'https://api.devnet.solana.com',  
  ],
  'mainnet-beta': [
    // 'https://mainnet.helius-rpc.com/?api-key=YOUR_KEY',
    clusterApiUrl('mainnet-beta'),
    'https://api.mainnet-beta.solana.com',
  ],
};

async function ping(url: string): Promise<boolean> {
  const conn = new Connection(url, { commitment: 'confirmed' });
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    await Promise.race([
      conn.getLatestBlockhash({ commitment: 'confirmed' }),
      new Promise((_, rej) => ctrl.signal.addEventListener('abort', () => rej(new Error('timeout')))),
    ]);
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(to);
  }
}

@Injectable({ providedIn: 'root' })
export class NetworkService {
  private cluster$ = new BehaviorSubject<Cluster>('devnet');
  private rpcUrl$ = new BehaviorSubject<string | null>(null);

  setCluster(c: Cluster) { this.cluster$.next(c); this.rpcUrl$.next(null); }
  getCluster() { return this.cluster$.value; }

  async getConnection(): Promise<Connection> {
    const existing = this.rpcUrl$.value;
    if (existing) return new Connection(existing, { commitment: 'confirmed' });

    const cluster = this.getCluster();
    for (const url of CANDIDATES[cluster]) {
      if (await ping(url)) {
        this.rpcUrl$.next(url);
        console.log('[RPC]', cluster, '→', url);
        return new Connection(url, { commitment: 'confirmed' });
      } else {
        console.warn('[RPC down]', url);
      }
    }
    throw new Error(`No ${cluster} RPC endpoints are reachable`);
  }
}
