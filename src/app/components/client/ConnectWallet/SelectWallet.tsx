"use client";

import { useStoreWallet } from './walletContext';
import { Button } from "@chakra-ui/react";
import { connect } from '@starknet-io/get-starknet';
import { WALLET_API } from '@starknet-io/types-js';
import { validateAndParseAddress, wallet, WalletAccount, constants as SNconstants, PaymasterRpc } from 'starknet';
import { myFrontendProviders } from '@/app/utils/constants';
import { useFrontendProvider } from '../provider/providerContext';
import WrongWallet from './WrongWallet';
import { useEffect, useState } from 'react';

export default function SelectWallet() {
    const [isError, setError] = useState<boolean>(false);

    const setMyWallet = useStoreWallet(state => state.setMyStarknetWalletObject);

    const setMyWalletAccount = useStoreWallet(state => state.setMyWalletAccount);

    const setChain = useStoreWallet(state => state.setChain);
    const setAddressAccount = useStoreWallet(state => state.setAddressAccount);

    const setConnected = useStoreWallet(state => state.setConnected);

    const setCurrentFrontendProviderIndex = useFrontendProvider(state => state.setCurrentFrontendProviderIndex);

    const setWalletApi = useStoreWallet(state => state.setWalletApiList);


    async function selectW() {
        setError(false);
        const myWalletSWO = await connect({ modalMode: "alwaysAsk" });
        if (myWalletSWO) {
            const isValid = await checkCompatibility(myWalletSWO);
            setError(!isValid);
            if (isValid) { await handleSelectedWallet(myWalletSWO); }
        }
    }

    const checkCompatibility = async (myWalletSWO: WALLET_API.StarknetWindowObject) => {
        // verify compatibility of wallet with the new API of get-starknet v4
        let isCompatible: boolean = false;
        try {
            await myWalletSWO.request({ type: "wallet_supportedSpecs" });
            isCompatible = true;
        } catch {
            (_err: any) => { console.log("Wallet compatibility failed.") };
        }
        return isCompatible;
    }

    const handleSelectedWallet = async (selectedWallet: WALLET_API.StarknetWindowObject) => {
        console.log("Trying to connect wallet=", selectedWallet);
        setMyWallet(selectedWallet); // zustand
        const paymasterRpc = new PaymasterRpc({ default: true });
        setMyWalletAccount(await WalletAccount.connect(myFrontendProviders[2], selectedWallet,undefined, paymasterRpc));

        const result = await wallet.requestAccounts(selectedWallet);
        if (typeof (result) == "string") {
            console.log("This Wallet is not compatible.");
            return;
        }
        console.log("Current account addr =", result);
        if (Array.isArray(result)) {
            const addr = validateAndParseAddress(result[0]);
            setAddressAccount(addr); // zustand
        }
        console.log("SWO name=", selectedWallet.name);
        const isConnectedWallet: boolean = await wallet.getPermissions(selectedWallet).then((res: any) => (res as WALLET_API.Permission[]).includes(WALLET_API.Permission.ACCOUNTS));
        setConnected(isConnectedWallet); // zustand
        if (isConnectedWallet) {
            const chainId = (await wallet.requestChainId(selectedWallet)) as string;
            setChain(chainId);
            setCurrentFrontendProviderIndex(chainId === SNconstants.StarknetChainId.SN_MAIN ? 0 : 2);
            console.log("change Provider index to :", chainId === SNconstants.StarknetChainId.SN_MAIN ? 0 : 2);
        }
        // ********** TODO : replace supportedSpecs by api versions when available in SNJS & wallets
        setWalletApi(await wallet.supportedSpecs(selectedWallet));
    }

    useEffect(() => {selectW()}, []);

    return (
        <>
        </>
    )
}
