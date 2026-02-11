# Lavadero – Desplegar en VM con Docker

Para la VM (Google Cloud u otra): usar la **rama `docker`** o `main` de este repo.

## En la VM

1. **Clonar y entrar a la carpeta**
   ```bash
   git clone https://github.com/Chuecks/LavanderiaAPP.git
   cd LavanderiaAPP
   # Si usás la rama docker:
   git checkout docker
   ```

2. **Crear el .env del backend**
   ```bash
   cp "Back end/.env.example" "Back end/.env"
   nano "Back end/.env"
   ```
   Completar: `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_DESTINO`, `JWT_SECRET`.

3. **Levantar contenedores**
   ```bash
   docker compose up -d --build
   ```

4. **Comprobar**
   - API: `http://IP_DE_LA_VM:4000`
   - En Google Cloud: regla de firewall permitiendo TCP 4000.

La app móvil debe apuntar a `http://IP_DE_LA_VM:4000/api` en `Front end/src/config/api.js` (PRODUCTION_API_URL o IP_BACKEND en desarrollo).
