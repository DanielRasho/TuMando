# 🕹️ TuMando 
![Backend Integration Tests](https://github.com/DanielRasho/TuMando/actions/workflows/run-tests.yml/badge.svg)
![Image Builds](https://github.com/DanielRasho/TuMando/actions/workflows/build-images.yml/badge.svg)

A little app to control your inventary and payments as a bussiness, with a funny parody name.

## 📦 Dependencies

Before you get down to rock some code, you need these programs installed on your PC:

- Docker
- Go
- Go Air (hot reload for Go apps)
- Node
- PNPM (Node package manager)
- process-compose
- Moon (task manager)
- Postgres 17

If you don't want to install them all, this project supports [**Nix**](https://nixos.org/) for installing everything for you.

## 🚀 Getting Started

The easiest way to spin up everything is by using Docker Compose to build the required containers for the app. **Other containers were added for the deployed environment.**

```bash
docker compose up --build # Run in the root of this repo
```

The following services will be started:

| Service    | Port   | Description                  |
|------------|--------|------------------------------|
| `client`   | `8080` | Vue 3 web application        |
| `server`   | `3003` | Go WebSocket backend         |
| `postgres` | `5433` | PostgreSQL database          |