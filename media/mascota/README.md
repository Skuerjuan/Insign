# Loro y mangos de InSign

Actualización: la mascota se llama **Waki** y también es el favicon. Se restauraron los adornos originales `public/vector-seccion.png` y `public/patron-juegos.png`, retirando sus versiones de mangos grises. El video de la landing, `public/grabacion-insign.mp4`, se reemplazó por un recorrido de las pantallas reales de Insign, con datos de demostración, Waki como guía, narración en español y subtítulos. Dura **84,063 segundos**. El guion está en `media/tutorial/guion-recorrido.json` y los tiempos finales en `media/tutorial/tiempos-recorrido.json`.

## Recorrido con Waki

Entrega: `output/video/insign-recorrido-waki.mp4`. Codificación H.264/AAC, 1440 × 810, 24 fps de salida. Captura de la interfaz y sus interacciones mediante Computer Use; sin diapositivas. Las tomas muestran la landing, acceso y registro, niveles, los cuatro juegos, entrenamiento, abecedario, progreso, perfil y configuración, incluido el cambio de apariencia.

La grabación usa una copia aislada de los componentes reales con un perfil ficticio. No se utilizan contraseñas, sesiones personales, claves de producción ni conexiones a la base de datos. La configuración de autenticación de la aplicación real permanece intacta. El panel lateral y la banda inferior reservan espacio para Waki y los subtítulos sin tapar los controles.

Fuentes: `scripts/prepare-tour-demo.mjs`, `scripts/narrate-waki-tour.ps1` y `scripts/render-waki-tour.mjs`. Capturas y archivos intermedios: `media/tutorial/build/recorrido/`. Portada, capítulos y transcripción: `public/recorrido-waki/`.

Las ilustraciones se generaron con la herramienta integrada `image_gen`, usando como referencia de identidad `C:/Users/ariel/Downloads/image 83.png`. La imagen de saludo es una copia intacta del original. No se usó la API ni el modo CLI.

## Archivos finales

| Archivo | Uso |
| --- | --- |
| `public/loro-saludando.png` | Inicio, acceso, registro, verificación, abecedario y felicitaciones |
| `public/loro-practicar.png` | Loro cargando un tronco |
| `public/loro-volando.png` | Vuelo libre en la landing y cierre del tutorial |
| `public/loro-desafios.png` | Loro explorando con binoculares y mangos |
| `public/loro-explorador.png` | Explorador con sombrero y lupa |
| `public/loro-pensando.png` | Múltiple elección |
| `public/loro-contrasena.png` | Cambio y recuperación de contraseña |
| `public/loro-ayuda.png` | Ayuda para recuperar la cuenta |
| `public/loro-mango.png` | Secciones y niveles; loro comiendo mango |
| `public/loro-triste.png` | Resultado sin intentos |
| `public/completar-mango.png` | Tarjetas ABC con mango |
| `public/camino-mangos.png` | Frutas de los bordes de la landing |
| `public/patron-juegos.png` | Patrón original de los juegos, restaurado |
| `public/vector-seccion.png` | Franja original de los niveles, restaurada |
| `src/juegos/fondo-mangos.png` | Reverso de las cartas |

Se conservaron las ilustraciones de paisajes, hojas, letras, cartas, íconos y medallas. Solo se sustituyeron las mascotas y las bananas solicitadas. Los PNG conservan transparencia donde corresponde.

## Prompts del loro

Referencia 1: loro original. Referencia 2: escena original del mono, salvo cuando se indica una revisión de una ilustración ya generada.

Invariantes utilizadas: “Preserve its huge glossy eyes, cream face with black markings, dark curved beak, green forehead, blue crest and wings, yellow breast, grey talons, rich polished shaded cartoon feathers. Wings instead of arms; no human hands, no monkey anatomy. Single app mascot asset. Preserve framing and transparent background. Whole desired silhouette comfortably inside canvas. No text or watermark.”

Escenas específicas:

- Tronco: “Full body carrying the same heavy wooden log across its shoulders, supported by its wings, cheerful effort. Keep log and little leaves.”
- Explorador: “Waist-up explorer wearing same safari hat and holding same magnifying glass over one eye.”
- Pensando: “Close-up head and upper body smiling, one folded wing pointing a feather toward its temple, thinking pose. Keep close-up framing.”
- Contraseña: “Full body with one wing resting on hip and the other pointing one feather upward, friendly cheerful guiding expression.”
- Ayuda: “Full body facing viewer with both wings resting on hips, friendly confident helpful expression.”
- Triste: “Full body seated with sad pensive expression, one folded wing supporting cheek and the other across belly. Gentle child-friendly sadness without tears.”

Vuelo (referencia: loro original):

> Generate the exact parrot character from image 1 flying freely with both wings spread wide, legs tucked naturally, expressive joyful face, tail trailing, three-quarter front view. No vine, no rope, no swing, no other objects. Preserve exact blue-and-yellow cartoon character identity and polished art style, cream face with black stripes, green forehead, big glossy eyes, grey talons, curved dark beak. Full silhouette comfortably inside frame. Transparent background.

Comiendo mango (referencia: loro con banana generado previamente):

> Edit only the banana: replace it with a ripe orange-red mango with a little green leaf and one visible juicy bite taken out. The blue-and-yellow parrot is happily eating the mango, holding it by its curved beak with a feathered wing. Keep exact parrot identity, large eyes, dark curved beak, blue feathers, yellow breast, green forehead, cream face black marks and detailed vibrant polished cartoon style. Keep waist-up framing and transparent background. No bananas anywhere. Single mascot asset.

Desafíos (referencia: loro explorador con binoculares generado previamente):

> Replace only the bananas with a small cluster of ripe oval orange-red mangoes with green leaves, carried in the same wing. Preserve the parrot exploring with green binoculars, raised foot, exact blue-yellow parrot identity, polished cartoon style, composition, pale cream backdrop. Do not change anything else. No bananas anywhere.

## Prompts de los mangos

Cada edición usa como referencia la imagen original correspondiente.

Tarjetas ABC:

> Replace only the yellow banana on the left with one ripe oval orange-red mango with small green leaf, in the same polished cartoon shading style. Preserve the A B C letter cards exactly with identical lettering, outlines, colors, positions and framing. Transparent background. No bananas.

Camino vertical:

> Replace every peeled banana with a small ripe oval orange-red mango, with a green leaf. Preserve the same scattered vertical trail arrangement, scale and generous transparent gaps. Simple polished cartoon fruit, no banana shapes or peels anywhere. Transparent background.

Cartas:

> Replace every yellow banana with a small ripe oval orange-red mango with tiny green leaf. Preserve the pale yellow background, density, consistent small fruit scale, rounded card boundary and original dimensions/aspect. Seamless playful repeating cartoon pattern. No bananas or peels.

Patrón:

> Replace every banana silhouette with an oval mango silhouette with a small leaf. Preserve exactly the monochrome pale gray tint and transparency, subtle repeated overlapping pattern, framing and size. No colored fruit, no bananas. Transparent background.

Franja:

> Replace every banana silhouette with an oval mango silhouette with a small leaf. Preserve exactly monochrome pale gray tint, opacity, transparent background, wide strip composition, original framing and aspect. No colored fruit, no bananas.

## Borrador del tutorial (no se publica)

El borrador local `public/tutorial-insign.mp4` es un video animado H.264, 1280 × 720, audio AAC en español, 14 capítulos, 3:57. Incluye subtítulos visibles y capítulos embebidos. Las pistas WebVTT, transcripción y portada están en `public/tutorial-insign/`. Estos archivos están ignorados por Git y no se usan en la landing; no cumplen el formato de recorrido real solicitado para la próxima versión.

La narración usa la voz sintética española Microsoft Sabina de Windows. Las ilustraciones del loro se mueven durante la explicación; no es una grabación de pantalla ni un video con sincronización labial.

Guion editable: `media/tutorial/guion.json`. Tiempos finales: `media/tutorial/timings.json`.

Para regenerar en Windows con las dependencias del proyecto, FFmpeg y la voz española instalada:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/narrate-tutorial.ps1
node scripts/render-tutorial.mjs
```

## Alcance de la revisión de señas

`node scripts/verify-signs.mjs` comprueba las 419 entradas del catálogo y los 27 videos del abecedario: nombres de archivo exactos, correspondencia entre clave y archivo, existencia, ausencia de duplicados binarios por categoría, expansión de abreviaturas y términos para completar. Los juegos conservan las claves originales para registrar el progreso. No es una certificación lingüística de la ejecución de los gestos en los videos.
