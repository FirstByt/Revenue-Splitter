export type ClusterName = 'mainnet-beta' | 'testnet' | 'devnet' | 'localnet';

export function inferClusterFromRpc(rpcUrl: string): ClusterName {
  const u = rpcUrl.toLowerCase();
  if (u.includes('devnet')) return 'devnet';
  if (u.includes('testnet')) return 'testnet';
  if (u.includes('localhost') || u.includes('127.0.0.1')) return 'localnet';
  return 'mainnet-beta';
}