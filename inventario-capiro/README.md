# Inventario Capiro

App de control de inventario para Café Capiro (La Ceja, Antioquia). Registra entradas con lote y vencimiento, mermas y consumo interno, indica qué producto sacar primero (FEFO) y cuadra el conteo físico contra el reporte de Loggro Restobar.

- **Versión web:** https://barmanpb74.github.io/bar-box/inventario-capiro/
- **APK:** pestaña *Releases* del repositorio, o `inventario-capiro.apk` en la rama `apk`.

## Estructura

| Ruta | Contenido |
| --- | --- |
| `index.html` | La app completa (HTML, CSS y JS en un archivo). Es la única fuente: el APK la copia al compilar. |
| `android/` | Envoltura nativa en Java (WebView), ícono adaptativo EK y firma de depuración. |
| `../.github/workflows/inventario-apk.yml` | Compila y publica el APK en cada cambio dentro de esta carpeta. |

## Datos

En el APK y en la versión web los datos se guardan solo en ese dispositivo. Usa **Más → Guardar copia** cada semana. La versión dentro de Claude guarda en la nube del artifact.

El catálogo incluye solo nombres y categorías de productos de la carta; las recetas del libro maestro no están en este repositorio.
