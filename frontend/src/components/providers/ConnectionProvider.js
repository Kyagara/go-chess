import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'

import cookie from 'js-cookie'
import * as uuid from 'uuid'

import CheckToken from '../helpers/CheckToken'
import { useRoom } from './RoomProvider'

export const ConnectionContext = createContext()

export function useConnection() {
    return useContext(ConnectionContext)
}

export default function ConnectionProvider({ children }) {
    const [username, setUsername] = useState('')
    const [jwt, setJWT] = useState('')
    const [wsStatus, setWSStatus] = useState(3)
    const [tabId, setTabId] = useState('')
    const [sharedWorker, setSharedWorker] = useState(null)

    const { setPlayers, setGameReady, setRoomStatus, UpdateBoardStatus } = useRoom()

    const router = useRouter()

    function CreateSharedWorker() {
        const worker = new SharedWorker('/websocket.js')

        worker.port.onmessage = ({ data }) => {
            switch (data.type) {
                case 'WSState':
                    setWSStatus(data.state)
                    break
                case 'message':
                    HandleMessage(data.data)
                    break
            }
        }

        worker.port.start()

        setSharedWorker(worker)

        const channel = new BroadcastChannel('WebSocketChannel')

        channel.onmessage = ({ data }) => {
            switch (data.type) {
                case 'WSState':
                    setWSStatus(data.state)
                    break
                case 'message':
                    HandleMessage(data.data)
                    break
            }
        }
    }

    function HandleMessage({ data }) {
        const { type, topic, name, payload } = data

        if (name === 'not_implemented') {
            console.error(
                `${type} ${name} do tópico ${topic} não foi implementado no servidor.`,
                payload,
            )
        }

        console.log(`[${topic}, ${name}]`, payload)

        switch (topic) {
            case 'client':
                switch (name) {
                    case 'redirect':
                        router.push(payload.to)

                        break
                }

                break

            case 'room':
                switch (name) {
                    case 'new_room':
                        router.push(`/room/${payload.id}`)

                        break

                    case 'player_joined':
                        setPlayers(payload.players)

                        if (payload.players['b']) {
                            setGameReady(true)
                            setRoomStatus('Sala aberta, jogo iniciado')
                        }

                        break

                    case 'player_left':
                        setPlayers(payload.players)

                        setGameReady(false)
                        setRoomStatus(
                            'Sala fechada, o jogo foi terminado devido a falta de players',
                        )

                        break
                }

                break

            case 'game':
                switch (name) {
                    case 'move':
                        UpdateBoardStatus(payload)

                        break
                }
                break
        }
    }

    function SendCommand(topic, name, payload) {
        if (wsStatus !== 1) {
            console.error(
                `Não foi possivel executar o comando ${name} de tópico ${topic} por falta de conexão.`,
                payload,
            )

            return
        }

        sharedWorker.port.postMessage({
            from: tabId,
            data: { type: 'command', topic: topic, name: name, payload: payload },
        })
    }

    useEffect(() => {
        const token = cookie.get('token')

        if (token && !tabId) {
            if (!sharedWorker) {
                CreateSharedWorker()
            }

            const parsedToken = CheckToken(token)

            setTabId(uuid.v4())
            setUsername(parsedToken.username)
            setJWT(token)
        }
    }, [jwt])

    const value = {
        SendCommand,
        username,
        setJWT,
        wsStatus,
    }

    return <ConnectionContext.Provider value={value}>{children}</ConnectionContext.Provider>
}
