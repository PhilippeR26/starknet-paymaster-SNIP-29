import { Box } from "@chakra-ui/react"
import styles from '../../../page.module.css'
import { CairoBytes31 } from "starknet"

export interface StateWallet {
    addressAccount:string,
    chainId:string,
    isConnected:boolean
}

interface WalletProps {
    walletData: StateWallet
}
export default  function WalletDisplay( {walletData}:WalletProps) {
   return (
       <>
       <Box bg='pink.200' color='black' borderWidth='1px' borderRadius='md'>
           <p className={styles.text1}>
           
               address = {walletData.addressAccount} <br />
               chain = {new CairoBytes31(walletData.chainId).decodeUtf8()} <br /> 
               isConnected={walletData.isConnected ? "Yes" : "No"}<br />
           </p>
       </Box>
       </>
   )
}