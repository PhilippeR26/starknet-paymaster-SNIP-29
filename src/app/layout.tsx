import { Provider } from "@/components/ui/provider"
import './globals.css'

export const metadata = {
  title: 'Paymaster SNIP-29',
  description: 'Demo of Starknet.js for Paymaster',
  icons: {
    icon: "./favicon.ico",
  },
}

export default function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Provider>
          {children}
        </Provider>
      </body>
    </html>
  )
}
