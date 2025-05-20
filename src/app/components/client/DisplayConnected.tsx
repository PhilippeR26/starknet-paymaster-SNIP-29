"use client";

import { Center, Button } from "@chakra-ui/react";
import { useStoreWallet } from "./ConnectWallet/walletContext";
import SelectWallet from "./ConnectWallet/SelectWallet";
import Transfer from "./paymaster/Transfer";
import { smallAddress } from "@/app/utils/smallAddress";
import TrackBlocks from "./Block/TrackBlocks";
import CheckAccount from "./paymaster/CheckAccount";

export function DisplayConnected() {
    const {
        isConnected,
        setConnected,
        address:addressAccount,
        chain:chainId,
        displaySelectWalletUI,
        setSelectWalletUI,
    } = useStoreWallet(state => state);


    return (
        <>
            {!isConnected ? (
                <>
                    <Center>
                        <Button
                            variant="surface"
                            fontWeight='bold'
                            mt={3}
                            px={5}
                            onClick={() => setSelectWalletUI(true)}
                        >
                            Connect a Wallet
                        </Button>
                        {displaySelectWalletUI && <SelectWallet></SelectWallet>}
                    </Center>
                </>
            ) : (
                <>
                    <Center>
                        <Button
                            variant="surface"
                            fontWeight='bold'
                            mt={3}
                            px={5}
                            onClick={() => {
                                setConnected(false);
                                setSelectWalletUI(false)
                            }}
                        >
                            {addressAccount
                                ? "Your wallet : "+smallAddress(addressAccount)+" is connected"
                                : "No Account"}
                        </Button>
                    </Center>
                    <br />
                    {/* <WalletDisplay walletData={stateWallet} ></WalletDisplay>
                    <DisplayBlockChain ></DisplayBlockChain>
                    <DisplayEvents></DisplayEvents>
                    <PlayWithCairo1></PlayWithCairo1> */}
                    <TrackBlocks></TrackBlocks>
                    <CheckAccount></CheckAccount>
                </>
            )
            }
        </>
    )
}