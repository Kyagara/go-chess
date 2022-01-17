import NextNProgress from 'nextjs-progressbar'

import '@/styles/globals.css'

import ConnectionProvider from '@/components/providers/ConnectionProvider'
import RoomProvider from '@/components/providers/RoomProvider'

export default function ChessApp({ Component, pageProps }) {
    return (
        <RoomProvider>
            <ConnectionProvider>
                <NextNProgress color="#F91031" stopDelayMs={50} />

                <Component {...pageProps} />
            </ConnectionProvider>
        </RoomProvider>
    )
}
