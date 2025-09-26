import { PublicKey } from "@solana/web3.js";

export interface Vault {
    address: PublicKey;
    authority: PublicKey;
    index: bigint;
    recipients: Array<{
        address: string;
        percentage: number;
    }>;
    mutable: boolean;
    name: string;
}