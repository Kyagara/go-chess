EXECUTABLES = go node

$(foreach exec,$(EXECUTABLES), \
	$(if $(shell which $(exec)),, \
		$(error "$(exec) não foi encontrado no PATH. É necessário go >=1.17 e node >=12.") \
	))
		
GREEN  := $(shell tput -Txterm setaf 2)
YELLOW := $(shell tput -Txterm setaf 3)
RESET  := $(shell tput -Txterm sgr0)

BUILD := $(shell git rev-parse --short HEAD)

.PHONY: build

all: help

## install: Instala todas as dependências do projeto
install:
	@echo " ${YELLOW}==> Instalando dependências da backend${RESET}"
	go get -u github.com/cosmtrek/air; go install; go mod tidy
	@echo " ${YELLOW}==> Instalando dependências da frontend${RESET}"
	cd ./frontend; yarn install
	@echo " ${YELLOW}==> Instalação finalizada${RESET}"

## build: Compila o projeto inteiro
build:
	@echo " ${YELLOW}==> Compilando backend${RESET}"
	go build -o ./build/ .	
	@echo " ${YELLOW}==> Compilando frontend${RESET}"
	cd ./frontend; yarn build
	@echo " ${YELLOW}==> Compilação finalizada${RESET}"

start-frontend: ## Iniciando a frontend
	cd ./frontend; yarn start

start-backend: ## Iniciando a backend
	cd ./build; ./chess

watch-frontend: ## Watch na frontend usando next dev
	cd ./frontend; yarn dev

watch-backend: ## Watch na backend utilizando 'air' https://github.com/cosmtrek/air
	air .

## watch: Inicia o projeto em modo dev, usando 'air' e 'next dev'
watch:
	@echo " ${YELLOW}==> Iniciando projeto em modo dev${RESET}"
	${MAKE} -j2 watch-backend watch-frontend
	
## start: Inicia o projeto caso ambos tenham uma compilação pronta
start:
	@echo " ${YELLOW}==> Iniciando projeto em modo prod${RESET}"
	${MAKE} -j2 start-backend start-frontend

help: Makefile
	@echo '  ${YELLOW}== Chess - ${BUILD} ==${RESET}'
	@echo ''
	@echo 'Como usar:'
	@echo '  ${YELLOW}make${RESET} ${GREEN}<comando>${RESET}'
	@echo ''
	@echo 'Comandos disponíveis:'
	@sed -n 's/^##//p' $< | column -t -s ':' |  sed -e 's/^/ /'