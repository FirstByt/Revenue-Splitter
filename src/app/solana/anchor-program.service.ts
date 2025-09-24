import { Injectable } from '@angular/core';
import { AnchorProvider, Idl, Program } from '@coral-xyz/anchor';
import { Connection, Transaction, VersionedTransaction } from '@solana/web3.js';
import { getAppConfig } from '../app.config';
import { WalletService } from './wallet.service';

type RevenueSplitterIdl = Idl & { address?: string };

@Injectable({ providedIn: 'root' })
export class AnchorProgramService {
  private connection: Connection;
  private idl?: RevenueSplitterIdl;

  constructor(private wallets: WalletService) {
    const { rpcUrl } = getAppConfig()!;
    this.connection = new Connection(rpcUrl, 'confirmed');
  }

  private async loadIdl(): Promise<RevenueSplitterIdl> {
    if (this.idl) return this.idl;

    const res = await fetch('/assets/idl/revenue_splitter.json', { cache: 'no-store' });
    const parsed: RevenueSplitterIdl = await res.json();
    this.idl = parsed;

    const cfgPid = getAppConfig()!.programId;
    if (parsed.address && parsed.address !== cfgPid) {
      console.warn('[Anchor] IDL address != app-config programId:', parsed.address, cfgPid);
    }

    return parsed;
  }

  private makeProvider(): AnchorProvider {
    const adapter = this.wallets.adapter;
    if (!adapter || !adapter.publicKey) throw new Error('Wallet is not connected');

    const signOne = adapter.signTransaction!.bind(adapter) as (
      tx: Transaction | VersionedTransaction
    ) => Promise<Transaction | VersionedTransaction>;

    const signMany = adapter.signAllTransactions
      ? (adapter.signAllTransactions.bind(adapter) as (
          txs: (Transaction | VersionedTransaction)[]
        ) => Promise<(Transaction | VersionedTransaction)[]>)
      : async (txs: (Transaction | VersionedTransaction)[]) =>
          Promise.all(txs.map((tx) => signOne(tx)));

    const wallet: any = {
      publicKey: adapter.publicKey,
      signTransaction: signOne,
      signAllTransactions: signMany,
    };

    return new AnchorProvider(this.connection, wallet, {});
  }

  async getProgram(): Promise<Program> {
    const idl = await this.loadIdl();
    const provider = this.makeProvider();
    return new Program(idl as Idl, provider);
  }

  getConnection() {
    return this.connection;
  }
}
