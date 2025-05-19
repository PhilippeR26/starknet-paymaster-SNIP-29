import { Box, Center, HStack, RadioGroup, VStack, Text, Button, Grid, GridItem, Group, Stack } from "@chakra-ui/react";
import Image from 'next/image'
import purseLeft from "../../../public/Images/purse-wallet.svg";
import arrow from "../../../public/Images/right-arrow.svg";
import purseRight from "../../../public/Images/purse.png";
import { useStoreWallet } from "../ConnectWallet/walletContext";
import { constants, Contract, num, shortString, PaymasterRpc, type TokenData, type PaymasterFeeEstimate, type PreparedTransaction, type BigNumberish, OutsideExecutionVersion } from "starknet";
import { smallAddress } from "@/app/utils/smallAddress";
import { addrETH, addrSTRK, addrSWAY, addrUSDCtestnet, targetAccountAddress } from "@/app/utils/constants";
import GetBalance from "../Contract/GetBalance";
import { useEffect, useRef, useState } from "react";
import { erc20Abi } from "../../../contracts/abis/ERC20abi"
import { useFrontendProvider } from "../provider/providerContext";
import { buildFee } from "./buildFee";
import TransactionStatus from "../Transaction/TransactionStatus";
import { useGlobalContext } from "@/app/globalContext";


export default function Transfer() {
  const { chain, myWalletAccount, StarknetWalletObject } = useStoreWallet(state => state);
  const [tokenList, setTokenList] = useState<TokenData[]>([]);
  const [isDeployed, setIsDeployed] = useState<boolean>(false);
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [tokenSymbol, setTokenSymbol] = useState<string[]>([]);
  const [estimatedFees, setEstimatedFees] = useState<(PaymasterFeeEstimate | undefined)[]>([]);
  const [usdcFees, setUsdcFees] = useState<PaymasterFeeEstimate | undefined>(undefined);
  const [ethFees, setEthFees] = useState<PaymasterFeeEstimate | undefined>(undefined);
  const myProviderIndex = useFrontendProvider(state => state.currentFrontendProviderIndex);
  const { txResult, setTxResult } = useGlobalContext(state => state);
  const [txH, setTxH] = useState<string>("");
  const scrollRef = useRef<null | HTMLDivElement>(null);


  const isValidNetwork = chain === constants.StarknetChainId.SN_SEPOLIA ? true : false;

  const erc20contract = new Contract(erc20Abi, addrUSDCtestnet, myWalletAccount);
  const callSendUSDC = erc20contract.populate("transfer",
    {
      recipient: targetAccountAddress,
      amount: 1n * 10n ** 5n,
    });

  async function sendToken(gasTokenAddress: string) {
    console.log("sending...");
    const res = await myWalletAccount!.execute(callSendUSDC, {
      paymaster: {
        feeMode: { mode: "default", gasToken: gasTokenAddress }
        // feeMode:{mode:"sponsored"}
      }
    });
    console.log("Sent.");
    console.log("res=", res);
    setTxH(res.transaction_hash);
  }

  async function deployAccount(gasTokenAddress: string){
    console.log("deploying...");
    const deploymentData = await StarknetWalletObject?.request({ type: "wallet_deploymentData" });
    if(!deploymentData){
      console.log("No deployment data found");
      return;
    }
    const res = await myWalletAccount?.executePaymasterTransaction([], {
      deploymentData: {
        ...deploymentData,
        sigdata: deploymentData.sigdata?.map((sig: any) => sig.startsWith("0x") ? sig : `0x${sig}`),
        version: deploymentData.version as 1,
      },
      feeMode: { mode: 'default', gasToken: gasTokenAddress },
    });
    if(!res) {
      console.log("Error deploying account");
      return;
    }
    console.log("Sent.");
    console.log("res=", res);
    setTxH(res.transaction_hash);
  }

  function scroll() {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView(
        {
          behavior: 'smooth',
          block: 'end',
          inline: 'nearest'
        })
    }
  }

  // get list of fee tokens
  useEffect(() => {
    const getTokenList = async () => {
      const tokens: TokenData[] = (await myWalletAccount!.paymaster.getSupportedTokens()) as TokenData[];
      console.log("tokens =", tokens);
      // Quick & dirty way to check if the account is deployed, we make a call to the contract, if it's not deployed, it will throw an error
      const _isDeployed = await myWalletAccount?.getSnip9Version() !== OutsideExecutionVersion.UNSUPPORTED;
      setIsDeployed(_isDeployed);
      let fees: (PaymasterFeeEstimate | undefined)[] = [];
      if(_isDeployed){
        fees = await Promise.all(
          tokens.map(async (tokenData: TokenData): Promise<PaymasterFeeEstimate | undefined> => {
            return (
              await myWalletAccount?.estimatePaymasterTransactionFee([callSendUSDC], {
                feeMode: { mode: 'default', gasToken: tokenData.token_address },
              }).catch((e) =>  {
                // New error is thrown here -> "execution error Not enough balance for gas token" 
                console.log(e)
                return undefined;
              })
            );
          })
        );
      }else{
        const deploymentData = await StarknetWalletObject?.request({ type: "wallet_deploymentData" });
        if(!deploymentData){
          console.log("No deployment data found");
          return;
        }
        console.log("deploymentData=", deploymentData);
        fees = await Promise.all(
          tokens.map(async (tokenData: TokenData): Promise<PaymasterFeeEstimate | undefined> => {
            return (
               (myWalletAccount?.estimatePaymasterTransactionFee([], {
                deploymentData: {
                  ...deploymentData,
                  // TODO: here there is an error if not hex, this sigdata is only used in Braavos wallet
                  sigdata: deploymentData.sigdata?.map((sig: any) => sig.startsWith("0x") ? sig : `0x${sig}`),
                  // TODO: Will probably be removed
                  version: deploymentData.version as 1,
                },
                feeMode: { mode: 'default', gasToken: tokenData.token_address },
              }).catch((e) =>  {
                // New error is thrown here -> "execution error Not enough balance for gas token" 
                console.log(e)
                return undefined;
              })));
          })
        );
      }
      console.log("fees=", fees);

      const symbols: string[] = await Promise.all(
        tokens.map(async (tokenData: TokenData): Promise<string> => {
          const contract = new Contract(erc20Abi, tokenData.token_address, myWalletAccount);
          return (
            shortString.decodeShortString(await contract.symbol())
          )
        })
      );
      console.log("symbol=", symbols)
      setTokenSymbol(symbols);
      setEstimatedFees(fees);
      setTokenList(tokens);
    };
    getTokenList();
  },
    []
  );

  // always see bottom of DAPP
  useEffect(() => {
    console.log("scroll1....");
    scroll();
  },
    [txResult, selectedToken])


  return (
    <>
      <Center>
        Network selected : {shortString.decodeShortString(chain)}
      </Center>
      <Center>
        {!isValidNetwork &&
          <p style={{ color: "red" }}>
            Please connect to Sepolia Testnet network
          </p>
        }
      </Center>
      {isValidNetwork &&
        <Box ref={scrollRef}>
          <Center>
            <HStack>
              <VStack>
                <Image src={purseLeft} alt='Source' width={150} />
                <Center fontWeight={"bold"}>
                  Addr:{smallAddress(myWalletAccount?.address)}
                </Center>
                <VStack>
                  <GetBalance tokenAddress={addrSTRK} accountAddress={myWalletAccount?.address ? myWalletAccount.address : ""}>
                  </GetBalance>
                  <GetBalance tokenAddress={addrETH} accountAddress={myWalletAccount?.address ? myWalletAccount.address : ""}></GetBalance>
                  <GetBalance tokenAddress={addrUSDCtestnet} accountAddress={myWalletAccount?.address ? myWalletAccount.address : ""}></GetBalance>
                  <GetBalance tokenAddress={addrSWAY} accountAddress={myWalletAccount?.address ? myWalletAccount.address : ""}></GetBalance>

                </VStack>
              </VStack>
              <Center w={200}>
                <Image src={arrow} alt='To' width={150} />
              </Center>
              <VStack>
                <Image src={purseRight} alt='Destination' width={150} />
                <Center fontWeight={"bold"}>
                  Addr:{smallAddress(targetAccountAddress)} <br></br>
                </Center>
                <VStack>
                  <GetBalance tokenAddress={addrSTRK} accountAddress={targetAccountAddress}>
                  </GetBalance>
                  <GetBalance tokenAddress={addrETH} accountAddress={targetAccountAddress}></GetBalance>
                  <GetBalance tokenAddress={addrUSDCtestnet} accountAddress={targetAccountAddress}></GetBalance>
                  <GetBalance tokenAddress={addrSWAY} accountAddress={targetAccountAddress}></GetBalance>
                </VStack>
              </VStack>
            </HStack>
          </Center>
          <Center>
            <Group
              pb={3}
              pt={2}
              bg={"lightslategray"}
              borderRadius={10}
              mt={8}
              mb={2}
            >
              <Center w={150} fontWeight={"bold"} fontSize={16}>
                Send 0.1 USDC
              </Center>
              <Box w={200}  >
                <Center>
                  <Text textDecoration={"underline"} fontSize={16} fontWeight={"bold"}>
                    Choose fees:<br></br>
                  </Text>
                </Center>
                <RadioGroup.Root
                  defaultValue={"0"}
                  value={selectedToken}
                  onValueChange={(e) => setSelectedToken(e.value)}
                  colorPalette={"black"}
                  size={"sm"}
                >
                  <Stack>
                    {tokenList.map((token: TokenData, index: number) => (
                      <RadioGroup.Item
                        key={index}
                        value={index.toString()}
                        disabled={!estimatedFees[index]}
                      >
                        <RadioGroup.ItemHiddenInput></RadioGroup.ItemHiddenInput>
                        <RadioGroup.ItemIndicator></RadioGroup.ItemIndicator>
                        <RadioGroup.ItemText
                        >
                          {buildFee(token.token_address, estimatedFees[index], myProviderIndex, tokenSymbol[index], token.decimals)}

                        </RadioGroup.ItemText>
                      </RadioGroup.Item>
                    ))}
                  </Stack>
                </RadioGroup.Root>
                <Center>
                  <Button
                    variant="surface"
                    fontWeight='bold'
                    mt={3}
                    px={5}
                    hidden={selectedToken === null}
                    disabled={estimatedFees[Number(selectedToken)] === undefined}
                    onClick={async () => {
                      setTxH("");
                      setTxResult(false);
                      if(isDeployed){
                        if(estimatedFees[Number(selectedToken)] !== undefined){
                          sendToken(
                            tokenList[Number(selectedToken!)].token_address);
                        }
                      }else{
                        deployAccount(
                          tokenList[Number(selectedToken!)].token_address);
                      }
                    }}
                  >
                    {isDeployed ? "Send..." : "Deploy..."}
                  </Button>
                </Center>
              </Box>
              <Center w={150} fontWeight={"bold"} fontSize={16}>
                Receive 0.1 USDC
              </Center>
            </Group>

          </Center>
          {txH !== "" ?
            (
              <TransactionStatus transactionHash={txH}></TransactionStatus>
            ) : (
              <Text><br></br>
                <br></br>
                <br></br></Text>
            )
          }

        </Box>
      }
    </>
  )
}