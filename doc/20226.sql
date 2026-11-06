DELETE FROM historial_reportes WHERE impresora_id IN (SELECT id FROM impresoras WHERE numero_serie = 'LSD4803430');
DELETE FROM impresoras WHERE numero_serie = 'LSD4803430';

ALTER TABLE impresoras ADD CONSTRAINT uq_numero_serie UNIQUE (numero_serie);