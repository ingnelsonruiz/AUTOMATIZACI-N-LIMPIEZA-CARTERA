// ─────────────────────────────────────────────────────────────────────────────
// CarteraClean Pro  –  Frontend React + Vite
// Flujo: POST /iniciar → polling GET /progreso/{id} → GET /descargar/{id}
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback, useRef, useEffect } from 'react'
import {
  Upload, FileSpreadsheet, Download, CheckCircle2,
  AlertCircle, Loader2, BarChart3, X, ChevronDown,
  ChevronUp, Trash2, FileCheck, TrendingUp, Shield,
  Database, FileText, Wifi
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTES AUXILIARES
// ─────────────────────────────────────────────────────────────────────────────

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
        {Icon && <div className={`w-6 h-6 rounded-md ${s.badge} flex items-center justify-center`}><Icon size={13} /></div>}
        {label}
      </div>
      <div className={`text-3xl font-bold ${s.val}`}>
        {typeof value === 'number' ? value.toLocaleString('es-CO') : value}
      </div>
    </div>
  )
}

// Barra de progreso con filas en tiempo real
function ProgresoServidor({ filas, total, pct, fase }) {
  const fases = {
    iniciando  : { label: 'Iniciando proceso...',            color: 'bg-blue-400' },
    leyendo    : { label: 'Leyendo estructura del archivo...', color: 'bg-blue-500' },
    procesando : { label: 'Aplicando reglas de limpieza...',  color: 'bg-blue-600' },
    completado : { label: 'Finalizando...',                   color: 'bg-green-500' },
  }
  const info = fases[fase] || fases.procesando

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
        <Loader2 size={15} className="animate-spin text-blue-600" />
        <h3 className="font-semibold text-gray-800 text-sm">Procesando en servidor...</h3>
      </div>
      <div className="p-6 space-y-5">

        {/* Fase actual */}
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${info.color} animate-pulse`} />
          <span className="text-sm font-medium text-gray-700">{info.label}</span>
        </div>

        {/* Barra de progreso */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-blue-700">{pct}% completado</span>
            {total > 0 && (
              <span className="text-xs text-gray-500 font-mono">
                {filas.toLocaleString('es-CO')} / {total.toLocaleString('es-CO')} filas
              </span>
            )}
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-700 ease-out"
              style={{ width: `${Math.max(pct, 2)}%` }}
            />
          </div>
          {total > 0 && filas > 0 && (
            <p className="text-xs text-gray-400 mt-1.5 text-right">
              {(total - filas).toLocaleString('es-CO')} filas restantes
            </p>
          )}
        </div>

        {/* Métricas en vivo */}
        {filas > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-xs text-blue-500 font-medium mb-0.5">Procesadas</p>
              <p className="text-lg font-bold text-blue-700">{filas.toLocaleString('es-CO')}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400 font-medium mb-0.5">Total</p>
              <p className="text-lg font-bold text-gray-600">{total > 0 ? total.toLocaleString('es-CO') : '...'}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <p className="text-xs text-green-500 font-medium mb-0.5">Progreso</p>
              <p className="text-lg font-bold text-green-700">{pct}%</p>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-400 text-center">
          No cierres esta ventana · El servidor está procesando tu archivo
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// APP PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  const [archivo, setArchivo]               = useState(null)
  const [procesando, setProcesando]         = useState(false)
  const [uploadPct, setUploadPct]           = useState(0)
  const [progreso, setProgreso]             = useState({ pct: 0, filas: 0, total: 0, fase: 'iniciando' })
  const [error, setError]                   = useState(null)
  const [resultado, setResultado]           = useState(null)
  const [mostrarDetalle, setMostrarDetalle] = useState(false)
  const inputRef   = useRef()
  const pollingRef = useRef(null)   // intervalo de polling
  const MB = 1024 * 1024

  // Limpiar polling al desmontar
  useEffect(() => () => { if (pollingRef.current) clearInterval(pollingRef.current) }, [])

  const handleArchivo = (file) => {
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.xlsx')) { setError('Solo se aceptan archivos .xlsx'); return }
    setArchivo(file); setResultado(null); setError(null)
  }

  const onDrop = useCallback((e) => { e.preventDefault(); handleArchivo(e.dataTransfer.files[0]) }, [])

  // ── POLLING: consulta /progreso/{id} cada 2 segundos ─────────────────────
  const iniciarPolling = (jobId) => {
    pollingRef.current = setInterval(async () => {
      try {
        const res  = await fetch(`${API_URL}/progreso/${jobId}`)
        const data = await res.json()

        setProgreso({
          pct  : data.pct             || 0,
          filas: data.filas_procesadas || 0,
          total: data.total_filas      || 0,
          fase : data.status           || 'procesando',
        })

        if (data.status === 'completado') {
          clearInterval(pollingRef.current)
          await descargarResultado(jobId)
        } else if (data.status === 'error') {
          clearInterval(pollingRef.current)
          setError('Error en el servidor: ' + (data.error || 'desconocido'))
          setProcesando(false)
        }
      } catch (_) {
        // Ignorar errores temporales de red, seguir polling
      }
    }, 2000)
  }

  // ── DESCARGA: GET /descargar/{id} ─────────────────────────────────────────
  const descargarResultado = async (jobId) => {
    try {
      const res = await fetch(`${API_URL}/descargar/${jobId}`)
      if (!res.ok) { throw new Error('Error descargando resultado') }

      const statsRaw = res.headers.get('X-Stats')
      const stats    = statsRaw ? JSON.parse(statsRaw) : {}
      const blob     = await res.blob()
      const nombre   = archivo.name.replace(/\.xlsx$/i, '_v02.xlsx')

      setResultado({ blob, nombre, stats })
      setProcesando(false)
    } catch (err) {
      setError('Error descargando el archivo: ' + err.message)
      setProcesando(false)
    }
  }

  // ── PROCESAR: POST /iniciar → job_id → polling ───────────────────────────
  const procesar = () => {
    if (!archivo) return
    setProcesando(true)
    setError(null)
    setResultado(null)
    setUploadPct(0)
    setProgreso({ pct: 0, filas: 0, total: 0, fase: 'iniciando' })

    const formData = new FormData()
    formData.append('file', archivo)

    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) setUploadPct(Math.round((e.loaded / e.total) * 100))
    })

    xhr.addEventListener('load', async () => {
      if (xhr.status !== 200) {
        let msg = 'Error al iniciar el procesamiento'
        try { msg = JSON.parse(xhr.responseText).detail || msg } catch (_) {}
        setError(msg); setProcesando(false); return
      }
      const { job_id } = JSON.parse(xhr.responseText)
      setProgreso(p => ({ ...p, fase: 'leyendo' }))
      iniciarPolling(job_id)
    })

    xhr.addEventListener('error', () => {
      setError('No se pudo conectar con el servidor. Verifica que el backend esté activo en Railway.')
      setProcesando(false)
    })

    xhr.open('POST', `${API_URL}/iniciar`)
    xhr.send(formData)
  }

  const descargar = () => {
    if (!resultado) return
    const url = URL.createObjectURL(resultado.blob)
    const a = document.createElement('a'); a.href = url; a.download = resultado.nombre; a.click()
    URL.revokeObjectURL(url)
  }

  const limpiar = () => {
    if (pollingRef.current) clearInterval(pollingRef.current)
    setArchivo(null); setResultado(null); setError(null); setProcesando(false)
    setProgreso({ pct: 0, filas: 0, total: 0, fase: 'iniciando' })
  }

  const stats    = resultado?.stats
  const totalEsp = stats ? stats.comillasDobles + stats.comillasSencillas + stats.pipes : 0
  const topCols  = stats ? Object.entries(stats.topColumnas).sort((a,b) => b[1]-a[1]).slice(0,10) : []

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-0">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow">
                <FileSpreadsheet size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-gray-900 leading-tight">CarteraClean Pro</h1>
                <p className="text-xs text-gray-500">Módulo ETL · Limpieza Inteligente de Cartera</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
              <Wifi size={13} className="text-green-600" />
              <span className="text-xs font-medium text-green-700">Servidor activo</span>
            </div>
          </div>
        </div>
      </header>

      {/* SUBHEADER */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 text-white">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-8 bg-white/40 rounded-full" />
            <h2 className="text-2xl font-extrabold tracking-tight">Limpieza y Validación Automática de Cartera</h2>
          </div>
          <p className="text-blue-100 text-sm ml-5">Carga tu archivo Excel · Procesamiento en servidor · Sin límite de tamaño</p>
          <div className="flex flex-wrap gap-3 mt-4 ml-5">
            <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">⚡ Procesamiento en servidor</span>
            <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">📁 Sin límite de tamaño</span>
            <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">🔒 Archivo no almacenado</span>
            <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">📊 Progreso en tiempo real</span>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto w-full px-6 py-8 flex-1 space-y-6">

        {/* ZONA DE CARGA */}
        {!resultado && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <Database size={16} className="text-blue-600" />
              <h3 className="font-semibold text-gray-800 text-sm">Cargar Archivo</h3>
            </div>
            <div className="p-6">
              <div
                onDrop={onDrop} onDragOver={e => e.preventDefault()}
                onClick={() => !archivo && inputRef.current?.click()}
                className={`relative rounded-xl border-2 border-dashed transition-all
                  ${archivo ? 'border-blue-400 bg-blue-50 cursor-default'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/40 bg-gray-50 cursor-pointer'}`}
              >
                <input ref={inputRef} type="file" accept=".xlsx" className="hidden"
                  onChange={e => handleArchivo(e.target.files[0])} />
                <div className="p-10 flex flex-col items-center gap-3 text-center">
                  {!archivo ? (
                    <>
                      <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center">
                        <Upload size={26} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-gray-700 font-semibold">Arrastra el archivo Excel aquí</p>
                        <p className="text-gray-400 text-sm mt-1">o haz clic · <span className="text-blue-600 font-medium">.xlsx</span> · Cualquier tamaño</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center">
                        <FileCheck size={26} className="text-green-600" />
                      </div>
                      <div>
                        <p className="text-gray-800 font-bold text-lg">{archivo.name}</p>
                        <p className="text-gray-500 text-sm mt-0.5">{(archivo.size/MB).toFixed(2)} MB · Listo para procesar</p>
                      </div>
                      <button onClick={e => { e.stopPropagation(); limpiar() }}
                        className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition">
                        <X size={15} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Barra subida */}
              {procesando && uploadPct > 0 && uploadPct < 100 && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Subiendo archivo al servidor...</span><span>{uploadPct}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadPct}%` }} />
                  </div>
                </div>
              )}

              {archivo && !resultado && (
                <div className="flex gap-3 mt-4">
                  <button onClick={procesar} disabled={procesando}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-6
                      bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed
                      rounded-xl font-semibold text-white transition-all text-sm shadow-sm">
                    {procesando
                      ? <><Loader2 size={17} className="animate-spin" /> Procesando...</>
                      : <><BarChart3 size={17} /> Iniciar Limpieza</>}
                  </button>
                  {!procesando && (
                    <button onClick={limpiar} className="py-3 px-4 rounded-xl border border-gray-300 hover:border-gray-400 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition">
                      <Trash2 size={17} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {/* PROGRESO EN TIEMPO REAL */}
        {procesando && uploadPct >= 100 && (
          <ProgresoServidor
            filas={progreso.filas}
            total={progreso.total}
            pct={progreso.pct}
            fase={progreso.fase}
          />
        )}

        {/* RESULTADO */}
        {resultado && stats && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-green-300 shadow-sm overflow-hidden">
              <div className="bg-green-600 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <CheckCircle2 size={28} className="text-white flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-bold text-white text-lg">Proceso completado exitosamente</p>
                  <p className="text-green-100 text-sm">{resultado.nombre}</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button onClick={descargar}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 py-2.5 px-5 bg-white hover:bg-green-50 rounded-xl font-semibold text-green-700 transition text-sm shadow-sm">
                    <Download size={16} /> Descargar v02
                  </button>
                  <button onClick={limpiar} className="py-2.5 px-3 rounded-xl bg-green-500 hover:bg-green-400 text-white transition"><X size={16} /></button>
                </div>
              </div>
            </div>

            {/* Resumen */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <TrendingUp size={16} className="text-blue-600" /><h3 className="font-bold text-gray-800">Resumen General</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <StatCard label="Registros procesados" value={stats.filas}    color="blue"   icon={Database} />
                  <StatCard label="Columnas procesadas"   value={stats.columnas} color="purple" icon={FileText} />
                  <StatCard label="Hoja principal"        value={stats.hojaPrincipal}  color="gray"  icon={FileSpreadsheet} />
                  <StatCard label="Hojas eliminadas"
                    value={stats.hojasEliminadas?.length > 0 ? stats.hojasEliminadas.join(', ') : 'Ninguna'}
                    color={stats.hojasEliminadas?.length > 0 ? 'amber' : 'green'} icon={Trash2} />
                </div>
              </div>
            </div>

            {/* Cambios */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <BarChart3 size={16} className="text-blue-600" /><h3 className="font-bold text-gray-800">Cambios por Tipo</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <StatCard label="Espacios múltiples corregidos"        value={stats.espaciosCorregidos} color="blue" />
                  <StatCard label='Comillas dobles " eliminadas'          value={stats.comillasDobles}    color="amber" />
                  <StatCard label="Comillas simples ' eliminadas"         value={stats.comillasSencillas} color="amber" />
                  <StatCard label="Pipes | eliminados"                    value={stats.pipes}             color="amber" />
                  <StatCard label="Total caracteres especiales"           value={totalEsp}                color="red" />
                  <StatCard label="Calificaciones con espacio corregidas" value={stats.califCeldasEspacio} color="purple" />
                </div>
              </div>
            </div>

            {/* SUBLINEA */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100"><h3 className="font-bold text-gray-800">Columna SUBLINEA</h3></div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <StatCard label="Registros con LARGO > 50" value={stats.sublineaMayor50} color="amber" />
                  <StatCard label="Registros con TRIM aplicado" value={stats.sublineaTrimmed} color="green" />
                </div>
              </div>
            </div>

            {/* Calificaciones */}
            {stats.valoresCalif && Object.keys(stats.valoresCalif).length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                  <Shield size={16} className="text-blue-600" /><h3 className="font-bold text-gray-800">Valores por Columna de Calificación</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Columna</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Valores únicos</th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      {Object.entries(stats.valoresCalif).map(([col, vals]) => (
                        <tr key={col} className="hover:bg-gray-50">
                          <td className="px-6 py-3 font-mono text-blue-700 text-xs font-semibold">{col}</td>
                          <td className="px-6 py-3"><div className="flex flex-wrap gap-1.5">
                            {vals.map(v => <span key={v} className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">{v}</span>)}
                          </div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Top columnas */}
            {topCols.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <button onClick={() => setMostrarDetalle(!mostrarDetalle)}
                  className="w-full px-6 py-4 border-b border-gray-100 flex items-center justify-between hover:bg-gray-50 transition">
                  <h3 className="font-bold text-gray-800">Top columnas con más celdas modificadas</h3>
                  {mostrarDetalle ? <ChevronUp size={18} className="text-gray-500" /> : <ChevronDown size={18} className="text-gray-500" />}
                </button>
                {mostrarDetalle && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase w-10">#</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Columna</th>
                        <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Celdas modificadas</th>
                      </tr></thead>
                      <tbody className="divide-y divide-gray-100">
                        {topCols.map(([col, cnt], i) => (
                          <tr key={col} className="hover:bg-gray-50">
                            <td className="px-6 py-3 text-gray-400 text-xs">{i+1}</td>
                            <td className="px-6 py-3 font-mono text-gray-700 text-xs">{col}</td>
                            <td className="px-6 py-3 text-right">
                              <span className="px-3 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs">{cnt.toLocaleString('es-CO')}</span>
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

      <footer className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-xs text-gray-400">© 2026 CarteraClean Pro · Módulo ETL</span>
          <span className="text-xs text-gray-400">Diseñado por <span className="font-semibold text-gray-600">Ing. Hernán Conrado Medina</span></span>
        </div>
      </footer>
    </div>
  )
}
