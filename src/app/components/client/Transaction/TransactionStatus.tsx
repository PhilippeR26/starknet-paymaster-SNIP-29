import { useEffect, useState } from 'react';
import { GetTransactionReceiptResponse, json, type RevertedTransactionReceiptResponse, type SuccessfulTransactionReceiptResponse } from "starknet";

import { useStoreBlock } from "../Block/blockContext";

import { Box, Spinner, Text } from "@chakra-ui/react";
import styles from '../../../page.module.css'
import { useFrontendProvider } from '../provider/providerContext';
import { myFrontendProviders } from '@/app/utils/constants';
import { useGlobalContext } from '@/app/globalContext';

type Props = { transactionHash: string };
const waiting: string = "waiting data";
const ErrorMessage: string = "ERROR: REJECTED";

export default function TransactionStatus({ transactionHash }: Props) {
    // wallet context
    const myProviderIndex = useFrontendProvider(state => state.currentFrontendProviderIndex);
    const myProvider = myFrontendProviders[myProviderIndex];

    // block context
    const blockFromContext = useStoreBlock(state => state.dataBlock);
    const setTxResult = useGlobalContext(state => state.setTxResult);

    // global context
    const { isReadyToTransfer, setIsReadyToTransfer } = useGlobalContext(state => state);

    // component context
    
    const [txStatus, setTxStatus] = useState<string>(waiting);

    useEffect(() => {
        myProvider?.waitForTransaction(transactionHash)
            .then((txR: GetTransactionReceiptResponse) => {
                console.log("TxStatus =", txR.statusReceipt);
                let finality: string = "";
                txR.match({
                    SUCCEEDED: (txR: SuccessfulTransactionReceiptResponse) => {
                        setTxResult(true);
                        finality = txR.finality_status;
                    },
                    REVERTED: (txR: RevertedTransactionReceiptResponse) => {
                        setTxResult(true);
                        finality = txR.finality_status;
                    },
                    ERROR: (err: Error) => {
                        setTxResult(true);
                        finality = err.message;
                    },
                    _: () => {
                        setTxResult(true);
                        console.log('Unsuccess');
                    },
                });
                console.log("TxFinality =", finality);
                setTxStatus(txR.statusReceipt + " " + finality);
                setIsReadyToTransfer(true);
            })
            .catch((e: any) => {
                setTxStatus(ErrorMessage);
                setTxResult(true);
                console.log("error getTransactionStatus=", e)
            });
        return () => { }
    }
        , [blockFromContext.block_number]
    );

    // useEffect(() => {
    //     setTxResult(true);
    // },
    //     []
    // );

    return (
        <>
            <Box
                bg={txStatus === ErrorMessage ? "hotpink" : 'green.300'}
                color='black'
                borderWidth='1px'
                borderColor='green.800'
                borderRadius='md'
                p={1} ml={2} mr={2} mb={2}
                className={styles.text1}>
                Transaction is : {" "}
                {txStatus === waiting ?
                    (<Spinner color="blue" size="sm" mr={4} />)
                    : txStatus}
            </Box>
            <Text><br></br>
                <br></br>
                <br></br></Text>
        </>
    )
}