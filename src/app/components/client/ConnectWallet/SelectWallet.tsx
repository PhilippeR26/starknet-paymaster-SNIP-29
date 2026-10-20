"use client";

import { Button, Dialog, StackSeparator, useDisclosure, VStack, Image } from "@chakra-ui/react";
import { WALLET_API } from '@starknet-io/types-js';
import { validateAndParseAddress, constants as SNconstants, WalletAccountV6, walletV6, json, PaymasterRpc, constants } from 'starknet';
import { createStore, type Store } from "@starknet-io/get-starknet-discovery";
import type { WalletWithStarknetFeatures } from "@starknet-io/get-starknet-wallet-standard/features";
import { myFrontendProviders } from '@/app/utils/constants';
import { useStoreWallet } from './walletContext';
import { useFrontendProvider } from '../provider/providerContext';
import { useEffect, useState } from 'react';

const PERMISSIONS_RETRY_MS = 3000;
const PERMISSIONS_MAX_ATTEMPTS = 3;
const INJECTED_WALLET_POLL_MS = 250; // how often window is checked for a newly injected wallet

const wait = (ms: number) => new Promise<"timeout">(resolve => setTimeout(() => resolve("timeout"), ms));

// Asks the wallet for its permissions to find out whether it speaks the Wallet API.
// An extension still starting up may never answer the first request, so the request is sent again after PERMISSIONS_RETRY_MS, up to PERMISSIONS_MAX_ATTEMPTS times.
async function checkCompatibility(wallet: WalletWithStarknetFeatures): Promise<boolean> {
    for (let attempt = 1; attempt <= PERMISSIONS_MAX_ATTEMPTS; attempt++) {
        try {
            const answer = await Promise.race([
                wallet.features["starknet:walletApi"].request({ type: "wallet_getPermissions" }),
                wait(PERMISSIONS_RETRY_MS),
            ]);
            if (answer !== "timeout") {
                console.log(`Wallet ${wallet.name} is compatible (attempt ${attempt})`);
                return true;
            }
        } catch (err) {
            console.log(`Wallet ${wallet.name} is NOT compatible:`, err);
            return false; // the wallet answered with an error
        }
    }
    console.log(`Wallet ${wallet.name} did not answer after ${PERMISSIONS_MAX_ATTEMPTS} attempts`);
    return false;
}

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

    const [wallets, setWallets] = useState<readonly WalletWithStarknetFeatures[]>([]);
    const [verdicts, setVerdicts] = useState<Map<WalletWithStarknetFeatures, boolean>>(new Map()); // no verdict yet = still checking

    async function handleSelectedWallet(selectedWallet: WalletWithStarknetFeatures) {
        // First, low level connection to be able to get chainId (only a problem in Ready wallet)
        console.log("selected WalletWithStarknetFeatures=", selectedWallet);
        await selectedWallet.features["standard:connect"].connect({ silent: false });
        // Direct access to wallet features 
        const chainId = (await walletV6.requestChainId(selectedWallet)) as string;
        // or
        // const chainId = await selectedWallet.features["starknet:walletApi"].request({ type: "wallet_requestChainId" });
        console.log("chainId=", chainId);

        setConnected(true);
        setMyWallet(selectedWallet); // zustand
        const paymasterRpc = new PaymasterRpc({ nodeUrl: constants.NetworkName.SN_SEPOLIA });
        console.log("Trying to connect wallet=", selectedWallet);
        setMyWalletAccount(await WalletAccountV6.connect(myFrontendProviders[2], selectedWallet, undefined, paymasterRpc));

        console.log("WalletAccountV5 created");
        const result = await walletV6.requestAccounts(selectedWallet);
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
        const isConnectedWallet: boolean = await walletV6.getPermissions(selectedWallet).then((res: any) => (res as WALLET_API.Permission[]).includes(WALLET_API.Permission.ACCOUNTS));
        setConnected(isConnectedWallet); // zustand
        if (isConnectedWallet) {
            const chainId = (await walletV6.requestChainId(selectedWallet)) as string;
            setChain(chainId);
            setCurrentFrontendProviderIndex(chainId === SNconstants.StarknetChainId.SN_MAIN ? 0 : 2);

            console.log("change Provider index to :", myFrontendProviderIndex);
        }
        setWalletApi(await walletV6.supportedSpecs(selectedWallet));
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

    // Wallet discovery, done with the get-starknet-discovery store. A wallet reaches the page in one of three ways:
    // - a window.starknet* object, scanned once when the store is created;
    // - a wallet-standard or EIP-6963 registration, reported to store.subscribe() whenever it happens;
    // - a window.starknet* object injected after that scan, which the store does not report: see the polling below.
    // Every wallet is then tested with wallet_getPermissions and listed in the dialog as soon as the store reports it.
    useEffect(
        () => {
            const store: Store = createStore();
            const checkedWallets = new Set<WalletWithStarknetFeatures>(); // wallet objects whose compatibility check was launched
            let cancelled = false;

            const onWalletsChange = (list: readonly WalletWithStarknetFeatures[]) => {
                console.log("List of starknet wallets", list);
                setWallets(list);
                list.filter(w => !checkedWallets.has(w)).forEach(async (wallet) => {
                    checkedWallets.add(wallet);
                    const isValid = await checkCompatibility(wallet);
                    if (!cancelled) setVerdicts(prev => new Map(prev).set(wallet, isValid));
                });
            };

            onWalletsChange(store.getWallets()); // wallets already known
            const unsubscribe = store.subscribe(onWalletsChange); // wallets registering later

            // The store scans window.starknet* only once, at creation, and emits nothing when a wallet is injected later.
            // Poll the number of starknet* keys of window and ask the store to scan again when it changes.
            // (A scan re-attaches listeners on every injected wallet, so it is only done when a new key appears.)
            // _refreshInjectedWallets() carries an underscore (not documented), but it is part of the Store type of get-starknet-discovery.
            const countKeys = () => Object.getOwnPropertyNames(window).filter(key => key.startsWith("starknet")).length;
            let knownCount = countKeys(); // already scanned by createStore()
            const intervalId = setInterval(() => {
                const count = countKeys();
                if (count === knownCount) return;
                knownCount = count;
                console.log("New starknet* key detected on window, scanning again.");
                store._refreshInjectedWallets();
            }, INJECTED_WALLET_POLL_MS);

            return () => {
                cancelled = true;
                clearInterval(intervalId);
                unsubscribe();
            }
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
                                    // The store lists the newest wallet first: reverse it so that new wallets are added at the bottom and no button moves under the cursor.
                                    [...wallets].reverse().map((wallet: WalletWithStarknetFeatures, index: number) => {
                                        const isValid = verdicts.get(wallet); // undefined while the check is running
                                        const status = isValid === undefined ? " checking..." : isValid ? "" : " not compatible!";
                                        const iconW: string = wallet.icon;
                                        return <Button
                                            key={wallet.name}
                                            id={"wId" + index.toString()}
                                            variant="surface"
                                            fontSize='lg'
                                            fontWeight='bold'
                                            backgroundColor={isValid === false ? "orange" : undefined}
                                            disabled={!isValid}
                                            onClick={() => {
                                                handleSelectedWallet(wallet);
                                                onClose();
                                            }} >
                                            <Image src={iconW ? iconW : undefined} width={30} />
                                            {wallet.name + ' ' + wallet.features["starknet:walletApi"].walletVersion + status}
                                        </Button>
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
