Coloca aquí la fuente TTF usada por el generador de PDFs para soportar el símbolo de colones (₡).

Se recomienda `Noto Sans Regular` (oficial, de Google). Ejemplos para descargar:

PowerShell (Windows):

```powershell
# Ejecutar desde la raíz del proyecto (donde está package.json)
mkdir -Force public\fonts
Invoke-WebRequest -Uri "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf" -OutFile "public\fonts\NotoSans-Regular.ttf"
```

curl (WSL / macOS / Linux):

```bash
mkdir -p public/fonts
curl -L -o public/fonts/NotoSans-Regular.ttf \
  https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf
```

Nota: si tu entorno bloquea descargas desde GitHub raw, descarga manualmente desde https://github.com/googlefonts/noto-fonts/releases o desde https://fonts.google.com/specimen/Noto+Sans y copia el archivo `NotoSans-Regular.ttf` a `public/fonts/`.

Después de colocar la fuente, reinicia el servidor de desarrollo y limpia caché de Next.js:

```powershell
rimraf .next
npm run dev
```

Si quieres, ejecuto el script `scripts/download-fonts.ps1` (si me das permiso) para descargar automáticamente la fuente en tu repo local.