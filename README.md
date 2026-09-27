# Galería

Galería personal para Android que sustituye a la app de galería del móvil: ve tus fotos y vídeos,
crea tus propios álbumes y personaliza la cuadrícula. Se actualiza sola desde GitHub Releases, sin
tienda ni servidor.

## Qué hace

- **Fotos**: cuadrícula con todas las fotos y vídeos del móvil, paginada y ordenable.
- **Álbumes** (desliza a la derecha): tus álbumes propios y las carpetas reales del móvil.
- **Álbumes virtuales**: crear un álbum no copia ni mueve ningún archivo — solo guarda referencias,
  así que una foto puede estar en varios álbumes y no ocupa el doble.
- **Visor**: zoom con dos dedos, doble toque, deslizar entre elementos, vídeo con controles.
- **Personalización**: fotos por fila (2–5), tema claro/oscuro/automático, color de acento, orden,
  mostrar u ocultar vídeos y nombres de archivo.

## Desarrollo

```bash
npx expo start            # servidor de desarrollo
npx expo run:android      # build de desarrollo en el móvil (necesario: hay módulos nativos)
npx tsc --noEmit          # typecheck
npx expo lint             # lint
```

Expo Go no sirve: la app usa módulos nativos (`expo-media-library`, `expo-video`,
`react-native-pager-view`), así que hace falta un development build.

## Autoactualización

No hay tienda ni servidor propio: todo se apoya en GitHub Releases y en el instalador de Android.

1. Cada push a `main` dispara [`.github/workflows/release.yml`](.github/workflows/release.yml), que
   hace `expo prebuild`, compila el APK firmado y publica la release `vX.Y.Z` con el APK adjunto.
   La versión se lee de `expo.version` en `app.json`: **para publicar una versión nueva hay que
   subir ese número**, si no el workflow ve que la release ya existe y no la recrea.
2. Al abrirse, la app consulta `https://api.github.com/repos/<repo>/releases/latest` (repo público,
   sin token) y compara el `tag_name` con la versión instalada **por segmentos numéricos**, no
   alfabéticamente — si no, `1.9` saldría mayor que `1.10`.
3. Si hay una versión mayor, aparece un aviso arriba. Al pulsarlo descarga el APK a la caché, lo
   expone con un `FileProvider` (desde Android 7 no se puede pasar un `file://` a otra app) y lanza
   el instalador del sistema con `ACTION_VIEW`.

Las dos piezas que lo hacen posible están en [`plugins/`](plugins):

| Pieza | Para qué |
| --- | --- |
| `withApkInstaller` | Añade el permiso `REQUEST_INSTALL_PACKAGES` y el `FileProvider` a la caché |
| `withAndroidReleaseSigning` | Firma el release con la keystore del repo (secrets); en local cae a `debug.keystore` |

**La firma es lo crítico**: Android solo deja actualizar una app si el APK nuevo está firmado con el
mismo certificado. Por eso el workflow usa una keystore fija guardada en los secrets del repo
(`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`,
`ANDROID_KEY_PASSWORD`). Si se pierde esa keystore, la única forma de actualizar es desinstalar y
volver a instalar.

### Limitaciones

- Hay que aceptar a mano el diálogo de instalación de Android; no existe actualización silenciosa
  (eso solo lo permite un MDM o ser app de sistema).
- La primera vez, Android pedirá activar «Instalar apps desconocidas» para esta app.
- Solo Android: iOS no permite instalar apps fuera de la App Store.
- La API de GitHub sin autenticar limita a 60 peticiones/hora por IP. La app solo consulta al
  abrirse, así que no se roza.
