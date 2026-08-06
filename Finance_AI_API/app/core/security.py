from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from firebase_admin import auth

from app.core.logger import logger


bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_uid(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> str:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Debes iniciar sesión.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        decoded_token = auth.verify_id_token(credentials.credentials)
        uid = decoded_token.get("uid")
        if not uid:
            raise ValueError("Token sin UID")
        return uid
    except Exception as exc:
        logger.warning("Firebase ID token inválido: %s", type(exc).__name__)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tu sesión expiró o no es válida. Inicia sesión nuevamente.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


def require_same_user(requested_uid: str, authenticated_uid: str) -> None:
    if requested_uid != authenticated_uid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para consultar información de otro usuario.",
        )
