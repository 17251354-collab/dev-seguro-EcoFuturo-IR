from pydantic import BaseModel
from datetime import date

class AtividadeCreate(BaseModel):
    transport_type: str
    distancia: float
    duracao: int
    dt_registro: date