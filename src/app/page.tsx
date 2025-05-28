"use server";

import Image from 'next/image'
import styles from './page.module.css'
import { Center } from '@chakra-ui/react';

import starknetjsImg from "./public/Images/StarkNet-JS_logo.png";
import { DisplayConnected } from './components/client/DisplayConnected';
import LowerBanner from './components/client/LowerBanner';

export default async function Page() {

    return (
            <div>
                <p className={styles.bgText}>
                    Demo SNIP-29 paymaster
                </p>
                   <Center> 
                     get-starknet v4.0.7 with starknet.js v7.4.0
                </Center>
                <Center>
                    <Image src={starknetjsImg} alt='starknet.js' width={150} />
                </Center>
                <Center>
                    Please connect to Sepolia Testnet network
                </Center>
                <div>
                    <DisplayConnected></DisplayConnected>

                </div>
                <LowerBanner></LowerBanner>
            </div >
    )
}


