import { RpcProvider } from "starknet";

export const addrETH = "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";
export const addrSTRK = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";
export const addrSWAY = "0x30058f19ed447208015f6430f0102e8ab82d6c291566d7e73fe8e613c3d2ed";
export const addrUSDCtestnet = "0x053b40a647cedfca6ca84f542a0fe36736031905a9639a7f19a3c1e66bfd5080";

export const addrTEST = "0x07394cBe418Daa16e42B87Ba67372d4AB4a5dF0B05C6e554D158458Ce245BC10";
export const addrLORDtestnet = "0x019c92fa87f4d5e3bE25C3DD6a284f30282a07e87cd782f5Fd387B82c8142017";
export const addrLORDmainnet = "0x0124aeb495b947201f5faC96fD1138E326AD86195B98df6DEc9009158A533B49";
export enum CommandWallet {
    wallet_requestAccounts = "wallet_requestAccounts",
    wallet_watchAsset = "wallet_watchAsset",
    wallet_addStarknetChain = "wallet_addStarknetChain",
    wallet_switchStarknetChain = "wallet_switchStarknetChain",
    starknet_addInvokeTransaction = "starknet_addInvokeTransaction",
    starknet_addDeclareTransaction = "starknet_addDeclareTransaction",
    starknet_signTypedData = "starknet_signTypedData",
    starknet_supportedSpecs = "starknet_supportedSpecs",
    wallet_requestChainId = "wallet_requestChainId",
    wallet_getPermissions = "wallet_getPermissions",
    wallet_deploymentData = "wallet_deploymentData",
    wallet_supportedWalletApi = "wallet_supportedWalletApi",
}

// export type StarknetChainIdEntry = keyof typeof SNconstants.StarknetChainId;

export const myFrontendProviders: RpcProvider[] = [
    new RpcProvider({ nodeUrl: "https://starknet-mainnet.public.blastapi.io/rpc/v0_8" }),
    new RpcProvider({ nodeUrl: "https://starknet-testnet.public.blastapi.io/rpc/v0_8" }),
    // new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno/v0_7"}),
    new RpcProvider({ nodeUrl: "https://starknet-sepolia.public.blastapi.io/rpc/v0_8" }),
];

export const RejectContractAddress: string[] = [
    "0x541b0409e65bf546ff6c3090f4c07c53938b20c1f659250b84ce5eb66d4485e", // mainnet
    "0x00", // testnet deprecated
    "0x4d0f60ba43be97d44257a77e6123f11df89350396480af6ed0cbc81c8179592", // sepolia
];

// OpenZeppelin 0.8.1. Exists in Mainnet & Sepolia
export const accountClass = "0x061dac032f228abef9c6626f995015233097ae253a7f72d68552db02f2971b8f";

export const compatibleApiVersions: string[] = ["0.7"];

export const addrTESTCONTRACT = "0x6a109c64aefc6f0e337f8996baec2db09e209d12fd329843327a0f442e04d84"; // sepolia testnet

export const targetAccountAddress = "0x0739D69A3877Fa6E759eAa7d1024e2F9cB643D6c7f5B08FFeFcD84D3C8CbcB4E"; // sepolia testnet ArgentX