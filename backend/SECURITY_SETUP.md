## Inicio de sesión del administrador

Configura estas variables en `backend/.env` antes de iniciar la API:

```dotenv
TONER_ADMIN_USER=Admin
TONER_ADMIN_PASSWORD=una-Admin123
TONER_AUTH_COOKIE_SECURE=false
```

Usa una contraseña larga y exclusiva. No compartas el archivo `.env` ni guardes sus credenciales en el código. Reinicia el backend después de cambiar las variables.

En instalaciones servidas mediante HTTPS, establece `TONER_AUTH_COOKIE_SECURE=true`. La cookie de sesión es `HttpOnly`, `SameSite=Strict` y expira tras ocho horas. Las sesiones se guardan en memoria y se invalidan al reiniciar el backend; ejecuta una sola instancia del backend para esta modalidad.
