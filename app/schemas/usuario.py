from pydantic import BaseModel, EmailStr

class UsuarioCreate(BaseModel):
    nome: str
    email: EmailStr
    senha: str
    tipo_usuario: str

class UsuarioLogin(BaseModel):
    email: EmailStr
    senha: str