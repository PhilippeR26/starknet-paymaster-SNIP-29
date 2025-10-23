"use client";

import { useEffect, useState } from 'react';
import { Contract, shortString, validateAndParseAddress } from "starknet";

import { useStoreBlock } from "../Block/blockContext";

import { Text, Center, Spinner, } from "@chakra-ui/react";
import styles from '../../../page.module.css'

import { erc20Abi } from "../../../contracts/abis/ERC20abi"
import { useStoreWallet } from "../ConnectWallet/walletContext";import { useFrontendProvider } from '../provider/providerContext';
import { myFrontendProviders } from '@/app/utils/constants';
;

type Props = { tokenAddress: string, accountAddress: string };

export default function GetBalance({ tokenAddress, accountAddress }: Props) {
    
    // block context
    const blockFromContext = useStoreBlock(state => state.dataBlock);
    
   
    const myProviderIndex= useFrontendProvider(state=>state.currentFrontendProviderIndex);

    const [balance, setBalance] = useState<string | undefined>(undefined);
    const [decimals, setDecimals] = useState<number>(18)
    const [symbol, setSymbol] = useState<string>("");

    const myProvider=myFrontendProviders[myProviderIndex];
    const contract = new Contract({
        abi:erc20Abi,
        address: tokenAddress,
        providerOrAccount: myProvider
    });

    useEffect(() => {
        contract.call("decimals")
            .then((resp: any) => {
                console.log("resDecimals=", resp);
                setDecimals(Number(resp));
            })
            .catch((e: any) => { console.log("error getDecimals=", e) });

        contract.symbol()
            .then((resp: any) => {
                const res2 = shortString.decodeShortString(resp);
                console.log("resSymbol=", res2);
                setSymbol(res2);
            })
            .catch((e: any) => { console.log("error getSymbol=", e) });
    }
        , []);

    useEffect(() => {
        if (!accountAddress) return;
        contract.balanceOf(accountAddress)
            .then((resp: any) => {
                const res3 = Number(resp);
                console.log("res3=", resp);
                const value:number=res3 / Math.pow(10, decimals);

                setBalance(value.toFixed(7));
            }
            )
            .catch((e: any) => { console.log("error balanceOf=", e) });
    }
    , [blockFromContext.block_number, decimals, accountAddress]); // balance updated at each block

    return (
        <>
            {
                typeof balance=="undefined" ? (
                    <>
                        <Center>
                            <Spinner color="blue" size="sm" mr={4} />  Fetching data ...
                        </Center>
                    </>
                ) : (
                    <>
                        <Text className={styles.text1}>{balance} {symbol} </Text>
                    </>
                )
            }
        </>

    )
}