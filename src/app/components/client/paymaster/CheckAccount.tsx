import { constants, OutsideExecutionVersion, shortString, type Call } from "starknet";
import { useStoreWallet } from "../ConnectWallet/walletContext";
import { useEffect, useState } from "react";
import Transfer from "./Transfer";
import { Center, Spinner, Text } from "@chakra-ui/react";
import DeployAccount from "./DeployAccount";
import { useGlobalContext } from "@/app/globalContext";


export default function CheckAccount() {
    const { chain, myWalletAccount, StarknetWalletObject } = useStoreWallet(state => state);
    const [isDeployed, setIsDeployed] = useState<boolean>(false);
    const [isSNIP9, setIsSNIP9] = useState<boolean>(false);
    const [isProcessing, setProcessing] = useState<boolean>(true);
    const { transferRequested, setTransferRequested } = useGlobalContext(state => state);

    const isValidNetwork = chain === constants.StarknetChainId.SN_SEPOLIA ? true : false;




    // is account deployed and SNIP-9?
    useEffect(() => {
        const getAccountStatus = async () => {
            //     const tokens: TokenData[] = (await myWalletAccount!.paymaster.getSupportedTokens()) as TokenData[];
            //     console.log("tokens =", tokens);
            //     // Quick & dirty way to check if the account is deployed, we make a call to the contract, if it's not deployed, it will throw an error

            let _isDeployed: boolean = false;
            try {
                const myCall: Call = {
                    contractAddress: myWalletAccount?.address!,
                    entrypoint: "get_public_key",
                    calldata: []
                };
                const res = await myWalletAccount?.callContract(myCall);
                console.log("get_public_key =", res);
                _isDeployed = true;
            } catch {
                _isDeployed = false;
                console.log("Account not deployed");
            }
            //  console.log("getSnip9Version",await myWalletAccount?.getSnip9Version());
            const _isSnip9 = await myWalletAccount?.getSnip9Version() !== OutsideExecutionVersion.UNSUPPORTED;
            console.log("isDeployed =", _isDeployed, "; isSnip9 =", _isSnip9);
            setIsDeployed(_isDeployed);
            setIsSNIP9(_isSnip9);
            setProcessing(false);
            //     console.log("isSnip9=", _isSnip9);
            //     let fees: (PaymasterFeeEstimate | undefined)[] = [];
            //     // if (_isDeployed) {
            //       fees = await Promise.all(
            //         tokens.map(async (tokenData: TokenData): Promise<PaymasterFeeEstimate | undefined> => {
            //           return (
            //             await myWalletAccount?.estimatePaymasterTransactionFee([callSendUSDC], {
            //               feeMode: { mode: 'default', gasToken: tokenData.token_address },
            //             }).catch((e) => {
            //               // New error is thrown here -> "execution error Not enough balance for gas token" 
            //               console.log(e)
            //               return undefined;
            //             })
            //           );
            //         })
            //       );
            // } else {
            //   const deploymentData = await StarknetWalletObject?.request({ type: "wallet_deploymentData" });
            //   if (!deploymentData) {
            //     console.log("No deployment data found");
            //     return;
            //   }
            //   console.log("deploymentData=", deploymentData);
            //   fees = await Promise.all(
            //     tokens.map(async (tokenData: TokenData): Promise<PaymasterFeeEstimate | undefined> => {
            //       return (
            //         (myWalletAccount?.estimatePaymasterTransactionFee([], {
            //           deploymentData: {
            //             ...deploymentData,
            //             // TODO: here there is an error if not hex, this sigdata is only used in Braavos wallet
            //             sigdata: deploymentData.sigdata?.map((sig: any) => sig.startsWith("0x") ? sig : `0x${sig}`),
            //             // TODO: Will probably be removed
            //             version: deploymentData.version as 1,
            //           },
            //           feeMode: { mode: 'default', gasToken: tokenData.token_address },
            //         }).catch((e) => {
            //           // New error is thrown here -> "execution error Not enough balance for gas token" 
            //           console.log(e)
            //           return undefined;
            //         })));
            //     })
            //   );
            // }
            //     console.log("fees=", fees);

            //     const symbols: string[] = await Promise.all(
            //       tokens.map(async (tokenData: TokenData): Promise<string> => {
            //         const contract = new Contract(erc20Abi, tokenData.token_address, myWalletAccount);
            //         return (
            //           shortString.decodeShortString(await contract.symbol())
            //         )
            //       })
            //     );
            //     console.log("symbol=", symbols)
            //     setTokenSymbols(symbols);
            //     setEstimatedFees(fees);
            //     setTokenList(tokens);
        };
        getAccountStatus();
    },
        []
    );

    return (
        <>

            {!isValidNetwork ? (
                <Center>
                    <p style={{ color: "red" }}>
                        Please connect to Sepolia Testnet network
                    </p>
                </Center>
            ) : (<>
                {isProcessing ? (
                    <Center>
                        <Spinner size="xl" color="blue.solid" />
                    </Center >
                ) : (
                    isDeployed ? (
                        isSNIP9 ? (
                            <>
                                <Center>
                                    Network selected : {shortString.decodeShortString(chain)}
                                </Center>
                                <Transfer></Transfer>
                            </>
                        ) : (


                            < Center fontSize='lg' color='red.500'>
                                Account is deployed but is not SNIP-9!
                            </Center >
                        )
                    ) : (
                        transferRequested ? (
                            <>
                                <Center>
                                    Network selected : {shortString.decodeShortString(chain)}
                                </Center>
                                <Transfer></Transfer>
                            </>
                        ) : (
                            <>
                                <Center fontSize='lg' color='red.500'>
                                    Account is not deployed!
                                </Center>
                                <DeployAccount></DeployAccount>
                            </>
                        )


                    )
                )

                }
            </>)
            }
        </>
    );
}