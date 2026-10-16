from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from settings import get_database_params

database_params = get_database_params()
SQLALCHEMY_DATABASE_URL = URL.create(
    "postgresql+psycopg2",
    username=database_params["user"],
    password=database_params["password"],
    host=database_params["host"],
    port=int(database_params["port"]),
    database=database_params["database"],
)

# 2. CREAR EL MOTOR DE LA BASE DE DATOS
# El motor gestiona las conexiones físicas con PostgreSQL
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# 3. CONFIGURAR LAS SESIONES
# Cada vez que el panel web pida datos, usará una sesión independiente para mayor seguridad
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. BASE PARA LOS MODELOS CLASE
# De aquí heredarán todas nuestras futuras tablas (Impresoras, Reportes, etc.)
Base = declarative_base()

# 5. FUNCIÓN AUXILIAR PARA OBTENER LA BASE DE DATOS
# Abre una conexión cuando la API la necesita y la cierra automáticamente al terminar
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
