import { useState } from 'react'
import { useRouter } from 'next/router'

import axios from 'axios'

import CheckToken from '@/components/helpers/CheckToken'
import MainLayout from '@/components/layout/MainLayout'
import { useConnection } from '@/components/providers/ConnectionProvider'

export default function IndexPage() {
    const { setJWT } = useConnection()

    const [username, setUsername] = useState('')

    const router = useRouter()

    const handleSubmit = (e) => {
        e.preventDefault()

        const body = { username: e.target[0].value }

        axios
            .post('http://localhost:2000/api/login', body, {
                withCredentials: true,
            })
            .then(({ data }) => {
                setJWT(data.token)

                router.push('/')
            })
            .catch((err) => {
                console.error(`Ocorreu um erro ao fazer o pedido de login: ${err}`)
            })
    }

    return (
        <MainLayout title="Login">
            <form
                onSubmit={handleSubmit}
                className="flex gap-2 mt-4 flex-col items-center justify-center"
            >
                <input
                    required
                    type="text"
                    key="username"
                    placeholder="Nome de usuário"
                    className="p-2 bg-white border shadow-sm border-gray-300 placeholder-gray-400 focus:outline-none text-center focus:border-sky-500 focus:ring-sky-500 block rounded-md sm:text-sm focus:ring-1"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />

                <button
                    className="px-4 py-2 font-semibold text-sm bg-cyan-500 text-white rounded-lg shadow-sm"
                    type="submit"
                >
                    Entrar
                </button>
            </form>
        </MainLayout>
    )
}

export async function getServerSideProps(ctx) {
    const token = CheckToken(ctx.req.cookies.token)

    if (token) {
        return {
            props: {},
            redirect: {
                destination: '/',
                permanent: false,
            },
        }
    }

    return { props: {} }
}
