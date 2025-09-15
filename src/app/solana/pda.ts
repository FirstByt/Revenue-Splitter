import { PublicKey } from '@solana/web3.js';

const CONFIG_SEED = Buffer.from('config');
const AUTHORITY_INFO_SEED = Buffer.from('authority_info');
const SPLITTER_SEED = Buffer.from('splitter');

const u64le = (n: bigint) => { const b = Buffer.alloc(8); b.writeBigUInt64LE(n); return b; };

export const findConfigPda = (programId: PublicKey) =>
  PublicKey.findProgramAddressSync([CONFIG_SEED], programId)[0];

export const findAuthorityInfoPda = (programId: PublicKey, config: PublicKey, authority: PublicKey) =>
  PublicKey.findProgramAddressSync([AUTHORITY_INFO_SEED, config.toBuffer(), authority.toBuffer()], programId)[0];

export const findSplitterPda = (programId: PublicKey, config: PublicKey, authority: PublicKey, index: bigint) =>
  PublicKey.findProgramAddressSync([SPLITTER_SEED, config.toBuffer(), authority.toBuffer(), u64le(index)], programId)[0];
