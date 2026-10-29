from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timedelta
import secrets
from app.database import supabase
from app.services.auth_service import decodificar_token

router = APIRouter(prefix="/resgates", tags=["Resgates"])
security = HTTPBearer()

DOMINIO_INSTITUCIONAL = "@esuda.edu.br"

PUBLICO_ALVO_PADRAO = {
    "EcoBag": ["aluno", "professor", "funcionarioEsuda", "comunidadeExterna"],
    "Cafe na Delta Expresso": ["aluno", "professor", "funcionarioEsuda"],
    "Ingresso de Cinema": ["aluno", "professor", "funcionarioEsuda"],
    "Vale-refeicao de R$50": ["aluno", "professor", "funcionarioEsuda"],
    "Camiseta EcoFuturo Esuda": ["aluno", "professor", "funcionarioEsuda", "comunidadeExterna"],
    "Desconto 50% na Livraria Jaqueira": ["aluno", "professor", "funcionarioEsuda"],
    "Desconto 50% na Matricula ESUDA": ["aluno", "professor", "funcionarioEsuda", "comunidadeExterna"],
    "Fone de Ouvido Gamer": ["aluno", "professor", "funcionarioEsuda"]
}


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = decodificar_token(credentials.credentials)
    if not payload:
        raise HTTPException(401, "Token inválido")
    result = supabase.table("usuario").select("*").eq("id_usuario", payload["sub"]).execute()
    if not result.data:
        raise HTTPException(401, "Usuário não encontrado")
    return result.data[0]


@router.post("/resgatar/{beneficio_id}")
async def resgatar(beneficio_id: int, current=Depends(get_current_user)):
    email = current["email"]
    tipo = current["tipo_usuario"]

    if tipo != "comunidadeExterna" and not email.endswith(DOMINIO_INSTITUCIONAL):
        raise HTTPException(
            403,
            f"Para resgatar benefícios, é necessário e-mail institucional ({DOMINIO_INSTITUCIONAL})."
        )

    b = supabase.table("beneficio").select("*").eq("id_beneficio", beneficio_id).execute()
    if not b.data:
        raise HTTPException(404, "Benefício não encontrado")
    beneficio = b.data[0]

    publico = beneficio.get("publico_alvo")
    if publico and isinstance(publico, list):
        if tipo not in publico:
            raise HTTPException(403, "Este benefício não está disponível para seu tipo de usuário.")
    else:
        publico_padrao = PUBLICO_ALVO_PADRAO.get(beneficio.get("nome"))
        if publico_padrao and tipo not in publico_padrao:
            raise HTTPException(403, "Este benefício não está disponível para seu tipo de usuário.")

    if beneficio["estoque"] <= 0:
        raise HTTPException(400, "Estoque esgotado")

    if float(current["qtd_moeda"]) < float(beneficio["valor_moedas"]):
        raise HTTPException(400, "Saldo insuficiente")

    resgate = supabase.table("resgate").insert({
        "id_usuario": current["id_usuario"],
        "id_beneficio": beneficio_id,
        "moedas_usadas": beneficio["valor_moedas"],
        "status_resgate": "CONCLUIDO"
    }).execute()

    resgate_id = resgate.data[0]["id_resgate"]

    codigo = secrets.token_urlsafe(12)
    validade = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")

    supabase.table("voucher").insert({
        "id_resgate": resgate_id,
        "codigo": codigo,
        "dt_emissao": datetime.now().strftime("%Y-%m-%d"),
        "dt_validade": validade,
        "status": "ATIVO"
    }).execute()

    supabase.table("beneficio").update({
        "estoque": beneficio["estoque"] - 1
    }).eq("id_beneficio", beneficio_id).execute()

    novo_saldo = float(current["qtd_moeda"]) - float(beneficio["valor_moedas"])
    supabase.table("usuario").update({"qtd_moeda": novo_saldo}) \
        .eq("id_usuario", current["id_usuario"]).execute()

    # ─── RN008: Parceiro recebe crédito ───
    id_parceiro = beneficio.get("id_parceiro")
    if id_parceiro:
        try:
            supabase.table("credito_parceiro").insert({
                "id_parceiro": id_parceiro,
                "id_resgate": resgate_id,
                "quantidade": beneficio["valor_moedas"]
            }).execute()
        except Exception as e:
            print(f"Erro ao registrar crédito do parceiro: {e}")

    return {
        "success": True,
        "voucher": codigo,
        "validade": validade,
        "novo_saldo": novo_saldo
    }


@router.get("/meus-vouchers")
async def meus_vouchers(current=Depends(get_current_user)):
    result = supabase.table("voucher") \
        .select("*, resgate!inner(id_usuario, beneficio(nome))") \
        .eq("resgate.id_usuario", current["id_usuario"]).execute()

    vouchers = []
    for v in result.data:
        beneficio_nome = "?"
        if v.get("resgate") and v["resgate"].get("beneficio"):
            b = v["resgate"]["beneficio"]
            if isinstance(b, dict):
                beneficio_nome = b.get("nome", "?")
            elif isinstance(b, list) and len(b) > 0:
                beneficio_nome = b[0].get("nome", "?")

        vouchers.append({
            "id_voucher": v["id_voucher"],
            "codigo": v["codigo"],
            "status": v["status"],
            "dt_emissao": v["dt_emissao"],
            "dt_validade": v["dt_validade"],
            "beneficio": beneficio_nome
        })

    return vouchers


@router.get("/creditos-parceiros")
async def creditos_parceiros(current=Depends(get_current_user)):
    if current["tipo_usuario"] != "admin":
        raise HTTPException(403, "Acesso negado. Apenas admin.")

    result = supabase.table("credito_parceiro") \
        .select("*, parceiro:parceiro!inner(nome)") \
        .order("dt_credito", desc=True).execute()
    return result.data