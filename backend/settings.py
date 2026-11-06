import os
from dotenv import load_dotenv

# Forzar la carga del archivo .env antes de cualquier validación
load_dotenv()

def _required_environment_value(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"Falta configurar la variable de entorno {name}.")
    return value


def get_database_params() -> dict[str, str]:
    return {
        "host": os.getenv("TONER_DB_HOST", "localhost"),
        "database": os.getenv("TONER_DB_NAME", "control_toner_kyocera"),
        "user": _required_environment_value("TONER_DB_USER"),
        "password": _required_environment_value("TONER_DB_PASSWORD"),
        "port": os.getenv("TONER_DB_PORT", "5432"),
    }


def get_email_settings() -> tuple[str, str, str, int]:
    return (
        _required_environment_value("TONER_GMAIL_USER"),
        _required_environment_value("TONER_GMAIL_APP_PASSWORD"),
        os.getenv("TONER_POP3_SERVER", "pop.gmail.com"),
        int(os.getenv("TONER_POP3_PORT", "995")),
    )


def get_admin_credentials() -> tuple[str, str] | None:
    username = os.getenv("TONER_ADMIN_USER", "").strip()
    password = os.getenv("TONER_ADMIN_PASSWORD", "")
    if not username or not password.strip():
        return None
    return username, password
