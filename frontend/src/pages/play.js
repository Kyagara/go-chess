import { useEffect, useState } from 'react'

import MainLayout from '@/components/layout/MainLayout'
import GameBoard from '@/components/Board'
import { useConnection } from '@/components/providers/ConnectionProvider'
import { useRoom } from '@/components/providers/RoomProvider'
import Sleep from '@/components/helpers/Sleep'
import GameStatusBar from '@/components/layout/GameStatusBar'

export default function RoomPage({}) {
    const { username } = useConnection()

    const {
        game,
        isGameReady,
        setGameReady,
        setRoomStatus,
        players,
        setPlayers,
        setRoomId,
        setGameStatus,
        UpdateGameStatus,
        SafeGameMutate,
    } = useRoom()

    const [stockfish, setStockfish] = useState(null)
    const [difficulty, setDifficulty] = useState(10)

    useEffect(() => {
        SafeGameMutate((game) => {
            game.reset()
        })

        if (!stockfish) {
            const wasmSupported =
                typeof WebAssembly === 'object' &&
                WebAssembly.validate(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00))

            console.log(
                wasmSupported
                    ? 'WebAssembly suportado, usando stockfish.wasm.js'
                    : 'Não há suporte para WebAssembly, usando stockfish.js',
            )

            console.log('Iniciando worker com Stockfish')

            // Usando stockfish.js https://github.com/niklasf/stockfish.js
            const s = new Worker(wasmSupported ? 'stockfish.wasm.js' : 'stockfish.js')

            s.onerror = (e) => {
                console.error('Ocorreu um erro no worker do Stockfish', e)
            }

            s.onmessage = async ({ data }) => {
                console.log(data)

                const match = data.match(/^bestmove ([a-h][1-8])([a-h][1-8])([qrbn])?/)

                if (match) {
                    await Sleep(500)

                    SafeGameMutate((game) => {
                        game.move({ from: match[1], to: match[2] })
                    })

                    UpdateGameStatus(game)
                }
            }

            setStockfish(s)
        }
    }, [])

    function SendUCI(cmd) {
        stockfish.postMessage(cmd)
    }

    function StartMatch() {
        if (!stockfish) {
            console.error('Stockfish não foi iniciado')

            return
        }

        SafeGameMutate((game) => {
            game.reset()
        })

        setPlayers({ w: !username ? 'Anônimo' : username, b: 'Bacalhau' })

        SendUCI('uci')
        SendUCI('ucinewgame')
        SendUCI(`setoption name Skill Level value ${difficulty}`)

        setRoomStatus('Sala aberta, jogo iniciado')
        setGameStatus('Branco para se mover')

        setRoomId('Stockfish')

        setGameReady(true)
    }

    function GenerateMove() {
        const history = game.history({ verbose: true })

        const moves = []
        for (var i = 0; i < history.length; ++i) {
            const move = history[i]

            moves.push(`${move.from}${move.to}${move.promotion ? move.promotion : ''}`)
        }

        SendUCI(`position startpos moves ${moves.join(' ')}`)

        SendUCI('go depth 10 movetime 1000')
    }

    return (
        <MainLayout title={'Sala: Stockfish'}>
            <div className="flex justify-center">
                <div className="w-full p-4">
                    <GameStatusBar />
                </div>

                <div>
                    <GameBoard GenerateMove={GenerateMove} />
                </div>

                <div className="w-full p-4">
                    <div className="flex flex-col gap-2 justify-center items-center text-xl">
                        <span>{players['w'] && `Host: ${players['w']}`}</span>

                        <span>{players['b'] && `Oponente: ${players['b']}`}</span>

                        <div className="flex gap-2">
                            <span>Dificuldade:</span>

                            <select
                                className="px-2 rounded-lg shadow-sm"
                                name="difficulty"
                                value={difficulty}
                                onChange={(e) => setDifficulty(parseInt(e.target.value))}
                            >
                                {[...Array(21).keys()].map((lvl) => (
                                    <option key={lvl} value={lvl}>
                                        {lvl}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            className="px-4 py-2 font-semibold text-sm bg-red-500 text-white rounded-lg shadow-sm"
                            onClick={() => StartMatch()}
                        >
                            {!isGameReady ? 'Iniciar jogo' : 'Reiniciar jogo'}
                        </button>
                    </div>
                </div>
            </div>
        </MainLayout>
    )
}
