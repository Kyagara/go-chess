module.exports = {
    reactStrictMode: true,

    async redirects() {
        return [
            {
                source: '/room',
                destination: '/',
                permanent: true,
            },
        ]
    },
}
