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

## Asistente profesional y voz

Las respuestas profesionales se generan localmente a partir de información
verificada del currículum. El chat no llama a Gemini ni a otros servicios
externos de inteligencia artificial y no requiere claves ni créditos de IA.

La voz de salida utiliza SpeechSynthesis del navegador cuando hay una voz
masculina compatible con el idioma seleccionado. El dictado utiliza Web Speech
API cuando el navegador lo admite; su disponibilidad depende del navegador y
del dispositivo. Si alguna función de voz no está disponible, el chat escrito
sigue funcionando y no se graba ni se envía audio.

La configuración Firebase del navegador contiene una clave de API web y un ID
OAuth públicos por diseño, necesarios para Gmail. Restringe la clave Firebase en
Google Cloud a los dominios y API que utiliza la aplicación. Las credenciales
privadas nunca deben guardarse en el repositorio.
