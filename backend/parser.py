import poplib
import email
from bs4 import BeautifulSoup
import re
import psycopg2
from datetime import datetime
from settings import get_database_params, get_email_settings

UMBRAL_CAMBIO_TONER = 35

def extraer_datos_html(texto_contenido):
    """Analiza el contenido del correo real de Kyocera manejando de forma segura los saltos de línea."""
    soup = BeautifulSoup(texto_contenido, 'html.parser')
    texto_original = soup.get_text()

    try:
        # 1. Extraer Número de Serie
        no_serie = re.search(r'Serial\s+Number:\s*([A-Z0-9-]+)', texto_original, re.IGNORECASE).group(1)
        
        # 2. 📊 CONTADOR MULTILÍNEA
        bloque_paginas = re.search(r'Printed\s+Pages:.*?.+?Total:\s*([0-9,.]+)', texto_original, re.DOTALL | re.IGNORECASE)
        contador = bloque_paginas.group(1)
        
        # 3. 🎨 TÓNER NEGRO MULTILÍNEA (Original para B/N y Negro de Color)
        bloque_toner = re.search(r'black:.*?\s*([0-9]+)\s*%', texto_original, re.DOTALL | re.IGNORECASE)
        toner = bloque_toner.group(1)
        
        contador_limpio = int(contador.replace(',', '').replace('.', ''))
        toner_limpio = int(toner)

        # --- NUEVO: SOPORTE PARA COLORES (Mantiene compatibilidad con B/N usando bloques try individuales) ---
        toner_c = None
        toner_m = None
        toner_y = None

        try:
            bloque_c = re.search(r'cyan:.*?\s*([0-9]+)\s*%', texto_original, re.DOTALL | re.IGNORECASE)
            if bloque_c: toner_c = int(bloque_c.group(1))
            
            bloque_m = re.search(r'magenta:.*?\s*([0-9]+)\s*%', texto_original, re.DOTALL | re.IGNORECASE)
            if bloque_m: toner_m = int(bloque_m.group(1))
            
            bloque_y = re.search(r'yellow:.*?\s*([0-9]+)\s*%', texto_original, re.DOTALL | re.IGNORECASE)
            if bloque_y: toner_y = int(bloque_y.group(1))
        except Exception:
            # Si el correo no contiene estas etiquetas por ser un equipo B/N, simplemente se quedan en None
            pass

        return no_serie.strip().upper(), contador_limpio, toner_limpio, toner_c, toner_m, toner_y
    except AttributeError:
        return None


def registrar_consumo_reserva(cur, impresora_id, color, nivel_anterior, nivel_actual):
    if nivel_anterior is None or nivel_actual - nivel_anterior < UMBRAL_CAMBIO_TONER:
        return

    cur.execute("""
        INSERT INTO inventario_reserva (impresora_id, color, cantidad)
        VALUES (%s, %s, 0)
        ON CONFLICT (impresora_id, color) DO NOTHING;
    """, (impresora_id, color))
    cur.execute("""
        UPDATE inventario_reserva
        SET cantidad = cantidad - 1
        WHERE impresora_id = %s AND color = %s AND cantidad > 0
        RETURNING cantidad;
    """, (impresora_id, color))
    stock_actualizado = cur.fetchone()
    tipo_movimiento = "SALIDA" if stock_actualizado else "CAMBIO_SIN_RESERVA"
    cantidad_movimiento = -1 if stock_actualizado else 0
    detalle = f"Cambio detectado por subida de {nivel_anterior}% a {nivel_actual}%"
    if not stock_actualizado:
        detalle += "; no había tóner de reserva disponible"

    cur.execute("""
        INSERT INTO historial_reservas (impresora_id, tipo_movimiento, color, cantidad, detalle)
        VALUES (%s, %s, %s, %s, %s);
    """, (impresora_id, tipo_movimiento, color, cantidad_movimiento, detalle))

def registrar_reporte_en_db(no_serie, contador, porcentaje, toner_c=None, toner_m=None, toner_y=None) -> bool:
    """Busca la impresora por Serie e inserta o actualiza el reporte en historial_reportes e historial_colores."""
    conn = None
    cur = None
    try:
        conn = psycopg2.connect(**get_database_params())
        cur = conn.cursor()
        fecha_hoy = datetime.now().date()

        # 1. Verificar si la impresora existe en el sistema
        cur.execute("SELECT id FROM impresoras WHERE numero_serie = %s;", (no_serie,))
        res = cur.fetchone()

        if res:
            impresora_id = res[0]  # Extraer ID numérico correctamente
            
            # 2. Consultar el último reporte guardado para este equipo
            cur.execute("""
                SELECT contador_paginas, porcentaje_toner, fecha_reporte FROM historial_reportes 
                WHERE impresora_id = %s 
                ORDER BY fecha_reporte DESC, id DESC LIMIT 1;
            """, (impresora_id,))
            ultimo_reporte = cur.fetchone()

            if ultimo_reporte:
                ultimo_contador = ultimo_reporte[0]
                ultimo_porcentaje = ultimo_reporte[1]
                ultima_fecha = ultimo_reporte[2]

                niveles_anteriores = {"NEGRO": ultimo_porcentaje}
                cur.execute("""
                    SELECT cian, magenta, amarillo FROM historial_reportes_color
                    WHERE impresora_id = %s AND fecha_reporte = %s
                    ORDER BY id DESC LIMIT 1;
                """, (impresora_id, ultima_fecha))
                ultimo_color = cur.fetchone()
                if ultimo_color:
                    niveles_anteriores.update(dict(zip(("CIAN", "MAGENTA", "AMARILLO"), ultimo_color)))

                niveles_actuales = {"NEGRO": porcentaje}
                if toner_c is not None:
                    niveles_actuales["CIAN"] = toner_c
                if toner_m is not None:
                    niveles_actuales["MAGENTA"] = toner_m
                if toner_y is not None:
                    niveles_actuales["AMARILLO"] = toner_y

                # Si es de la misma fecha, validamos que no estemos sobreescribiendo datos nuevos con viejos
                if str(ultima_fecha) == str(fecha_hoy):
                    niveles_comparables = [
                        (niveles_anteriores[color], nivel)
                        for color, nivel in niveles_actuales.items()
                        if color in niveles_anteriores
                    ]
                    reporte_mas_viejo = (
                        ultimo_contador == contador
                        and niveles_comparables
                        and all(anterior >= actual for anterior, actual in niveles_comparables)
                        and any(anterior > actual for anterior, actual in niveles_comparables)
                    )
                    if ultimo_contador > contador or reporte_mas_viejo:
                        print(f"⏭️ [Parser Skip] Se evitó sobreescribir el reporte nuevo con un correo atrasado de hoy.")
                        return True

                    for color, nivel_actual in niveles_actuales.items():
                        registrar_consumo_reserva(cur, impresora_id, color, niveles_anteriores.get(color), nivel_actual)
                        
                    sql_update = """
                        UPDATE historial_reportes 
                        SET contador_paginas = %s, porcentaje_toner = %s, origen = 'CORREO'
                        WHERE impresora_id = %s AND fecha_reporte = %s;
                    """
                    cur.execute(sql_update, (contador, porcentaje, impresora_id, fecha_hoy))
                    print(f"🔄 [Parser] Registro de hoy actualizado con datos más nuevos -> Serie: {no_serie} | Tóner: {porcentaje}% | Páginas: {contador}")
                    
                    # ACTUALIZACIÓN DE COLORES (Si vienen en el correo)
                    if toner_c is not None and toner_m is not None and toner_y is not None:
                        # Para evitar errores de duplicidad en tablas históricas de color si ya existía reporte hoy
                        cur.execute("DELETE FROM historial_reportes_color WHERE impresora_id = %s AND fecha_reporte = %s;", (impresora_id, fecha_hoy))
                        sql_insert_color = """
                            INSERT INTO historial_reportes_color (impresora_id, fecha_reporte, cian, magenta, amarillo)
                            VALUES (%s, %s, %s, %s, %s);
                        """
                        cur.execute(sql_insert_color, (impresora_id, fecha_hoy, toner_c, toner_m, toner_y))

                    conn.commit()
                    return True

            # 3. Si no hay reportes previos o es un día nuevo, se inserta un registro limpio
            if ultimo_reporte:
                for color, nivel_actual in niveles_actuales.items():
                    registrar_consumo_reserva(cur, impresora_id, color, niveles_anteriores.get(color), nivel_actual)

            sql_insert = """
                INSERT INTO historial_reportes (impresora_id, fecha_reporte, contador_paginas, porcentaje_toner, origen)
                VALUES (%s, %s, %s, %s, 'CORREO');
            """
            cur.execute(sql_insert, (impresora_id, fecha_hoy, contador, porcentaje))
            
            # INSERCIÓN DE COLORES NUEVA (Solo si aplica para el modelo)
            if toner_c is not None and toner_m is not None and toner_y is not None:
                sql_insert_color = """
                    INSERT INTO historial_reportes_color (impresora_id, fecha_reporte, cian, magenta, amarillo)
                    VALUES (%s, %s, %s, %s, %s);
                """
                cur.execute(sql_insert_color, (impresora_id, fecha_hoy, toner_c, toner_m, toner_y))
                print(f"🎨 [Parser Color] Desglose guardado con éxito -> C: {toner_c}% | M: {toner_m}% | Y: {toner_y}%")

            print(f"✅ [Parser] Nuevo reporte guardado con éxito -> Serie: {no_serie} | Tóner: {porcentaje}% | Páginas: {contador}")
            conn.commit()
            
        else:
            print(f"⚠️ [Parser Alert] Se recibió un correo con Serie '{no_serie}', pero debes darlo de alta primero en el panel web.")

            return False

        return True
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"❌ Error de base de datos en el robot Parser: {e}")
        return False
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


def procesar_reporte_correo(conexion_pop, indice, datos):
    if not registrar_reporte_en_db(*datos):
        return False
    conexion_pop.dele(indice)
    return True

def ejecutar_extractor_correos():
    """Se conecta de forma segura vía POP3 a la bandeja de entrada y procesa los correos nuevos."""
    try:
        email_user, email_password, pop3_server, pop3_port = get_email_settings()
        p = poplib.POP3_SSL(pop3_server, pop3_port)
        p.user(email_user)
        p.pass_(email_password)

        num_mensajes = len(p.list()[1])
        
        if num_mensajes == 0:
            print("📭 Bandeja vacía: No hay correos nuevos.")
            p.quit()
            return

        print(f"📩 Leyendo bandeja de entrada POP3... Se encontraron {num_mensajes} correos en total.")

        for i in range(num_mensajes, 0, -1):
            response, lineas_mensaje, octets = p.retr(i)
            contenido_completo = b"\n".join(lineas_mensaje)
            msg = email.message_from_bytes(contenido_completo)
            
            asunto = str(msg.get("Subject", ""))
            print(f"🔍 Evaluando correo con Asunto: '{asunto}'")

            cuerpo_correo = ""
            if msg.is_multipart():
                for part in msg.walk():
                    if part.get_content_type() in ["text/html", "text/plain"]:
                        cuerpo_correo = part.get_payload(decode=True).decode(part.get_content_charset() or 'utf-8', errors='ignore')
                        if cuerpo_correo: 
                            break
            else:
                if msg.get_content_type() in ["text/html", "text/plain"]:
                    cuerpo_correo = msg.get_payload(decode=True).decode(msg.get_content_charset() or 'utf-8', errors='ignore')

            if cuerpo_correo:
                datos = extraer_datos_html(cuerpo_correo)
                if datos:
                    procesar_reporte_correo(p, i, datos)

        p.quit()
    except Exception as e:
        print(f"❌ Error crítico de conexión POP3 a Gmail en el Parser: {e}")

if __name__ == "__main__":
    ejecutar_extractor_correos()
