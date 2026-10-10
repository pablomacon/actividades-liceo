# Actividades Liceo 29

Plataforma web de actividades interactivas para trabajar contenidos de **algoritmos** con estudiantes del Liceo N.º 29 Alicia Goyena. Cada estudiante elige su grupo y su nombre, resuelve una misión y el sistema conserva sus intentos como evidencia de trabajo. El equipo docente puede consultar esos resultados y abrir o cerrar cada actividad por grupo.

El proyecto corresponde al ciclo lectivo **2026** y está escrito en español rioplatense.

## Actividades disponibles

El hub reúne actualmente ocho misiones:

1. **Ordenar botellas**: ordenamiento mediante intercambios y uso de pistas.
2. **Candado numérico**: descarte de combinaciones según las pistas disponibles.
3. **Candado nivel 2**: razonamiento con posiciones correctas.
4. **Candado nivel 3**: búsqueda por fuerza bruta con un candado de cinco cifras.
5. **El Radar del Puerto**: reducción del espacio de búsqueda a partir de direcciones.
6. **El Almacén Central**: comparación entre búsqueda secuencial y una búsqueda apoyada por índice.
7. **Criptógrafos**: recorrido de grafos y elección de una ruta de menor interferencia.
8. **Detective de patrones**: análisis de pistas y descarte de posibilidades.

## Qué se ha construido hasta ahora

- Un hub de actividades que informa si cada misión está disponible y permite ver también las próximas propuestas.
- Ocho experiencias jugables independientes, con cronómetro, interacción visual y registro de las métricas propias de cada desafío.
- Selección de grupo y estudiante desde la base de datos; no se solicitan datos personales por texto libre.
- Registro de intentos, límite configurable por estudiante y verificación de disponibilidad antes de comenzar.
- Endpoints para grupos, estudiantes, juegos, intentos, estado de intento y ranking de la actividad de botellas.
- Un panel docente protegido con inicio de sesión, resumen de participación, filtros por grupo y actividad, y consulta de resultados.
- Gestión de habilitaciones por grupo: los perfiles `admin` pueden habilitar o deshabilitar una o varias actividades; los perfiles `practicante` pueden consultar su estado y los resultados.
- Autenticación de docentes mediante contraseñas cifradas con `scrypt` y tokens firmados con HMAC-SHA256, con una vigencia de una hora.

## Arquitectura

```text
frontend/                         Sitio estático HTML, CSS y JavaScript
├── index.html                    Hub de actividades
├── docente/                      Inicio de sesión y panel docente
├── shared/                       Estilos y encabezado comunes
└── 2026/cc7/algoritmos/          Una carpeta por misión

backend/                          API serverless para Vercel
├── api/                          Endpoints HTTP
├── db/neon.js                    Conexión a Neon/PostgreSQL
└── scripts/                      Utilidad para generar hashes de contraseña
```

El frontend no utiliza un framework ni paso de compilación: cada pantalla carga HTML, CSS y JavaScript nativos. Las configuraciones de las pantallas apuntan a la API publicada en Vercel.

El backend usa Node.js con módulos ES, funciones serverless de Vercel y `@neondatabase/serverless` para acceder a PostgreSQL en Neon. La información académica se organiza en tablas de grupos, estudiantes, inscripciones, juegos, intentos, docentes y habilitaciones por grupo. Las métricas de cada misión se normalizan al guardar los intentos para que el panel docente las pueda mostrar y resumir.

## API principal

| Área | Endpoints |
| --- | --- |
| Datos de clase | `GET /api/grupos`, `GET /api/estudiantes?grupo_id=…` |
| Actividades | `GET /api/juego?slug=…`, `GET /api/estado-intento?juego_slug=…&estudiante_id=…&grupo_id=…` |
| Resultados | `POST /api/intentos`, `GET /api/ranking?grupo_id=…` |
| Docentes | `POST /api/docente-login`, `GET /api/docente-me`, `GET /api/docente-resultados` |
| Habilitaciones | `GET` y `POST /api/docente-habilitaciones` |

Las rutas docentes requieren el encabezado `Authorization: Bearer <token>`. La modificación de habilitaciones requiere el rol `admin`.

## Desarrollo local

### Frontend

El frontend puede abrirse desde un servidor estático que conserve las rutas relativas. Debe configurarse la URL de la API en `frontend/config.js` y en el archivo `config.js` de cada actividad si se usará una API local o distinta de la publicada.

### Backend

Requisitos: Node.js y una base PostgreSQL compatible con Neon.

```powershell
cd backend
npm install
$env:DATABASE_URL = "postgresql://…"
$env:DOCENTE_JWT_SECRET = "un-secreto-largo-y-aleatorio"
$env:ALLOWED_ORIGIN = "http://127.0.0.1:…"
npm run local
```

`DATABASE_URL` es obligatoria para conectarse a la base y `DOCENTE_JWT_SECRET` es obligatoria para crear y validar sesiones docentes. `ALLOWED_ORIGIN` restringe el origen permitido por CORS; si se omite, la API acepta cualquier origen.

La estructura y los datos iniciales de la base de datos no están versionados en este repositorio. Para ejecutar una instancia nueva se deben crear y poblar las tablas que consume la API antes de probar las actividades.

## Despliegue

El backend está preparado para desplegarse como proyecto de Vercel. El frontend es un sitio estático y puede desplegarse por separado. Al cambiar el dominio del backend hay que actualizar las constantes `API_BASE_URL` de `frontend/config.js` y las configuraciones de las misiones.

## Repositorio

Repositorio: [pablomacon/actividades-liceo](https://github.com/pablomacon/actividades-liceo)
