"use server";

import Image from 'next/image'
import styles from './page.module.css'
import { Center, Text } from '@chakra-ui/react';

import starknetjsImg from "./public/Images/StarkNet-JS_logo.png";
import { DisplayConnected } from './components/client/DisplayConnected';
import LowerBanner from './components/client/LowerBanner';

export default async function Page() {

    return (
        <div>
            <p className={styles.bgText}>
                Demo SNIP-29 paymaster
            </p>
            <Text
                textStyle={"xl"}
                textAlign={"center"}
            >
                get-starknet v5.0.0 with starknet.js v9.1.0
            </Text>
            <Center>
                <Image
                    src={starknetjsImg}
                    alt='starknet.js'
                    width={150}
                />
            </Center>
            <Text
                textAlign={"center"}
                pt={2}
            >
                Please connect to Testnet network
            </Text>
            <div>
                <DisplayConnected></DisplayConnected>

            </div>
            <LowerBanner></LowerBanner>
        </div >
    )
}


