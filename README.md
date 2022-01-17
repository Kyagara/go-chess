# go-chess

Esse projeto foi criado com o intuito de colocar Golang em prática, eu acabei decidindo trabalhar com websockets criando um jogo de xadrez, nisso, acabei descobrindo problemas como o usuário refazer uma conexão websocket assim que ele abrir uma nova aba, então decidi trabalhar com outras coisas que ainda não tinha tido experiências do zero como JWT e Shared WebWorkers.

Esse projeto é só um playground e não tem como objetivo estar em produção, não recomendo o uso dele em produção no estado atual, não existe uma versão do projeto disponível em algum site.

#### Funcionalidades

-   Singleplayer contra [stockfish.js](https://github.com/niklasf/stockfish.js/)
-   Multiplayer
-   Assistir partidas de outros jogadores

#### Todo

-   Escolher que lado começar antes de criar sala
-   Resolver problemas com o FEN saindo de sincronização durante um jogo
-   Criar um sistema de ver movimentos feitos na partida clicando no PGN da sala
-   Usar docker para facilitar deploy

## Compilando

É necessário ter `go >= 1.17` e `node >= 12` instalados, com os dois instalados você pode usar `make install`, `make build` e `make start`. O sistema de build não foi testado no Windows, recomendo usar [WSL](https://docs.microsoft.com/en-us/windows/wsl/install).

## Licensa

Este projeto está sobre a licensa GNU Affero General Public License, versão 3 ou alguma versão mais recente de sua escolha.

[stockfish.js](https://github.com/niklasf/stockfish.js/) de [niklasf](https://github.com/niklasf), localizado em `frontend/public/`: `stockfish.js, stockfish.wasm, stockfish.wasm.js`. [Licensa GPLv3](https://github.com/niklasf/stockfish.js/blob/ddugovic/Copying.txt).

[Sfxs](https://github.com/ornicar/lila/tree/master/public/sound/sfx) feitos por [Enigmahack](https://github.com/Enigmahack), localizado em `frontend/public/sounds/sfx.ogg` e obtidos no repositório [lila](https://github.com/ornicar/lila/). Os arquivos `Capture.ogg, Check.ogg, Move.ogg, LowTime.ogg, Victory.ogg, Defeat.ogg, Draw.ogg` foram transformados em um único arquivo, `sfx.ogg`. [Licensa AGPLv3](https://github.com/ornicar/lila/blob/master/COPYING.md#exceptions-free).
