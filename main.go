package main

import (
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func main() {
	// Iniciando Echo
	e := echo.New()

	// Configurando Logger
	e.Use(middleware.LoggerWithConfig(middleware.LoggerConfig{
		Format:           "${time_custom} [${method}, ${status}] ${uri}\n",
		CustomTimeFormat: "2006/01/02 15:04:05",
	}))

	// Configurando CORS
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowCredentials: true,
		AllowOrigins:     []string{"http://localhost:3000"},
	}))

	// Criando hub e inicializando a sua goroutine
	hub := NewHub()
	go hub.Run()

	// Endpoint de login
	e.POST("/api/login", Login(hub))

	config := middleware.JWTConfig{
		Claims:      &TokenClaims{},
		SigningKey:  []byte("segredo"),
		TokenLookup: "cookie:token",
	}

	// Grupo de endpoints com middleware de autenticação
	api := e.Group("/api")
	api.Use(middleware.JWTWithConfig(config))

	// Websocket
	api.GET("/ws", WebSocketHandler(hub))

	// Salas
	room := api.Group("/room")
	room.GET("", GetRoomInfo(hub))
	room.GET("/list", GetAllRooms(hub))

	e.Logger.Fatal(e.Start(":2000"))
}
