import { erc20Abi } from "@/app/contracts/abis/ERC20abi";
import type { DataForFeesList, EstimatePaymasterFeesResponse, TokenDataNecessary } from "@/app/type/types";
import { useEffect, useRef, useState } from "react";
import { type TokenData, Contract, shortString, type PaymasterFeeEstimate } from "starknet";
import { useStoreWallet } from "../ConnectWallet/walletContext";
import { Box, Button, Center, Group, HStack, RadioGroup, Spinner, Stack, VStack, Text } from "@chakra-ui/react";
import { useGlobalContext } from "@/app/globalContext";
import type { addrSTRK, addrETH, addrUSDCtestnet, addrSWAY, targetAccountAddress } from "@/app/utils/constants";
import type { smallAddress } from "@/app/utils/smallAddress";
import GetBalance from "../Contract/GetBalance";
import TransactionStatus from "../Transaction/TransactionStatus";
import { buildFee } from "./buildFee";
import { useFrontendProvider } from "../provider/providerContext";

export default function DeployAccount() {
  const { chain, myWalletAccount, StarknetWalletObject } = useStoreWallet(state => state);
  const [answersFees, setAnswersFees] = useState<DataForFeesList[]>([]);
  const [isFeesAvailable, setFeesAvailable] = useState<boolean>(false);
  const { txResult, setTxResult } = useGlobalContext(state => state);
  const { transferRequested, setTransferRequested } = useGlobalContext(state => state);
  const [txH, setTxH] = useState<string>("");
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const scrollRef = useRef<null | HTMLDivElement>(null);
  const myProviderIndex = useFrontendProvider(state => state.currentFrontendProviderIndex);

  async function paymasterDeployAccount(gasTokenAddress: string) {
    console.log("deploying...");
    const deploymentData = await StarknetWalletObject?.request({ type: "wallet_deploymentData" });
    if (!deploymentData) {
      console.log("No deployment data found");
      return;
    }
    // const res = await myWalletAccount?.executePaymasterTransaction([], {
    //   deploymentData: {
    //     ...deploymentData,
    //     sigdata: deploymentData.sigdata?.map((sig: any) => sig.startsWith("0x") ? sig : `0x${sig}`),
    //     version: deploymentData.version as 1,
    //   },
    //   feeMode: { mode: 'default', gasToken: gasTokenAddress },
    // });
    // if (!res) {
    //   console.log("Error deploying account");
    //   return;
    // }
    console.log("Sent.");
    // console.log("res=", res);
    // setTxH(res.transaction_hash);
  }

  useEffect(() => {
    const getTokenList = async () => {
      const tokens: TokenData[] = (await myWalletAccount!.paymaster.getSupportedTokens()) as TokenData[];
      console.log("tokens =", tokens);
      const deploymentData = await StarknetWalletObject?.request({ type: "wallet_deploymentData" });
      if (!deploymentData) {
        console.log("No deployment data found");
        return;
      }

      const fees: EstimatePaymasterFeesResponse[] = await Promise.all(
        tokens.map(
          async (tokenData: TokenData): Promise<EstimatePaymasterFeesResponse> => {

            try {
              const build = await myWalletAccount?.estimatePaymasterTransactionFee([], {
                deploymentData: {
                  ...deploymentData,
                  sigdata: deploymentData.sigdata?.map((sig: any) => sig.startsWith("0x") ? sig : `0x${sig}`),
                  version: deploymentData.version as 1,
                },
                feeMode: { mode: 'default', gasToken: tokenData.token_address },
              })
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

  // 
  // always see bottom of DAPP
  useEffect(() => {
    console.log("scroll1....");
    scroll();
  },
    [txResult, selectedToken])



  return (<>
    <Box ref={scrollRef}>

      <Center>
        <Group
          pb={3}
          pt={2}
          bg={"lightslategray"}
          borderRadius={10}
          mt={8}
          mb={2}
        >

          <Box w={200}  >
            <Center>
              <Text textDecoration={"underline"} fontSize={16} fontWeight={"bold"}>
                Choose fees:<br></br>
              </Text>
            </Center>
            {isFeesAvailable ? (<>
              <RadioGroup.Root
                defaultValue={"0"}
                value={selectedToken}
                onValueChange={(e) => setSelectedToken(e.value)}
                colorPalette={"black"}
                size={"sm"}
              >
                <Stack>
                  {answersFees.map((token: DataForFeesList, index: number) => (
                    <RadioGroup.Item
                      key={index}
                      value={index.toString()}
                      pl={5}
                    >
                      <RadioGroup.ItemHiddenInput></RadioGroup.ItemHiddenInput>
                      <RadioGroup.ItemIndicator></RadioGroup.ItemIndicator>
                      <RadioGroup.ItemText
                      >
                        {buildFee(token.tokenData.address, token.feeData, myProviderIndex, token.tokenData.symbol, token.tokenData.decimals)}

                      </RadioGroup.ItemText>
                    </RadioGroup.Item>
                  ))}
                </Stack>
              </RadioGroup.Root>
            </>
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
                  paymasterDeployAccount(
                    answersFees[Number(selectedToken!)].tokenData.address);
                }}
              >
                Deploy account...
              </Button>
            </Center>
          </Box>

        </Group>

      </Center>
      {txH !== "" ?
        (
          <>
            <TransactionStatus transactionHash={txH}></TransactionStatus>
            <Button
              variant="surface"
              fontWeight='bold'
              mt={3}
              px={5}
              onClick={
                () => {
                  setTransferRequested(true);
                }
              }
            >
              Prepare Transfer...
            </Button>
          </>
        ) : (
          <Text><br></br>
            <br></br>
            <br></br></Text>
        )
      }
    </Box>
  </>)
}
