import { Injectable } from '@angular/core';
import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { getAppConfig } from '../app.config';

@Injectable({ providedIn: 'root' })
export class ConnectionService {
  private readonly conn = new Connection(getAppConfig()!.rpcUrl, 'confirmed');

  async getLatestBlockhash() {
    const { blockhash } = await this.conn.getLatestBlockhash();
    return blockhash;
  }

  async getBalance(pubkey: PublicKey) {
    return this.conn.getBalance(pubkey);
  }

  async airdrop(pubkey: PublicKey, sol = 1) {
    const lamports = Math.floor(sol * LAMPORTS_PER_SOL);
    const sig = await this.conn.requestAirdrop(pubkey, lamports);
    const bh = await this.conn.getLatestBlockhash();
    await this.conn.confirmTransaction({ signature: sig, ...bh }, 'confirmed');
    return sig;
  }
}
