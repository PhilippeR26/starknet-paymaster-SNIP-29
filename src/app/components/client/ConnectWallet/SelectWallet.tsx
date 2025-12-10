"use client";

import { Button, Dialog, StackSeparator, useDisclosure, VStack, Image } from "@chakra-ui/react";
import { WALLET_API } from '@starknet-io/types-js';
import { validateAndParseAddress, constants as SNconstants, WalletAccountV5, walletV5, json, PaymasterRpc, constants } from 'starknet';
import { createStore, type Store } from "@starknet-io/get-starknet-discovery";
import { isStarknetWallet, type WalletWithStarknetFeatures } from "@starknet-io/get-starknet-wallet-standard/features";
import { myFrontendProviders } from '@/app/utils/constants';
import { useStoreWallet } from './walletContext';
import { useFrontendProvider } from '../provider/providerContext';
import { useEffect } from 'react';

export default function SelectWallet() {
    const { open, onOpen, onClose } = useDisclosure()

    const {
        setWalletWSF: setMyWallet,
        setMyWalletAccount,
        setConnected,
        setSelectWalletUI,
        setWalletApiList: setWalletApi,
        setChain,
        setAddressAccount,
    } = useStoreWallet();

    const {
        currentFrontendProviderIndex: myFrontendProviderIndex,
        setCurrentFrontendProviderIndex,
    } = useFrontendProvider();

    const store: Store = createStore();
    const wallets: WalletWithStarknetFeatures[] = store.getWallets();
    console.log(wallets);

    async function handleSelectedWallet(selectedWallet: WalletWithStarknetFeatures) {
        // First, low level connection to be able to get chainId (only a problem in Ready wallet)
        console.log("selected WalletWithStarknetFeatures=", selectedWallet);
        await selectedWallet.features["standard:connect"].connect({ silent: false });
        // Direct access to wallet features 
        const chainId = (await walletV5.requestChainId(selectedWallet)) as string;
        // or
        // const chainId = await selectedWallet.features["starknet:walletApi"].request({ type: "wallet_requestChainId" });
        console.log("chainId=", chainId);

        setConnected(true);
        setMyWallet(selectedWallet); // zustand
        const paymasterRpc = new PaymasterRpc({ nodeUrl: constants.NetworkName.SN_SEPOLIA });
        console.log("Trying to connect wallet=", selectedWallet);
        setMyWalletAccount(await WalletAccountV5.connect(myFrontendProviders[2], selectedWallet, undefined, paymasterRpc));

        console.log("WalletAccountV5 created");
        const result = await walletV5.requestAccounts(selectedWallet);
        if (typeof (result) == "string") {
            console.log("This Wallet is not compatible.");
            setSelectWalletUI(false);
            return;
        }
        console.log("Current account addr =", result);
        if (Array.isArray(result)) {
            const addr = validateAndParseAddress(result[0]);
            setAddressAccount(addr); // zustand
        }
        const isConnectedWallet: boolean = await walletV5.getPermissions(selectedWallet).then((res: any) => (res as WALLET_API.Permission[]).includes(WALLET_API.Permission.ACCOUNTS));
        setConnected(isConnectedWallet); // zustand
        if (isConnectedWallet) {
            const chainId = (await walletV5.requestChainId(selectedWallet)) as string;
            setChain(chainId);
            setCurrentFrontendProviderIndex(chainId === SNconstants.StarknetChainId.SN_MAIN ? 0 : 2);

            console.log("change Provider index to :", myFrontendProviderIndex);
        }
        setWalletApi(await walletV5.supportedSpecs(selectedWallet));
        console.log("selected wallet =", json.stringify(selectedWallet));
        setSelectWalletUI(false);
    }

    useEffect(
        () => {
            console.log("Launch select wallet window.");
            onOpen();
            return () => { }
        },
        []
    );

    return (
        <>
            <Dialog.Root
                placement={"center"}
                scrollBehavior={"inside"}
                size={"md"}
                open={open}
                closeOnInteractOutside={true}
                onOpenChange={() => {
                    setSelectWalletUI(false);
                    onClose()
                }}
            >
                <Dialog.Positioner>
                    <Dialog.Content>
                        <Dialog.Header
                            fontSize='xl'
                            fontWeight='bold'
                            padding={"20px"}
                            marginBottom={"10px"}
                        >
                            <Dialog.Title>
                                Select a wallet:
                            </Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body
                            px={"20px"}
                        >
                            <VStack
                                separator={<StackSeparator borderColor='gray.200' />}
                                gap={3}
                                marginBottom={"20px"}
                                align='stretch'
                            >
                                {
                                    wallets.map((wallet: WalletWithStarknetFeatures, index: number) => {
                                        const iconW: string = wallet.icon;
                                        return <>
                                            {isStarknetWallet(wallet) ? <>
                                                <Button
                                                    key={"wKey" + index.toString()}
                                                    id={"wId" + index.toString()}
                                                    variant="surface"
                                                    fontSize='lg'
                                                    fontWeight='bold'
                                                    onClick={() => {
                                                        handleSelectedWallet(wallet);
                                                        onClose();
                                                    }} >
                                                    <Image src={iconW ? iconW : undefined} width={30} />
                                                    {wallet.name + ' ' + wallet.features["starknet:walletApi"].walletVersion}
                                                </Button>
                                            </> : <>
                                                <Button
                                                    key={"wKey" + index.toString()}
                                                    id={"wId" + index.toString()}

                                                    variant="surface"
                                                    fontSize='lg'
                                                    fontWeight='bold'
                                                    backgroundColor="orange"
                                                    disabled={true}
                                                >
                                                    <Image src={iconW} width={30} />
                                                    {(wallet as WalletWithStarknetFeatures).name + ' ' + (wallet as WalletWithStarknetFeatures).version + " not compatible!"}
                                                </Button>
                                            </>}
                                        </>
                                    })
                                }
                            </VStack>
                        </Dialog.Body>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Dialog.Root>
        </>
    )
}
