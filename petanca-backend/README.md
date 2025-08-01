# `README.md`

## Descripción

Esta API en **Node.js**/Express gestiona un torneo de petanca de equipos de 3 jugadores. Incluye:

* Autenticación (un único admin)
* Registro y gestión de equipos
* Generación de cuadro de eliminatorias con byes
* Registro de resultados y notificaciones (SMS/E‑mail)
* Reinicio seguro de datos (`clear`)
* Middleware de errores global y seed de admin

## Prerrequisitos

* Node.js v16+ y npm
* Cuenta en MongoDB Atlas
* Credenciales de Twilio (SID, Token, Número)
* Servicio SMTP (SendGrid, Mailgun…)

## Instalación

1. Clona el repositorio y accede a la carpeta:

   ```bash
   git clone <repo-url>
   cd petanca-backend
   ```
2. Instala dependencias:

   ```bash
   npm install
   ```
3. Copia `env.example` a `.env` y rellena las variables:

   ```bash
   cp .env.example .env
   # Edita .env y añade tus credenciales
   ```

## Scripts disponibles

* **`npm run dev`**: arranca en modo desarrollo (nodemon)
* **`npm start`**: arranca en modo producción
* **`npm run lint`**: ejecuta ESLint
* **`npm run seed-admin`**: crea la cuenta admin si no existe
* **`npm test`**: ejecuta tests (si están definidas)

## Estructura de carpetas

```
src/
├─ config.js            # carga de variables de entorno
├─ index.js             # punto de entrada
├─ models/              # esquemas Mongoose
├─ controllers/         # lógica de endpoints
├─ routes/              # definición de rutas
├─ middlewares/         # auth, errorHandler
├─ validators/          # validaciones con express-validator
├─ utils/               # notify.js, seedAdmin.js
└─ validators/          # validación de input
```

## Endpoints principales

| Método | Ruta                      | Descripción                                         |
| ------ | ------------------------- | --------------------------------------------------- |
| POST   | `/api/auth/login`         | Login admin → devuelve JWT                          |
| GET    | `/api/teams`              | Listar equipos                                      |
| POST   | `/api/teams`              | Crear equipo                                        |
| DELETE | `/api/teams/:id`          | Eliminar equipo                                     |
| POST   | `/api/matches/generate`   | Cerrar inscripciones y generar bracket              |
| GET    | `/api/matches`            | Listar todos los partidos                           |
| POST   | `/api/matches/:id/result` | Registrar resultado + notificación automática       |
| POST   | `/api/notify/:matchId`    | Envío manual de aviso (“pronto” o “ya toca”)        |
| POST   | `/api/admin/clear`        | Reiniciar torneo (borrar equipos, partidos, notifs) |

## Uso

1. **Seed de admin**:

   ```bash
   npm run seed-admin
   ```
2. **Login**:

   ```bash
   curl -X POST http://localhost:4000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"<user>","password":"<pass>"}'
   ```
3. **Usar token**:
   En cabecera `Authorization: Bearer <token>` para todas las rutas protegidas.

---

¡Listo! Con estos archivos de configuración y documentación, tu backend queda bien documentado y fácil de poner en marcha.
