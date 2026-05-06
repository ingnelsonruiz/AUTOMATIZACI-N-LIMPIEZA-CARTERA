import { useState, useCallback, useRef } from 'react'
import * as XLSX from 'xlsx'
import {
  Upload, FileSpreadsheet, Download, CheckCircle2,
  AlertCircle, Loader2, BarChart3, X, ChevronDown,
  ChevronUp, Trash2, FileCheck
} from 'lucide-react'
import { limpiarCartera } from './utils/cartera'

function StatCard({ label, value, color = 'blue' }) {
  const colors = {
    blue  : 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    green : 'bg-green-500/10 border-green-500/30 text-green-400',
    yellow: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    red   : 'bg-red-500/10 border-red-500/30 text-red-400',
    purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
  }
  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-2 ${colors[color]}`}>
      <div className="text-xs opacity-60 leading-tight">{label}</div>
      <div className="text-2xl font-bold">
        {typeof value === 'number' ? value.toLocaleString('es-CO') : value}
      </div>
    </div>
  )
}

function PasoProgreso({ numero, label, activo, completado }) {
  return (
    <div className={`flex items-center gap-3 py-2 px-3 rounded-lg transition-all
      ${activo ? 'bg-blue-500/20 border border-blue-500/40' : ''}`}>
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
        ${completado ? 'bg-green-500 text-white'
          : activo ? 'bg-blue-500 text-white'
          : 'bg-slate-700 text-slate-400'}`}>
        {completado ? '✓' : numero}
      </div>
      <span className={`text-sm ${activo ? 'text-blue-300 font-medium' : 'text-slate-400'}`}>
        {label}
      </span>
      {activo && <Loader2 size={14} className="ml-auto animate-spin text-blue-400" />}
    </div>
  )
}

const PASOS = [
  'Leyendo archivo Excel...',
  'Cargando estructura de datos...',
  'Limpiando espacios múltiples...',
  'Eliminando caracteres especiales (" \' |)...',
  'Procesando columna SUBLINEA (LARGO > 50)...',
  'Eliminando hojas adicionales...',
  'Limpiando columnas de calificación...',
  'Generando archivo v02...',
]

export default function App() {
  const [archivo, setArchivo]           = useState(null)
  const [procesando, setProcesando]     = useState(false)
  const [pasoActual, setPasoActual]     = useState(-1)
  const [error, setError]               = useState(null)
  const [resultado, setResultado]       = useState(null)
  const [mostrarDetalle, setMostrarDetalle] = useState(false)
  const inputRef = useRef()

  const handleArchivo = (file) => {
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      setError('Solo se aceptan archivos .xlsx')
      return
    }
    setArchivo(file)
    setResultado(null)
    setError(null)
  }

  const onDrop = useCallback((e) => {
    e.preventDefault()
    handleArchivo(e.dataTransfer.files[0])
  }, [])

  const procesar = async () => {
    if (!archivo) return
    setProcesando(true)
    setError(null)
    setResultado(null)
    setPasoActual(0)

    try {
      await new Promise(r => setTimeout(r, 60))
      setPasoActual(1)
      const buffer = await archivo.arrayBuffer()

      setPasoActual(2)
      await new Promise(r => setTimeout(r, 60))
      const wb = XLSX.read(buffer, { type: 'array', cellDates: false })

      setPasoActual(3)
      await new Promise(r => setTimeout(r, 60))

      const { workbook, stats } = limpiarCartera(wb, (msg) => {
        if (msg.includes('50'))        setPasoActual(4)
        else if (msg.includes('Hoja')) setPasoActual(5)
        else if (msg.includes('cal'))  setPasoActual(6)
      })

      setPasoActual(7)
      await new Promise(r => setTimeout(r, 60))

      const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
      const blob  = new Blob([wbout], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      const nombreSalida = archivo.name.replace(/\.xlsx$/i, '_v02.xlsx')
      setResultado({ blob, nombre: nombreSalida, stats })

    } catch (err) {
      console.error(err)
      setError('Error al procesar: ' + err.message)
    } finally {
      setProcesando(false)
      setPasoActual(-1)
    }
  }

  const descargar = () => {
    if (!resultado) return
    const url = URL.createObjectURL(resultado.blob)
    const a = document.createElement('a')
    a.href = url
    a.download = resultado.nombre
    a.click()
    URL.revokeObjectURL(url)
  }

  const limpiar = () => { setArchivo(null); setResultado(null); setError(null) }

  const stats = resultado?.stats
  const totalEspeciales = stats
    ? stats.comillasDobles + stats.comillasSencillas + stats.pipes : 0
  const topCols = stats
    ? Object.entries(stats.topColumnas).sort((a, b) => b[1] - a[1]).slice(0, 10) : []

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">

      {/* HEADER */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
              <FileSpreadsheet size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-white leading-tight">
                Automatización Limpieza Cartera
              </h1>
              <p className="text-xs text-slate-400">Dusakawi EPS · v2.0</p>
            </div>
          </div>
          <span className="text-xs text-slate-500 hidden sm:block">
            Procesamiento local · Sin límite de tamaño
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto w-full px-6 py-10 flex-1 space-y-8">

        {/* ZONA DE CARGA */}
        {!resultado && (
          <div
            onDrop={onDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => !archivo && inputRef.current?.click()}
            className={`relative rounded-2xl border-2 border-dashed transition-all
              ${archivo
                ? 'border-blue-500/50 bg-blue-500/5 cursor-default'
                : 'border-slate-700 hover:border-blue-500/50 hover:bg-slate-900/40 bg-slate-900/20 cursor-pointer'}`}
          >
            <input
              ref={inputRef} type="file" accept=".xlsx" className="hidden"
              onChange={e => handleArchivo(e.target.files[0])}
            />
            <div className="p-14 flex flex-col items-center gap-4 text-center">
              {!archivo ? (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center">
                    <Upload size={28} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="text-slate-200 font-medium text-lg">
                      Arrastra el archivo Excel aquí
                    </p>
                    <p className="text-slate-500 text-sm mt-1">
                      o haz clic para seleccionarlo ·{' '}
                      <span className="text-blue-400">.xlsx</span> · Soporta archivos de 60 MB+
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                    <FileCheck size={28} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-lg">{archivo.name}</p>
                    <p className="text-slate-400 text-sm mt-1">
                      {(archivo.size / 1024 / 1024).toFixed(2)} MB · Listo para procesar
                    </p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); limpiar() }}
                    className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition"
                  ><X size={16} /></button>
                </>
              )}
            </div>
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
            <AlertCircle size={18} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* BOTONES */}
        {archivo && !resultado && (
          <div className="flex gap-3">
            <button
              onClick={procesar} disabled={procesando}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6
                bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 disabled:cursor-not-allowed
                rounded-xl font-semibold text-white transition-all text-sm"
            >
              {procesando
                ? <><Loader2 size={18} className="animate-spin" /> Procesando...</>
                : <><BarChart3 size={18} /> Iniciar Limpieza</>}
            </button>
            {!procesando && (
              <button onClick={limpiar}
                className="py-3.5 px-4 rounded-xl border border-slate-700
                  hover:border-slate-600 text-slate-400 hover:text-slate-300 transition">
                <Trash2 size={18} />
              </button>
            )}
          </div>
        )}

        {/* PROGRESO */}
        {procesando && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-1.5">
            <h3 className="text-sm font-medium text-slate-400 mb-4">Progreso del proceso</h3>
            {PASOS.map((paso, i) => (
              <PasoProgreso key={i} numero={i + 1} label={paso}
                activo={pasoActual === i} completado={pasoActual > i} />
            ))}
          </div>
        )}

        {/* RESULTADO */}
        {resultado && stats && (
          <div className="space-y-8">

            {/* Banner éxito */}
            <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-6
              flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <CheckCircle2 size={32} className="text-green-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-green-300 text-lg">Proceso completado exitosamente</p>
                <p className="text-sm text-green-400/70 mt-0.5">{resultado.nombre}</p>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <button onClick={descargar}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2
                    py-2.5 px-5 bg-green-600 hover:bg-green-500 rounded-xl
                    font-semibold text-white transition text-sm">
                  <Download size={16} /> Descargar v02
                </button>
                <button onClick={limpiar}
                  className="py-2.5 px-4 rounded-xl border border-slate-700
                    hover:border-slate-600 text-slate-400 hover:text-slate-300 transition">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* RESUMEN GENERAL */}
            <section>
              <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                <BarChart3 size={18} className="text-blue-400" /> Resumen General
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Registros procesados" value={stats.filas}    color="blue" />
                <StatCard label="Columnas procesadas"   value={stats.columnas} color="purple" />
                <StatCard label="Hoja principal"        value={stats.hojaPrincipal} color="blue" />
                <StatCard label="Hojas eliminadas"
                  value={stats.hojasEliminadas.length > 0 ? stats.hojasEliminadas.join(', ') : 'Ninguna'}
                  color={stats.hojasEliminadas.length > 0 ? 'yellow' : 'green'} />
              </div>
            </section>

            {/* CAMBIOS POR TIPO */}
            <section>
              <h2 className="text-base font-semibold text-white mb-3">Cambios por Tipo</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <StatCard label="Celdas con espacios múltiples corregidas" value={stats.espaciosCorregidos} color="blue" />
                <StatCard label='Comillas dobles " eliminadas'              value={stats.comillasDobles}    color="yellow" />
                <StatCard label="Comillas simples ' eliminadas"             value={stats.comillasSencillas} color="yellow" />
                <StatCard label="Pipes | eliminados"                        value={stats.pipes}             color="yellow" />
                <StatCard label="Total caracteres especiales eliminados"    value={totalEspeciales}         color="red" />
                <StatCard label="Celdas calificación vacías corregidas"     value={stats.califCeldasEspacio} color="purple" />
              </div>
            </section>

            {/* SUBLINEA */}
            <section>
              <h2 className="text-base font-semibold text-white mb-3">Columna SUBLINEA</h2>
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Registros con LARGO > 50 detectados" value={stats.sublineaMayor50} color="yellow" />
                <StatCard label="Registros con TRIM aplicado"          value={stats.sublineaTrimmed} color="green" />
              </div>
            </section>

            {/* CALIFICACIONES */}
            {Object.keys(stats.valoresCalif).length > 0 && (
              <section>
                <h2 className="text-base font-semibold text-white mb-3">
                  Valores por Columna de Calificación
                </h2>
                <div className="rounded-xl border border-slate-800 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-800/70">
                        <th className="text-left px-4 py-3 text-slate-400 font-medium">Columna</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium">Valores únicos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(stats.valoresCalif).map(([col, vals], i) => (
                        <tr key={col} className={i % 2 === 0 ? 'bg-slate-900/40' : ''}>
                          <td className="px-4 py-3 font-mono text-blue-300 text-xs whitespace-nowrap">{col}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1.5">
                              {vals.map(v => (
                                <span key={v}
                                  className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-xs font-mono">
                                  {v}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* TOP COLUMNAS */}
            {topCols.length > 0 && (
              <section>
                <button
                  onClick={() => setMostrarDetalle(!mostrarDetalle)}
                  className="flex items-center gap-2 text-base font-semibold text-white mb-3 hover:text-blue-300 transition"
                >
                  Top columnas con más celdas modificadas
                  {mostrarDetalle ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {mostrarDetalle && (
                  <div className="rounded-xl border border-slate-800 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-800/70">
                          <th className="text-left px-4 py-3 text-slate-400 font-medium w-10">#</th>
                          <th className="text-left px-4 py-3 text-slate-400 font-medium">Columna</th>
                          <th className="text-right px-4 py-3 text-slate-400 font-medium">Celdas modificadas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topCols.map(([col, cnt], i) => (
                          <tr key={col} className={i % 2 === 0 ? 'bg-slate-900/40' : ''}>
                            <td className="px-4 py-3 text-slate-500 text-xs">{i + 1}</td>
                            <td className="px-4 py-3 font-mono text-slate-300 text-xs">{col}</td>
                            <td className="px-4 py-3 text-right">
                              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono text-xs">
                                {cnt.toLocaleString('es-CO')}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

          </div>
        )}
      </main>

      <footer className="border-t border-slate-800 py-4 text-center text-xs text-slate-600">
        Dusakawi EPS · Automatización Limpieza Cartera · Procesamiento 100% local · Sin servidores
      </footer>
    </div>
  )
}
