-- 1. CREAR TABLA DE MODELOS
CREATE TABLE modelos_toner (
    id SERIAL PRIMARY KEY,
    modelo_equipo VARCHAR(50) NOT NULL UNIQUE,
    codigo_toner VARCHAR(30) NOT NULL,
    rendimiento_fabrica INT NOT NULL
);

-- 2. CREAR TABLA DE IMPRESORAS
CREATE TABLE impresoras (
    id SERIAL PRIMARY KEY,
    numero_serie VARCHAR(50) NOT NULL UNIQUE,
    ip VARCHAR(15),
    ubicacion VARCHAR(100) NOT NULL,
    modelo_id INT REFERENCES modelos_toner(id) ON DELETE RESTRICT,
    fecha_alta TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. CREAR TABLA DE REPORTES
CREATE TABLE historial_reportes (
    id SERIAL PRIMARY KEY,
    impresora_id INT REFERENCES impresoras(id) ON DELETE CASCADE,
    fecha_reporte DATE NOT NULL,
    contador_paginas INT NOT NULL,
    porcentaje_toner INT NOT NULL,
    origen VARCHAR(15) NOT NULL DEFAULT 'HISTORICO',
    CONSTRAINT un_reporte_por_dia UNIQUE (impresora_id, fecha_reporte)
);

-- 4. INVENTARIO Y BITACORA DE TONER DE RESERVA
CREATE TABLE inventario_reserva (
    id SERIAL PRIMARY KEY,
    impresora_id INT NOT NULL REFERENCES impresoras(id) ON DELETE CASCADE,
    color VARCHAR(15) NOT NULL,
    cantidad INT NOT NULL DEFAULT 0 CHECK (cantidad >= 0),
    CONSTRAINT uq_inventario_reserva_impresora_color UNIQUE (impresora_id, color)
);

CREATE TABLE historial_reservas (
    id SERIAL PRIMARY KEY,
    impresora_id INT NOT NULL REFERENCES impresoras(id) ON DELETE CASCADE,
    fecha_movimiento TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tipo_movimiento VARCHAR(25) NOT NULL,
    color VARCHAR(15) NOT NULL,
    cantidad INT NOT NULL,
    detalle TEXT NOT NULL
);

-- 4. CARGA INICIAL DE TUS MODELOS KYOCERA
INSERT INTO modelos_toner (modelo_equipo, codigo_toner, rendimiento_fabrica) VALUES
('ECOSYS M3655idn', 'TK-3192', 25000),
('ECOSYS M5500', 'TK-5142', 5000),
('TASKalfa 4002i', 'TK-6117', 35000),
('TASKalfa 4003i', 'TK-6117', 35000),
('TASKalfa 3252ci', 'TK-8337K', 25000);
