from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


# ==========================================================
# MODELO BASE DEL USUARIO
# ==========================================================


class UserModel(BaseModel):
    model_config = ConfigDict(extra="allow")

    uid: str = Field(
        ...,
        description="UID único del usuario en Firebase.",
        examples=["6NLMplhbdTPAoQz2R66Tb3p8ay43"],
    )

    name: Optional[str] = Field(default=None, description="Nombre del usuario.")

    email: Optional[str] = Field(default=None, description="Correo electrónico.")


# ==========================================================
# RESPUESTA LISTADO
# ==========================================================


class UsersResponse(BaseModel):
    success: bool = Field(..., examples=[True])

    message: str = Field(..., examples=["Usuarios obtenidos correctamente."])

    count: int = Field(..., examples=[3])

    data: List[Dict[str, Any]]


# ==========================================================
# RESPUESTA USUARIO
# ==========================================================


class UserResponse(BaseModel):
    success: bool = Field(..., examples=[True])

    message: str = Field(..., examples=["Usuario obtenido correctamente."])

    data: Dict[str, Any]


# ==========================================================
# SUMMARY
# ==========================================================


class SummaryData(BaseModel):
    uid: str = Field(..., examples=["6NLMplhbdTPAoQz2R66Tb3p8ay43"])

    summary: str = Field(..., description="Resumen financiero generado por IA.")


class SummaryResponse(BaseModel):
    success: bool = Field(..., examples=[True])

    message: str = Field(..., examples=["Resumen financiero generado correctamente."])

    data: SummaryData
