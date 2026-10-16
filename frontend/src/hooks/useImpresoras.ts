import { useState, useEffect, useCallback } from "react";

export interface ReporteHistorial {
  fecha: string;
  contador: number;
  toner: number;
}

export interface MovimientoReserva {
  fecha: string;
  tipo_movimiento: string;
  color: string;
  cantidad: number;
  detalle: string;
}

export interface Impresora {
  id: number;
  numero_serie: string;
  ip: string;
  ubicacion: string;
  modelo: string;
  codigo_toner: string;
  rendimiento_fabrica: number;
  es_color?: boolean;
  detalles_color?: { color: string; codigo_toner: string; rendimiento_fabrica: number }[];
  historial: ReporteHistorial[];
  stock_reserva?: { negro: number; cian: number; magenta: number; amarillo: number };
  historial_reserva?: MovimientoReserva[];
}

export function useImpresoras() {
  const [impresoras, setImpresoras] = useState<Impresora[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("TODOS");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [cargandoRobot, setCargandoRobot] = useState(false);
  const [reiniciandoInformes, setReiniciandoInformes] = useState(false);
  const [impresoraSeleccionada, setImpresoraSeleccionada] = useState<Impresora | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);

  const [formId, setFormId] = useState<number | null>(null);
  const [formSerie, setFormSerie] = useState("");
  const [formIp, setFormIp] = useState("");
  const [formUbicacion, setFormUbicacion] = useState("");
  const [formModelo, setFormModelo] = useState("ECOSYS M3655idn");
  const [formReservaNegro, setFormReservaNegro] = useState("0");
  const [formReservaCian, setFormReservaCian] = useState("0");
  const [formReservaMagenta, setFormReservaMagenta] = useState("0");
  const [formReservaAmarillo, setFormReservaAmarillo] = useState("0");
  const [formError, setFormError] = useState<string | null>(null);

  const cargarImpresoras = useCallback(() => {
    fetch("http://localhost:8000/api/impresoras")
      .then((res) => {
        if (!res.ok) throw new Error("Fallo al conectar con la base de datos");
        return res.json();
      })
      .then((data: Impresora[]) => {
          const impresorasCargadas = Array.isArray(data) ? data : [];
          setImpresoras(impresorasCargadas);
        setCargando(false);
          setImpresoraSeleccionada((actual) =>
            actual ? impresorasCargadas.find((impresora) => impresora.id === actual.id) || null : null,
          );
      })
      .catch((err) => {
        setError(err.message);
        setCargando(false);
      });
  }, []);

  useEffect(() => {
    cargarImpresoras();
  }, [cargarImpresoras]);

  const handleEjecutarRobot = async () => {
    setCargandoRobot(true);
    try {
      const respuesta = await fetch("http://localhost:8000/api/parser/ejecutar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const datos = await respuesta.json();
      if (respuesta.ok) {
        alert("🤖 ¡Robot ejecutado! Base de datos sincronizada con Gmail con éxito.");
        cargarImpresoras();
      } else {
        alert(`❌ Error al ejecutar el robot: ${datos.detail}`);
      }
    } catch (err) {
      console.error(err);
      alert("❌ No se pudo conectar con el servidor backend.");
    } finally {
      setCargandoRobot(false);
    }
  };

  const handleEliminarInformes = async () => {
    const confirmar = window.confirm(
      "¿Eliminar los informes anteriores de TODAS las impresoras? Se conservará automáticamente el último reporte de correo de cada una, con sus niveles B/N y color. Si aún no hay reportes de correo identificados, se conservará el último reporte disponible. Las impresoras, reservas y movimientos también se conservarán. Esta acción no se puede deshacer.",
    );
    if (!confirmar) return;

    setReiniciandoInformes(true);
    try {
      const respuesta = await fetch("http://localhost:8000/api/reportes", { method: "DELETE" });
      const datos = await respuesta.json();
      if (!respuesta.ok) throw new Error(datos.detail || "No se pudieron eliminar los informes.");
      alert(`Reportes conservados: ${datos.reportes_correo_conservados} últimos de correo y ${datos.reportes_respaldo_conservados} de respaldo. Informes anteriores eliminados: ${datos.reportes_eliminados} B/N y ${datos.reportes_color_eliminados} a color.`);
      cargarImpresoras();
    } catch (err) {
      alert(err instanceof Error ? err.message : "No se pudo conectar con el servidor backend.");
    } finally {
      setReiniciandoInformes(false);
    }
  };

  const handleGuardarImpresora = async (e: React.FormEvent): Promise<boolean> => {
    e.preventDefault();
    setFormError(null);
    if (!formSerie.trim() || !formUbicacion.trim()) {
      setFormError("Por favor llena los campos obligatorios (*)");
      return false;
    }

    const serieLimpia = formSerie.trim().toUpperCase();

    if (!formId && impresoras.some((i) => i.numero_serie === serieLimpia)) {
      setFormError("Ya existe una impresora con ese número de serie.");
      return false;
    }

    const elNum = (document.getElementById("form_num_maquina") as HTMLInputElement)?.value || null;
    const elContador = (document.getElementById("form_lectura") as HTMLInputElement)?.value;
    const elToner = (document.getElementById("form_toner") as HTMLInputElement)?.value;

    const payload = {
      numero_serie: serieLimpia,
      ip: formIp.trim() || null,
      ubicacion: formUbicacion.trim(),
      modelo_equipo: formModelo,
      numero_maquina: elNum,
      lectura_contador: elContador ? parseInt(elContador) : null,
      porcentaje_toner: elToner ? parseInt(elToner) : null,
      reserva_negro: Math.max(0, parseInt(formReservaNegro, 10) || 0),
      reserva_cian: Math.max(0, parseInt(formReservaCian, 10) || 0),
      reserva_magenta: Math.max(0, parseInt(formReservaMagenta, 10) || 0),
      reserva_amarillo: Math.max(0, parseInt(formReservaAmarillo, 10) || 0),
    };

    const url = formId
      ? `http://localhost:8000/api/impresoras/${formId}`
      : "http://localhost:8000/api/impresoras";

    try {
      const respuesta = await fetch(url, {
        method: formId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const datos = await respuesta.json();
      if (!respuesta.ok) throw new Error(datos.detail || "No se pudo guardar la impresora.");

      cerrarModal();
      cargarImpresoras();
      return true;
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "No se pudo conectar con el servidor backend.");
      return false;
    }
  };

  const handleEliminarImpresora = (id: number) => {
    if (!window.confirm("¿Estás seguro de eliminar esta impresora?")) return;
    fetch(`http://localhost:8000/api/impresoras/${id}`, { method: "DELETE" })
      .then((res) => {
        if (!res.ok) throw new Error("Error");
        setImpresoraSeleccionada(null);
        cargarImpresoras();
      })
      .catch((err) => {
        alert(err.message);
      });
  };

  const abrirModalEditar = (imp: Impresora) => {
    setFormId(imp.id);
    setFormSerie(imp.numero_serie);
    setFormIp(imp.ip || "");
    setFormUbicacion(imp.ubicacion);
    setFormModelo(imp.modelo);
    setFormReservaNegro(String(imp.stock_reserva?.negro ?? 0));
    setFormReservaCian(String(imp.stock_reserva?.cian ?? 0));
    setFormReservaMagenta(String(imp.stock_reserva?.magenta ?? 0));
    setFormReservaAmarillo(String(imp.stock_reserva?.amarillo ?? 0));
    setModalAbierto(true);
    setTimeout(() => {
      const uR = imp.historial && imp.historial.length > 0 ? imp.historial[imp.historial.length - 1] : null;
      const inputLectura = document.getElementById("form_lectura") as HTMLInputElement;
      const inputToner = document.getElementById("form_toner") as HTMLInputElement;
      if (inputLectura && uR) inputLectura.value = uR.contador.toString();
      if (inputToner && uR) inputToner.value = uR.toner.toString();
    }, 100);
  };

  const cerrarModal = () => {
    setFormId(null);
    setFormSerie("");
    setFormIp("");
    setFormUbicacion("");
    setFormModelo("ECOSYS M3655idn");
    setFormReservaNegro("0");
    setFormReservaCian("0");
    setFormReservaMagenta("0");
    setFormReservaAmarillo("0");
    setFormError(null);
    setModalAbierto(false);
  };

  const calcularPrediccionDias = (imp: Impresora) => {
    if (!imp?.historial || imp.historial.length < 2) return "Esperando reportes...";
    const pR = imp.historial[0];
    const uR = imp.historial[imp.historial.length - 1];
    const dT = Math.round(Math.abs((new Date(uR.fecha).getTime() - new Date(pR.fecha).getTime()) / (24 * 60 * 60 * 1000)));
    if (dT <= 0) return "Esperando ciclo...";
    const tC = pR.toner - uR.toner;
    if (tC <= 0) return "Uso mínimo";
    return `${Math.round(uR.toner / (tC / dT))} días restantes`;
  };

  const obtenerColorSemaforo = (nivel: number) => {
    if (nivel <= 10)
      return { bg: "bg-red-100 text-red-800 border-red-300", barra: "bg-red-600", estado: "CRITICO", texto: "Crítico (<10%)" };
    if (nivel <= 20)
      return { bg: "bg-amber-100 text-amber-800 border-amber-300", barra: "bg-amber-500", estado: "ADVERTENCIA", texto: "Comprar Tóner" };
    return { bg: "bg-emerald-100 text-emerald-800 border-emerald-300", barra: "bg-emerald-500", estado: "ESTABLE", texto: "Estable" };
  };

  const impresorasFiltradas = (impresoras || []).filter((imp) => {
    if (!imp) return false;
    const modeloSeguro = (imp.modelo || "").toLowerCase();
    const ubicacionSegura = (imp.ubicacion || "").toLowerCase();
    const serieSegura = (imp.numero_serie || "").toLowerCase();
    const textoBusqueda = (busqueda || "").toLowerCase();

    const coincideBusqueda =
      modeloSeguro.includes(textoBusqueda) ||
      ubicacionSegura.includes(textoBusqueda) ||
      serieSegura.includes(textoBusqueda);

    if (filtroEstado === "TODOS") return coincideBusqueda;

    const tA = imp.historial && imp.historial.length > 0 ? imp.historial[imp.historial.length - 1].toner : 100;
    const sem = obtenerColorSemaforo(tA);
    return coincideBusqueda && sem.estado === filtroEstado;
  });

  return {
    busqueda, setBusqueda,
    filtroEstado, setFiltroEstado,
    cargando, error,
    cargandoRobot, handleEjecutarRobot,
    reiniciandoInformes, handleEliminarInformes,
    impresoraSeleccionada, setImpresoraSeleccionada,
    modalAbierto, setModalAbierto,
    formId, formSerie, setFormSerie,
    formIp, setFormIp,
    formUbicacion, setFormUbicacion,
    formModelo, setFormModelo,
    formReservaNegro, setFormReservaNegro,
    formReservaCian, setFormReservaCian,
    formReservaMagenta, setFormReservaMagenta,
    formReservaAmarillo, setFormReservaAmarillo,
    formError, cerrarModal,
    handleGuardarImpresora, handleEliminarImpresora,
    abrirModalEditar, calcularPrediccionDias,
    obtenerColorSemaforo, impresorasFiltradas
  };
}
