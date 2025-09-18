import { Injectable } from '@angular/core';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { AnchorProgramService } from './anchor-program.service';
import { findConfigPda, findAuthorityInfoPda, findSplitterPda } from './pda';
import { WalletService } from './wallet.service';

export type UiRecipient = { address: string; percentage: number };

function toPk(v: PublicKey | string): PublicKey {
  return v instanceof PublicKey ? v : new PublicKey(v);
}

function toBigInt(u: any): bigint {
  if (typeof u === 'bigint') return u;
  if (u && typeof u.toString === 'function') return BigInt(u.toString());
  return BigInt(u as number);
}

@Injectable({ providedIn: 'root' })
export class SplitterService {
  constructor(
    private anchor: AnchorProgramService,
    private wallets: WalletService
  ) {}

  private async program() {
    return this.anchor.getProgram();
  }

  async fetchConfig(): Promise<{
    admin: PublicKey;
    creationFee: bigint;
    depositFee: bigint;
    updateFee: bigint;
    treasury: PublicKey;
    bump: number;
  }> {
    const program = await this.program();
    const programId = toPk(program.programId as any);
    const cfgPda = findConfigPda(programId);

    const raw: any = await (program.account as any).config.fetch(cfgPda);

    return {
      admin: toPk(raw.admin),
      creationFee: toBigInt(raw.creationFee),
      depositFee: toBigInt(raw.depositFee),
      updateFee: toBigInt(raw.updateFee),
      treasury: toPk(raw.treasury),
      bump: Number(raw.bump ?? 0),
    };
  }

  async ensureAuthorityInfo(): Promise<PublicKey> {
    const program = await this.program();
    const programId = toPk(program.programId as any);

    const adapter = this.wallets.adapter;
    if (!adapter?.publicKey) throw new Error('Wallet is not connected');
    const authority = adapter.publicKey;

    const cfgPda = findConfigPda(programId);
    const aiPda = findAuthorityInfoPda(programId, cfgPda, authority);

    try {
      await (program.account as any).authorityInfo.fetch(aiPda);
      return aiPda;
    } catch {
      await (program.methods as any).createAuthorityInfo()
        .accounts({
          authorityInfo: aiPda,
          payer: authority,
          config: cfgPda,
          authority,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      return aiPda;
    }
  }

  async createVault(input: { recipients: UiRecipient[]; mutable: boolean }) {
    const program = await this.program();
    const programId = toPk(program.programId as any);

    const adapter = this.wallets.adapter;
    if (!adapter?.publicKey) throw new Error('Wallet is not connected');
    const authority = adapter.publicKey;

    const cfgPda = findConfigPda(programId);
    const aiPda = await this.ensureAuthorityInfo();
    const cfg = await this.fetchConfig();
    const treasury = cfg.treasury;

    if (input.recipients.length < 1 || input.recipients.length > 10) {
      throw new Error('Recipients must be 1..10');
    }
    const total = input.recipients.reduce((s, r) => s + Number(r.percentage || 0), 0);
    if (total !== 100) throw new Error('Total % must equal 100');
    const dedup = new Set(input.recipients.map(r => r.address));
    if (dedup.size !== input.recipients.length) throw new Error('Duplicate recipient');

    const aiRaw: any = await (program.account as any).authorityInfo.fetch(aiPda);
    const nextIndex = toBigInt(aiRaw.splittersAmount ?? 0);

    const recipientsIDL = input.recipients.map(r => ({
      address: toPk(r.address),
      percentage: Number(r.percentage)
    }));

    const remaining = recipientsIDL.map(r => ({
      pubkey: r.address as PublicKey,
      isWritable: false,
      isSigner: false,
    }));

    const splitterPda = findSplitterPda(programId, cfgPda, authority, nextIndex);

    const sig: string = await (program.methods as any)
      .createSplitter(recipientsIDL, !!input.mutable)
      .accounts({
        splitter: splitterPda,
        authority,
        authorityInfo: aiPda,
        treasury,
        config: cfgPda,
        systemProgram: SystemProgram.programId,
      })
      .remainingAccounts(remaining) // ⬅️ додано
      .rpc();

    return { signature: sig, splitter: splitterPda, index: nextIndex };
}


  async listMyVaults(): Promise<Array<{
    address: PublicKey;
    authority: PublicKey;
    index: bigint;
    recipients: Array<{ address: string; percentage: number }>;
    mutable: boolean;
  }>> {
    const program = await this.program();
    const programId = toPk(program.programId as any);

    const adapter = this.wallets.adapter;
    if (!adapter?.publicKey) throw new Error('Wallet is not connected');
    const me = adapter.publicKey;

    // layout Splitter: [8 discriminator][32 config][32 authority]
    const AUTHORITY_OFFSET = 8 + 32;

    const all: any[] = await (program.account as any).splitter.all([
      { memcmp: { offset: AUTHORITY_OFFSET, bytes: me.toBase58() } }
    ]);

    return all.map(({ publicKey, account }) => ({
      address: toPk(publicKey),
      authority: toPk(account.authority),
      index: toBigInt(account.index),
      recipients: (account.recipients || []).map((r: any) => ({
        address: toPk(r.address).toBase58(),
        percentage: Number(r.percentage)
      })),
      mutable: !!account.mutable,
    }));
  }
}
