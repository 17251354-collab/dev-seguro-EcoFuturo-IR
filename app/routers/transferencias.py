from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime
from app.database import supabase
from app.services.auth_service import decodificar_token

router = APIRouter(prefix="/transferencias", tags=["Transferências"])
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = decodificar_token(credentials.credentials)
    if not payload:
        raise HTTPException(401, "Token inválido")
    result = supabase.table("usuario").select("*").eq("id_usuario", payload["sub"]).execute()
    if not result.data:
        raise HTTPException(401, "Usuário não encontrado")
    return result.data[0]


@router.post("/")
async def transferir(dados: dict, current=Depends(get_current_user)):
    if current["tipo_usuario"] == "admin":
        raise HTTPException(403, "Admins não podem transferir moedas")

    email_destino = dados.get("email_destino")
    valor = dados.get("valor")

    if not email_destino:
        raise HTTPException(400, "E-mail do destinatário é obrigatório")
    if not valor or float(valor) <= 0:
        raise HTTPException(400, "Valor inválido")

    valor = float(valor)
    if float(current["qtd_moeda"]) < valor:
        raise HTTPException(400, "Saldo insuficiente")

    destino = supabase.table("usuario").select("*").eq("email", email_destino).execute()
    if not destino.data:
        raise HTTPException(404, "Destinatário não encontrado")
    dest = destino.data[0]

    if int(dest["id_usuario"]) == int(current["id_usuario"]):
        raise HTTPException(400, "Não pode transferir para si mesmo")

    # ─── RN009: Criar transferência com autorizado = false (pendente) ───
    result = supabase.table("transferencia").insert({
        "id_remetente": current["id_usuario"],
        "id_destinatario": dest["id_usuario"],
        "quantidade": valor,
        "autorizado": False
    }).execute()

    return {
        "success": True,
        "message": "Transferência solicitada. Aguardando aprovação do administrador.",
        "transferencia": result.data[0]
    }


@router.get("/historico")
async def historico(current=Depends(get_current_user)):
    result = supabase.table("transferencia") \
        .select("*") \
        .or_(f"id_remetente.eq.{current['id_usuario']},id_destinatario.eq.{current['id_usuario']}") \
        .order("dt_transferencia", desc=True) \
        .limit(20).execute()
    return result.data


@router.get("/pendentes")
async def pendentes(current=Depends(get_current_user)):
    if current["tipo_usuario"] != "admin":
        raise HTTPException(403, "Acesso negado")

    result = supabase.table("transferencia") \
        .select("*") \
        .eq("autorizado", False) \
        .order("dt_transferencia", desc=True).execute()
    return result.data


@router.put("/{transferencia_id}/aprovar")
async def aprovar(transferencia_id: int, current=Depends(get_current_user)):
    if current["tipo_usuario"] != "admin":
        raise HTTPException(403, "Acesso negado")

    t = supabase.table("transferencia").select("*").eq("id_transferencia", transferencia_id).execute()
    if not t.data:
        raise HTTPException(404, "Transferência não encontrada")

    trans = t.data[0]
    if trans["autorizado"]:
        raise HTTPException(400, "Transferência já aprovada")

    rem = supabase.table("usuario").select("*").eq("id_usuario", trans["id_remetente"]).execute()
    dest = supabase.table("usuario").select("*").eq("id_usuario", trans["id_destinatario"]).execute()

    if not rem.data or not dest.data:
        raise HTTPException(404, "Usuário não encontrado")

    remetente = rem.data[0]
    destinatario = dest.data[0]

    if float(remetente["qtd_moeda"]) < float(trans["quantidade"]):
        raise HTTPException(400, "Remetente não tem saldo suficiente")

    supabase.table("moeda").insert({
        "id_usuario": trans["id_remetente"],
        "quantidade": trans["quantidade"],
        "tipo_movimento": "SAIDA"
    }).execute()

    supabase.table("moeda").insert({
        "id_usuario": trans["id_destinatario"],
        "quantidade": trans["quantidade"],
        "tipo_movimento": "ENTRADA"
    }).execute()

    supabase.table("usuario").update({
        "qtd_moeda": float(remetente["qtd_moeda"]) - float(trans["quantidade"])
    }).eq("id_usuario", trans["id_remetente"]).execute()

    supabase.table("usuario").update({
        "qtd_moeda": float(destinatario["qtd_moeda"]) + float(trans["quantidade"])
    }).eq("id_usuario", trans["id_destinatario"]).execute()

    supabase.table("transferencia").update({
        "autorizado": True
    }).eq("id_transferencia", transferencia_id).execute()

    return {"success": True, "message": "Transferência aprovada"}


@router.put("/{transferencia_id}/rejeitar")
async def rejeitar(transferencia_id: int, current=Depends(get_current_user)):
    if current["tipo_usuario"] != "admin":
        raise HTTPException(403, "Acesso negado")

    t = supabase.table("transferencia").select("*").eq("id_transferencia", transferencia_id).execute()
    if not t.data:
        raise HTTPException(404, "Transferência não encontrada")

    if t.data[0]["autorizado"]:
        raise HTTPException(400, "Transferência já aprovada")

    supabase.table("transferencia").delete().eq("id_transferencia", transferencia_id).execute()

    return {"success": True, "message": "Transferência rejeitada e excluída"}