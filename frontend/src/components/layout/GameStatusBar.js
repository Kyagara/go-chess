import { useRoom } from '../providers/RoomProvider'

export default function GameStatusBar({}) {
    const { game, gameStatus, players, isGameReady } = useRoom()

    const PlayerTurn = () => {
        const turn = game.turn()

        return `${players[turn]}, lado ${turn === 'w' ? 'branco' : 'preto'}`
    }

    return (
        <div className="flex flex-col gap-2 justify-center items-center text-lg">
            {isGameReady ? (
                <>
                    <span>{gameStatus}</span>

                    <span>Movimentos: {game.history().length}</span>

                    <span>
                        Turno de:{' '}
                        <span className="font-bold">
                            <PlayerTurn />
                        </span>
                    </span>

                    <span className="text-base">{game.fen()}</span>

                    <span className="text-base">{game.pgn()}</span>
                </>
            ) : (
                <span className="text-center text-xl underline">Jogo não iniciado</span>
            )}
        </div>
    )
}
