import { Box, Center, HStack, RadioGroup, VStack, Text, Button, Grid, GridItem, Group, Stack, Spinner } from "@chakra-ui/react";
import Image from 'next/image'
import purseLeft from "../../../public/Images/purse-wallet.svg";
import arrow from "../../../public/Images/right-arrow.svg";
import purseRight from "../../../public/Images/purse.png";
import { useStoreWallet } from "../ConnectWallet/walletContext";
import { constants, Contract, num, shortString, PaymasterRpc, type TokenData, type PaymasterFeeEstimate, type PreparedTransaction, type BigNumberish, OutsideExecutionVersion, type Call } from "starknet";
import { smallAddress } from "@/app/utils/smallAddress";
import { addrETH, addrSTRK, addrSWAY, addrUSDCtestnet, targetAccountAddress } from "@/app/utils/constants";
import GetBalance from "../Contract/GetBalance";
import { useEffect, useRef, useState } from "react";
import { erc20Abi } from "../../../contracts/abis/ERC20abi"
import { useFrontendProvider } from "../provider/providerContext";
import { buildFee, buildNativeFee } from "./buildFee";
import TransactionStatus from "../Transaction/TransactionStatus";
import { useGlobalContext } from "@/app/globalContext";
import type { DataForFeesList, EstimatePaymasterFeesResponse, TokenDataNecessary } from "@/app/type/types";


export default function Transfer() {
  const UsdcAmount = 1n * 10n ** 5n;

  const { chain, myWalletAccount, StarknetWalletObject } = useStoreWallet(state => state);
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [nativeFees, setNativeFees] = useState<string>("-");
  const [answersFees, setAnswersFees] = useState<DataForFeesList[]>([]);
  const myProviderIndex = useFrontendProvider(state => state.currentFrontendProviderIndex);
  const [isFeesAvailable, setFeesAvailable] = useState<boolean>(false);
  const { txResult, setTxResult } = useGlobalContext(state => state);
  const [txH, setTxH] = useState<string>("");
  const scrollRef = useRef<null | HTMLDivElement>(null);
  const [isAccountFunded, setIsAccountFunded] = useState<boolean>(false);


  const UsdcContract = new Contract(erc20Abi, addrUSDCtestnet, myWalletAccount);
  const callSendUSDC = UsdcContract.populate("transfer",
    {
      recipient: targetAccountAddress,
      amount: UsdcAmount,
    });

  async function sendToken(tokenNumber: string) {
    console.log("sending...");
    // native STRK fees
    if (tokenNumber === "0") {
      const res = await myWalletAccount!.execute([callSendUSDC]);
      console.log("Sent with native fees.");
      console.log("res=", res);
      setTxH(res.transaction_hash);
    } else {
      // SNIP-29 tx
      const gasTokenAddress = answersFees[Number(selectedToken!) - 1].tokenData.address

      const res = await myWalletAccount!.executePaymasterTransaction([callSendUSDC],
        {
          feeMode: { mode: 'default', gasToken: gasTokenAddress },
        });
      console.log("Sent with paymaster.");
      console.log("res=", res);
      setTxH(res.transaction_hash);
    }
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

  // get fees for a native transaction
  useEffect(() => {
    const getNativeFees = async () => {
      const nativeFees = await myWalletAccount?.estimateInvokeFee(callSendUSDC);
      console.log("nativeFees =", nativeFees);
      setNativeFees(buildNativeFee(nativeFees?.suggestedMaxFee));
    }
    getNativeFees();
  }
    , [myWalletAccount]
  );

  // get list of fee tokens
  useEffect(() => {
    const getTokenList = async () => {
      const tokens: TokenData[] = (await myWalletAccount!.paymaster.getSupportedTokens()) as TokenData[];
      console.log("tokens =", tokens);

      const fees: EstimatePaymasterFeesResponse[] = await Promise.all(
        tokens.map(
          async (tokenData: TokenData): Promise<EstimatePaymasterFeesResponse> => {

            try {
              const build = (await myWalletAccount?.paymaster.buildTransaction({
                type: 'invoke',
                invoke: {
                  userAddress: myWalletAccount?.address ? myWalletAccount.address : "",
                  calls: [callSendUSDC],
                }
              }, {
                version: '0x1',
                feeMode: { mode: 'default', gasToken: tokenData.token_address },
                // timeBounds?: PaymasterTimeBounds;
              }))!.fee;
              return build;

            } catch {
              // not enough of this token to pay fees
              return undefined;
            }
          }
        )
      );

      console.log("fees=", fees)

      const symbols: string[] = await Promise.all(
        tokens.map(
          async (tokenData: TokenData): Promise<string> => {

            const contract = new Contract(erc20Abi, tokenData.token_address, myWalletAccount);

            return (
              shortString.decodeShortString(await contract.symbol())
            )
          }
        )
      );
      console.log("symbol=", symbols);
      const answersFees: { feeData: PaymasterFeeEstimate, tokenData: TokenDataNecessary }[] = fees.map(
        (fee: EstimatePaymasterFeesResponse, index: number) => {
          if (fee === undefined) {
            return undefined;
          }


          return {
            feeData: fee,
            tokenData: {
              symbol: symbols[index],
              address: tokens[index].token_address,
              decimals: tokens[index].decimals
            }
          }
        }
      ).filter((fee) => fee !== undefined); // remove tokens that can't be used to pay fees
      console.log("answersFees=", answersFees);
      setAnswersFees(answersFees);
      setFeesAvailable(true);

      console.log("symbol=", symbols)
      // setTokenSymbols(symbols);
      // setEstimatedFees(fees);
      // setTokenList(tokens);
    };
    getTokenList();
  }
    , []
  );

  // account needs at least 0.1 USDC for the transfer
  useEffect(() => {
    const checkFunded = async () => {
      UsdcContract.balanceOf(myWalletAccount?.address)
        .then((resp: any) => {
          const result = BigInt(resp);
          if (resp >= UsdcAmount) {
            console.log("account is funded");
            setIsAccountFunded(true);
          }
        }
        )
        .catch((e: any) => { console.log("error balanceOf=", e) });
    };
    checkFunded();
  }
    , []
  );

  // 
  // always see bottom of DAPP
  useEffect(() => {
    console.log("scroll1....");
    scroll();
  },
    [txResult, selectedToken])


  return (
    <>
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
        {isAccountFunded ? (
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
                {isFeesAvailable ? (
                  answersFees.length > 0 ? (
                    <>
                      <RadioGroup.Root
                        defaultValue={"0"}
                        value={selectedToken}
                        onValueChange={(e) => setSelectedToken(e.value)}
                        colorPalette={"black"}
                        size={"sm"}
                      >
                        <Stack>
                          <RadioGroup.Item
                            key={0}
                            value={"0"}
                            pl={5}
                          >
                            <RadioGroup.ItemHiddenInput></RadioGroup.ItemHiddenInput>
                            <RadioGroup.ItemIndicator></RadioGroup.ItemIndicator>
                            <RadioGroup.ItemText
                            >
                              {
                                nativeFees
                              }

                            </RadioGroup.ItemText>
                          </RadioGroup.Item>
                          {answersFees.map((token: DataForFeesList, index: number) => (
                            <RadioGroup.Item
                              key={index + 1}
                              value={(index + 1).toString()}
                              pl={5}
                            >
                              <RadioGroup.ItemHiddenInput></RadioGroup.ItemHiddenInput>
                              <RadioGroup.ItemIndicator></RadioGroup.ItemIndicator>
                              <RadioGroup.ItemText
                              >
                                {buildFee(token.feeData, token.tokenData.symbol, token.tokenData.decimals)}

                              </RadioGroup.ItemText>
                            </RadioGroup.Item>
                          ))}
                        </Stack>
                      </RadioGroup.Root>
                    </>
                  ) : (
                    <Center fontSize='lg' color='orange'>
                      No fee token available
                    </Center>
                  )
                ) : (
                  <>
                    <Center>
                      <Spinner size="xl" color="blue.solid" />
                    </Center>
                  </>
                )
                }
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
                      sendToken(selectedToken!
                      );
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
        ) : (
          <Center fontSize='lg' color='red.500' pt={6}>
            Account needs to be funded with at least 0.1 USDC
          </Center>
        )
        }
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
    </>
  )
}