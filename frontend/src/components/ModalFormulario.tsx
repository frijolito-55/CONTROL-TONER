import { useState } from "react";

interface FormularioProps {
  formId: number | null;
  formSerie: string;
  setFormSerie: (v: string) => void;
  formIp: string;
  setFormIp: (v: string) => void;
  formUbicacion: string;
  setFormUbicacion: (v: string) => void;
  formModelo: string;
  setFormModelo: (v: string) => void;
  formReservaNegro: string;
  setFormReservaNegro: (v: string) => void;
  formReservaCian: string;
  setFormReservaCian: (v: string) => void;
  formReservaMagenta: string;
  setFormReservaMagenta: (v: string) => void;
  formReservaAmarillo: string;
  setFormReservaAmarillo: (v: string) => void;
  formError: string | null;
  onCerrar: () => void;
  onGuardar: (e: React.FormEvent) => Promise<boolean>;
}

export default function ModalFormulario({
  formId,
  formSerie,
  setFormSerie,
  formIp,
  setFormIp,
  formUbicacion,
  setFormUbicacion,
  formModelo,
  setFormModelo,
  formReservaNegro,
  setFormReservaNegro,
  formReservaCian,
  setFormReservaCian,
  formReservaMagenta,
  setFormReservaMagenta,
  formReservaAmarillo,
  setFormReservaAmarillo,
  formError,
  onCerrar,
  onGuardar,
}: FormularioProps) {
  // 🛡️ Llave de seguridad: Evita el doble clic congelando el formulario en el envío
  const [enviando, setEnviando] = useState(false);
  const modeloColor = formModelo.toLowerCase().endsWith("ci");

  const manejarEnvioSeguro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enviando) return; // Si ya se está procesando un envío, bloquea los clics adicionales

    setEnviando(true);
    try {
      await onGuardar(e);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
        <div className="bg-slate-50 px-6 py-4 border-b flex justify-between items-center">
          <h2 className="font-bold text-lg text-slate-800">
            {formId ? "✏️ Modificar Impresora" : "➕ Alta con Hoja de Estado"}
          </h2>
          <button
            type="button"
            onClick={onCerrar}
            disabled={enviando}
            className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer disabled:opacity-30"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={manejarEnvioSeguro}
          className="p-6 space-y-4 max-h-[80vh] overflow-y-auto"
        >
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium">
              {formError}
            </div>
          )}

          {/* CAMPOS PRINCIPALES */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Modelo *
              </label>
              <select
                value={formModelo}
                disabled={enviando}
                onChange={(e) => setFormModelo(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
              >
                <option value="ECOSYS M3655idn">ECOSYS M3655idn</option>
                <option value="ECOSYS M5500">ECOSYS M5500</option>
                <option value="ECOSYS M3040">ECOSYS M3040</option>
                <option value="TASKalfa 4002i">TASKalfa 4002i</option>
                <option value="TASKalfa 4003i">TASKalfa 4003i</option>
                <option value="TASKalfa 3252ci">TASKalfa 3252ci</option>
                <option value="TASKalfa 2554ci">TASKalfa 2554ci</option>
                <option value="ECOSYS M2040dn">ECOSYS M2040dn</option>
                <option value="ECOSYS M3550idn">ECOSYS M3550idn</option>
                <option value="TASKalfa 3051ci">TASKalfa 3051ci</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                N.º de Serie *
              </label>
              <input
                type="text"
                placeholder="S/N"
                value={formSerie}
                disabled={enviando}
                onChange={(e) => setFormSerie(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase disabled:bg-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                N.º de Máquina (ID)
              </label>
              <input
                type="text"
                placeholder="Ej: EQ-05"
                id="form_num_maquina"
                disabled={enviando}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Dirección IP
              </label>
              <input
                type="text"
                placeholder="192.168.1.X"
                value={formIp}
                disabled={enviando}
                onChange={(e) => setFormIp(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Ubicación Física *
            </label>
            <input
              type="text"
              placeholder="Ej: Planta Baja - Almacén"
              value={formUbicacion}
              disabled={enviando}
              onChange={(e) => setFormUbicacion(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
            />
          </div>

          <div className="rounded-lg border border-slate-200 p-4 space-y-3">
            <span className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
              Tóner de reserva
            </span>
            <div
              className={`grid ${modeloColor ? "grid-cols-2" : "grid-cols-1"} gap-3`}
            >
              <label className="text-xs font-semibold text-slate-600">
                Negro
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formReservaNegro}
                  disabled={enviando}
                  onChange={(e) => setFormReservaNegro(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
              {modeloColor && (
                <>
                  <label className="text-xs font-semibold text-slate-600">
                    Cian
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={formReservaCian}
                      disabled={enviando}
                      onChange={(e) => setFormReservaCian(e.target.value)}
                      className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="text-xs font-semibold text-slate-600">
                    Magenta
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={formReservaMagenta}
                      disabled={enviando}
                      onChange={(e) => setFormReservaMagenta(e.target.value)}
                      className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="text-xs font-semibold text-slate-600">
                    Amarillo
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={formReservaAmarillo}
                      disabled={enviando}
                      onChange={(e) => setFormReservaAmarillo(e.target.value)}
                      className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                    />
                  </label>
                </>
              )}
            </div>
          </div>

          {/* SECCIÓN HOJA DE ESTADO */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-2 space-y-3">
            <span className="block text-xs font-extrabold text-blue-700 uppercase tracking-wider">
              📊 Datos de la Página de Estado (Actualizar)
            </span>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Lectura Contador (Págs)
                </label>
                <input
                  type="number"
                  placeholder="Ej: 45200"
                  id="form_lectura"
                  disabled={enviando}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono disabled:bg-slate-100"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Porcentaje Tóner (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0-100"
                  id="form_toner"
                  defaultValue="100"
                  disabled={enviando}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold disabled:bg-slate-100"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCerrar}
              disabled={enviando}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-50 text-slate-700 cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-xs cursor-pointer disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {enviando ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Procesando...</span>
                </>
              ) : formId ? (
                "Guardar Cambios"
              ) : (
                "Registrar con Reporte"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
