import { useState } from 'react'
import { useRouter } from 'next/router'

import axios from 'axios'

import CheckToken from '@/components/helpers/CheckToken'
import MainLayout from '@/components/layout/MainLayout'
import { useConnection } from '@/components/providers/ConnectionProvider'

export default function Homepage({ rooms }) {
    const { SendCommand } = useConnection()

    const [roomId, setRoomId] = useState('')

    const router = useRouter()

    const handleSubmit = (e) => {
        e.preventDefault()

        router.push(`/room/${roomId}?spectate=false`)
    }

    function GetRoomName(players, closed) {
        if (players.length === 2) {
            return `'${players['w']}' vs '${players['b']}'`
        }

        if (!players['b'] && !closed) {
            return `'${players['w']}' esperando oponente`
        }

        if (closed) {
            return `Sala sem jogadores`
        }
    }

    const RoomsList = () => {
        return rooms.map(({ id, players, closed }) => (
            <div
                key={id}
                className="flex flex-col bg-gray-100 rounded-lg p-2 gap-1 border-2 border-gray-300"
            >
                <span>Sala: {id}</span>

                <span className="text-gray-600">{GetRoomName(players, closed)}</span>

                <div className="flex w-full justify-end gap-2">
                    <button
                        className="text-gray-600 font-bold"
                        onClick={() => router.push(`/room/${id}?spectate=true`)}
                    >
                        Assistir
                    </button>

                    {!players[1] && !closed && (
                        <button
                            className="px-4 py-2 font-semibold text-sm bg-red-500 text-white rounded-lg shadow-sm"
                            onClick={() => router.push(`/room/${id}?spectate=false`)}
                        >
                            Jogar
                        </button>
                    )}
                </div>
            </div>
        ))
    }

    return (
        <MainLayout title="Homepage">
            <div className="flex flex-col gap-8">
                <div className="flex gap-8 mt-4 items-center justify-center">
                    <div className="flex flex-col gap-2 items-center justify-center">
                        <form
                            onSubmit={handleSubmit}
                            className="flex gap-2 items-center justify-center"
                        >
                            <input
                                required
                                type="text"
                                key="roomId"
                                placeholder="Código de sala"
                                className="p-2 bg-white border shadow-sm border-gray-300 placeholder-gray-400 focus:outline-none text-center focus:border-sky-500 focus:ring-sky-500 block rounded-md sm:text-sm focus:ring-1"
                                value={roomId}
                                onChange={(e) => setRoomId(e.target.value)}
                            />

                            <button
                                className="px-4 py-2 font-semibold text-sm bg-green-400 text-white rounded-lg shadow-sm"
                                type="submit"
                            >
                                Entrar na sala
                            </button>
                        </form>

                        <button
                            className="px-4 py-2 font-semibold text-sm bg-cyan-500 text-white rounded-lg shadow-sm"
                            onClick={() => router.push(`/room/${roomId}?spectate=true`)}
                        >
                            Entrar como espectador
                        </button>
                    </div>

                    <span> - Ou - </span>

                    <div className="flex flex-col gap-2 items-center justify-center">
                        <button
                            className="px-4 py-2 font-semibold text-sm bg-red-500 text-white rounded-lg shadow-sm"
                            onClick={() => SendCommand('room', 'create_room', null)}
                        >
                            Criar sala
                        </button>

                        <button
                            className="px-4 py-2 font-semibold text-sm bg-red-500 text-white rounded-lg shadow-sm"
                            onClick={() => router.push('/play')}
                        >
                            Jogar contra stockfish
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-4 items-center justify-center font-bold">
                    <span className="text-lg">Salas disponíveis:</span>

                    <div className="flex flex-col gap-2 w-96">
                        {rooms ? (
                            <RoomsList />
                        ) : (
                            <span className="text-center underline">Nenhuma sala encontrada</span>
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    )
}

export async function getServerSideProps(ctx) {
    const token = CheckToken(ctx.req.cookies.token)

    if (!token) {
        return {
            props: {},
            redirect: {
                destination: '/login',
                permanent: false,
            },
        }
    }

    const response = await axios
        .get('http://localhost:2000/api/room/list', {
            headers: ctx.req.headers,
        })
        .catch(() => {
            return { data: null }
        })

    return { props: { rooms: response.data } }
}
