# Subir la app Lavadero a internet

## Resumen rápido

- **Backend (API + MongoDB)**: puedes correrlo en una VM con Docker (p. ej. Google Cloud) o usar un PaaS (Render, Railway).
- **Frontend web**: build estático de Expo y subirlo a Vercel, Netlify o Firebase Hosting (gratis).
- **App móvil**: en el código apuntas la API a la URL pública del backend; si quieres app en Play Store/App Store usas EAS Build (Expo).

---

## Opción 1: VM con Docker (Google Cloud u otra)

### 1. Crear una VM en Google Cloud

1. Entra en [Google Cloud Console](https://console.cloud.google.com/).
2. Crea un proyecto (o usa uno existente).
3. **Compute Engine** → **VM instances** → **Create instance**.
   - Región cercana a tus usuarios (p. ej. `southamerica-east1` para Brasil/Uruguay).
   - Tipo: **e2-small** o **e2-micro** (e2-micro entra en free tier).
   - Disco: 10–20 GB.
   - Marca **Allow HTTP/HTTPS traffic** si vas a poner un dominio y certificado después.
4. Conéctate por SSH desde la consola o con `gcloud compute ssh NOMBRE_VM --zone=ZONA`.

### 2. En la VM: instalar Docker y Docker Compose

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y docker.io docker-compose-v2
sudo usermod -aG docker $USER
# Cerrar sesión y volver a entrar (o ejecutar con sudo hasta entonces)
```

### 3. Subir el proyecto a la VM

- Opción A: clonar desde Git si el repo está en GitHub/GitLab:
  ```bash
  git clone https://github.com/TU_USUARIO/lavadero.git
  cd lavadero
  ```
- Opción B: desde tu PC, copiar la carpeta del proyecto (incluye `Back end`, `Front end`, `docker-compose.yml`):
  ```bash
  scp -r /ruta/local/Lavadero usuario@IP_VM:~/lavadero
  ```

### 4. Variables de entorno en la VM

En la VM, crea el archivo de entorno del backend (si no existe):

```bash
cd ~/lavadero
nano Back end/.env
```

Contenido mínimo (ajusta valores):

```env
NODE_ENV=production
PORT=4000
MONGODB_URI=mongodb://mongo:27017/lavadero
# JWT (genera uno seguro: openssl rand -hex 32)
JWT_SECRET=tu_clave_secreta_muy_larga_y_aleatoria
# Email (Gmail u otro)
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=contraseña_de_aplicacion
EMAIL_SERVICE=gmail
EMAIL_DESTINO=donde-recibir-pedidos@ejemplo.com
```

Si más adelante usas RabbitMQ en Docker, en ese mismo `.env` puedes poner `RABBITMQ_URL=amqp://rabbitmq:5672`.

### 5. Levantar con Docker Compose

```bash
cd ~/lavadero
docker compose up -d
```

Se levantan: **mongo** → **rabbitmq** → **backend** → **frontend** (web). La primera vez el frontend tarda más porque construye la app con Expo.

- **Web app (frontend):** http://localhost (puerto 80). La app web usa `/api` y nginx hace proxy al backend.
- **API directa:** http://localhost:4000 (por si quieres probar o conectar la app móvil en la misma red).

Comprueba que responda:

```bash
curl http://localhost/api/health
# o
curl http://localhost:4000/api/health
```

### 6. Abrir el puerto 4000 en la VM (Google Cloud)

- En Google Cloud: **VPC network** → **Firewall** → **Create firewall rule**.
  - Nombre: `allow-api-4000`.
  - Targets: All instances (o la red de tu VM).
  - Source IP ranges: `0.0.0.0/0` (o restringe a tu IP si solo pruebas).
  - Protocols and ports: **TCP 4000**.

Desde fuera:

```text
http://IP_PUBLICA_VM:4000/api/health
```

Esa `IP_PUBLICA_VM` es la URL base del backend para el frontend y la app móvil.

### 7. (Opcional) RabbitMQ para emails

En `docker-compose.yml` descomenta el servicio `rabbitmq` y en `backend` ya está `RABBITMQ_URL: amqp://rabbitmq:5672`. Luego:

```bash
docker compose up -d
```

### 8. Frontend web en la misma VM (opcional)

Si quieres servir la web desde la misma máquina:

1. En tu PC, en la carpeta `Front end`:
   ```bash
   cd Front end
   npm install
   npx expo export:web
   ```
2. Sube la carpeta `Front end/dist` (o la que indique `expo export:web`) a la VM.
3. En la VM instala Nginx y sirve esa carpeta; o usa un contenedor con Nginx que apunte a esos archivos.

Recomendación: es más simple al principio poner el frontend web en Vercel/Netlify (ver más abajo).

---

## Opción 2: Backend en PaaS (sin VM)

- **Render** (render.com): creas un **Web Service** desde el repo (carpeta `Back end`), añades variable `MONGODB_URI`. Usas **MongoDB Atlas** (gratis) como base de datos; no hace falta MongoDB en Docker.
- **Railway** (railway.app): igual, despliegas el backend desde el repo y conectas MongoDB Atlas.
- **Google Cloud Run**: construyes la imagen Docker del backend, la subes a Artifact Registry y creas un servicio Cloud Run. Base de datos en Atlas o en una VM con MongoDB.

En todos los casos:
- Base de datos: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (cluster gratis).
- En el backend defines `MONGODB_URI` con la cadena de conexión de Atlas.
- RabbitMQ: puedes usar [CloudAMQP](https://www.cloudamqp.com/) (plan gratis) y poner `RABBITMQ_URL` en las variables de entorno.

---

## Opción 3: Frontend web (Expo) en internet

1. En `Front end/src/config/api.js` define la URL del backend en producción, por ejemplo:
   ```js
   API_BASE_URL = 'https://tu-dominio-o-ip.com:4000/api'
   ```
   o la URL que te dé Render/Railway/Cloud Run.

2. Build web:
   ```bash
   cd Front end
   npx expo export:web
   ```

3. Sube la salida (carpeta que indique Expo, p. ej. `dist`) a:
   - **Vercel**: conectar repo y carpeta del frontend, o arrastrar la carpeta del build.
   - **Netlify**: igual, deploy desde carpeta o desde Git.
   - **Firebase Hosting**: `firebase init hosting` y `firebase deploy`.

Así la app web queda en una URL pública (p. ej. `https://lavadero.vercel.app`).

---

## Opción 4: App móvil apuntando al backend en internet

En `Front end/src/config/api.js`:

- En producción (`!__DEV__`) ya tienes algo como `API_BASE_URL = 'https://tu-api.com/api'`.
- Cambia `https://tu-api-produccion.com/api` por la URL real de tu backend (IP pública de la VM o dominio de Render/Railway/Cloud Run).

Los usuarios pueden:
- Usar **Expo Go** y escanear el QR de tu proyecto (en desarrollo) o una build de desarrollo que apunte a tu API.
- Para **publicar en Play Store / App Store**: usa [EAS Build](https://docs.expo.dev/build/introduction/) de Expo; en el build de producción la app usará la URL que definas en `api.js`.

---

## Comandos útiles Docker (en la VM)

```bash
# Ver logs del backend
docker compose logs -f backend

# Reiniciar solo el backend
docker compose restart backend

# Parar todo
docker compose down

# Reconstruir tras cambios
docker compose up -d --build
```

---

## Resumen recomendado

| Parte        | Recomendación breve |
|-------------|----------------------|
| **Backend** | VM Google (e2-micro) con `docker compose` (API + MongoDB) o Render/Railway + MongoDB Atlas. |
| **Frontend web** | Build con `expo export:web` y deploy en Vercel o Netlify. |
| **App móvil** | En `api.js` poner la URL pública del backend; para tiendas usar EAS Build. |
| **Base de datos** | En VM: MongoDB en Docker. En PaaS: MongoDB Atlas. |
| **Emails** | RabbitMQ + Nodemailer en VM (descomentando en compose) o CloudAMQP en PaaS. |

Si quieres, el siguiente paso puede ser un `docker-compose.prod.yml` con Nginx delante del backend y dominio + HTTPS (Let’s Encrypt) en la VM.
