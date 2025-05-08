"use client";

import { useEffect, useState } from 'react';
import { json } from "starknet";
import { useStoreBlock, dataBlockInit, type DataBlock } from "./blockContext";
import GetBalance from "../Contract/GetBalance";
import { Text, Spinner, Center, Separator, Box } from "@chakra-ui/react";
import styles from '../../../page.module.css'
import * as constants from '@/app/utils/constants';
import { useFrontendProvider } from '../provider/providerContext';
import { myFrontendProviders } from '@/app/utils/constants';

export default function TrackBlocks() {

    // read block
    const blockFromContext = useStoreBlock(state => state.dataBlock);
    const setBlockData = useStoreBlock((state) => state.setBlockData);
    const [timerId, setTimerId] = useState<NodeJS.Timer | undefined>(undefined);
    //const [_, setChainId] = useState<string>("unknown");
    const myProviderIndex = useFrontendProvider(state => state.currentFrontendProviderIndex);
    const myProvider = myFrontendProviders[myProviderIndex];

    async function catchBlock() {
        if (!!myProvider) {
            const bl = await myProvider.getBlock("latest");
            const dataBlock: DataBlock = {
                block_hash: bl.block_hash,
                block_number: bl.block_number,
                timestamp: bl.timestamp,
                l1_gas_price: bl.l1_gas_price
            };
            setBlockData(dataBlock);
            //setChainId(await myProvider.getChainId());
        }
    }

    useEffect(() => {
        catchBlock()
        const tim = setInterval(() => {
            catchBlock()
            console.log("timerId=", tim);
        }
            , 10000 //ms
        );
        setTimerId(() => tim);

        console.log("startTimer", tim);

        return () => {
            clearInterval(tim);
            console.log("stopTimer", tim)
            setBlockData(dataBlockInit);
        }
    }
        , []);


    return (
        <>



        </>

    )
}