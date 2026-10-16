from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import case, func
from sqlalchemy.orm import Session, selectinload
from typing import List
import models
from database import get_db
from pydantic import BaseModel, Field

# =========================================================================
# 1. INICIALIZAR LA APP FASTAPI
# =========================================================================
app = FastAPI(
    title="Sistema de Control de Tóner Kyocera",
    description="API profesional para monitoreo y predicción de consumo de tóner",
    version="1.0.0"
)

# =========================================================================
# 2. CONFIGURAR CORS (Permisos de seguridad)
# =========================================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================================================================
# 3. RUTA DE PRUEBA (Home)
# =========================================================================
@app.get("/")
def read_root():
    return {"status": "Online", "proyecto": "Control de Tóner Kyocera v1"}

# =========================================================================
# 4. RUTA MAESTRA: OBTENER TODAS LAS IMPRESORAS (💥 ADAPTADA PARA GRÁFICA A COLOR)
# =========================================================================
@app.get("/api/impresoras")
def obtener_impresoras(db: Session = Depends(get_db)):
    impresoras = db.query(models.Impresora).options(
        selectinload(models.Impresora.modelo).selectinload(models.ModeloToner.detalles_color),
        selectinload(models.Impresora.reportes),
        selectinload(models.Impresora.reportes_color),
        selectinload(models.Impresora.inventario_reserva),
        selectinload(models.Impresora.historial_reservas),
    ).all()
    resultado = []  
    
    if not impresoras:
        return resultado
        
    for imp in impresoras:
        modelo_nombre = imp.modelo.modelo_equipo if imp.modelo else "Modelo Kyocera"
        codigo_toner = imp.modelo.codigo_toner if imp.modelo else "TK-Genérico"
        rendimiento = imp.modelo.rendimiento_fabrica if imp.modelo else 25000
        
        # Validar si este modelo cuenta con definición de colores en el catálogo extendido
        es_color = bool(imp.modelo and (imp.modelo.detalles_color or imp.modelo.modelo_equipo.lower().endswith("ci")))
        detalles_color_lista = []
        if imp.modelo and imp.modelo.detalles_color:
            detalles_color_lista = [
                {
                    "color": det.color,
                    "codigo_toner": det.codigo_toner,
                    "rendimiento_fabrica": det.rendimiento_fabrica
                } for det in imp.modelo.detalles_color
            ]

        colores_por_fecha = {
            rep_color.fecha_reporte: rep_color
            for rep_color in sorted(imp.reportes_color, key=lambda reporte: reporte.id)
        }
        
        # Mapear el historial ordenando del reporte más viejo al más nuevo para el gráfico de React
        reportes_lista = []
        if hasattr(imp, 'reportes') and imp.reportes:
            for rep in sorted(imp.reportes, key=lambda x: (x.fecha_reporte, x.id)):
                # Estructura base idéntica para mantener compatibilidad absoluta con B/N
                data_reporte = {
                    "fecha": str(rep.fecha_reporte), 
                    "contador": rep.contador_paginas,
                    "toner": rep.porcentaje_toner  # Mantiene compatibilidad directa con tu gráfica actual
                }
                
                # Si el equipo maneja colores, inyectamos los niveles adicionales del historial a color
                if es_color:
                    # Cambiamos conceptualmente el nombre clave para la gráfica multi-línea del frontend
                    data_reporte["toner_negro"] = rep.porcentaje_toner
                    
                    rep_color = colores_por_fecha.get(rep.fecha_reporte)
                    
                    if rep_color:
                        data_reporte["toner_cian"] = rep_color.cian
                        data_reporte["toner_magenta"] = rep_color.magenta
                        data_reporte["toner_amarillo"] = rep_color.amarillo
                    else:
                        # Valores por defecto en caso de que un reporte no contenga el registro de color
                        data_reporte["toner_cian"] = 0
                        data_reporte["toner_magenta"] = 0
                        data_reporte["toner_amarillo"] = 0
                
                reportes_lista.append(data_reporte)

        stock_reserva = {"negro": 0, "cian": 0, "magenta": 0, "amarillo": 0}
        for item in imp.inventario_reserva:
            clave = {"NEGRO": "negro", "CIAN": "cian", "MAGENTA": "magenta", "AMARILLO": "amarillo"}.get(item.color)
            if clave:
                stock_reserva[clave] = item.cantidad

        historial_reserva = [
            {
                "fecha": item.fecha_movimiento.isoformat() if item.fecha_movimiento else None,
                "tipo_movimiento": item.tipo_movimiento,
                "color": item.color,
                "cantidad": item.cantidad,
                "detalle": item.detalle,
            }
            for item in sorted(imp.historial_reservas, key=lambda movimiento: (movimiento.fecha_movimiento, movimiento.id), reverse=True)
        ]
        
        resultado.append({
            "id": imp.id,
            "numero_serie": imp.numero_serie,
            "ip": imp.ip if imp.ip else "No asignada",
            "ubicacion": imp.ubicacion if imp.ubicacion else "Sin ubicación",
            "modelo": modelo_nombre,
            "es_color": es_color,
            "codigo_toner": codigo_toner,
            "rendimiento_fabrica": rendimiento,
            "detalles_color": detalles_color_lista,
            "historial": reportes_lista,
            "stock_reserva": stock_reserva,
            "historial_reserva": historial_reserva,
        })
        
    return resultado
# =========================================================================
# 5. ESQUEMA DE VALIDACIÓN AMPLIADO (Alineado para recibir reportes)
# =========================================================================
class ImpresoraCreate(BaseModel):
    numero_serie: str
    ip: str | None = None
    ubicacion: str
    modelo_equipo: str
    numero_maquina: str | None = None
    lectura_contador: int | None = None
    porcentaje_toner: int | None = None
    
    # NUEVO: Soporte opcional por si envías reportes manuales a color desde el panel
    porcentaje_cian: int | None = None
    porcentaje_magenta: int | None = None
    porcentaje_amarillo: int | None = None
    reserva_negro: int | None = Field(default=None, ge=0)
    reserva_cian: int | None = Field(default=None, ge=0)
    reserva_magenta: int | None = Field(default=None, ge=0)
    reserva_amarillo: int | None = Field(default=None, ge=0)


def sincronizar_inventario_reserva(db: Session, impresora_id: int, modelo, datos: ImpresoraCreate, es_alta: bool = False):
    cantidades = {
        "NEGRO": datos.reserva_negro,
        "CIAN": datos.reserva_cian,
        "MAGENTA": datos.reserva_magenta,
        "AMARILLO": datos.reserva_amarillo,
    }
    colores_permitidos = {"NEGRO"}
    if modelo.detalles_color or modelo.modelo_equipo.lower().endswith("ci"):
        colores_permitidos.update({"CIAN", "MAGENTA", "AMARILLO"})

    for color, cantidad_solicitada in cantidades.items():
        if color not in colores_permitidos:
            continue
        if cantidad_solicitada is None and not es_alta:
            continue

        registro = db.query(models.InventarioReserva).filter(
            models.InventarioReserva.impresora_id == impresora_id,
            models.InventarioReserva.color == color,
        ).first()
        if not registro:
            registro = models.InventarioReserva(impresora_id=impresora_id, color=color, cantidad=0)
            db.add(registro)
            db.flush()

        nueva_cantidad = cantidad_solicitada if cantidad_solicitada is not None else 0
        diferencia = nueva_cantidad - registro.cantidad
        if diferencia:
            registro.cantidad = nueva_cantidad
            db.add(models.HistorialReserva(
                impresora_id=impresora_id,
                tipo_movimiento="ENTRADA" if diferencia > 0 else "SALIDA",
                color=color,
                cantidad=diferencia,
                detalle="Carga inicial de reserva" if es_alta else "Ajuste manual de reserva",
            ))

# =========================================================================
# 6. RUTA POST UNIFICADA (💥 BLINDAJE EXTREMO CONTRA CLONES EN TIEMPO REAL)
# =========================================================================
@app.post("/api/impresoras")
def crear_impresora(impresora: ImpresoraCreate, db: Session = Depends(get_db)):
    serie_limpia = impresora.numero_serie.strip().upper()
    
    # 1. Validar modelo en el catálogo
    modelo = db.query(models.ModeloToner).filter(models.ModeloToner.modelo_equipo == impresora.modelo_equipo).first()
    if not modelo:
        raise HTTPException(status_code=400, detail=f"El modelo '{impresora.modelo_equipo}' no existe en el catálogo.")
    
    # 2. Guardar la Impresora usando un bloque try-except
    nueva_imp = models.Impresora(
        numero_serie=serie_limpia,
        ip=impresora.ip.strip() if impresora.ip else None,
        ubicacion=impresora.ubicacion.strip(),
        modelo_id=modelo.id
    )
    db.add(nueva_imp)  
    try:
        db.commit()
        db.refresh(nueva_imp)
    except Exception:
        db.rollback()
        existe_last = db.query(models.Impresora).filter(models.Impresora.numero_serie == serie_limpia).first()
        if existe_last:
            return {"message": "Sincronizada correctamente", "id": existe_last.id}
        raise HTTPException(status_code=400, detail="Error de duplicidad detectado.")
    
    # 3. Crear el primer reporte histórico si se ingresaron los datos manuales
    if impresora.lectura_contador is not None and impresora.porcentaje_toner is not None:
        from datetime import datetime
        fecha_hoy = datetime.now().date()
        
        nuevo_reporte = models.HistorialReporte(
            impresora_id=nueva_imp.id,
            fecha_reporte=fecha_hoy,
            contador_paginas=impresora.lectura_contador,
            porcentaje_toner=impresora.porcentaje_toner,
            origen="MANUAL",
        )
        db.add(nuevo_reporte)
        
        # Si se ingresaron porcentajes de color válidos, los insertamos en su tabla histórica
        if (impresora.porcentaje_cian is not None and 
            impresora.porcentaje_magenta is not None and 
            impresora.porcentaje_amarillo is not None):
            nuevo_reporte_color = models.HistorialReporteColor(
                impresora_id=nueva_imp.id,
                fecha_reporte=fecha_hoy,
                cian=impresora.porcentaje_cian,
                magenta=impresora.porcentaje_magenta,
                amarillo=impresora.porcentaje_amarillo
            )
            db.add(nuevo_reporte_color)
            
    sincronizar_inventario_reserva(db, nueva_imp.id, modelo, impresora, es_alta=True)
    db.commit()
        
    return {"message": "Impresora y reporte inicial guardados con éxito", "id": nueva_imp.id}

# =========================================================================
# 7. RUTA PARA ELIMINAR UNA IMPRESORA
# =========================================================================
@app.delete("/api/impresoras/{impresora_id}")
def eliminar_impresora(impresora_id: int, db: Session = Depends(get_db)):
    imp = db.query(models.Impresora).filter(models.Impresora.id == impresora_id).first()
    if not imp:
        raise HTTPException(status_code=404, detail="La impresora seleccionada no existe.")
    
    db.delete(imp)
    db.commit()
    return {"message": "Impresora eliminada correctamente"}


@app.delete("/api/reportes")
def eliminar_todos_los_reportes(db: Session = Depends(get_db)):
    reportes_ordenados = db.query(
        models.HistorialReporte.id.label("id"),
        models.HistorialReporte.impresora_id.label("impresora_id"),
        models.HistorialReporte.fecha_reporte.label("fecha_reporte"),
        func.row_number().over(
            partition_by=models.HistorialReporte.impresora_id,
            order_by=(
                case((models.HistorialReporte.origen == "CORREO", 0), else_=1),
                models.HistorialReporte.fecha_reporte.desc(),
                models.HistorialReporte.id.desc(),
            ),
        ).label("posicion"),
    ).subquery()
    ultimos_reportes = db.query(
        reportes_ordenados.c.id,
        reportes_ordenados.c.impresora_id,
        reportes_ordenados.c.fecha_reporte,
    ).filter(reportes_ordenados.c.posicion == 1).subquery()

    reportes_conservados = db.query(ultimos_reportes.c.id).count()
    reportes_correo_conservados = db.query(ultimos_reportes.c.id).join(
        models.HistorialReporte,
        models.HistorialReporte.id == ultimos_reportes.c.id,
    ).filter(models.HistorialReporte.origen == "CORREO").count()
    existe_reporte_conservado = db.query(ultimos_reportes.c.id).filter(
        ultimos_reportes.c.impresora_id == models.HistorialReporteColor.impresora_id,
        ultimos_reportes.c.fecha_reporte == models.HistorialReporteColor.fecha_reporte,
    ).exists()
    reportes_color_eliminados = db.query(models.HistorialReporteColor).filter(
        ~existe_reporte_conservado
    ).delete(synchronize_session=False)
    reportes_eliminados = db.query(models.HistorialReporte).filter(
        ~models.HistorialReporte.id.in_(db.query(ultimos_reportes.c.id))
    ).delete(synchronize_session=False)
    db.commit()
    return {
        "message": "Se conservaron los reportes de correo más recientes por impresora y se eliminaron los anteriores.",
        "reportes_conservados": reportes_conservados,
        "reportes_correo_conservados": reportes_correo_conservados,
        "reportes_respaldo_conservados": reportes_conservados - reportes_correo_conservados,
        "reportes_eliminados": reportes_eliminados,
        "reportes_color_eliminados": reportes_color_eliminados,
    }

# =========================================================================
# 8. RUTA PUT UNIFICADA (Edición de datos con actualización inteligente)
# =========================================================================
@app.put("/api/impresoras/{impresora_id}")
def actualizar_impresora(impresora_id: int, datos: ImpresoraCreate, db: Session = Depends(get_db)):
    imp = db.query(models.Impresora).filter(models.Impresora.id == impresora_id).first()
    if not imp:
        raise HTTPException(status_code=404, detail="La impresora no existe.")
    
    modelo = db.query(models.ModeloToner).filter(models.ModeloToner.modelo_equipo == datos.modelo_equipo).first()
    if not modelo:
        raise HTTPException(status_code=400, detail="Modelo no válido.")

    imp.numero_serie = datos.numero_serie.strip().upper()
    imp.ip = datos.ip.strip() if datos.ip else None
    imp.ubicacion = datos.ubicacion.strip()
    imp.modelo_id = modelo.id
    sincronizar_inventario_reserva(db, imp.id, modelo, datos)

    if datos.lectura_contador is not None and datos.porcentaje_toner is not None:
        from datetime import datetime
        fecha_hoy = datetime.now().date()
        
        reporte_hoy = db.query(models.HistorialReporte).filter(
            models.HistorialReporte.impresora_id == imp.id,
            models.HistorialReporte.fecha_reporte == fecha_hoy
        ).first()
        
        if reporte_hoy:
            reporte_hoy.contador_paginas = datos.lectura_contador
            reporte_hoy.porcentaje_toner = datos.porcentaje_toner
            reporte_hoy.origen = "MANUAL"
        else:
            nuevo_reporte = models.HistorialReporte(
                impresora_id=imp.id,
                fecha_reporte=fecha_hoy,
                contador_paginas=datos.lectura_contador,
                porcentaje_toner=datos.porcentaje_toner,
                origen="MANUAL",
            )
            db.add(nuevo_reporte)
            
        # Sincronización del reporte manual de color en el PUT
        if (datos.porcentaje_cian is not None and 
            datos.porcentaje_magenta is not None and 
            datos.porcentaje_amarillo is not None):
            
            reporte_color_hoy = db.query(models.HistorialReporteColor).filter(
                models.HistorialReporteColor.impresora_id == imp.id,
                models.HistorialReporteColor.fecha_reporte == fecha_hoy
            ).first()
            
            if reporte_color_hoy:
                reporte_color_hoy.cian = datos.porcentaje_cian
                reporte_color_hoy.magenta = datos.porcentaje_magenta
                reporte_color_hoy.amarillo = datos.porcentaje_amarillo
            else:
                nuevo_rep_color = models.HistorialReporteColor(
                    impresora_id=imp.id,
                    fecha_reporte=fecha_hoy,
                    cian=datos.porcentaje_cian,
                    magenta=datos.porcentaje_magenta,
                    amarillo=datos.porcentaje_amarillo
                )
                db.add(nuevo_rep_color)
            
    db.commit()
    
    return {"message": "Datos e historial actualizados con éxito"}

# =========================================================================
# 9. NUEVO ENDPOINT: DISPARAR EL ROBOT EXTRACTOR POP3 DESDE EL FRONTEND
# =========================================================================
@app.post("/api/parser/ejecutar")
def disparar_extractor_pop3():
    """Ejecuta de forma segura el robot extractor POP3 y procesa las alertas nuevas."""
    try:
        from parser import ejecutar_extractor_correos
        ejecutar_extractor_correos()
        return {
            "status": "success", 
            "message": "Robot POP3 ejecutado con éxito. Base de datos sincronizada con las nuevas alertas de Gmail."
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error crítico al ejecutar el robot Parser: {str(e)}"
        )
