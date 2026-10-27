# Docker Commands: Beginner's Practical Guide

Use this as a reference, not a memorization list. Docker commands follow a few patterns; replace the example names with your own.

## The basic mental model

```text
Dockerfile / image  ->  container  ->  running application
                         |
                         +-- volume: keeps data after the container is removed
                         +-- network: lets containers communicate
```

- **Image**: a packaged template for software.
- **Container**: a running (or stopped) instance of an image.
- **Volume**: storage managed by Docker, often used to keep database files.
- **Compose**: a YAML file describing an app's containers and how to run them.
- **Service**: a named entry in `compose.yaml`; in this project the database service is `db`.

## Start with these commands

Run these from the directory containing `compose.yaml`.

| Command | What it does |
|---|---|
| `docker --version` | Shows the installed Docker CLI version. |
| `docker info` | Shows whether Docker Engine is running and its configuration. |
| `docker compose config` | Checks and displays the resolved Compose configuration. |
| `docker compose up -d` | Creates and starts the services in the background. |
| `docker compose ps` | Shows this project's services and whether they are running. |
| `docker compose logs -f` | Streams logs from all services; press `Ctrl+C` to stop watching. |
| `docker compose logs -f db` | Streams only the database service logs. |
| `docker compose stop` | Stops services but keeps their containers and data. |
| `docker compose start` | Starts previously stopped services. |
| `docker compose restart db` | Restarts only the `db` service. |
| `docker compose down` | Stops and removes this project's containers and network. Its named volume remains. |

### This project's PostgreSQL container

The Compose service is `db`, the container is `resolveiq_db`, and the database is `resolveiq`.

Open a PostgreSQL prompt inside the container:

```bash
docker compose exec db psql -U resolveiq -d resolveiq
```

At the `psql` prompt, try:

```sql
\dt                         -- list tables
SELECT id FROM tickets;     -- list ticket IDs
\q                          -- exit psql
```

Run a one-off SQL query without opening the prompt:

```bash
docker compose exec db psql -U resolveiq -d resolveiq -c "SELECT id FROM tickets;"
```

The equivalent command using the explicit container name is:

```bash
docker exec -it resolveiq_db psql -U resolveiq -d resolveiq
```

Prefer `docker compose exec db ...` while in the project: it uses the service name from `compose.yaml`.

## Containers

| Command | What it does |
|---|---|
| `docker ps` | Lists running containers. |
| `docker ps -a` | Lists running and stopped containers. |
| `docker start <container>` | Starts an existing stopped container. |
| `docker stop <container>` | Gracefully stops a running container. |
| `docker restart <container>` | Restarts a container. |
| `docker logs <container>` | Prints the container's logs. |
| `docker logs -f <container>` | Follows new log lines as they arrive. |
| `docker exec -it <container> sh` | Opens a shell inside a running container (if `sh` exists). |
| `docker inspect <container>` | Shows detailed container configuration and state. |
| `docker stats` | Shows live CPU and memory usage for running containers. |
| `docker cp <container>:/path/in/container ./local-file` | Copies a file from a container to your current folder. |

`-i` keeps input open; `-t` gives the command an interactive terminal. Together, `-it` is common for shells and database prompts.

## Images and building

| Command | What it does |
|---|---|
| `docker images` | Lists images stored locally. |
| `docker pull <image>:<tag>` | Downloads an image, for example `docker pull postgres:16`. |
| `docker build -t <name>:<tag> .` | Builds an image using the Dockerfile in the current directory. |
| `docker image inspect <image>` | Shows image details. |
| `docker image rm <image>` | Removes a local image if no container depends on it. |

For a Compose project with a Dockerfile, use:

```bash
docker compose build
docker compose up -d --build
```

`--build` rebuilds images before starting services.

## Run a one-off container

```bash
docker run --rm hello-world
```

- `docker run` creates and starts a new container.
- `--rm` removes that container after it exits.
- Add `-it` for an interactive program, or `-d` to run it in the background.

## Ports, networks, and storage

| Command | What it does |
|---|---|
| `docker port <container>` | Shows published host-to-container ports. |
| `docker network ls` | Lists Docker networks. |
| `docker network inspect <network>` | Shows which containers are attached to a network. |
| `docker volume ls` | Lists Docker volumes. |
| `docker volume inspect <volume>` | Shows details about a volume. |

In `compose.yaml`, `5432:5432` means host port `5432` forwards to container port `5432`. The `postgres_data` volume keeps PostgreSQL data when its container is recreated.

## Cleanup: understand before running

| Command | Effect |
|---|---|
| `docker compose down` | Removes this project's containers/network; named volumes are kept. |
| `docker compose down -v` | Also removes this project's Compose volumes. **This deletes the database data in `postgres_data`.** |
| `docker container prune` | Removes all stopped containers. |
| `docker image prune` | Removes unused dangling images. |
| `docker system df` | Shows Docker disk usage. |
| `docker system prune` | Removes unused Docker data; review its prompt before confirming. |

Do not use `docker compose down -v` or broad prune commands if you need the data they may remove. A container can be recreated; a removed volume may contain the only copy of your database.

## Quick troubleshooting routine

When a service does not work, check in this order:

```bash
docker info
docker compose ps
docker compose logs --tail=100 db
docker compose config
```

- If Docker cannot connect to the engine, start Docker Desktop/Engine.
- If `db` is stopped, try `docker compose up -d db`.
- If PostgreSQL is still initializing, follow `docker compose logs -f db` until it reports that it is ready.
- If a table is missing, check migrations and inspect tables with `\dt` in `psql`.

## How to read a command

Take this command:

```bash
docker compose exec db psql -U resolveiq -d resolveiq -c "SELECT id FROM tickets;"
```

Read it left to right: use Docker Compose, execute a program in the running `db` service, launch `psql`, connect as user `resolveiq` to database `resolveiq`, and run the SQL after `-c`.

The general pattern is:

```text
docker compose <action> [service] [program and its arguments]
```

For example, `docker compose logs -f db` means “show and follow logs for the `db` service.”
