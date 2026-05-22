# Generador de Reporte de Vulnerabilidades

Aplicación Node.js que toma un archivo CSV de hallazgos (`findings.csv`) y genera un reporte PDF ejecutivo/técnico por sprint o carpeta de entrada.

## Resumen De Lo Que Se Hizo

Durante los ajustes recientes se aplicaron estos cambios principales:

1. Reorganización de carpetas de la aplicación para mejorar mantenibilidad.
2. Estructura de datos simplificada: se eliminó carpeta intermedia `sprints`.
3. Entradas y salidas unificadas por carpeta: el PDF se genera en la misma carpeta donde está el `findings.csv`.
4. Parámetro de entrada opcional: si no se envía argumento, usa `Ejemplo` por defecto.
5. Mejoras de maquetación del PDF:
   - Menos saltos de página forzados entre secciones.
   - Correcciones de espaciado para evitar texto amontonado en detalle de vulnerabilidades (4.1, 4.2, 4.3).
   - En la sección Top 10, el bloque explicativo pasó de caja a nota en línea.

## Estructura Actual

```text
main/
  data/
    Ejemplo/
      findings.csv
    Sprint 245/
      findings.csv
      Reporte_Vulnerabilidades_Sprint_245.pdf
  src/
    config/
      index.mjs
    pdf/
      components.mjs
      sections.mjs
    services/
      data.mjs
  index.mjs
  package.json
```

## Prerrequisitos

1. Node.js 18 o superior.
2. npm (incluido con Node.js).

Para validar versiones:

```bash
node -v
npm -v
```

## Instalación De Dependencias

Desde la carpeta raíz del proyecto (`main`):

```bash
npm install
```

Esto instalará las dependencias definidas en `package.json` (`pdfkit` y `papaparse`).

## Ejecución Paso A Paso

### 1) Ir a la carpeta del proyecto

```bash
cd c:/Users/miltonpacheco/Desktop/Actividades/Vulnerabilidades/main
```

### 2) Instalar dependencias (solo la primera vez o cuando cambie `package.json`)

```bash
npm install
```

### 3) Ejecutar con carpeta específica

Ejemplo para `Sprint 245`:

```bash
node index.mjs "Sprint 245"
```

También puedes usar script npm:

```bash
npm run analyze -- "Sprint 245"
```

### 4) Ejecutar sin parámetro (usa `Ejemplo` por defecto)

```bash
node index.mjs
```

Comportamiento esperado:

1. Busca `data/Ejemplo/findings.csv`.
2. Procesa hallazgos válidos por tag.
3. Genera el PDF en la misma carpeta (`data/Ejemplo/`).

## Dónde Queda El Reporte

El archivo generado queda en la misma carpeta de entrada:

```text
data/<Carpeta>/Reporte_Vulnerabilidades_<Carpeta>.pdf
```

Ejemplo real:

```text
data/Sprint 245/Reporte_Vulnerabilidades_Sprint_245.pdf
```

## Flujo Interno (Resumen Técnico)

1. `src/services/data.mjs`:
   - Parsea CSV.
   - Limpia datos.
   - Filtra tags válidos.
   - Calcula agregados y análisis.
2. `src/pdf/sections.mjs`:
   - Renderiza secciones del reporte.
3. `src/pdf/components.mjs`:
   - Componentes visuales reutilizables.
4. `index.mjs`:
   - Orquesta lectura, análisis y generación de PDF.

## Problemas Comunes

### 1) "No se encontraron vulnerabilidades con tags válidos"

Causa común:

1. `findings.csv` vacío.
2. Tags fuera del catálogo válido.

Qué revisar:

1. Que el CSV tenga filas reales.
2. Que esté en la carpeta correcta (`data/<Carpeta>/findings.csv`).

### 2) "No se encontró findings.csv"

Verifica nombre exacto de archivo y ubicación.

### 3) Dependencias faltantes

Ejecuta:

```bash
npm install
```

## Comandos Útiles

```bash
# Ejecutar por defecto (Ejemplo)
node index.mjs

# Ejecutar una carpeta específica
node index.mjs "Sprint 245"

# Usando npm scripts
npm run start -- "Sprint 245"
npm run analyze -- "Sprint 245"
```
