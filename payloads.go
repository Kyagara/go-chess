package main

import (
	"encoding/json"
	"log"
)

type Message struct {
	// De qual aba esta vindo essa mensagem, vazio se não houver aba
	From string `json:"from,omitempty"`
	// Dados da mensagem, possui o tipo, nome e o payload da mensagem
	Data MessageData `json:"data"`
}

type MessageData struct {
	// Tipo da mensagem, 'event' ou 'command'
	Type string `json:"type"`
	// Tópico da mensagem, 'room', 'game'
	Topic string `json:"topic"`
	// Nome do evento ou comando
	Name string `json:"name"`
	// Payload da mensagem, map[string]interface{}
	Payload JSON `json:"payload"`
}

// Objeto json com key do tipo string
type JSON map[string]interface{}

// Valida e retorna uma mensagem
func ParseMessage(msg []byte) *Message {
	var message *Message

	err := json.Unmarshal(msg, &message)

	if err != nil {
		log.Println("Erro ao validar uma mensagem: ", err)
	}

	return message
}
