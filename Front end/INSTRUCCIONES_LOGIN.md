# Instrucciones para Probar el Login

## Pasos para que funcione el login:

### 1. Asegúrate de que el backend esté corriendo

```bash
cd "Back end"
npm install  # Si aún no lo has hecho
npm run dev  # O npm start
```

El backend debe estar corriendo en `http://localhost:4000`

### 2. Verifica la configuración de la API

El archivo `Front end/src/config/api.js` está configurado para:
- **Web**: `http://localhost:4000/api`
- **Android Emulator**: `http://10.0.2.2:4000/api`
- **iOS Simulator**: `http://localhost:4000/api`

Si usas un dispositivo físico, cambia la IP en `api.js` por tu IP local.

### 3. Verifica que MongoDB esté corriendo

El backend necesita MongoDB. Asegúrate de tener MongoDB corriendo localmente o configura una URI de MongoDB Atlas en el archivo `.env` del backend.

### 4. Crea un usuario de prueba

Puedes crear un usuario desde la pantalla de registro o directamente en MongoDB.

### 5. Prueba el login

1. Abre la app
2. Ve a la pantalla de Login
3. Ingresa las credenciales:
   - Username o Email del usuario registrado
   - Password
4. Presiona "Iniciar Sesión"

### Errores comunes:

- **"No se pudo conectar al servidor"**: El backend no está corriendo o la URL está mal configurada
- **"Credenciales inválidas"**: El usuario no existe o la contraseña es incorrecta
- **Error de CORS**: Verifica que el backend tenga CORS habilitado (ya está configurado)

### Para verificar que el backend funciona:

Abre en tu navegador: `http://localhost:4000/api/health`

Deberías ver:
```json
{
  "success": true,
  "mensaje": "Servidor funcionando correctamente"
}
```

