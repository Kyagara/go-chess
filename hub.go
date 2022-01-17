package main

import (
	"log"
)

// Estrutura que representa uma sala principal onde todos os clientes conectados no websockets são encontrados
type Hub struct {
	// Clientes registrados no hub
	Clients map[string]*Client
	// Salas registradas no hub
	Rooms map[string]*Room
	// Adicionar um cliente no hub
	AddClient chan *Client
	// Remover um cliente do hub
	RemoveClient chan *Client
	// Adicionar uma sala no hub
	AddRoom chan *Room
	// Remover uma sala do hub
	RemoveRoom chan *Room
}

func NewHub() *Hub {
	return &Hub{
		Clients:      make(map[string]*Client),
		Rooms:        make(map[string]*Room),
		AddClient:    make(chan *Client),
		RemoveClient: make(chan *Client),
		AddRoom:      make(chan *Room),
		RemoveRoom:   make(chan *Room),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.AddClient:
			h.RegisterClient(client)

		case client := <-h.RemoveClient:
			h.UnregisterClient(client)

		case room := <-h.AddRoom:
			h.RegisterRoom(room)

		case room := <-h.RemoveRoom:
			h.UnregisterRoom(room)
		}
	}
}

func (h *Hub) RegisterClient(c *Client) {
	log.Printf("Cliente '%v' registrado no hub", c.Id)

	// Adicionando cliente no mapa de clientes do hub
	h.Clients[c.Id] = c
}

func (h *Hub) UnregisterClient(c *Client) {
	if h.Clients[c.Id] != nil {
		len := len(c.Rooms)

		// Se o cliente estiver em alguma sala, remover ele
		if len > 0 {
			for _, r := range c.Rooms {
				r.RemoveClient <- c
			}
		}

		log.Printf("Cliente '%v' removido do hub", c.Id)

		// Fechando o canal de send do cliente e deleta o cliente do mapa de clientes no hub
		close(c.Send)
		delete(h.Clients, c.Id)
	}
}

func (h *Hub) RegisterRoom(r *Room) {
	log.Printf("Sala '%v' criada", r.Id)

	// Adicionando a sala no mapa de salas do hub
	h.Rooms[r.Id] = r
}

func (h *Hub) UnregisterRoom(r *Room) {
	if h.Rooms[r.Id] != nil {
		// Se a sala tiver clientes, remover eles
		for _, c := range r.Clients {
			r.RemoveClient <- c
		}

		log.Printf("Sala '%v' removida", r.Id)

		// Fechando o canal de broadcast da sala e deleta a sala do mapa de salas no hub
		close(r.BroadcastToClients)
		delete(h.Rooms, r.Id)
	}
}
