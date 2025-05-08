import { Box, Center, HStack, RadioGroup, VStack, Text, Button, Grid, GridItem, Group, Stack } from "@chakra-ui/react";
import Image from 'next/image'
import purseLeft from "../../../public/Images/purse-wallet.svg";
import arrow from "../../../public/Images/right-arrow.svg";
import purseRight from "../../../public/Images/purse.png";
import { useStoreWallet } from "../ConnectWallet/walletContext";
import { constants, Contract, num, shortString, PaymasterRpc, type TokenData, type PaymasterFeeEstimate, type PreparedTransaction, type BigNumberish } from "starknet";
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
  const { chain, myWalletAccount } = useStoreWallet(state => state);
  const [tokenList, setTokenList] = useState<TokenData[]>([]);
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [tokenSymbol, setTokenSymbol] = useState<string[]>([]);
  const [estimatedFees, setEstimatedFees] = useState<Array<PaymasterFeeEstimate>>([]);
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

  async function sendToken(gasTokenAddress: string, maxGasToken: BigNumberish) {
    console.log("sending...");
    const res = await myWalletAccount!.execute(callSendUSDC, {
      paymaster: {
        maxEstimatedFeeInGasToken: maxGasToken,
        feeMode: { mode: "default", gasToken: gasTokenAddress }
        // feeMode:{mode:"sponsored"}
      }
    });
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

      const fees = await Promise.all(
        tokens.map(async (tokenData: TokenData): Promise<PaymasterFeeEstimate> => {
          return (
            await myWalletAccount?.paymaster.buildTransaction({
              type: 'invoke',
              invoke: {
                userAddress: myWalletAccount?.address ? myWalletAccount.address : "",
                calls: [callSendUSDC],
              }
            }, {
              version: '0x1',
              feeMode: { mode: 'default', gasToken: tokenData.address },
              // timeBounds?: PaymasterTimeBounds;
            }))!.fee;
        })
      );
      console.log("fees=", fees)

      const symbols: string[] = await Promise.all(
        tokens.map(async (tokenData: TokenData): Promise<string> => {
          const contract = new Contract(erc20Abi, tokenData.address, myWalletAccount);
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
                      >
                        <RadioGroup.ItemHiddenInput></RadioGroup.ItemHiddenInput>
                        <RadioGroup.ItemIndicator></RadioGroup.ItemIndicator>
                        <RadioGroup.ItemText
                        >
                          {buildFee(token.address, estimatedFees[index], myProviderIndex, tokenSymbol[index], token.decimals)}

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
                    onClick={async () => {
                      setTxH("");
                      setTxResult(false);
                      sendToken(
                        tokenList[Number(selectedToken!)].address,
                        estimatedFees[Number(selectedToken)].suggested_max_fee_in_gas_token);
                    }}
                  >
                    Proceed...
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