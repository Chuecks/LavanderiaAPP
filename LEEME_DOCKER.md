# Lavadero – Solo necesitás Docker (VM u otra PC)

En la VM o en cualquier PC **no hace falta instalar Node, MongoDB ni RabbitMQ**. Solo Docker (y Docker Compose, que suele venir con Docker Desktop).

---

## Qué incluye el backend en Docker

- **backend**: API Node.js (puerto 4000)
- **mongo**: MongoDB 7 (puerto 27017, datos en un volumen)
- **rabbitmq**: RabbitMQ + gestión (puertos 5672 y 15672)

Todo el backend corre en contenedores; en la máquina solo se instala Docker.

---

## En la VM (o en una PC que haga de servidor)

1. **Instalá solo Docker**  
   - Windows: [Docker Desktop](https://www.docker.com/products/docker-desktop/)  
   - Linux: `sudo apt install docker.io docker-compose-v2` (o equivalente)

2. **Cloná el repo** (o copiá la carpeta del proyecto):
   ```bash
   git clone https://github.com/Chuecks/LavanderiaAPP.git
   cd LavanderiaAPP
   ```

3. **Creá el archivo de entorno del backend** (solo la primera vez). El repo incluye `Back end/.env.example`; copialo y completalo:
   ```bash
   # Desde la raíz del repo (Windows PowerShell):
   copy "Back end\.env.example" "Back end\.env"
   # Linux/Mac:
   cp "Back end/.env.example" "Back end/.env"
   ```
   Luego editá `Back end/.env` y reemplazá los valores (JWT_SECRET, EMAIL_USER, EMAIL_PASS, EMAIL_DESTINO). El `.env` no se sube a Git (tiene secretos).

4. **Levantá todo el backend**:
   ```bash
   docker compose up -d
   ```

5. **Comprobá**:
   - API: `http://localhost:4000/api/health`
   - Diagnóstico DB: `http://localhost:4000/api/debug/db`

En la VM, abrí el puerto **4000** en el firewall para que la app móvil pueda conectarse usando la IP pública de la VM.

---

## En otra PC (desarrollar / probar la app)

### ¿Hace falta crear .env en la otra PC?

- **Solo si ahí corre el backend** (con Docker). En ese caso, en esa PC creá `Back end/.env` (copiando de `Back end/.env.example` y completando), igual que en la VM.
- **Si en la otra PC solo corrés el frontend** (Expo) y el backend está en la VM, en esa PC **no** hace falta ningún `.env` del backend.

### ¿Hace falta instalar Node en la otra PC?

Sí, **si querés correr el frontend con Expo** en esa PC (`npx expo start`, escanear QR, etc.). Expo es un proyecto Node; no se puede ejecutar sin Node/npm. No hay forma de evitar Node para eso.

Si **no** querés instalar Node en esa PC, tenés esta alternativa:

### Opción A) Backend en la VM, frontend en esta PC (con Node + Expo)

- VM: `docker compose up -d` + tenés `Back end/.env` ahí.
- Esta PC: instalás **Node** y **Expo**, y corrés el frontend:
  ```bash
  cd LavanderiaAPP/Front end
  npm install
  npx expo start
  ```
- En `Front end/src/config/api.js` la IP debe ser la de la VM (para que el celular/Expo conecte a la API). En esta PC no hace falta `.env` del backend.

### Opción B) Todo en Docker en la VM (sin instalar Node en la otra PC)

- En la **VM**: `docker compose -f docker-compose.full.yml up -d` (backend + web). Ahí sí necesitás `Back end/.env` en la VM.
- En la **otra PC**: no instalás nada. Abrís el navegador y entrás a `http://IP_DE_LA_VM` y usás la app web. Para la app móvil en el celular, la app (Expo Go o build) apunta a la IP de la VM.

Resumen: **.env solo donde corre el backend** (VM o PC con Docker). **Node solo si en esa PC querés correr Expo** (frontend en desarrollo).

---

## Resumen

| Dónde        | Qué instalar      | Comando                          |
|-------------|-------------------|----------------------------------|
| **VM / servidor** | Solo Docker       | `docker compose up -d`           |
| **Otra PC (solo backend + web)** | Solo Docker       | `docker compose -f docker-compose.full.yml up -d` |
| **Otra PC (desarrollar app móvil)** | Node + Expo       | `npx expo start` (backend en VM o en Docker en esa PC) |

No hace falta instalar MongoDB ni RabbitMQ en ningún lado; todo eso va dentro de los contenedores.

---

## ¿Por qué varios contenedores y no uno solo?

El backend está en **tres contenedores** (API, MongoDB, RabbitMQ) y no en un solo contenedor “con todo”:

- **Actualizaciones**: podés actualizar solo la API sin tocar la base de datos.
- **Recursos**: cada servicio puede limitar memoria/CPU por separado.
- **Práctica habitual**: es el esquema estándar y el que usan la mayoría de los entornos en producción.

En la VM o en otra PC seguís instalando **solo Docker**; `docker compose up -d` levanta los tres y listo.
