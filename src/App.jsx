import { useState, useCallback, useRef } from 'react'
import * as XLSX from 'xlsx'
import {
  Upload, FileSpreadsheet, Download, CheckCircle2,
  AlertCircle, Loader2, BarChart3, X, ChevronDown,
  ChevronUp, Trash2, FileCheck, TrendingUp, Shield,
  Database, FileText
} from 'lucide-react'
import { limpiarCartera } from './utils/cartera'

function StatCard({ label, value, color = 'blue', icon: Icon }) {
  const styles = {
    blue  : { card: 'bg-white border-blue-200',   badge: 'bg-blue-50',   text: 'text-blue-700',   val: 'text-blue-800'   },
    green : { card: 'bg-white border-green-200',  badge: 'bg-green-50',  text: 'text-green-700',  val: 'text-green-800'  },
    amber : { card: 'bg-white border-amber-200',  badge: 'bg-amber-50',  text: 'text-amber-700',  val: 'text-amber-800'  },
    red   : { card: 'bg-white border-red-200',    badge: 'bg-red-50',    text: 'text-red-700',    val: 'text-red-800'    },
    purple: { card: 'bg-white border-purple-200', badge: 'bg-purple-50', text: 'text-purple-700', val: 'text-purple-800' },
    gray  : { card: 'bg-white border-gray-200',   badge: 'bg-gray-50',   text: 'text-gray-600',   val: 'text-gray-800'   },
  }
  const s = styles[color] || styles.blue
  return (
    <div className={`rounded-xl border ${s.card} p-5 shadow-sm flex flex-col gap-3`}>
      <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wide ${s.text}`}>
        {Icon && <div className={`w-6 h-6 rounded-md ${s.badge} flex items-center justify-center`}>
          <Icon size={13} />
        </div>}
        {label}
      </div>
      <div className={`text-3xl font-bold ${s.val}`}>
        {typeof value === 'number' ? value.toLocaleString('es-CO') : value}
      </div>
    </div>
  )
}

function PasoProgreso({ numero, label, activo, completado }) {
  return (
    <div className={`flex items-center gap-3 py-2.5 px-4 rounded-lg transition-all
      ${activo ? 'bg-blue-50 border border-blue-200' : 'border border-transparent'}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all
        ${completado ? 'bg-green-500 text-white shadow-sm'
          : activo ? 'bg-blue-600 text-white shadow-sm'
          : 'bg-gray-200 text-gray-500'}`}>
        {completado ? <CheckCircle2 size={14} /> : numero}
      </div>
      <span className={`text-sm font-medium ${activo ? 'text-blue-700' : completado ? 'text-gray-400' : 'text-gray-500'}`}>
        {label}
      </span>
      {activo && <Loader2 size={14} className="ml-auto animate-spin text-blue-500" />}
      {completado && <CheckCircle2 size={14} className="ml-auto text-green-500" />}
    </div>
  )
}

const PASOS = [
  'Leyendo archivo Excel...',
  'Cargando estructura de datos...',
  'Limpiando espacios múltiples...',
  'Eliminando caracteres especiales...',
  'Procesando columna SUBLINEA...',
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
        if (msg.includes('50'))         setPasoActual(4)
        else if (msg.includes('Hoja'))  setPasoActual(5)
        else if (msg.includes('cal'))   setPasoActual(6)
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
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ── HEADER ── */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-0">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow">
                <FileSpreadsheet size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-gray-900 leading-tight">
                  Automatización Limpieza Cartera
                </h1>
                <p className="text-xs text-gray-500">Dusakawi EPS · Módulo ETL</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
              <Shield size={13} className="text-green-600" />
              <span className="text-xs font-medium text-green-700">Procesamiento local seguro</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── SUBHEADER AZUL ── */}
      <div className="bg-blue-600 text-white">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <h2 className="text-xl font-bold">Limpieza y Validación de Reportes</h2>
          <p className="text-blue-200 text-sm mt-1">
            Carga tu archivo Excel · El sistema aplica automáticamente todas las reglas del manual
          </p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto w-full px-6 py-8 flex-1 space-y-6">

        {/* ── ZONA DE CARGA ── */}
        {!resultado && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <Database size={16} className="text-blue-600" />
              <h3 className="font-semibold text-gray-800 text-sm">Cargar Archivo</h3>
            </div>
            <div className="p-6">
              <div
                onDrop={onDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => !archivo && inputRef.current?.click()}
                className={`relative rounded-xl border-2 border-dashed transition-all
                  ${archivo
                    ? 'border-blue-400 bg-blue-50 cursor-default'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/40 bg-gray-50 cursor-pointer'}`}
              >
                <input
                  ref={inputRef} type="file" accept=".xlsx" className="hidden"
                  onChange={e => handleArchivo(e.target.files[0])}
                />
                <div className="p-10 flex flex-col items-center gap-3 text-center">
                  {!archivo ? (
                    <>
                      <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center">
                        <Upload size={26} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-gray-700 font-semibold">
                          Arrastra el archivo Excel aquí
                        </p>
                        <p className="text-gray-400 text-sm mt-1">
                          o haz clic para seleccionarlo ·{' '}
                          <span className="text-blue-600 font-medium">.xlsx</span> · Soporta archivos de 60 MB+
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center">
                        <FileCheck size={26} className="text-green-600" />
                      </div>
                      <div>
                        <p className="text-gray-800 font-bold text-lg">{archivo.name}</p>
                        <p className="text-gray-500 text-sm mt-0.5">
                          {(archivo.size / 1024 / 1024).toFixed(2)} MB · Listo para procesar
                        </p>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); limpiar() }}
                        className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition"
                      ><X size={15} /></button>
                    </>
                  )}
                </div>
              </div>

              {/* Botones */}
              {archivo && !resultado && (
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={procesar} disabled={procesando}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-6
                      bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed
                      rounded-xl font-semibold text-white transition-all text-sm shadow-sm"
                  >
                    {procesando
                      ? <><Loader2 size={17} className="animate-spin" /> Procesando...</>
                      : <><BarChart3 size={17} /> Iniciar Limpieza</>}
                  </button>
                  {!procesando && (
                    <button onClick={limpiar}
                      className="py-3 px-4 rounded-xl border border-gray-300
                        hover:border-gray-400 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition">
                      <Trash2 size={17} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ERROR ── */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
            <AlertCircle size={18} />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {/* ── PROGRESO ── */}
        {procesando && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                <Loader2 size={15} className="animate-spin text-blue-600" />
                Procesando archivo...
              </h3>
            </div>
            <div className="p-4 space-y-1">
              {PASOS.map((paso, i) => (
                <PasoProgreso key={i} numero={i + 1} label={paso}
                  activo={pasoActual === i} completado={pasoActual > i} />
              ))}
            </div>
          </div>
        )}

        {/* ── RESULTADO ── */}
        {resultado && stats && (
          <div className="space-y-6">

            {/* Banner éxito */}
            <div className="bg-white rounded-2xl border border-green-300 shadow-sm overflow-hidden">
              <div className="bg-green-600 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <CheckCircle2 size={28} className="text-white flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-bold text-white text-lg">Proceso completado exitosamente</p>
                  <p className="text-green-100 text-sm">{resultado.nombre}</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button onClick={descargar}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2
                      py-2.5 px-5 bg-white hover:bg-green-50 rounded-xl
                      font-semibold text-green-700 transition text-sm shadow-sm">
                    <Download size={16} /> Descargar v02
                  </button>
                  <button onClick={limpiar}
                    className="py-2.5 px-3 rounded-xl bg-green-500 hover:bg-green-400 text-white transition">
                    <X size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* RESUMEN GENERAL */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <TrendingUp size={16} className="text-blue-600" />
                <h3 className="font-bold text-gray-800">Resumen General</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <StatCard label="Registros procesados" value={stats.filas}    color="blue"   icon={Database} />
                  <StatCard label="Columnas procesadas"   value={stats.columnas} color="purple" icon={FileText} />
                  <StatCard label="Hoja principal"        value={stats.hojaPrincipal} color="gray" icon={FileSpreadsheet} />
                  <StatCard
                    label="Hojas eliminadas"
                    value={stats.hojasEliminadas.length > 0 ? stats.hojasEliminadas.join(', ') : 'Ninguna'}
                    color={stats.hojasEliminadas.length > 0 ? 'amber' : 'green'}
                    icon={Trash2}
                  />
                </div>
              </div>
            </div>

            {/* CAMBIOS POR TIPO */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <BarChart3 size={16} className="text-blue-600" />
                <h3 className="font-bold text-gray-800">Cambios por Tipo</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <StatCard label="Espacios múltiples corregidos"          value={stats.espaciosCorregidos} color="blue" />
                  <StatCard label='Comillas dobles " eliminadas'            value={stats.comillasDobles}    color="amber" />
                  <StatCard label="Comillas simples ' eliminadas"           value={stats.comillasSencillas} color="amber" />
                  <StatCard label="Pipes | eliminados"                      value={stats.pipes}             color="amber" />
                  <StatCard label="Total caracteres especiales eliminados"  value={totalEspeciales}         color="red" />
                  <StatCard label="Celdas calificación vacías corregidas"   value={stats.califCeldasEspacio} color="purple" />
                </div>
              </div>
            </div>

            {/* SUBLINEA */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-800">Columna SUBLINEA</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <StatCard label="Registros con LARGO > 50 detectados" value={stats.sublineaMayor50} color="amber" />
                  <StatCard label="Registros con TRIM aplicado"          value={stats.sublineaTrimmed} color="green" />
                </div>
              </div>
            </div>

            {/* CALIFICACIONES */}
            {Object.keys(stats.valoresCalif).length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                  <Shield size={16} className="text-blue-600" />
                  <h3 className="font-bold text-gray-800">Valores por Columna de Calificación</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Columna</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Valores únicos encontrados</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {Object.entries(stats.valoresCalif).map(([col, vals]) => (
                        <tr key={col} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-3 font-mono text-blue-700 text-xs font-semibold whitespace-nowrap">{col}</td>
                          <td className="px-6 py-3">
                            <div className="flex flex-wrap gap-1.5">
                              {vals.map(v => (
                                <span key={v}
                                  className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
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
              </div>
            )}

            {/* TOP COLUMNAS */}
            {topCols.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <button
                  onClick={() => setMostrarDetalle(!mostrarDetalle)}
                  className="w-full px-6 py-4 border-b border-gray-100 flex items-center justify-between hover:bg-gray-50 transition"
                >
                  <h3 className="font-bold text-gray-800">Top columnas con más celdas modificadas</h3>
                  {mostrarDetalle ? <ChevronUp size={18} className="text-gray-500" /> : <ChevronDown size={18} className="text-gray-500" />}
                </button>
                {mostrarDetalle && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase w-10">#</th>
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Columna</th>
                          <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Celdas modificadas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {topCols.map(([col, cnt], i) => (
                          <tr key={col} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-3 text-gray-400 text-xs font-medium">{i + 1}</td>
                            <td className="px-6 py-3 font-mono text-gray-700 text-xs">{col}</td>
                            <td className="px-6 py-3 text-right">
                              <span className="px-3 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs">
                                {cnt.toLocaleString('es-CO')}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

          </div>
        )}
      </main>

      {/* ── FOOTER ── */}
      <footer className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            © 2026 Dusakawi EPS · Automatización Limpieza Cartera
          </span>
          <span className="text-xs text-gray-400">
            Diseñado por <span className="font-semibold text-gray-500">Ing. Hernán Conrado Medina</span>
          </span>
        </div>
      </footer>
    </div>
  )
}
