import jwt from 'jsonwebtoken'

export default function CheckToken(rawToken) {
    if (!rawToken) return null

    try {
        jwt.verify(rawToken, 'segredo')
    } catch (err) {
        console.error('Erro ao verificar JWT', err)
        return null
    }

    const token = jwt.decode(rawToken)

    if (!token || !token.username) return null

    return token
}
