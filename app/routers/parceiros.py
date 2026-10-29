from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.database import supabase
from app.services.auth_service import decodificar_token

router = APIRouter(prefix="/parceiros", tags=["Parceiros"])
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = decodificar_token(credentials.credentials)
    if not payload:
        raise HTTPException(401, "Token inválido")
    result = supabase.table("usuario").select("*").eq("id_usuario", payload["sub"]).execute()
    if not result.data:
        raise HTTPException(401, "Usuário não encontrado")
    return result.data[0]

@router.get("/")
async def listar_parceiros(current=Depends(get_current_user)):
    if current["tipo_usuario"] != "admin":
        raise HTTPException(403, "Acesso negado")
    result = supabase.table("parceiro").select("*").order("nome").execute()
    return result.data

@router.post("/")
async def cadastrar_parceiro(dados: dict, current=Depends(get_current_user)):
    if current["tipo_usuario"] != "admin":
        raise HTTPException(403, "Acesso negado")
    if "nome" not in dados or not dados["nome"]:
        raise HTTPException(400, "Nome é obrigatório")
    if "cnpj" not in dados or not dados["cnpj"]:
        raise HTTPException(400, "CNPJ é obrigatório")
    result = supabase.table("parceiro").insert({
        "nome": dados["nome"],
        "cnpj": dados["cnpj"]
    }).execute()
    return {"success": True, "parceiro": result.data[0]}

@router.put("/{parceiro_id}")
async def alterar_parceiro(parceiro_id: int, dados: dict, current=Depends(get_current_user)):
    if current["tipo_usuario"] != "admin":
        raise HTTPException(403, "Acesso negado")
    result = supabase.table("parceiro").update(dados).eq("id_parceiro", parceiro_id).execute()
    if not result.data:
        raise HTTPException(400, "Erro ao atualizar")
    return {"success": True, "parceiro": result.data[0]}

@router.delete("/{parceiro_id}")
async def excluir_parceiro(parceiro_id: int, current=Depends(get_current_user)):
    if current["tipo_usuario"] != "admin":
        raise HTTPException(403, "Acesso negado")
    supabase.table("parceiro").delete().eq("id_parceiro", parceiro_id).execute()
    return {"success": True, "message": "Parceiro excluído"}