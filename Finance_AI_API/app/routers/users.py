from fastapi import APIRouter, Depends, HTTPException, Path, status

from app.core.security import get_current_uid, require_same_user
from app.services.finance_service import FinanceService

router = APIRouter(
    prefix="/users",
    tags=["Users"],
)

finance_service = FinanceService()


# =====================================================
# OBTENER USUARIO AUTENTICADO
# =====================================================


@router.get(
    "/",
    summary="Obtener usuario autenticado",
    description="""
Devuelve únicamente el usuario correspondiente al Firebase ID token.
No expone información de otras cuentas.
""",
    status_code=status.HTTP_200_OK,
)
async def get_users(current_uid: str = Depends(get_current_uid)):

    user = finance_service.get_user(current_uid)
    users = [user] if user else []

    return {
        "success": True,
        "message": "Usuario autenticado obtenido correctamente.",
        "count": len(users),
        "data": users,
    }


# =====================================================
# OBTENER USUARIO POR UID
# =====================================================


@router.get(
    "/{uid}",
    summary="Obtener usuario por UID",
    description="""
Obtiene toda la información de un usuario utilizando
su UID de Firebase.
""",
    status_code=status.HTTP_200_OK,
)
async def get_user(
    uid: str = Path(
        ...,
        title="UID",
        description="UID del usuario registrado en Firebase.",
        min_length=20,
        examples={
            "ejemplo": {
                "summary": "UID de Firebase",
                "value": "6NLMplhbdTPAoQz2R66Tb3p8ay43",
            }
        },
    ),
    current_uid: str = Depends(get_current_uid),
):

    require_same_user(uid, current_uid)

    user = finance_service.get_user(uid)

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="Usuario no encontrado.",
        )

    return {
        "success": True,
        "message": "Usuario obtenido correctamente.",
        "data": user,
    }
