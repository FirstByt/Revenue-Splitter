import { Injectable } from '@angular/core';
import { AnchorProvider, Idl, Program } from '@coral-xyz/anchor';
import { Commitment, Connection, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import { WalletService } from './wallet.service';
import { NetworkService } from './network.service';
import { getAppConfig } from '../app.config';

type RevenueSplitterIdl = Idl & { address?: string };
const COMMITMENT: Commitment = 'confirmed';

@Injectable({ providedIn: 'root' })
export class AnchorProgramService {
  private provider: AnchorProvider | null = null;
  private program: Program | null = null;
  private idl?: RevenueSplitterIdl;
  private lastWalletKey?: string;

  constructor(private wallets: WalletService, private net: NetworkService) {}

  private async loadIdl(): Promise<RevenueSplitterIdl> {
    if (this.idl) return this.idl;
    const res = await fetch('/assets/idl/revenue_splitter.json', { cache: 'no-store' });
    const idl = (await res.json()) as RevenueSplitterIdl;

    if (!idl.address) {
      const cfg = getAppConfig()!;
      idl.address = cfg.programId; // '7SSiszqhzQ5hMKoJe2nXQGqEY9995ppBcPqEECNtQM48'
    }

    this.idl = idl;
    return this.idl!;
  }

  async getConnection(): Promise<Connection> {
    return this.net.getConnection();
  }

  private makeWalletShim() {
    const adapter = this.wallets.adapter;
    if (!adapter || !adapter.publicKey) throw new Error('Wallet is not connected');

    const signOne = adapter.signTransaction!.bind(adapter) as (tx: Transaction | VersionedTransaction) =>
      Promise<Transaction | VersionedTransaction>;

    const signMany = adapter.signAllTransactions
      ? adapter.signAllTransactions.bind(adapter)
      : async (txs: (Transaction | VersionedTransaction)[]) => Promise.all(txs.map(signOne));

    return {
      publicKey: adapter.publicKey as PublicKey,
      signTransaction: signOne,
      signAllTransactions: signMany as any,
    } as any;
  }

  private async buildProvider(): Promise<AnchorProvider> {
    const connection = await this.getConnection();
    const wallet = this.makeWalletShim();
    return new AnchorProvider(connection, wallet, {
      commitment: COMMITMENT,
      preflightCommitment: COMMITMENT,
    });
  }

  private walletChanged(): boolean {
    const pk = this.wallets.publicKey()?.toBase58() ?? '';
    if (pk !== this.lastWalletKey) {
      this.lastWalletKey = pk;
      return true;
    }
    return false;
  }

  async getProgram(): Promise<Program> {
    if (this.walletChanged()) {
      this.provider = null;
      this.program = null;
    }
    if (this.program) return this.program;

    const idl = await this.loadIdl();
    this.provider = await this.buildProvider();

    this.program = new Program(idl as Idl, this.provider!);
    return this.program;
  }
}
