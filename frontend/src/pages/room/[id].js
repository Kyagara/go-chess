import { useEffect } from 'react'

import axios from 'axios'

import MainLayout from '@/components/layout/MainLayout'
import CheckToken from '@/components/helpers/CheckToken'
import GameBoard from '@/components/Board'
import { useConnection } from '@/components/providers/ConnectionProvider'
import { useRoom } from '@/components/providers/RoomProvider'
import GameStatusBar from '@/components/layout/GameStatusBar'

export default function RoomPage({ room }) {
    const { SendCommand, wsStatus } = useConnection()

    const { players, roomStatus, NewPVPGame } = useRoom()

    useEffect(() => {
        NewPVPGame(room)

        if (wsStatus === 1) {
            SendCommand('room', 'join_room', { id: room.id, spectate: room.spectate })
        }
    }, [wsStatus])

    return (
        <MainLayout title={`Sala: ${room.id}`}>
            <div className="flex justify-center">
                <div className="w-full p-4">
                    <GameStatusBar />
                </div>

                <div>
                    <GameBoard />
                </div>

                <div className="w-full p-4">
                    <div className="flex flex-col gap-1 justify-center items-center text-lg">
                        <button
                            className="text-orange-600 font-bold text-base uppercase"
                            onClick={() => navigator.clipboard.writeText(room.id)}
                        >
                            Copiar código da sala
                        </button>

                        <span className="text-center">{roomStatus}</span>

                        <span>{`Host: ${players['w']}`}</span>
                        <span>{players['b'] && `Oponente: ${players['b']}`}</span>
                    </div>
                </div>
            </div>
        </MainLayout>
    )
}

export async function getServerSideProps(ctx) {
    const { id } = ctx.params
    const spectate = ctx.query.spectate === 'true'

    const token = CheckToken(ctx.req.cookies.token)

    if (!token) {
        return {
            props: {},
            redirect: {
                destination: '/',
                permanent: false,
            },
        }
    }

    const response = await axios
        .get('http://localhost:2000/api/room', {
            params: { id: id },
            headers: ctx.req.headers,
        })
        .catch(() => {
            return false
        })

    if (!response) {
        return {
            props: {},
            redirect: {
                destination: '/',
                permanent: false,
            },
        }
    }

    if (!spectate) {
        response.data.spectate = false
    } else {
        response.data.spectate = true
    }

    return { props: { room: response.data } }
}
