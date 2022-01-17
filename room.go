package main

import (
	"encoding/json"
	"log"

	"github.com/lucsky/cuid"
	"github.com/notnil/chess"
)

// Sala de clientes conectada ao hub
type Room struct {
	// Id da sala, um CUID
	Id string
	// Se a sala estiver fechada, o valor será verdadeiro
	Closed bool
	// Jogo 'notnil/chess'
	Game *chess.Game
	// Jogadores da sala
	Players map[string]*Player
	// Clientes na sala
	Clients map[string]*Client
	// Adicionar um cliente na sala
	AddClient chan *Client
	// Adicionar um jogador na sala
	AddPlayer chan *Client
	// Remover um cliente da sala
	RemoveClient chan *Client
	// Enviar mensagem para todos os clientes de uma sala
	BroadcastToClients chan *Message
}

type Player struct {
	// O lado do jogador, 'w' para Branco e 'b' para Preto
	Side string
	// Client do jogador
	Client *Client
}

func NewRoom() *Room {
	return &Room{
		Id:                 cuid.Slug(),
		Closed:             false,
		Game:               chess.NewGame(chess.UseNotation(chess.AlgebraicNotation{})),
		Players:            make(map[string]*Player),
		Clients:            make(map[string]*Client),
		AddClient:          make(chan *Client),
		AddPlayer:          make(chan *Client),
		RemoveClient:       make(chan *Client),
		BroadcastToClients: make(chan *Message, 256),
	}
}

func (r *Room) Run() {
	for {
		select {
		case client := <-r.AddClient:
			r.RegisterClient(client)

		case client := <-r.AddPlayer:
			r.RegisterPlayer(client)

		case client := <-r.RemoveClient:
			r.UnregisterClient(client)

		case message := <-r.BroadcastToClients:
			r.Broadcast(message)
		}
	}
}

func (r *Room) RegisterClient(c *Client) {
	log.Printf("Cliente '%v' registrado na sala '%v'", c.Id, r.Id)

	// Adicionando o cliente na sala
	r.Clients[c.Id] = c
	c.Rooms[r.Id] = r

	data := MessageData{Type: "event", Topic: "room", Name: "client_joined", Payload: JSON{"id": r.Id, "client": c.Id}}

	// Dar Broadcast com o cliente que acabou de conectar na sala
	r.BroadcastToClients <- &Message{From: "", Data: data}
}

func (r *Room) RegisterPlayer(c *Client) {
	var side string

	if len(r.Players) == 0 {
		side = "w"
	} else {
		side = "b"
	}

	// Criando jogador com o lado dele
	player := &Player{
		Side:   side,
		Client: c,
	}

	log.Printf("Jogador '%v' registrado na sala '%v'", c.Id, r.Id)

	r.Clients[c.Id] = c
	c.Rooms[r.Id] = r
	r.Players[side] = player

	// Criando lista de jogadores
	players := make(map[string]string)

	for _, player := range r.Players {
		players[player.Side] = player.Client.Id
	}

	data := MessageData{Type: "event", Topic: "room", Name: "player_joined", Payload: JSON{"id": r.Id, "players": players}}

	// Enviar um Broadcast com a lista atualizada de jogadores
	r.BroadcastToClients <- &Message{From: "", Data: data}
}

func (r *Room) UnregisterClient(c *Client) {
	if r.Clients[c.Id] != nil {
		var player *Player

		// Verificando se ele é um jogador
		for _, p := range r.Players {
			if p.Client.Id == c.Id {
				player = p
				break
			}
		}

		var data MessageData

		// Se ele for um jogador
		if player != nil {
			delete(r.Players, player.Side)

			r.Closed = true

			players := make(map[string]string)

			for _, player := range r.Players {
				players[player.Side] = player.Client.Id
			}

			log.Printf("Jogador '%v' saiu, terminando jogo na sala '%v' por falta de jogadores", c.Id, r.Id)

			data = MessageData{Type: "event", Topic: "room", Name: "player_left", Payload: JSON{"id": r.Id, "players": players}}
		} else {
			log.Printf("Cliente '%v' removido da sala '%v'", c.Id, r.Id)

			data = MessageData{Type: "event", Topic: "room", Name: "client_left", Payload: JSON{"id": r.Id, "client": c.Id}}
		}

		// Removendo cliente
		delete(r.Clients, c.Id)
		delete(c.Rooms, r.Id)

		r.BroadcastToClients <- &Message{From: "", Data: data}

		// Caso a sala não tenha mais nenhum cliente
		if len(r.Clients) == 0 {
			c.Hub.RemoveRoom <- r
		}
	}
}

// Broadcast em uma mensagem para todos os clientes conectados na sala. Usando Message para certificar que o json terá um campo 'data'
func (r *Room) Broadcast(msg *Message) {
	j, err := json.Marshal(msg)

	if err != nil {
		log.Printf("Erro '%v' ao validar mensagem de Broadcast: %v", msg, err)

		return
	}

	// Enviando a mensagem para todos os clientes
	for _, client := range r.Clients {
		client.Send <- j
	}
}
