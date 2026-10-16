from sqlalchemy import Column, Integer, String, ForeignKey, Date, DateTime, Text, UniqueConstraint, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

# =========================================================================
# 1. MODELO PARA LA TABLA: modelos_toner (Base de catálogo)
# =========================================================================
class ModeloToner(Base):
    __tablename__ = "modelos_toner"

    id = Column(Integer, primary_key=True, index=True)
    modelo_equipo = Column(String(50), unique=True, nullable=False)
    codigo_toner = Column(String(30), nullable=False)
    rendimiento_fabrica = Column(Integer, nullable=False)

    # Relación: Un modelo de tóner puede estar en muchas impresoras
    impresoras = relationship("Impresora", back_populates="modelo")
    
    # NUEVO: Relación hacia el catálogo secundario de colores si aplica
    detalles_color = relationship("DetalleTonerColor", back_populates="modelo", cascade="all, delete-orphan")


# =========================================================================
# 2. MODELO PARA LA TABLA: impresoras
# =========================================================================
class Impresora(Base):
    __tablename__ = "impresoras"

    id = Column(Integer, primary_key=True, index=True)
    numero_serie = Column(String(50), unique=True, nullable=False, index=True)
    ip = Column(String(15), nullable=True)
    ubicacion = Column(String(100), nullable=False)
    modelo_id = Column(Integer, ForeignKey("modelos_toner.id", ondelete="RESTRICT"))
    fecha_alta = Column(DateTime, server_default=func.now())

    # Relaciones
    modelo = relationship("ModeloToner", back_populates="impresoras")
    reportes = relationship("HistorialReporte", back_populates="impresora", cascade="all, delete-orphan")
    
    # NUEVO: Relación hacia el historial cambiante diario de tóners a color
    reportes_color = relationship("HistorialReporteColor", back_populates="impresora", cascade="all, delete-orphan")
    inventario_reserva = relationship("InventarioReserva", back_populates="impresora", cascade="all, delete-orphan")
    historial_reservas = relationship("HistorialReserva", back_populates="impresora", cascade="all, delete-orphan")


# =========================================================================
# 3. MODELO PARA LA TABLA: historial_reportes (Tus datos B/N e históricos intactos)
# =========================================================================
class HistorialReporte(Base):
    __tablename__ = "historial_reportes"

    id = Column(Integer, primary_key=True, index=True)
    impresora_id = Column(Integer, ForeignKey("impresoras.id", ondelete="CASCADE"))
    fecha_reporte = Column(Date, nullable=False)
    contador_paginas = Column(Integer, nullable=False)
    porcentaje_toner = Column(Integer, nullable=False)
    origen = Column(String(15), nullable=False, default="HISTORICO", server_default="HISTORICO")

    # Relación: Este reporte pertenece a una sola impresora
    impresora = relationship("Impresora", back_populates="reportes")


# =========================================================================
# 4. NUEVA TABLA: detalle_toner_color (Catálogo extendido estático para color)
# =========================================================================
class DetalleTonerColor(Base):
    __tablename__ = "detalle_toner_color"

    id = Column(Integer, primary_key=True, autoincrement=True)
    modelo_equipo = Column(String(100), ForeignKey("modelos_toner.modelo_equipo", ondelete="CASCADE"))
    color = Column(String(20))
    codigo_toner = Column(String(50))
    rendimiento_fabrica = Column(Integer)

    # Relación inversa al catálogo base
    modelo = relationship("ModeloToner", back_populates="detalles_color")


# =========================================================================
# 5. NUEVA TABLA: historial_reportes_color (Historial dinámico para el robot Parser)
# =========================================================================
class HistorialReporteColor(Base):
    __tablename__ = "historial_reportes_color"

    id = Column(Integer, primary_key=True, autoincrement=True)
    impresora_id = Column(Integer, ForeignKey("impresoras.id", ondelete="CASCADE"))
    fecha_reporte = Column(Date, nullable=False)
    cian = Column(Integer, nullable=False)
    magenta = Column(Integer, nullable=False)
    amarillo = Column(Integer, nullable=False)

    # Relación inversa hacia la impresora
    impresora = relationship("Impresora", back_populates="reportes_color")


class InventarioReserva(Base):
    __tablename__ = "inventario_reserva"
    __table_args__ = (
        UniqueConstraint("impresora_id", "color", name="uq_inventario_reserva_impresora_color"),
        CheckConstraint("cantidad >= 0", name="ck_inventario_reserva_cantidad_no_negativa"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    impresora_id = Column(Integer, ForeignKey("impresoras.id", ondelete="CASCADE"), nullable=False)
    color = Column(String(15), nullable=False)
    cantidad = Column(Integer, nullable=False, default=0)

    impresora = relationship("Impresora", back_populates="inventario_reserva")


class HistorialReserva(Base):
    __tablename__ = "historial_reservas"

    id = Column(Integer, primary_key=True, autoincrement=True)
    impresora_id = Column(Integer, ForeignKey("impresoras.id", ondelete="CASCADE"), nullable=False)
    fecha_movimiento = Column(DateTime, server_default=func.now(), nullable=False)
    tipo_movimiento = Column(String(25), nullable=False)
    color = Column(String(15), nullable=False)
    cantidad = Column(Integer, nullable=False)
    detalle = Column(Text, nullable=False)

    impresora = relationship("Impresora", back_populates="historial_reservas")
