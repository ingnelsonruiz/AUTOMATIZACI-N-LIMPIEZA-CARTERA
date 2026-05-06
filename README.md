# Automatización Limpieza Cartera 
Aplicación web para limpieza y validación automática de reportes de cartera ICETEX.

## Características

- Carga de archivos Excel (.xlsx) de hasta 60 MB o más
- Procesamiento 100% local en el navegador (sin servidores)
- Aplica todas las reglas del ManualOK.docx automáticamente
- Genera archivo v02 listo para entrega
- Reporte de estadísticas y cambios realizados

## Reglas aplicadas (según manual)

1. Reducción de espacios múltiples a un solo espacio
2. Eliminación de comillas dobles, simples y pipes
3. Validación de columna SUBLINEA (TRIM si LARGO > 50)
4. Eliminación de hojas adicionales
5. Limpieza de columnas de calificación

## Tecnologías

- React 18 + Vite
- SheetJS (xlsx) para procesamiento de Excel
- Tailwind CSS
- Lucide React (iconos)

## Despliegue

Desplegado en Vercel: procesamiento estático sin backend.

---

Dusakawi EPS · 2026
