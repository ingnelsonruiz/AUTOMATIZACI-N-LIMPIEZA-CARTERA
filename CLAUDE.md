# CONTEXTO DEL PROYECTO – Automatización Limpieza Cartera
## Dusakawi EPS | Nelson Javier | profesionaldesistemas1@dusakawiepsi.com

---

## ¿Qué es este proyecto?

Aplicación web (React + Vite + SheetJS) y script Python para limpiar automáticamente
los reportes de cartera ICETEX que genera Dusakawi EPS mensualmente.

El archivo de entrada es: `Reporte_Cartera_Completo_<MES>_<AÑO>.xlsx`
El archivo de salida es:  `Reporte_Cartera_Completo_<MES>_<AÑO>_v02.xlsx`

---

## Repositorio GitHub

URL: https://github.com/ingnelsonruiz/AUTOMATIZACI-N-LIMPIEZA-CARTERA
Branch: main
Archivos locales en: C:\cartera\

---

## Reglas de limpieza (basadas en ManualOK.docx – texto + 18 imágenes)

1. **Espacios múltiples:** 3+ espacios → 1 espacio, 2 espacios → 1 espacio (todo el archivo)
2. **Caracteres especiales:** eliminar comillas dobles `"`, comillas simples `'`, pipe `|` (todo el archivo)
3. **Columna SUBLINEA:** si LARGO > 50 caracteres → aplicar TRIM. Luego eliminar columna auxiliar.
4. **Hojas adicionales:** eliminar todo excepto la hoja principal (ej: `Obligs_Alin`)
5. **Columnas de calificación:** buscar celdas cuyo contenido COMPLETO sea un espacio → reemplazar por vacío
   - Columnas: CALIFICACIONACTUAL, CALIFICACIONANT, CALIF_MOD, CALIF_DEF_ALIN, CALIFICACION_SIN_ALINEAR
   - Aplicar con "Coincidir con el contenido de toda la celda" ACTIVADO (imagen 16 del manual)
6. **Fechas:** NO SE TOCAN. Deben salir en formato DD/MM/YYYY igual que el original.
7. **Formato de salida:** Excel (.xlsx), NO CSV. Una sola hoja.

---

## Estructura del archivo Excel

- Hoja principal: `Hoja1`
- ~145 columnas, ~513 registros (varía por mes)
- Columnas clave:
  - `SUBLINEA` (col DE en Excel)
  - `CALIFICACIONACTUAL`, `CALIFICACIONANT`, `CALIF_MOD`, `CALIF_DEF_ALIN`, `CALIFICACION_SIN_ALINEAR`
  - `FECHAMOVIMIENTO`, `FECHAPRIMERGIRO`, `FECHAESTADO`, etc.
- Valores de calificación válidos: A, AA, B, BB, C, CC, D, DD, E, K

---

## Solución Python (ejecutar en conda)

Archivo: `limpiar_cartera.py`
Ruta entrada: `C:\hernan\Reporte_Cartera_Completo_Marzo_2026.xlsx`
Ruta salida:  `C:\hernan\Reporte_Cartera_Completo_Marzo_2026_v02.xlsx`

Dependencias: `pip install pandas openpyxl`

Resultado del último procesamiento:
- 513 registros, 145 columnas procesadas
- 0 espacios múltiples encontrados (archivo ya estaba limpio)
- 0 comillas/pipes encontrados
- 0 registros SUBLINEA > 50 chars
- 2 celdas de calificación con espacio vacío corregidas
- Fechas correctas en DD/MM/YYYY

---

## Solución Web (React + Vite + SheetJS)

Desplegada en Vercel. Procesamiento 100% local en el navegador, sin backend.
Soporta archivos de 60 MB o más sin límite de upload.

Stack: React 18, Vite, SheetJS (xlsx 0.18.5), Tailwind CSS, Lucide React
Diseño: fondo blanco, header azul corporativo, tema profesional Dusakawi EPS

Archivos principales:
- `src/App.jsx` — UI completa con estadísticas
- `src/utils/cartera.js` — lógica de limpieza
- `src/main.jsx`, `src/index.css` — entry point y estilos

---

## Estado actual del proyecto

- [x] Script Python completo con reporte de estadísticas
- [x] Aplicación web React subida a GitHub
- [x] Diseño profesional fondo blanco implementado
- [ ] Despliegue en Vercel pendiente de conectar

---

## Notas técnicas importantes

- Git en Windows requiere: `git config --global core.longpaths true`
- El token GitHub usado para subir el repo quedó en el historial — revocar si es necesario
- La app web no detecta las 2 celdas de calificación vacías porque SheetJS solo procesa
  celdas de tipo string puro (las celdas vacías con espacio tienen tipo diferente)
- El script Python usa `dtype=str` al leer, lo que captura esos casos adicionales
