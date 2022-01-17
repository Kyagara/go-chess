import { createContext, useContext, useRef, useState } from 'react'

import { Howl } from 'howler'
import * as ChessJS from 'chess.js'

export const RoomContext = createContext()

export function useRoom() {
    return useContext(RoomContext)
}

export default function RoomProvider({ children }) {
    const Chess = typeof ChessJS === 'function' ? ChessJS : ChessJS.Chess

    // Jogo
    const [game, setGame] = useState(new Chess())
    const [gameStatus, setGameStatus] = useState('')

    // Sala
    const [roomId, setRoomId] = useState('')
    const [players, setPlayers] = useState({})
    const [roomStatus, setRoomStatus] = useState('')
    const [isGameReady, setGameReady] = useState(false)

    // Usando sons feitos por https://github.com/Enigmahack
    const sounds = useRef(
        new Howl({
            src: ['/sounds/sfx.ogg'],
            sprite: {
                move: [0, 216.2358276643991],
                capture: [2000, 396.1904761904762],
                check: [4000, 552.9251700680273],
                lowTime: [6000, 518.0952380952384],
                victory: [8000, 1873.5600907029486],
                defeat: [11000, 857.6870748299327],
                draw: [13000, 802.5396825396829],
            },
        }),
    )

    function NewPVPGame(room) {
        SafeGameMutate((game) => {
            game.load_pgn(room.pgn)
        })

        setRoomId(room.id)

        setPlayers(room.players)

        if (room.closed && room.players.length !== 2) {
            setRoomStatus('Sala fechada, jogo terminado por falta de jogadores')
            return
        }

        // Todo: sistema de escolher que lado começar, no momento o lado branco é o primeiro por padrão
        if (!room.players[1]) {
            setRoomStatus('Aguardando oponente')
        } else {
            setRoomStatus('Sala aberta, jogo iniciado')
            setGameStatus('Branco para se mover')
            setGameReady(true)
        }
    }

    function SafeGameMutate(modify) {
        setGame((g) => {
            const update = { ...g }
            modify(update)
            return update
        })
    }

    function UpdateBoardStatus(newMove) {
        // Caso o novo fen seja igual ao fen local, apenas atualizar o status
        if (game.fen() === newMove.fen) {
            UpdateGameStatus(game)

            return
        }

        // O movimento recebido do servidor sempre é feito no jogo do cliente, forçando que o 'game' do cliente esteja sempre atualizado
        SafeGameMutate((game) => {
            game.move({
                from: newMove.from,
                to: newMove.to,
                promotion: 'q',
            })
        })

        // Caso o fen atual de 'game' não seja igual ao fen do servidor, carregar a board com o novo fen
        // Caso essa função seja executada, o cliente terá o pgn do jogo quebrado, mostrando apenas movimentos depois dessa atualização
        if (game.fen() !== newMove.fen) {
            SafeGameMutate((game) => {
                game.load(newMove.fen)
            })

            setGame(game)

            UpdateGameStatus(game)

            return
        }

        setGame(game)

        UpdateGameStatus(game)
    }

    function UpdateGameStatus(game) {
        const turn = game.turn()
        const color = turn === 'w' ? 'Branco' : 'Preto'
        const history = game.history({ verbose: true })
        const lastMove = history[history.length - 1]

        if (game.in_checkmate()) {
            setGameStatus(`${color} em checkmate`)
            sounds.current.play(turn === color ? 'victory' : 'defeat')
        } else if (game.in_stalemate()) {
            setGameStatus(`${color} em stalemate`)
            sounds.current.play(turn === color ? 'victory' : 'defeat')
        } else if (game.in_check()) {
            setGameStatus(`${color} para se mover, ${color} está em check`)
            sounds.current.play('check')
        } else if (game.in_draw()) {
            setGameStatus('Empate')
            sounds.current.play('draw')
        } else if (lastMove.captured) {
            setGameStatus(`${color} para se mover`)
            sounds.current.play('capture')
        } else {
            setGameStatus(`${color} para se mover`)
            sounds.current.play('move')
        }
    }

    const value = {
        // Jogo
        game,
        setGame,
        gameStatus,
        setGameStatus,
        sounds,

        // Sala
        roomId,
        setRoomId,
        players,
        setPlayers,
        roomStatus,
        setRoomStatus,
        isGameReady,
        setGameReady,

        //Funções
        NewPVPGame,
        UpdateBoardStatus,
        UpdateGameStatus,
        SafeGameMutate,
    }

    return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>
}
