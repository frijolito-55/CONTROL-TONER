interface ReporteHistorial {
  fecha: string;
  contador: number;
  toner: number;
}

interface Impresora {
  id: number;
  numero_serie: string;
  ip: string;
  ubicacion: string;
  modelo: string;
  codigo_toner: string;
  rendimiento_fabrica: number;
  historial: ReporteHistorial[];
}

interface TarjetaProps {
  imp: Impresora;
  onSelect: (imp: Impresora) => void;
  obtenerColorSemaforo: (nivel: number) => {
    bg: string;
    barra: string;
    estado: string;
    texto: string;
  };
}

export default function TarjetaImpresora({
  imp,
  onSelect,
  obtenerColorSemaforo,
}: TarjetaProps) {
  // 💥 CORRECCIÓN DEFINITIVA: Si la base de datos no tiene reportes aún, asume 100% para no romper el diseño
  const tonerActual =
    imp.historial && imp.historial.length > 0
      ? imp.historial[imp.historial.length - 1].toner
      : 100;

  const semaforo = obtenerColorSemaforo(tonerActual);

  return (
    <div
      onClick={() => onSelect(imp)}
      className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col justify-between cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group"
    >
      <div className="p-5 border-b bg-slate-50/50 group-hover:bg-blue-50/10">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-bold text-base text-slate-800 group-hover:text-blue-600 transition-all">
              {imp.modelo}
            </h3>
            <p className="text-xs font-mono text-slate-400">
              N.º SERIE: {imp.numero_serie}
            </p>
          </div>
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${semaforo.bg}`}
          >
            {semaforo.texto}
          </span>
        </div>
        <div className="text-xs text-slate-600 mt-3 space-y-1">
          <div>
            📍 <strong>Ubicación:</strong> {imp.ubicacion}
          </div>
          <div>
            🌐 <strong>IP LAN:</strong>{" "}
            <span className="font-mono text-blue-600">
              {imp.ip || "No asignada"}
            </span>
          </div>
        </div>
      </div>
      <div className="p-5 space-y-3">
        <div>
          <div className="flex justify-between text-xs font-semibold mb-1">
            <span className="text-slate-500">Nivel de Tóner Negro</span>
            <span className="font-bold">{tonerActual}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full ${semaforo.barra}`}
              style={{ width: `${tonerActual}%` }}
            ></div>
          </div>
        </div>
        <div className="text-right text-[11px] text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition-all">
          Ver análisis detallado ➔
        </div>
      </div>
    </div>
  );
}
