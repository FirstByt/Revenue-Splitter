import { Injectable } from '@angular/core';
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { AnchorProgramService } from './anchor-program.service';
import { findConfigPda, findAuthorityInfoPda, findSplitterPda } from './pda';
import { WalletService } from './wallet.service';

export type UiRecipient = { address: string; percentage: number };

function toPk(v: PublicKey | string): PublicKey {
  return v instanceof PublicKey ? v : new PublicKey(v);
}
function toBigInt(u: any): bigint {
  if (u === null || u === undefined) return 0n;
  if (typeof u === 'bigint') return u;
  const s = typeof u === 'number' ? Math.trunc(u).toString() : u.toString?.();
  return BigInt(s ?? 0);
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

  /** ---- Config ---- */
  async fetchConfig(): Promise<{
    admin: PublicKey;
    creationFee: bigint;
    depositFee: bigint;
    updateFee: bigint;
    treasury: PublicKey;
    bump: number;
  }> {
    const program = await this.program();
    const programId = new PublicKey(program.programId);
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
    const programId = new PublicKey(program.programId);

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

  private async ensureRecipientsOnChain(recipients: PublicKey[], payer: PublicKey) {
    const program = await this.program();
    const conn = program.provider.connection;

    const missing: PublicKey[] = [];
    for (const pk of recipients) {
      const info = await conn.getAccountInfo(pk, 'confirmed');
      if (!info) missing.push(pk);
      else if (!info.owner.equals(SystemProgram.programId)) {
        throw new Error(`Recipient is not a System account: ${pk.toBase58()}`);
      }
    }
    if (!missing.length) return;

    const LAMPORTS = 5_000;

    const ixs = missing.map(pk =>
      SystemProgram.transfer({ fromPubkey: payer, toPubkey: pk, lamports: LAMPORTS })
    );
    const tx = new Transaction().add(...ixs);

    const { blockhash, lastValidBlockHeight } =
      await conn.getLatestBlockhash({ commitment: 'confirmed' });

    tx.recentBlockhash = blockhash;
    tx.feePayer = payer;

    const signed = await (program.provider.wallet as any).signTransaction(tx);
    const sig = await conn.sendRawTransaction(signed.serialize(), { skipPreflight: false });
    await conn.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed');

    console.log('[recipients] created system accounts via transfers:', {
      created: missing.map(m => m.toBase58()),
      sig,
    });
  }

  /** ---- Create vault ---- */
  async createVault(input: { recipients: UiRecipient[]; mutable: boolean }) {
    const program = await this.program();
    const programId = new PublicKey(program.programId);

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
    for (const r of input.recipients) {
      if (!Number.isInteger(r.percentage) || r.percentage < 0 || r.percentage > 100) {
        throw new Error('Each percentage must be an integer between 0 and 100');
      }
    }
    const total = input.recipients.reduce((s, r) => s + (r.percentage || 0), 0);
    if (total !== 100) throw new Error('Total % must equal 100');

    const trimmed = input.recipients.map(r => ({ address: r.address.trim(), percentage: r.percentage }));
    const dedup = new Set(trimmed.map(r => r.address));
    if (dedup.size !== trimmed.length) throw new Error('Duplicate recipient');

    const recipientsIDL = trimmed.map(r => ({
      address: toPk(r.address),
      percentage: r.percentage,
    }));

    const remaining = recipientsIDL.map(r => ({
      pubkey: r.address,
      isSigner: false,
      isWritable: false,
    }));

    await this.ensureRecipientsOnChain(recipientsIDL.map(r => r.address), authority);

    const aiRaw: any = await (program.account as any).authorityInfo.fetch(aiPda);
    const index = toBigInt(aiRaw.splittersAmount ?? 0n);
    const splitterPda = findSplitterPda(programId, cfgPda, authority, index);

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
      .remainingAccounts(remaining)
      .rpc();

    console.log('[createVault] OK', { signature: sig, splitter: splitterPda.toBase58(), index: index.toString() });
    return { signature: sig, splitter: splitterPda, index };
  }

  /** ---- List my splitters ---- */
  async listMyVaults(): Promise<Array<{
    address: PublicKey;
    authority: PublicKey;
    index: bigint;
    recipients: Array<{ address: string; percentage: number }>;
    mutable: boolean;
  }>> {
    const program = await this.program();
    const adapter = this.wallets.adapter;
    if (!adapter?.publicKey) throw new Error('Wallet is not connected');
    const me = adapter.publicKey;

    // layout Splitter: [8 discr][32 config][32 authority] → authority offset = 8 + 32
    const AUTHORITY_OFFSET = 8 + 32;

    try {
      const all: any[] = await (program.account as any).splitter.all([
        { memcmp: { offset: AUTHORITY_OFFSET, bytes: me.toBase58() } },
      ]);

      return all.map(({ publicKey, account }) => ({
        address: toPk(publicKey),
        authority: toPk(account.authority),
        index: toBigInt(account.index),
        recipients: (account.recipients || []).map((r: any) => ({
          address: toPk(r.address).toBase58(),
          percentage: Number(r.percentage),
        })),
        mutable: !!account.mutable,
      }));
    } catch (e) {
      console.error('[listMyVaults] failed', e);
      return [];
    }
  }
}
