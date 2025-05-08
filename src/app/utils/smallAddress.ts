import { num } from "starknet";

export function smallAddress(addressAccount: string|undefined ): string {
    if (!addressAccount) return "";

    return `0x${num.toHex64(addressAccount).slice(2, 7)}...${addressAccount.slice(-4)}`;
}
//${addressAccount?.slice(0, 7)}...${addressAccount?.slice(-4)}