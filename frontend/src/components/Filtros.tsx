interface FiltrosProps {
  busqueda: string;
  setBusqueda: (value: string) => void;
  filtroEstado: string;
  setFiltroEstado: (value: string) => void;
}

export default function Filtros({
  busqueda,
  setBusqueda,
  filtroEstado,
  setFiltroEstado,
}: FiltrosProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      {/* BUSCADOR */}
      <input
        type="text"
        placeholder="🔍 Buscar por modelo, serie o ubicación..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="w-full md:max-w-md bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm shadow-xs focus:ring-2 focus:ring-blue-500"
      />

      {/* BOTONES DE ESTADO SEMÁFORO */}
      <div className="flex bg-slate-200/60 p-1 rounded-xl w-fit space-x-1 border">
        {["TODOS", "ESTABLE", "ADVERTENCIA", "CRITICO"].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setFiltroEstado(st)}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filtroEstado === st
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {st === "TODOS"
              ? "📋 Todos"
              : st === "ESTABLE"
                ? "🟢 Estables"
                : st === "ADVERTENCIA"
                  ? "🟡 Comprar"
                  : "🔴 Críticos"}
          </button>
        ))}
      </div>
    </div>
  );
}
