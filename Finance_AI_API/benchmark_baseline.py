import os
import statistics
import time

import requests


# ==========================================================
# CONFIGURACIÓN
# ==========================================================

BASE_URL = "http://127.0.0.1:8000"

# UID del usuario que será utilizado para la prueba
UID = "2s5ajLylt4NlieTDYOSU3aOjWPG3"

# Token Firebase del mismo usuario
TOKEN = os.getenv("FIREBASE_ID_TOKEN")

# Endpoint que vamos a medir
ENDPOINT = f"{BASE_URL}/ai/predict/{UID}"

# Cantidad de solicitudes para la línea base
TOTAL_REQUESTS = 20

# Tiempo máximo de espera por solicitud
TIMEOUT = 60


# ==========================================================
# VALIDACIÓN DE CONFIGURACIÓN
# ==========================================================

if not TOKEN:
    raise RuntimeError(
        "No se encontró FIREBASE_ID_TOKEN. "
        "Configura el token antes de ejecutar el benchmark."
    )


# ==========================================================
# HEADERS
# ==========================================================

HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json",
}


# ==========================================================
# RESULTADOS
# ==========================================================

successful_times = []
failed_requests = []


# ==========================================================
# INICIO
# ==========================================================

print("=" * 70)
print("LÍNEA BASE - FINANCE AI API")
print("=" * 70)

print(f"Endpoint: {ENDPOINT}")
print(f"Solicitudes: {TOTAL_REQUESTS}")
print()


# ==========================================================
# EJECUCIÓN DE LAS SOLICITUDES
# ==========================================================

for i in range(1, TOTAL_REQUESTS + 1):

    start = time.perf_counter()

    try:

        response = requests.post(
            ENDPOINT,
            headers=HEADERS,
            timeout=TIMEOUT,
        )

        duration_ms = (
            time.perf_counter() - start
        ) * 1000

        status_code = response.status_code

        # --------------------------------------------------
        # SOLICITUD EXITOSA
        # --------------------------------------------------

        if 200 <= status_code < 300:

            successful_times.append(duration_ms)

            print(
                f"[{i:02d}/{TOTAL_REQUESTS}] "
                f"OK | "
                f"{status_code} | "
                f"{duration_ms:.2f} ms"
            )

        # --------------------------------------------------
        # SOLICITUD FALLIDA
        # --------------------------------------------------

        else:

            failed_requests.append(
                {
                    "request": i,
                    "status_code": status_code,
                    "duration_ms": duration_ms,
                }
            )

            print(
                f"[{i:02d}/{TOTAL_REQUESTS}] "
                f"ERROR | "
                f"{status_code} | "
                f"{duration_ms:.2f} ms"
            )

    except requests.RequestException as ex:

        duration_ms = (
            time.perf_counter() - start
        ) * 1000

        failed_requests.append(
            {
                "request": i,
                "status_code": None,
                "duration_ms": duration_ms,
                "error": str(ex),
            }
        )

        print(
            f"[{i:02d}/{TOTAL_REQUESTS}] "
            f"ERROR | "
            f"{duration_ms:.2f} ms | "
            f"{ex}"
        )


# ==========================================================
# CÁLCULO DE MÉTRICAS
# ==========================================================

total_requests = TOTAL_REQUESTS
successful = len(successful_times)
failed = len(failed_requests)

error_rate = (
    failed / total_requests
) * 100


# ==========================================================
# PERCENTILES
# ==========================================================

if successful_times:

    sorted_times = sorted(successful_times)

    # ------------------------------------------------------
    # P50
    # ------------------------------------------------------

    p50 = statistics.median(sorted_times)

    # ------------------------------------------------------
    # P95
    #
    # Interpolación lineal
    # ------------------------------------------------------

    position = (
        len(sorted_times) - 1
    ) * 0.95

    lower_index = int(position)

    upper_index = min(
        lower_index + 1,
        len(sorted_times) - 1,
    )

    weight = (
        position - lower_index
    )

    p95 = (
        sorted_times[lower_index]
        + weight
        * (
            sorted_times[upper_index]
            - sorted_times[lower_index]
        )
    )

    # ------------------------------------------------------
    # MÁXIMO
    # ------------------------------------------------------

    maximum = max(sorted_times)

else:

    # No hubo solicitudes exitosas.
    p50 = None
    p95 = None
    maximum = None


# ==========================================================
# RESULTADOS
# ==========================================================

print()

print("=" * 70)
print("RESULTADOS DE LA LÍNEA BASE")
print("=" * 70)

print(
    f"Solicitudes totales : {total_requests}"
)

print(
    f"Solicitudes exitosas: {successful}"
)

print(
    f"Solicitudes fallidas: {failed}"
)

print(
    f"Tasa de error       : {error_rate:.2f}%"
)

print()


if successful_times:

    print(
        f"p50                 : {p50:.2f} ms"
    )

    print(
        f"p95                 : {p95:.2f} ms"
    )

    print(
        f"Máximo              : {maximum:.2f} ms"
    )

else:

    print(
        "p50                 : N/A "
        "(sin solicitudes exitosas)"
    )

    print(
        "p95                 : N/A "
        "(sin solicitudes exitosas)"
    )

    print(
        "Máximo              : N/A "
        "(sin solicitudes exitosas)"
    )


print("=" * 70)


# ==========================================================
# TABLA PARA EL INFORME
# ==========================================================

print()
print("TABLA DE LÍNEA BASE")
print()

print("| Métrica | Resultado |")
print("|---|---:|")
print(f"| Solicitudes | {total_requests} |")
print(f"| Exitosas | {successful} |")
print(f"| Fallidas | {failed} |")
print(f"| Tasa de error | {error_rate:.2f}% |")


if successful_times:

    print(f"| p50 | {p50:.2f} ms |")
    print(f"| p95 | {p95:.2f} ms |")
    print(f"| Máximo | {maximum:.2f} ms |")

else:

    print("| p50 | N/A |")
    print("| p95 | N/A |")
    print("| Máximo | N/A |")


# ==========================================================
# DETALLE DE ERRORES
# ==========================================================

if failed_requests:

    print()
    print("=" * 70)
    print("DETALLE DE SOLICITUDES FALLIDAS")
    print("=" * 70)

    for error in failed_requests:

        print(
            f"Solicitud #{error['request']} | "
            f"Status: {error['status_code']} | "
            f"Tiempo: {error['duration_ms']:.2f} ms"
        )

        if "error" in error:

            print(
                f"  Error: {error['error']}"
            )