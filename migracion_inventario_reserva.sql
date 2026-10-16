CREATE TABLE IF NOT EXISTS inventario_reserva (
    id SERIAL PRIMARY KEY,
    impresora_id INT NOT NULL REFERENCES impresoras(id) ON DELETE CASCADE,
    color VARCHAR(15) NOT NULL,
    cantidad INT NOT NULL DEFAULT 0 CHECK (cantidad >= 0),
    CONSTRAINT uq_inventario_reserva_impresora_color UNIQUE (impresora_id, color)
);

CREATE TABLE IF NOT EXISTS historial_reservas (
    id SERIAL PRIMARY KEY,
    impresora_id INT NOT NULL REFERENCES impresoras(id) ON DELETE CASCADE,
    fecha_movimiento TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tipo_movimiento VARCHAR(25) NOT NULL,
    color VARCHAR(15) NOT NULL,
    cantidad INT NOT NULL,
    detalle TEXT NOT NULL
);

ALTER TABLE historial_reportes
ADD COLUMN IF NOT EXISTS origen VARCHAR(15) NOT NULL DEFAULT 'HISTORICO';