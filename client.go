package main

import (
	"bytes"
	"encoding/json"
	"log"
	"time"

	"github.com/gorilla/websocket"
)

// Estrutura que representa um usuário conectado ao hub
type Client struct {
	// Nome de usuário
	Id string
	// Hub do Client
	Hub *Hub
	// Conexão de websocket do cliente
	Conn *websocket.Conn
	// Channel de mensagens do cliente
	Send chan []byte
	// Salas que o cliente está conectado
	Rooms map[string]*Room
}

const (
	// Tempo permitido para escrever uma mensagem
	writeWait = 10 * time.Second
	// Tempo permitido para ler o proximo 'pong'
	pongWait = 60 * time.Second
	// Periodo usado para enviar pings
	pingPeriod = 55 * time.Second
	// Tamanho máximo de uma mensagem permitido
	maxMessageSize = 1024
)

var (
	newline = []byte{'\n'}
	space   = []byte{' '}
)

var (
	ack = MessageData{Type: "event", Topic: "client", Name: "ack", Payload: JSON{"ok": true}}
)

func NewClient(username string, hub *Hub, conn *websocket.Conn) *Client {
	return &Client{
		Id:    username,
		Hub:   hub,
		Conn:  conn,
		Send:  make(chan []byte, 256),
		Rooms: map[string]*Room{},
	}
}

// Goroutine feita para cada conexão, responsável por enviar mensagens do websocket para o hub
func (c *Client) ReadPump() {
	defer func() {
		c.Hub.RemoveClient <- c
		c.Conn.Close()
	}()

	c.Conn.SetReadLimit(maxMessageSize)

	c.Conn.SetReadDeadline(time.Now().Add(pongWait))

	c.Conn.SetPongHandler(func(string) error { c.Conn.SetReadDeadline(time.Now().Add(pongWait)); return nil })

	for {
		_, message, err := c.Conn.ReadMessage()

		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Println(err)
			}
			break
		}

		message = bytes.TrimSpace(bytes.Replace(message, newline, space, -1))

		c.Send <- message
	}
}

// Goroutine feita para cada conexão, responsável por enviar mensagens do hub para o websocket
func (c *Client) WritePump() {
	ticker := time.NewTicker(pingPeriod)

	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))

			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.Conn.NextWriter(websocket.TextMessage)

			if err != nil {
				return
			}

			// Validando a array de bytes recebida
			msg := ParseMessage(message)

			// Verificando se a mensagem é um comando, se for, criar uma nova mensagem para enviar para a conexão
			if msg.Data.Type == "command" {
				var data MessageData

				switch msg.Data.Topic {
				case "room":
					data = RoomCommandHandler(c, msg)

				case "game":
					data = GameCommandHandler(c, msg)

				default:
					// Se o tipo da mensagem não for suportado, enviar um mensagem erro
					data = MessageData{Type: msg.Data.Type, Topic: msg.Data.Topic, Name: "not_implemented", Payload: msg.Data.Payload}
				}

				newMessage := Message{From: msg.From, Data: data}
				payload, err := json.Marshal(newMessage)

				if err != nil {
					log.Printf("Erro '%v' ao validar payload: %v", err, newMessage)
					return
				}

				w.Write(payload)
			} else {
				// Se a mensagem não for um 'command' e sim um 'event', apenas enviar ela
				w.Write(message)
			}

			n := len(c.Send)

			for i := 0; i < n; i++ {
				w.Write(newline)
				w.Write(<-c.Send)
			}

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))

			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
