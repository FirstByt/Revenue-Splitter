import { Buffer } from 'buffer';
import { PublicKey } from '@solana/web3.js';

export const findConfigPda = (pid: PublicKey) =>
  PublicKey.findProgramAddressSync([Buffer.from('config')], pid)[0];

export const findAuthorityInfoPda = (pid: PublicKey, cfg: PublicKey, auth: PublicKey) =>
  PublicKey.findProgramAddressSync(
    [Buffer.from('authority_info'), cfg.toBuffer(), auth.toBuffer()],
    pid
  )[0];

export const findSplitterPda = (pid: PublicKey, cfg: PublicKey, auth: PublicKey, index: bigint) => {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(index); // <-- Big-Endian!
  return PublicKey.findProgramAddressSync(
    [Buffer.from('splitter'), cfg.toBuffer(), auth.toBuffer(), buf],
    pid
  )[0];
};

export function deriveSplitterPdaVariants(pid: PublicKey, cfg: PublicKey, auth: PublicKey, index: bigint) {
  const u64le = (n: bigint) => { const b = Buffer.alloc(8); b.writeBigUInt64LE(n); return b; };
  const u64be = (n: bigint) => { const b = Buffer.alloc(8); b.writeBigUInt64BE(n); return b; };

  const variants = [
    { name: 'LE, i',   pda: PublicKey.findProgramAddressSync([Buffer.from('splitter'), cfg.toBuffer(), auth.toBuffer(), u64le(index)], pid)[0] },
    { name: 'BE, i',   pda: PublicKey.findProgramAddressSync([Buffer.from('splitter'), cfg.toBuffer(), auth.toBuffer(), u64be(index)], pid)[0] },
    { name: 'LE, i-1', pda: index > 0n ? PublicKey.findProgramAddressSync([Buffer.from('splitter'), cfg.toBuffer(), auth.toBuffer(), u64le(index-1n)], pid)[0] : null },
    { name: 'BE, i-1', pda: index > 0n ? PublicKey.findProgramAddressSync([Buffer.from('splitter'), cfg.toBuffer(), auth.toBuffer(), u64be(index-1n)], pid)[0] : null },
  ].filter(v => v.pda !== null);

  return variants.map(v => ({ variant: v.name, pda: (v.pda as PublicKey).toBase58() }));
}
