package main

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt"
	"github.com/gorilla/websocket"
	"github.com/labstack/echo/v4"
)

type TokenClaims struct {
	Username string `json:"username"`
	jwt.StandardClaims
}

type LoginStruct struct {
	Username string `json:"username"`
}

type GameMatchInfo struct {
	Id      string            `json:"id"`
	Players map[string]string `json:"players"`
	Closed  bool              `json:"closed"`
	FEN     string            `json:"fen"`
	PGN     string            `json:"pgn"`
}

// Upgrader do websocket
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		origin := r.Header.Get("Origin")

		if origin == "http://localhost:3000" {
			return true
		} else {
			return false
		}
	},
}

// Obter claims do JWT
func GetJWTClaims(c echo.Context) TokenClaims {
	user := c.Get("user").(jwt.Token)
	claims := user.Claims.(TokenClaims)

	return claims
}

// Conectar ao websocket
func WebSocketHandler(h *Hub) echo.HandlerFunc {
	return func(c echo.Context) error {
		// Obtendo o nome do usuário
		claims := GetJWTClaims(c)

		// Fazendo upgrade na conexão
		connection, err := upgrader.Upgrade(c.Response(), c.Request(), nil)

		if err != nil {
			log.Println(err)

			return err
		}

		// Criando um cliente
		client := NewClient(claims.Username, h, connection)

		// Adicionando cliente no hub
		h.AddClient <- client

		// Iniciando goroutines do cliente
		go client.WritePump()
		go client.ReadPump()

		return nil
	}
}

// Obter JWT criando um cookie
func Login(h *Hub) echo.HandlerFunc {
	return func(c echo.Context) error {
		// Lendo body
		body, _ := ioutil.ReadAll(c.Request().Body)

		var login LoginStruct

		// Unmarshal do body na estrutura LoginStruct
		json.Unmarshal(body, &login)

		// Se o nome estiver vazio
		if login.Username == "" {
			return echo.ErrBadRequest
		}

		len := len(login.Username)

		// Verificar se o nome possui um tamanho aceitável de caracteres
		if len < 4 || len > 12 {
			return echo.ErrBadRequest
		}

		// Verificar se já existe um usuário com esse nome
		_, ok := h.Clients[login.Username]

		if ok {
			return echo.ErrBadRequest
		}

		// exp do JWT
		expirationTime := time.Now().Add(time.Hour * 72)

		// Criando uma estrutura com as informações necessárias
		claims := &TokenClaims{
			Username: login.Username,
			StandardClaims: jwt.StandardClaims{
				ExpiresAt: expirationTime.Unix(),
			},
		}

		// Criando um JWT com a estrutura claims
		token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

		// Usando uma key super secreta para criptografar o JWT
		signedToken, err := token.SignedString([]byte("segredo"))

		if err != nil {
			log.Println("Erro ao criar um token: ", err)

			return echo.ErrInternalServerError
		}

		// Criando um header de set-cookie
		http.SetCookie(c.Response(), &http.Cookie{
			Name:     "token",
			Value:    signedToken,
			Expires:  expirationTime,
			Path:     "/",
			Domain:   "localhost",
			SameSite: http.SameSiteLaxMode,
		})

		// Enviando o token como resposta
		return c.JSON(http.StatusOK, map[string]interface{}{
			"token": signedToken,
		})
	}
}

// Obter informações sobre uma sala
func GetRoomInfo(h *Hub) echo.HandlerFunc {
	return func(c echo.Context) error {
		// Query da URL
		query := c.Request().URL.Query()

		// Campo de ID
		id := query.Get("id")

		// Se o id estiver vázio
		if id == "" {
			return echo.ErrBadRequest
		}

		// Verificando se a sala existe
		room, ok := h.Rooms[id]

		if ok {
			players := make(map[string]string)

			for _, player := range room.Players {
				players[player.Side] = player.Client.Id
			}

			// Informações atualizadas da sala
			match := GameMatchInfo{Id: room.Id, Players: players, Closed: room.Closed, FEN: room.Game.FEN(), PGN: room.Game.String()}

			return c.JSON(http.StatusOK, match)
		}

		return c.JSON(http.StatusNotFound, map[string]bool{"room": false})
	}
}

// Obter todas as salas
func GetAllRooms(h *Hub) echo.HandlerFunc {
	return func(c echo.Context) error {
		if len(h.Rooms) == 0 {
			return c.JSON(http.StatusNotFound, map[string]bool{"rooms": false})
		}

		var rooms []GameMatchInfo

		for _, room := range h.Rooms {
			players := make(map[string]string)

			for _, player := range room.Players {
				players[player.Side] = player.Client.Id
			}

			rooms = append(rooms, GameMatchInfo{Id: room.Id, Players: players, Closed: room.Closed})
		}

		if len(rooms) == 0 {
			return c.JSON(http.StatusNotFound, map[string]bool{"rooms": false})
		}

		return c.JSON(http.StatusOK, rooms)
	}
}
