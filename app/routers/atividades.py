from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.database import supabase
from app.schemas.atividade import AtividadeCreate
from app.services.strategies import STRATEGIES
from app.services.auth_service import decodificar_token

router = APIRouter(prefix="/atividades", tags=["Atividades"])
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = decodificar_token(credentials.credentials)
    if not payload:
        raise HTTPException(401, "Token inválido")
    result = supabase.table("usuario").select("*").eq("id_usuario", payload["sub"]).execute()
    if not result.data:
        raise HTTPException(401, "Usuário não encontrado")
    return result.data[0]

@router.post("/registrar")
async def registrar_atividade(dados: AtividadeCreate, current=Depends(get_current_user)):
    # 1. Valida transporte
    strategy = STRATEGIES.get(dados.transport_type)
    if not strategy:
        raise HTTPException(400, "Transporte inválido")

    # 2. Valida distância e duração
    if dados.distancia <= 0:
        raise HTTPException(400, "Distância inválida")
    if dados.duracao <= 0:
        raise HTTPException(400, "Duração inválida")

    # 3. Verifica duplicidade na mesma data
    dup = supabase.table("atividade").select("id_atividade") \
        .eq("id_usuario", current["id_usuario"]) \
        .eq("dt_registro", str(dados.dt_registro)).execute()
    if dup.data:
        raise HTTPException(400, "Você já registrou atividade nesta data")

    # 4. Calcula moedas e CO₂
    moedas = strategy.calcular_moedas(dados.distancia)
    co2 = strategy.calcular_co2(dados.distancia)

    # 5. Insere atividade
    ativ = supabase.table("atividade").insert({
        "id_usuario": current["id_usuario"],
        "distancia": dados.distancia,
        "duracao": dados.duracao,
        "dt_registro": str(dados.dt_registro),
        "transport_type": dados.transport_type
    }).execute()
    ativ_id = ativ.data[0]["id_atividade"]

    # 6. Insere emissão de CO₂
    emissao = supabase.table("emissao_co2").insert({
        "id_atividade": ativ_id,
        "quantidade_co2": co2
    }).execute()
    emissao_id = emissao.data[0]["id_emissao"]

    # 7. Insere conversão de moedas
    conv = supabase.table("conversao_moedas").insert({
        "id_emissao": emissao_id,
        "quantidade_moeda": moedas
    }).execute()
    conv_id = conv.data[0]["id_conversao"]

    # 8. Insere movimentação de moeda
    supabase.table("moeda").insert({
        "id_usuario": current["id_usuario"],
        "quantidade": moedas,
        "tipo_movimento": "ENTRADA",
        "id_conversao": conv_id
    }).execute()

    # 9. Atualiza saldo do usuário
    novo_saldo = float(current["qtd_moeda"]) + moedas
    supabase.table("usuario").update({
        "qtd_moeda": novo_saldo
    }).eq("id_usuario", current["id_usuario"]).execute()

    return {
        "success": True,
        "moedas_ganhas": moedas,
        "co2_reduzido": co2,
        "novo_saldo": novo_saldo
    }