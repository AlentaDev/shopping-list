# Levantar y conectar la API con la base de datos

Este documento describe cómo iniciar la API junto con PostgreSQL y cómo conectar clientes a la base de datos.

## Requisitos

- Docker + Docker Compose
- pnpm (para ejecutar scripts si corres la API fuera de Docker)

## Opción 1: API + BD con Docker Compose (recomendado)

El `docker-compose.yml` del repo levanta **PostgreSQL** y la **API** con la configuración ya preparada.

1. Inicia los servicios:

   ```bash
   docker compose up --build
   ```

2. La API queda disponible en `http://localhost:3000`.
3. La base de datos queda publicada en `localhost:5432`.

### Variables de entorno usadas por la API

Estas variables se inyectan en el servicio `api` del `docker-compose.yml`:

- `DB_HOST=db`
- `DB_PORT=5432`
- `DB_NAME=shopping_list`
- `DB_USER=shopping_list`
- `DB_PASSWORD=shopping_list`
- `DB_SSL=false`

> Nota: `DB_HOST` apunta al nombre del servicio `db` dentro de Docker Compose.

## Opción 2: BD con Docker + API en local

1. Levanta solo la base de datos:

   ```bash
   docker compose up db
   ```

2. Exporta variables de entorno (o crea un `.env` en `apps/api` si prefieres):

   ```bash
   export DB_HOST=localhost
   export DB_PORT=5432
   export DB_NAME=shopping_list
   export DB_USER=shopping_list
   export DB_PASSWORD=shopping_list
   export DB_SSL=false
   ```

3. Arranca la API:

   ```bash
   pnpm -C apps/api dev
   ```

## Migraciones

La API incluye un migrador SQL simple.

- Ejecutar migraciones:

  ```bash
  pnpm -C apps/api database:migrate
  ```

- Resetear y volver a migrar:

  ```bash
  pnpm -C apps/api database:reset
  ```

## Conexión directa a PostgreSQL

Con los valores por defecto de Docker Compose:

- Host: `localhost`
- Puerto: `5432`
- Base de datos: `shopping_list`
- Usuario: `shopping_list`
- Password: `shopping_list`

Ejemplo con `psql`:

```bash
psql -h localhost -p 5432 -U shopping_list -d shopping_list
```
