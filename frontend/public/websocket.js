// Baseado em https://ayushgp.xyz/scaling-websockets-using-sharedworkers/

// Criar um BroadcastChannel para notificar todas as abas do WSState do websocket
const channel = new BroadcastChannel('WebSocketChannel')

// Mapeando as ports geradas pelo worker usando os uuids gerados
const connectedPorts = {}

const websocket = new WebSocket('ws://localhost:2000/api/ws')

// Iniciando conexão websocket

// Notificar todas as abas sobre o WSState do websocket usando o BroadcastChannel
websocket.onopen = () => channel.postMessage({ type: 'WSState', state: 1 })
websocket.onerror = () => channel.postMessage({ type: 'WSState', state: 2 })
websocket.onclose = () => channel.postMessage({ type: 'WSState', state: 3 })

// Recebendo mensagem do servidor
websocket.onmessage = ({ data }) => {
    const messages = data.split('\n')

    messages.forEach((msg) => {
        const parsedData = { data: JSON.parse(msg), type: 'message' }

        if (!parsedData.data.from) {
            // Enviar a mensagem recebida para o BroadcastChannel, enviando para todas as abas conectadas
            channel.postMessage(parsedData)
        } else {
            // Enviar a mensagem para uma aba específica usando o uuid da mensagem do servidor
            connectedPorts[parsedData.data.from].postMessage(parsedData)
        }
    })
}

// Evento utilizado quando uma aba tenta conectar ao worker
onconnect = ({ ports }) => {
    // Recendo a port do evento, a port será o canal de comunicação entre a aba e o SharedWorker
    const port = ports[0]

    port.onmessage = ({ data }) => {
        // Salvando a port no mapa
        connectedPorts[data.from] = port

        // Enviando comando para o websocket
        websocket.send(JSON.stringify(data))
    }

    // Notificando a aba atual do WSState do websocket
    port.postMessage({ state: websocket.readyState, type: 'WSState' })
}
