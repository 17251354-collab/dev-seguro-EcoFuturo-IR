from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.database import supabase
from app.services.auth_service import decodificar_token

router = APIRouter(prefix="/usuarios", tags=["Usuários"])
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
async def listar_usuarios(current=Depends(get_current_user)):
    if current["tipo_usuario"] != "admin":
        raise HTTPException(403, "Acesso negado")
    result = supabase.table("usuario").select("id_usuario, nome, email, tipo_usuario, qtd_moeda, status, data_cadastro").order("nome").execute()
    return result.data

@router.get("/{user_id}")
async def consultar_usuario(user_id: int, current=Depends(get_current_user)):
    if current["tipo_usuario"] != "admin" and int(current["id_usuario"]) != user_id:
        raise HTTPException(403, "Acesso negado")
    result = supabase.table("usuario").select("id_usuario, nome, email, tipo_usuario, qtd_moeda, status, data_cadastro").eq("id_usuario", user_id).execute()
    if not result.data:
        raise HTTPException(404, "Usuário não encontrado")
    return result.data[0]

@router.put("/{user_id}")
async def alterar_usuario(user_id: int, dados: dict, current=Depends(get_current_user)):
    if current["tipo_usuario"] != "admin" and int(current["id_usuario"]) != user_id:
        raise HTTPException(403, "Acesso negado")
    if "tipo_usuario" in dados and dados["tipo_usuario"] == "admin" and current["tipo_usuario"] != "admin":
        raise HTTPException(403, "Não pode criar admins")
    result = supabase.table("usuario").update(dados).eq("id_usuario", user_id).execute()
    if not result.data:
        raise HTTPException(400, "Erro ao atualizar")
    user = result.data[0]
    return {
        "success": True,
        "usuario": {
            "id_usuario": user["id_usuario"],
            "nome": user["nome"],
            "email": user["email"],
            "tipo_usuario": user["tipo_usuario"],
            "qtd_moeda": user["qtd_moeda"],
            "status": user["status"]
        }
    }

@router.delete("/{user_id}")
async def excluir_usuario(user_id: int, current=Depends(get_current_user)):
    if current["tipo_usuario"] != "admin":
        raise HTTPException(403, "Acesso negado")
    if int(current["id_usuario"]) == user_id:
        raise HTTPException(400, "Não pode excluir a si mesmo")
    supabase.table("usuario").delete().eq("id_usuario", user_id).execute()
    return {"success": True, "message": "Usuário excluído"}