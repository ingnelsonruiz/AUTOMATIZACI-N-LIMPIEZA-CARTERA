// ─────────────────────────────────────────────────────────────
// LÓGICA DE LIMPIEZA - Basada en ManualOK.docx
// Dusakawi EPS | Automatización Cartera
// ─────────────────────────────────────────────────────────────

const PREFIJOS_CALIF = ['CALIFICACI', 'CALIF_']

function esColumnaCalificacion(nombre) {
  if (!nombre) return false
  return PREFIJOS_CALIF.some(p => nombre.toUpperCase().startsWith(p))
}

// Paso 1: espacios múltiples → 1 espacio + strip
function limpiarEspacios(valor) {
  if (typeof valor !== 'string') return { valor, cambio: false }
  const nuevo = valor.replace(/ {2,}/g, ' ').trim()
  return { valor: nuevo, cambio: nuevo !== valor }
}

// Paso 2: eliminar " ' |
function limpiarCaracteresEspeciales(valor) {
  if (typeof valor !== 'string') return { valor, cd: 0, cs: 0, pipes: 0 }
  const cd    = (valor.match(/"/g)  || []).length
  const cs    = (valor.match(/'/g)  || []).length
  const pipes = (valor.match(/\|/g) || []).length
  const nuevo = valor.replace(/"/g, '').replace(/'/g, '').replace(/\|/g, '')
  return { valor: nuevo, cd, cs, pipes }
}

// ─────────────────────────────────────────────────────────────
// PROCESADOR PRINCIPAL
// ─────────────────────────────────────────────────────────────
export function limpiarCartera(workbook, onProgreso) {
  const stats = {
    filas              : 0,
    columnas           : 0,
    hojaPrincipal      : '',
    hojasEliminadas    : [],
    espaciosCorregidos : 0,
    comillasDobles     : 0,
    comillasSencillas  : 0,
    pipes              : 0,
    sublineaMayor50    : 0,
    sublineaTrimmed    : 0,
    califCeldasEspacio : 0,
    topColumnas        : {},
    valoresCalif       : {},
  }

  // Hoja principal = primera hoja
  const hojaPrincipal = workbook.SheetNames[0]
  stats.hojaPrincipal = hojaPrincipal

  // Paso 4: Eliminar hojas adicionales
  workbook.SheetNames.forEach(h => {
    if (h !== hojaPrincipal) {
      delete workbook.Sheets[h]
      stats.hojasEliminadas.push(h)
    }
  })
  workbook.SheetNames = [hojaPrincipal]

  const ws = workbook.Sheets[hojaPrincipal]
  if (!ws) throw new Error(`Hoja "${hojaPrincipal}" no encontrada`)

  const celdas = Object.keys(ws).filter(k => !k.startsWith('!'))

  // Leer encabezados (fila 1)
  const encabezados = {}
  celdas.forEach(ref => {
    const m = ref.match(/^([A-Z]+)1$/)
    if (m) encabezados[m[1]] = ws[ref].v ? String(ws[ref].v).trim() : ''
  })

  stats.columnas = Object.keys(encabezados).length

  // Contar filas
  let maxFila = 1
  celdas.forEach(ref => {
    const m = ref.match(/(\d+)$/)
    if (m) maxFila = Math.max(maxFila, parseInt(m[1]))
  })
  stats.filas = Math.max(0, maxFila - 1)

  // Inicializar tracking de calificaciones
  Object.values(encabezados).forEach(nombre => {
    if (esColumnaCalificacion(nombre)) {
      stats.valoresCalif[nombre] = new Set()
    }
  })

  let procesadas = 0
  const total = celdas.length

  celdas.forEach(ref => {
    const cell = ws[ref]
    if (!cell) return

    const m = ref.match(/^([A-Z]+)(\d+)$/)
    if (!m) return
    const [, colLetra, filaStr] = m
    const fila = parseInt(filaStr)

    if (fila === 1) return // no tocar encabezados

    const nombreCol = encabezados[colLetra] || ''

    // Solo celdas de texto — fechas y números intactos
    if (cell.t !== 's') return

    let val = typeof cell.v === 'string' ? cell.v : String(cell.v ?? '')
    const original = val

    // Paso 1: espacios múltiples
    const r1 = limpiarEspacios(val)
    if (r1.cambio) stats.espaciosCorregidos++
    val = r1.valor

    // Paso 2: caracteres especiales
    const r2 = limpiarCaracteresEspeciales(val)
    stats.comillasDobles    += r2.cd
    stats.comillasSencillas += r2.cs
    stats.pipes             += r2.pipes
    val = r2.valor

    // Paso 3: SUBLINEA - TRIM si LARGO > 50
    if (nombreCol === 'SUBLINEA') {
      if (val.trim().length > 50) {
        stats.sublineaMayor50++
        const antes = val
        val = val.replace(/ {2,}/g, ' ').trim()
        if (val !== antes) stats.sublineaTrimmed++
      }
    }

    // Paso 5: Calificación - solo si celda completa es espacio
    if (esColumnaCalificacion(nombreCol)) {
      if (val !== '' && val.trim() === '') {
        stats.califCeldasEspacio++
        val = ''
      }
      if (val) stats.valoresCalif[nombreCol]?.add(val)
    }

    // Aplicar cambio
    if (val !== original) {
      cell.v = val
      cell.w = val
      if (!stats.topColumnas[nombreCol]) stats.topColumnas[nombreCol] = 0
      stats.topColumnas[nombreCol]++
    }

    procesadas++
    if (procesadas % 3000 === 0) {
      const pct = Math.round((procesadas / total) * 100)
      onProgreso?.(`Procesando... ${pct}%`)
    }
  })

  // Convertir Sets a arrays ordenados
  Object.keys(stats.valoresCalif).forEach(k => {
    stats.valoresCalif[k] = [...stats.valoresCalif[k]].sort()
  })

  return { workbook, stats }
}
