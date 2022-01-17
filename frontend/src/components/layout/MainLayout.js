import { useRouter } from 'next/router'

import { useConnection } from '@/components/providers/ConnectionProvider'

export default function MainLayout({ title, children }) {
    const { SendCommand, wsStatus, username } = useConnection()

    const router = useRouter()

    const ConnectionStatus = () => {
        switch (wsStatus) {
            case 0:
                return <span>Conectando...</span>
            case 2:
                return <span>Falha na conexão com o websocket</span>
            case 3:
                return <span>Desconectado</span>
        }
    }

    return (
        <div className="h-screen bg-slate-300">
            <div className="flex flex-col bg-slate-600">
                <div className="flex flex-col gap-1 pb-2 text-sm font-bold items-center">
                    <div className="text-2xl text-center text-white">{title}</div>

                    {router.pathname.startsWith('/room/') && (
                        <button
                            className="text-orange-500 font-bold uppercase"
                            onClick={() =>
                                SendCommand('room', 'leave_room', { id: router.query.id })
                            }
                        >
                            Sair da sala
                        </button>
                    )}

                    {router.pathname.startsWith('/play') && (
                        <button
                            className="text-orange-500 font-bold uppercase"
                            onClick={() => (username ? router.push('/') : router.push('/login'))}
                        >
                            Sair da sala
                        </button>
                    )}

                    {wsStatus === 1 && (
                        <div className="flex gap-3 justify-center uppercase text-white">
                            <div>{username}</div>
                        </div>
                    )}
                </div>
            </div>

            {wsStatus !== 1 && (
                <div className="text-center text-lg font-bold p-2 bg-slate-500 w-full text-white">
                    <ConnectionStatus />
                </div>
            )}

            <div>{children}</div>
        </div>
    )
}
