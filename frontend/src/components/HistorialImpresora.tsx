import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

interface ReporteHistorial {
  fecha: string;
  contador: number;
  toner: number;
  toner_negro?: number;
  toner_cian?: number;
  toner_magenta?: number;
  toner_amarillo?: number;
}

interface MovimientoReserva {
  fecha: string;
  tipo_movimiento: string;
  color: string;
  cantidad: number;
  detalle: string;
}

interface DetalleColor {
  color: string;
  codigo_toner: string;
  rendimiento_fabrica: number;
}

interface Impresora {
  id: number;
  numero_serie: string;
  ip: string;
  ubicacion: string;
  modelo: string;
  codigo_toner: string;
  rendimiento_fabrica: number;
  es_color?: boolean;
  detalles_color?: DetalleColor[];
  stock_reserva?: {
    negro: number;
    cian: number;
    magenta: number;
    amarillo: number;
  };
  historial_reserva?: MovimientoReserva[];
  historial: ReporteHistorial[];
}

interface ExpedienteProps {
  imp: Impresora;
  onVolver: () => void;
  onEditar: (imp: Impresora) => void;
  onEliminar: (id: number) => void;
  calcularPrediccionDias: (imp: Impresora) => string;
  obtenerColorSemaforo: (nivel: number) => {
    bg: string;
    barra: string;
    estado: string;
    texto: string;
  };
}

export default function HistorialImpresora({
  imp,
  onVolver,
  onEditar,
  onEliminar,
  calcularPrediccionDias,
  obtenerColorSemaforo,
}: ExpedienteProps) {
  const historialValido = imp?.historial || [];
  const modeloNombre = imp?.modelo || "Modelo Kyocera";
  const numeroSerie = imp?.numero_serie || "S/N No disponible";
  const ubicacionFisica = imp?.ubicacion || "Sin ubicación";
  const ipRed = imp?.ip || "No asignada";
  const codigoCartucho = imp?.codigo_toner || "TK-Generico";
  const rendimientoFabrica = imp?.rendimiento_fabrica || 25000;
  const esColor = imp?.es_color || false;

  const tonerActual =
    historialValido.length > 0
      ? historialValido[historialValido.length - 1].toner
      : 100;

  const semaforo =
    typeof obtenerColorSemaforo === "function"
      ? obtenerColorSemaforo(tonerActual)
      : {
          bg: "bg-slate-100 border-slate-300",
          barra: "bg-slate-500",
          texto: "Estable",
        };

  const formatoFecha = (fechaStr: string) => {
    if (!fechaStr) return "Instalación";
    try {
      const opciones: Intl.DateTimeFormatOptions = {
        day: "numeric",
        month: "short",
        year: "numeric",
      };
      return new Date(fechaStr + "T00:00:00").toLocaleDateString(
        "es-MX",
        opciones,
      );
    } catch {
      return fechaStr;
    }
  };

  // 💥 CONSTRUCCIÓN DINÁMICA DE DATASETS (Configurada con tus colores solicitados)
  const generarDatasets = () => {
    if (historialValido.length === 0) {
      return [
        {
          label: "Nivel de Tóner %",
          data: [tonerActual],
          borderColor: "rgb(37, 99, 235)",
          backgroundColor: "rgba(37, 99, 235, 0.08)",
          tension: 0.2,
          fill: true,
          pointRadius: 5,
          pointBackgroundColor: "rgb(37, 99, 235)",
        },
      ];
    }

    if (!esColor) {
      // Línea azul original intacta para equipos B/N
      return [
        {
          label: "Nivel de Tóner %",
          data: historialValido.map((r) => r.toner),
          borderColor: "rgb(37, 99, 235)",
          backgroundColor: "rgba(37, 99, 235, 0.08)",
          tension: 0.2,
          fill: true,
          pointRadius: 6,
          pointBackgroundColor: "rgb(37, 99, 235)",
        },
      ];
    }

    // Retorna las 4 líneas simultáneas con los tonos exactos que especificaste
    return [
      {
        label: "Tóner Negro (K) %",
        data: historialValido.map((r) => r.toner_negro ?? r.toner),
        borderColor: "rgb(0, 0, 0)", // Negro Puro
        backgroundColor: "transparent",
        tension: 0.2,
        fill: false,
        pointRadius: 5,
        pointBackgroundColor: "rgb(0, 0, 0)",
      },
      {
        label: "Tóner Cian (C) %",
        data: historialValido.map((r) => r.toner_cian ?? 0),
        borderColor: "rgb(0, 162, 232)", // Azul Cian Vibrante
        backgroundColor: "transparent",
        tension: 0.2,
        fill: false,
        pointRadius: 5,
        pointBackgroundColor: "rgb(0, 162, 232)",
      },
      {
        label: "Tóner Magenta (M) %",
        data: historialValido.map((r) => r.toner_magenta ?? 0),
        borderColor: "rgb(255, 0, 128)", // Rosa Magenta Intenso
        backgroundColor: "transparent",
        tension: 0.2,
        fill: false,
        pointRadius: 5,
        pointBackgroundColor: "rgb(255, 0, 128)",
      },
      {
        label: "Tóner Amarillo (Y) %",
        data: historialValido.map((r) => r.toner_amarillo ?? 0),
        borderColor: "rgb(255, 204, 0)", // Amarillo Puro Visible
        backgroundColor: "transparent",
        tension: 0.2,
        fill: false,
        pointRadius: 5,
        pointBackgroundColor: "rgb(255, 204, 0)",
      },
    ];
  };

  const dataGrafica = {
    labels:
      historialValido.length > 0
        ? historialValido.map((r) => formatoFecha(r.fecha))
        : ["Estatus Inicial"],
    datasets: generarDatasets(),
  };

  const stringPrediccion =
    typeof calcularPrediccionDias === "function"
      ? calcularPrediccionDias(imp)
      : "Calculando...";
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      {/* CABECERA */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-4">
          <button
            onClick={onVolver}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg text-sm cursor-pointer transition-all"
          >
            ⬅ Volver al Panel
          </button>
          <h1 className="text-xl font-bold text-slate-800">
            Expediente de Máquina
          </h1>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onEditar(imp)}
            className="bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm px-4 py-2 rounded-lg cursor-pointer transition-all"
          >
            ✏️ Editar Datos
          </button>
          <button
            onClick={() => onEliminar(imp.id)}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold text-sm px-4 py-2 rounded-lg cursor-pointer transition-all"
          >
            🗑️ Eliminar Máquina
          </button>
        </div>
      </header>

      {/* CUERPO CENTRAL */}
      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* RESUMEN TÉCNICO */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4 h-fit">
          <div>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${semaforo.bg}`}
            >
              {semaforo.texto}
            </span>
            <h2 className="text-xl font-bold mt-2 text-slate-800">
              {modeloNombre}
            </h2>
            <p className="text-xs font-mono text-slate-400">
              SERIAL: {numeroSerie}
            </p>
          </div>
          <div className="border-t pt-4 space-y-2.5 text-sm text-slate-600">
            <div>
              📍 <strong>Ubicación:</strong> {ubicacionFisica}
            </div>
            <div>
              🌐 <strong>IP de Red:</strong>{" "}
              <span className="font-mono text-blue-600 underline">{ipRed}</span>
            </div>
            <div>
              📦 <strong>Cartucho Principal:</strong> {codigoCartucho} (
              {rendimientoFabrica.toLocaleString()} págs)
            </div>

            {/* Si es a color, listamos los cartuchos secundarios en la ficha técnica */}
            {esColor && imp.detalles_color && imp.detalles_color.length > 0 && (
              <div className="mt-2 pt-2 border-t border-dashed border-slate-200 space-y-1">
                <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
                  Cartuchos de Color:
                </span>
                {imp.detalles_color.map((det, idx) => (
                  <div key={idx} className="text-xs flex justify-between">
                    <span>
                      🎨 {det.color}:{" "}
                      <strong className="font-mono">{det.codigo_toner}</strong>
                    </span>
                    <span className="text-slate-400">
                      ({det.rendimiento_fabrica.toLocaleString()} págs)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="border-t pt-4 bg-blue-50/50 p-4 rounded-xl text-center border border-blue-100">
            <span className="block font-semibold text-blue-900 text-xs">
              Predicción de Vida Útil
            </span>
            <span className="font-bold text-blue-700 text-base block mt-1 bg-white py-1 rounded-lg border border-blue-200">
              {stringPrediccion}
            </span>
          </div>
        </div>

        {/* GRÁFICA LINEAL Y LOGS */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <h3 className="font-bold text-sm text-slate-500 uppercase tracking-wider mb-4">
              📈 Curva de Desgaste Lineal
            </h3>
            <div className="relative h-72 w-full bg-slate-50/50 p-2 rounded-xl">
              <Line
                data={dataGrafica}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: { y: { min: 0, max: 100 } },
                }}
              />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b bg-slate-50/50">
              <h3 className="font-bold text-sm text-slate-500 uppercase tracking-wider">
                📋 Reportes en PostgreSQL
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-500">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b">
                  <tr>
                    <th className="px-6 py-3">Fecha del Reporte</th>
                    <th className="px-6 py-3">Contador (Páginas)</th>
                    <th className="px-6 py-3">Niveles de Tóner</th>
                  </tr>
                </thead>
                <tbody className="divide-y bg-white">
                  {historialValido.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-6 py-8 text-center text-slate-400 bg-white"
                      >
                        📭 Aún no se han recibido reportes automáticos de esta
                        máquina. Los datos históricos aparecerán aquí.
                      </td>
                    </tr>
                  ) : (
                    historialValido.map((rep, idx) => (
                      <tr
                        key={idx}
                        className="bg-white text-slate-800 hover:bg-slate-50/50 transition-all"
                      >
                        <td className="px-6 py-3">{formatoFecha(rep.fecha)}</td>
                        <td className="px-6 py-3 font-mono">
                          {rep.contador.toLocaleString()}
                        </td>
                        <td className="px-6 py-3">
                          {!esColor ? (
                            <span
                              className={`font-bold ${rep.toner <= 10 ? "text-red-600" : rep.toner <= 20 ? "text-amber-600" : "text-emerald-600"}`}
                            >
                              {rep.toner}%
                            </span>
                          ) : (
                            <div className="flex space-x-3 text-xs font-mono">
                              <span className="text-slate-900 font-bold">
                                K: {rep.toner_negro ?? rep.toner}%
                              </span>
                              <span className="text-cyan-600 font-bold">
                                C: {rep.toner_cian ?? 0}%
                              </span>
                              <span className="text-pink-600 font-bold">
                                M: {rep.toner_magenta ?? 0}%
                              </span>
                              <span className="text-yellow-600 font-bold">
                                Y: {rep.toner_amarillo ?? 0}%
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <section className="lg:col-span-3 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b bg-slate-50/50">
            <h3 className="font-bold text-sm text-slate-700 uppercase tracking-wider">
              Inventario de tóner de reserva
            </h3>
          </div>
          <div
            className={`grid grid-cols-2 ${esColor ? "md:grid-cols-4" : "md:grid-cols-1"} gap-4 p-6`}
          >
            {[
              { color: "Negro", key: "negro" },
              ...(esColor
                ? [
                    { color: "Cian", key: "cian" },
                    { color: "Magenta", key: "magenta" },
                    { color: "Amarillo", key: "amarillo" },
                  ]
                : []),
            ].map(({ color, key }) => (
              <div key={key} className="border-l-4 border-slate-500 pl-3">
                <div className="text-xs text-slate-500">{color}</div>
                <div className="text-xl font-bold text-slate-800">
                  {imp.stock_reserva?.[
                    key as keyof NonNullable<Impresora["stock_reserva"]>
                  ] ?? 0}
                </div>
                <div className="text-xs text-slate-500">
                  unidades disponibles
                </div>
              </div>
            ))}
          </div>
          <div className="border-t overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs uppercase bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-6 py-3">Fecha</th>
                  <th className="px-6 py-3">Movimiento</th>
                  <th className="px-6 py-3">Color</th>
                  <th className="px-6 py-3">Cantidad</th>
                  <th className="px-6 py-3">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(imp.historial_reserva || []).length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-6 text-center text-slate-400"
                    >
                      Sin movimientos de reserva registrados.
                    </td>
                  </tr>
                ) : (
                  (imp.historial_reserva || []).map((movimiento, idx) => (
                    <tr key={`${movimiento.fecha}-${idx}`}>
                      <td className="px-6 py-3 whitespace-nowrap">
                        {new Date(movimiento.fecha).toLocaleString("es-MX")}
                      </td>
                      <td className="px-6 py-3">
                        {movimiento.tipo_movimiento}
                      </td>
                      <td className="px-6 py-3">{movimiento.color}</td>
                      <td className="px-6 py-3 font-mono">
                        {movimiento.cantidad > 0
                          ? `+${movimiento.cantidad}`
                          : movimiento.cantidad}
                      </td>
                      <td className="px-6 py-3">{movimiento.detalle}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
