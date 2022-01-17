package main

import (
	"encoding/json"
)

func RoomCommandHandler(c *Client, cmd *Message) MessageData {
	bytes, _ := json.Marshal(cmd.Data.Payload)

	var payload JSON
	json.Unmarshal(bytes, &payload)

	switch cmd.Data.Name {
	case "create_room":
		// Criando sala
		room := NewRoom()

		// Iniciando goroutine da sala
		go room.Run()

		// Adicionando ela no hub
		c.Hub.AddRoom <- room

		// Adicionando o cliente como um jogador
		room.AddPlayer <- c

		return MessageData{Type: "event", Topic: "room", Name: "new_room", Payload: JSON{"id": room.Id}}

	case "join_room":
		id := payload["id"].(string)
		spectate := payload["spectate"].(bool)

		room, ok := c.Hub.Rooms[id]

		if ok {
			// Verificar se o cliente já é um jogador, se for, apenas retornar um ack
			for _, player := range room.Players {
				if player.Client.Id == c.Id {
					return ack
				}
			}

			// Adicionar apenas um cliente
			if spectate || room.Closed || len(room.Players) > 1 {
				room.AddClient <- c

				return ack
			}

			room.AddPlayer <- c

			return ack
		}

		return MessageData{Type: "event", Topic: "room", Name: "not_found", Payload: JSON{"message": "Sala não encontrada"}}

	case "leave_room":
		id := payload["id"].(string)

		room, ok := c.Rooms[id]

		if ok {
			room.RemoveClient <- c
		}

		return MessageData{Type: "event", Topic: "client", Name: "redirect", Payload: JSON{"to": "/"}}

	default:
		return MessageData{Type: "command", Topic: "room", Name: "not_implemented", Payload: nil}
	}
}
