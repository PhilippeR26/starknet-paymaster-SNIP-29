import { myFrontendProviders } from "@/app/utils/constants";
import type { PaymasterFeeEstimate, WalletAccount } from "starknet";
import { Contract } from "starknet";
import { erc20Abi } from "@/app/contracts/abis/ERC20abi";
import { formatBalance } from "@/app/utils/formatBalance";

/**
 * Build a string with token fee value and symbol.
 */
export function buildFee(paymasterFees: PaymasterFeeEstimate | undefined, tokenSymbol: string, tokenDecimals: number): string {
  const value = paymasterFees ? formatBalance(BigInt(paymasterFees.suggested_max_fee_in_gas_token), tokenDecimals) : "-";
  return value + " " + tokenSymbol;
}

/**
 * Build a string with STRK fee value.
 */
export function buildNativeFee(fees:bigint|undefined): string {
  const value = fees ? formatBalance(fees, 18) : "-";
  return value + " STRK (native)";
}
