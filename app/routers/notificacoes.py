from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.database import supabase
from app.services.auth_service import decodificar_token

router = APIRouter(prefix="/notificacoes", tags=["Notificações"])
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
async def listar_notificacoes(current=Depends(get_current_user)):
    result = supabase.table("notificacao") \
        .select("*") \
        .eq("id_usuario", current["id_usuario"]) \
        .order("dt_envio", desc=True) \
        .limit(50).execute()
    return result.data

@router.get("/nao-lidas")
async def nao_lidas(current=Depends(get_current_user)):
    result = supabase.table("notificacao") \
        .select("id_notificacao") \
        .eq("id_usuario", current["id_usuario"]) \
        .eq("status", "NOVA").execute()
    return {"total": len(result.data)}

@router.put("/{notificacao_id}/marcar-lida")
async def marcar_lida(notificacao_id: int, current=Depends(get_current_user)):
    result = supabase.table("notificacao") \
        .update({"status": "LIDA"}) \
        .eq("id_notificacao", notificacao_id) \
        .eq("id_usuario", current["id_usuario"]).execute()
    if not result.data:
        raise HTTPException(404, "Notificação não encontrada")
    return {"success": True, "message": "Notificação marcada como lida"}

@router.post("/criar")
async def criar_notificacao(dados: dict, current=Depends(get_current_user)):
    if current["tipo_usuario"] != "admin":
        raise HTTPException(403, "Acesso negado")
    if "id_usuario" not in dados or "mensagem" not in dados:
        raise HTTPException(400, "id_usuario e mensagem são obrigatórios")

    result = supabase.table("notificacao").insert({
        "id_usuario": dados["id_usuario"],
        "mensagem": dados["mensagem"],
        "tipo": dados.get("tipo", "info"),
        "status": "NOVA"
    }).execute()
    return {"success": True, "notificacao": result.data[0]}

@router.get("/motivacional")
async def mensagem_motivacional(current=Depends(get_current_user)):
    mensagens = [
        "🌱 Cada pedalada conta! Continue assim!",
        "🌍 Você está ajudando o planeta!",
        "🚴 A sustentabilidade é um caminho, não um destino.",
        "💚 Pequenas ações geram grandes mudanças!",
        "🌳 Você já reduziu CO₂ hoje? Continue firme!",
        "🏆 Parabéns por escolher o transporte sustentável!",
        "⭐ Continue registrando suas atividades!",
        "🎯 Você está no caminho certo para um futuro melhor!"
    ]

    import random
    mensagem = random.choice(mensagens)
    return {
        "mensagem": mensagem,
        "usuario": current["nome"]
    }