import { useEffect, useState } from "react";
import Filtros from "./components/Filtros";
import TarjetaImpresora from "./components/TarjetaImpresora";
import ModalFormulario from "./components/ModalFormulario";
import HistorialImpresora from "./components/HistorialImpresora";
import Login from "./components/Login";
import { apiFetch } from "./api";
import { useImpresoras } from "./hooks/useImpresoras";

interface ControlPanelProps {
  username: string;
  onLogout: () => void;
}

function ControlPanel({ username, onLogout }: ControlPanelProps) {
  const {
    busqueda,
    setBusqueda,
    filtroEstado,
    setFiltroEstado,
    cargando,
    error,
    cargandoRobot,
    handleEjecutarRobot,
    reiniciandoInformes,
    handleEliminarInformes,
    handleEliminarReporte,
    handleEliminarMovimiento,
    impresoraSeleccionada,
    abrirExpediente,
    volverAlPanel,
    modalAbierto,
    setModalAbierto,
    formId,
    formSerie,
    setFormSerie,
    formIp,
    setFormIp,
    formUbicacion,
    setFormUbicacion,
    formModelo,
    setFormModelo,
    formCodigoToner,
    setFormCodigoToner,
    formRendimientoFabrica,
    setFormRendimientoFabrica,
    formReservaNegro,
    setFormReservaNegro,
    formReservaCian,
    setFormReservaCian,
    formReservaMagenta,
    setFormReservaMagenta,
    formReservaAmarillo,
    setFormReservaAmarillo,
    formError,
    cerrarModal,
    handleGuardarImpresora,
    handleEliminarImpresora,
    abrirModalEditar,
    calcularPrediccionDias,
    obtenerColorSemaforo,
    impresorasFiltradas,
  } = useImpresoras();

  const modalFormulario = modalAbierto ? (
    <ModalFormulario
      formId={formId}
      formSerie={formSerie}
      setFormSerie={setFormSerie}
      formIp={formIp}
      setFormIp={setFormIp}
      formUbicacion={formUbicacion}
      setFormUbicacion={setFormUbicacion}
      formModelo={formModelo}
      setFormModelo={setFormModelo}
      formCodigoToner={formCodigoToner}
      setFormCodigoToner={setFormCodigoToner}
      formRendimientoFabrica={formRendimientoFabrica}
      setFormRendimientoFabrica={setFormRendimientoFabrica}
      formReservaNegro={formReservaNegro}
      setFormReservaNegro={setFormReservaNegro}
      formReservaCian={formReservaCian}
      setFormReservaCian={setFormReservaCian}
      formReservaMagenta={formReservaMagenta}
      setFormReservaMagenta={setFormReservaMagenta}
      formReservaAmarillo={formReservaAmarillo}
      setFormReservaAmarillo={setFormReservaAmarillo}
      formError={formError}
      onCerrar={cerrarModal}
      onGuardar={handleGuardarImpresora}
    />
  ) : null;

  if (cargando) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-red-800 p-4">
        <div className="bg-red-50 border p-4 rounded-xl">{error}</div>
      </div>
    );
  }

  if (impresoraSeleccionada) {
    return (
      <>
        <HistorialImpresora
          imp={impresoraSeleccionada}
          onVolver={volverAlPanel}
          onEditar={abrirModalEditar}
          onEliminar={handleEliminarImpresora}
          onEliminarReporte={handleEliminarReporte}
          onEliminarMovimiento={handleEliminarMovimiento}
          calcularPrediccionDias={calcularPrediccionDias}
          obtenerColorSemaforo={obtenerColorSemaforo}
        />
        {modalFormulario}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-6 py-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="bg-red-600 text-white font-bold px-3 py-1.5 rounded-lg text-lg tracking-wider">
            KYOCERA
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">
            Control Central de Tóner
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleEliminarInformes}
            disabled={reiniciandoInformes}
            title="Conserva el último reporte de correo de cada impresora y elimina los anteriores."
            className="border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50 font-semibold text-sm px-4 py-2 rounded-lg cursor-pointer transition-colors"
          >
            {reiniciandoInformes ? "Eliminando..." : "Borrar informes"}
          </button>
          <button
            onClick={handleEjecutarRobot}
            disabled={cargandoRobot}
            className={`${
              cargandoRobot
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
            } text-white font-semibold text-sm px-4 py-2 rounded-lg shadow-sm flex items-center space-x-2 transition-colors`}
          >
            <span>{cargandoRobot ? "⏳" : ""}</span>
            <span>{cargandoRobot ? "Sincronizando..." : "Escanear Gmail"}</span>
          </button>

          <button
            onClick={() => setModalAbierto(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2 rounded-lg shadow-sm cursor-pointer flex items-center space-x-2 transition-colors"
          >
            <span>Agregar Impresora</span>
          </button>
          <button
            onClick={onLogout}
            title={`Sesión de ${username}`}
            className="border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-sm px-4 py-2 rounded-lg cursor-pointer transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <Filtros
          busqueda={busqueda}
          setBusqueda={setBusqueda}
          filtroEstado={filtroEstado}
          setFiltroEstado={setFiltroEstado}
        />
        {impresorasFiltradas.length === 0 ? (
          <div className="text-center py-12 bg-white border rounded-xl text-slate-400">
            No hay equipos que coincidan con la selección.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {impresorasFiltradas.map((imp) => (
              <TarjetaImpresora
                key={imp.id}
                imp={imp}
                onSelect={abrirExpediente}
                obtenerColorSemaforo={obtenerColorSemaforo}
              />
            ))}
          </div>
        )}
      </main>

      {modalFormulario}
    </div>
  );
}

export default function App() {
  const [comprobandoSesion, setComprobandoSesion] = useState(true);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    apiFetch("/api/auth/session")
      .then(async (response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancelado) return;
        setUsername(data?.username ?? null);
        setComprobandoSesion(false);
      })
      .catch(() => {
        if (cancelado) return;
        setUsername(null);
        setComprobandoSesion(false);
      });

    return () => {
      cancelado = true;
    };
  }, []);

  const cerrarSesion = async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.history.replaceState(null, "", window.location.href);
      setUsername(null);
    }
  };

  if (comprobandoSesion) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!username) return <Login onSuccess={setUsername} />;
  return (
    <ControlPanel key={username} username={username} onLogout={cerrarSesion} />
  );
}
