# Cómo actualizar a Expo SDK 54 para usar en el celular

Tu Expo Go en el celular es **SDK 54** y el proyecto estaba en **SDK 49**. Ya se actualizó el `package.json` a SDK 54 y se añadió un **override de `semver`** para evitar el error `Cannot find module './internal/re'` al ejecutar `npx expo install --fix`.

## Pasos (hazlos en orden)

### 1. Detener el servidor
En la terminal donde está corriendo `npm start`, presiona **Ctrl+C** para detenerlo.

### 2. Borrar node_modules y lock (recomendado para que el override de semver aplique)
En PowerShell, desde la carpeta del Front end:
```powershell
cd "c:\Users\surfaceLaptop3\Desktop\Lavadero\Front end"
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
```

### 3. Instalar dependencias
```powershell
npm install
```

### 4. Ajustar versiones con Expo
```powershell
npx expo install --fix
```
Si este paso falla de nuevo, puedes seguir: **npm start** suele funcionar igual y la app puede correr en el celular.

### 5. Verificar
```powershell
npx expo-doctor
```

### 6. Iniciar de nuevo
```powershell
npm start
```

Luego escanea el código QR con Expo Go (SDK 54) en tu celular.

---

**Si no quieres borrar node_modules:** solo cierra la terminal donde corre `npm start`, abre una nueva, ve a la carpeta `Front end` y ejecuta:
```powershell
cd "c:\Users\surfaceLaptop3\Desktop\Lavadero\Front end"
npm install
npx expo install --fix
npm start
```
