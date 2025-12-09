"use client";

import { create } from "zustand";
import { ProviderInterface, AccountInterface, type WalletAccount, type WalletAccountV5 } from "starknet";
import { WALLET_API } from "@starknet-io/types-js";
import type { WalletWithStarknetFeatures } from "@starknet-io/get-starknet-wallet-standard/features";

export interface Wallet_state {
    walletWSF: WalletWithStarknetFeatures | undefined,
    setWalletWSF: (wallet: WalletWithStarknetFeatures) => void,    address: string,
    setAddressAccount: (address: string) => void,
    chain: string,
    setChain: (chain: string) => void,
    myWalletAccount: WalletAccountV5 | undefined;
    setMyWalletAccount: (myWAccount: WalletAccountV5) => void;
    account: AccountInterface | undefined,
    setAccount: (account: AccountInterface) => void,
    provider: ProviderInterface | undefined,
    setProvider: (provider: ProviderInterface) => void,
    isConnected: boolean,
    setConnected: (isConnected: boolean) => void,
    displaySelectWalletUI: boolean,
    setSelectWalletUI: (displaySelectWalletUI: boolean) => void,
    walletApiList: string[],
    setWalletApiList: (version: string[]) => void,
    selectedApiVersion: string,
    setSelectedApiVersion: (version: string) => void,

}

export const useStoreWallet = create<Wallet_state>()(set => ({
    walletWSF: undefined,
    setWalletWSF: (wallet: WalletWithStarknetFeatures) => { set({ walletWSF: wallet }) },
    address: "",
    setAddressAccount: (address: string) => { set(_state => ({ address })) },
    chain: "",
    setChain: (chain: string) => { set(_state => ({ chain: chain })) },
    myWalletAccount: undefined,
    setMyWalletAccount: (myWAccount: WalletAccountV5) => { set(_state => ({ myWalletAccount: myWAccount })) },
    account: undefined,
    setAccount: (account: AccountInterface) => { set(_state => ({ account })) },
    provider: undefined,
    setProvider: (provider: ProviderInterface) => { set(_state => ({ provider: provider })) },
    isConnected: false,
    setConnected: (isConnected: boolean) => { set(_state => ({ isConnected })) },
    displaySelectWalletUI: false,
    setSelectWalletUI: (displaySelectWalletUI: boolean) => { set(_state => ({ displaySelectWalletUI })) },
    walletApiList: [],
    setWalletApiList: (walletApi: string[]) => { set(_state => ({ walletApiList: walletApi })) },
    selectedApiVersion: "default",
    setSelectedApiVersion: (selectedApiVersion: string) => { set(_state => ({ selectedApiVersion })) },
}));
