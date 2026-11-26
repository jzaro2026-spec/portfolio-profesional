# Portfolio profesional

Portfolio bilingüe de José María Maroto, construido con React, Vite y TypeScript.
El CV descargable se sirve desde `public/CV_Jose_Maria_Maroto_Lazaro.pdf`; el
portfolio ofrece una descarga directa del archivo predeterminado.
La fotografía personal predeterminada se sirve desde
`public/assets/images/jose-maria-maroto.png`.

## Requisitos y desarrollo local

- Node.js 24.12 o posterior.
- Bun, que utiliza el lockfile existente `bun.lock`.

En Windows PowerShell, usa el shim `bun.cmd` para evitar la política de ejecución
de scripts de PowerShell:

```powershell
bun.cmd install --frozen-lockfile
bun.cmd run dev
```

Abre <http://127.0.0.1:3000>. Para validar el proyecto:

```powershell
bun.cmd run lint
bun.cmd run test
bun.cmd run build
```

La conexión opcional con Gmail requiere que Firebase y Google OAuth tengan
configurado el dominio de desarrollo o producción como autorizado. La aplicación
principal y el asistente escrito no requieren iniciar sesión en Gmail.

## Asistente profesional y protección de uso

El asistente llama a Gemini exclusivamente desde la función de servidor
`api/assistant/chat.ts`, publicada automáticamente en Vercel como
`/api/assistant/chat`. La clave no se incluye en el JavaScript público.

La función limita cada IP a 8 consultas por minuto y el despliegue a 250 al día.
Los contadores compartidos usan Upstash Redis y guardan un identificador HMAC de
la IP, no la dirección original. Si falta Redis o no está disponible, la función
falla de forma cerrada y no llama a Gemini.

Configura estas variables en **Vercel → Project Settings → Environment
Variables**, para Production y Preview:

- `GEMINI_API_KEY`: clave de Gemini.
- `UPSTASH_REDIS_REST_URL`: URL REST de una base de datos Redis de Upstash.
- `UPSTASH_REDIS_REST_TOKEN`: token REST de lectura y escritura de esa base.

Para desarrollo local, copia los nombres y los valores a un `.env.local` no
versionado. No uses el prefijo `VITE_` para ninguna de estas variables. Para
probar la función localmente, ejecuta `npx.cmd vercel dev`; `bun.cmd run dev`
inicia Vite y la interfaz, pero no procesa funciones serverless.

La configuración Firebase del navegador contiene una clave de API web y un ID
OAuth públicos por diseño, necesarios para Gmail. No son credenciales de Gemini;
restringe la clave Firebase en Google Cloud a los dominios y API que utiliza la
aplicación. Las credenciales privadas nunca deben guardarse en el repositorio.
