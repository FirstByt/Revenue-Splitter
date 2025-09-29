import { Injectable } from '@angular/core';
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { AnchorProgramService } from './anchor-program.service';
import { findConfigPda, findAuthorityInfoPda, findSplitterPda } from './pda';
import { WalletService } from './wallet.service';
import { utils } from '@coral-xyz/anchor';
import { Vault } from '../models/vault/vault';

export type UiRecipient = { address: string; percentage: number };

const SPLITTER_DISCRIM = Uint8Array.from([187, 177, 147, 182, 44, 155, 130, 202]);
const SPLITTER_DISCRIM_B58 = utils.bytes.bs58.encode(SPLITTER_DISCRIM);

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
  async createVault(input: { recipients: UiRecipient[]; mutable: boolean, name: string }) {
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
      .createSplitter(recipientsIDL, !!input.mutable, input.name)
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

  async listMyVaults(): Promise<Vault[]> {
    const program = await this.program();
    const conn = program.provider.connection;

    const adapter = this.wallets.adapter;
    if (!adapter?.publicKey) throw new Error('Wallet is not connected');
    const me = adapter.publicKey;

    const filters = [
      { memcmp: { offset: 0, bytes: SPLITTER_DISCRIM_B58 } },
      { memcmp: { offset: 8 + 32, bytes: me.toBase58() } },
    ];

    const raws = await conn.getProgramAccounts(new PublicKey(program.programId), {
      commitment: 'confirmed',
      filters,
    });

    const out: Array<Vault> = [];

    for (const { pubkey, account } of raws) {
      const buf = Buffer.from(account.data); 

      try {
        const config = new PublicKey(buf.subarray(8, 8 + 32));
        const authority = new PublicKey(buf.subarray(8 + 32, 8 + 32 + 32));
        const index = Number(buf.readBigUInt64LE(8 + 32 + 32));
        let p = 8 + 32 + 32 + 8;

        // ---- recipients: vec<Recipient> ----
        if (p + 4 > buf.length) throw new Error('truncated before recipients length');
        const n = buf.readUInt32LE(p); p += 4;

        const tryParseRecipients = (bytesPerPercent: 1 | 2) => {
          const recs: Array<{ address: string; percentage: number }> = [];
          const itemSize = 32 + bytesPerPercent;
          if (p + n * itemSize > buf.length) return null;

          let q = p;
          for (let i = 0; i < n; i++) {
            const addr = new PublicKey(buf.subarray(q, q + 32)); q += 32;
            const pct = bytesPerPercent === 2 ? buf.readUInt16LE(q) : buf.readUInt8(q);
            q += bytesPerPercent;
            recs.push({ address: addr.toBase58(), percentage: pct });
          }
          return { recs, next: p + n * itemSize };
        };

        let parsed = tryParseRecipients(2 /* u16 */);
        if (!parsed) parsed = tryParseRecipients(1 /* u8 (legacy) */);
        if (!parsed) throw new Error('recipients vector out of bounds');

        const recipients = parsed.recs;
        p = parsed.next;

        // ---- mutable ----
        let mutable = false;
        if (p + 1 <= buf.length) {
          mutable = buf[p] !== 0; p += 1;
        }

        // ---- bump ----
        if (p + 1 <= buf.length) {
          /* const bump = buf[p]; */ p += 1;
        }

        let name = '';
        if (p + 4 <= buf.length) {
          const slen = buf.readUInt32LE(p); p += 4;
          if (slen > 0 && p + slen <= buf.length) {
            name = Buffer.from(buf.subarray(p, p + slen)).toString('utf8');
            p += slen;
          }
        }

        out.push({
          address: pubkey,
          authority,
          index: BigInt(index),
          recipients,
          mutable,
          name: name ?? '',
        });
      } catch (e) {
        console.warn('[listMyVaults][skip]', pubkey.toBase58(), (e as Error)?.message);
        continue;
      }
    }

    out.sort((a, b) => Number(a.index - b.index));
    return out;
  }
}
