import { useState } from 'react'

import { Chessboard } from 'react-chessboard'

import { useRoom } from './providers/RoomProvider'
import { useConnection } from './providers/ConnectionProvider'

export default function GameBoard({ GenerateMove }) {
    const { SendCommand, username } = useConnection()

    const { game, setGame, players, roomId, isGameReady, UpdateGameStatus } = useRoom()

    const [moveFrom, setMoveFrom] = useState('')
    const [moveSquares, setMoveSquares] = useState({})
    const [optionSquares, setOptionSquares] = useState({})

    function getMoveOptions(square) {
        const moves = game.moves({
            square,
            verbose: true,
        })

        if (moves.length === 0) return

        const newSquares = {}

        moves.map((move) => {
            newSquares[move.to] = {
                background:
                    game.get(move.to) && game.get(move.to).color !== game.get(square).color
                        ? 'radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)'
                        : 'radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)',
                borderRadius: '50%',
            }

            return move
        })

        newSquares[square] = {
            background: 'rgba(255, 255, 0, 0.4)',
        }

        setOptionSquares(newSquares)
    }

    function onSquareClick(square) {
        if (game.game_over() || !isGameReady) return

        const turn = game.turn()

        if (players[turn] !== username) return

        function resetFirstMove(square) {
            setMoveFrom(square)
            getMoveOptions(square)
        }

        if (!moveFrom) {
            resetFirstMove(square)

            return
        }

        const gameCopy = { ...game }

        const move = gameCopy.move({
            from: moveFrom,
            to: square,
            promotion: 'q',
        })

        setGame(gameCopy)

        if (move === null) {
            resetFirstMove(square)

            return
        }

        setMoveFrom('')
        setOptionSquares({})

        if (roomId === 'Stockfish') {
            UpdateGameStatus(gameCopy)

            GenerateMove(move)
            return
        }

        SendCommand('game', 'move', {
            id: roomId,
            san: move.san,
        })
    }

    return (
        <Chessboard
            position={game.fen()}
            animationDuration={200}
            arePiecesDraggable={false}
            areArrowsAllowed={false}
            boardOrientation={players['w'] === username ? 'white' : 'black'}
            customSquareStyles={{
                ...moveSquares,
                ...optionSquares,
            }}
            onSquareClick={onSquareClick}
        />
    )
}
