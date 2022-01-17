package main

import (
	"encoding/json"
)

func GameCommandHandler(c *Client, cmd *Message) MessageData {
	bytes, _ := json.Marshal(cmd.Data.Payload)

	var payload JSON
	json.Unmarshal(bytes, &payload)

	switch cmd.Data.Name {
	case "move":
		id := payload["id"].(string)
		san := payload["san"].(string)

		room, ok := c.Hub.Rooms[id]

		if ok {
			side := room.Game.Position().Turn().String()

			player := room.Players[side]

			// Caso o cliente não seja o jogador em questão, retornar o FEN atual
			if player.Client.Id != c.Id {
				data := MessageData{Type: "event", Topic: "game", Name: "refresh", Payload: JSON{"id": room.Id, "fen": room.Game.FEN()}}

				return data
			}

			// Caso o movimento seja inválido, retornar o FEN atual
			if err := room.Game.MoveStr(san); err != nil {
				data := MessageData{Type: "event", Topic: "game", Name: "refresh", Payload: JSON{"id": room.Id, "fen": room.Game.FEN()}}

				return data
			}

			// Obtendo último movimento
			moves := room.Game.Moves()
			lastMove := moves[len(moves)-1]

			// Caso o movimento seja válido, mandar broadcast com o FEN atual e o último movimento para todos da sala
			data := MessageData{Type: "event", Topic: "game", Name: "move", Payload: JSON{"id": room.Id, "from": lastMove.S1().String(), "to": lastMove.S2().String(), "promotion": lastMove.Promo().String(), "fen": room.Game.FEN()}}

			room.BroadcastToClients <- &Message{From: "", Data: data}

			// Comunicar ao cliente que o comando foi executado com sucesso
			return ack
		}

		// Caso a sala não seja encontrada
		data := MessageData{Type: "event", Topic: "room", Name: "not_found", Payload: JSON{"message": "Sala não encontrada"}}

		return data

	default:
		return MessageData{Type: "command", Topic: "game", Name: "not_implemented", Payload: nil}
	}
}
