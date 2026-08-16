import json
import logging
import sys


class JsonFormatter(logging.Formatter):
    """
    Formateador de logs en JSON.

    Cada evento se registra como una línea JSON para facilitar
    su búsqueda, filtrado y análisis.
    """

    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": self.formatTime(
                record,
                datefmt="%Y-%m-%dT%H:%M:%S"
            ),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        # Agregar campos adicionales enviados mediante extra={}
        extra_fields = getattr(record, "extra_fields", None)

        if isinstance(extra_fields, dict):
            log_data.update(extra_fields)

        return json.dumps(
            log_data,
            ensure_ascii=False
        )


def _create_logger() -> logging.Logger:
    logger = logging.getLogger("finance-ai")

    logger.setLevel(logging.INFO)

    # Evitar agregar handlers duplicados cuando se utiliza
    # uvicorn --reload
    if logger.handlers:
        return logger

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())

    logger.addHandler(handler)

    # Evitar que el mensaje sea procesado nuevamente
    # por el logger raíz.
    logger.propagate = False

    return logger


logger = _create_logger()