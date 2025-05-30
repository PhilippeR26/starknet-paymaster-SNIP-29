import { myFrontendProviders } from "@/app/utils/constants";
import type { PaymasterFeeEstimate } from "starknet";
import { Contract } from "starknet";
import { erc20Abi } from "@/app/contracts/abis/ERC20abi";
import { formatBalance } from "@/app/utils/formatBalance";

export  function buildFee(tokenAddress: string, paymasterFees: PaymasterFeeEstimate|undefined, providerIndex:number, tokenSymbol:string, tokenDecimals:number): string {
    const myProvider = myFrontendProviders[providerIndex];
    const contract = new Contract(erc20Abi, tokenAddress, myProvider);
    const value = paymasterFees ? formatBalance(BigInt(paymasterFees.suggested_max_fee_in_gas_token), tokenDecimals) : "-";
    return value + " " + tokenSymbol;
  }