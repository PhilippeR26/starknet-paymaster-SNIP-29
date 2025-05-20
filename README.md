# starknet-paymaster-SNIP-29
Starknet demo DAPP of paymaster SNIP-29 fee payment


> [!IMPORTANT]
> Stars are appreciated!

## Presentation

This small project demonstrates how to create a DAPP to use SNIP-29 paymaster.  
It allows you to use several tokens to pay the Starknet fees: STRK, ETH, USDC, SWAY. 

> [!NOTE]
> For example, if you have some USDC and no STRK in your wallet, you can anyway proceed a transfer, using some of these USDC to pay the fees.
> 
> Use an account in Sepolia Testnet network.

> [!IMPORTANT]
> In this demo, you need at least 0.1 USDC in your account to be able to execute a transfer.  
> To get USDC in testnet, one way is to connect a Testnet account to: https://app.ekubo.org/?outputCurrency=USDC&amount=1&inputCurrency=STRK

Analyze the code to see how to create a such DAPP (start [here](src/app/page.tsx))  

The DAPP is made in the Next.js framework. Coded in Typescript. Using React, Zustand context & Chakra-ui components.

## Getting Started 🚀

Run the development server:

```bash
npm i
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.  

## Deploy on Vercel 🎊

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

> You can test this DAPP ; it's already deployed at [https://xxx.vercel.app/](https://xxx.vercel.app/).

If you fork this repo, you need a Vercel account. You can configure your own environment variables for the Server side :  
![](./Images/vercelEnv.png)