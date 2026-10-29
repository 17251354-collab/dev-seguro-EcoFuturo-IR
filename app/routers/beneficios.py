from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.database import supabase
from app.services.auth_service import decodificar_token

router = APIRouter(prefix="/beneficios", tags=["Benefícios"])
security = HTTPBearer()

# ─── Mapa de público-alvo padrão por nome de benefício ───
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

@router.get("/")
async def listar_beneficios(current=Depends(get_current_user)):
    result = supabase.table("beneficio").select("*").order("nome").execute()

    # ─── RN002: Filtrar pelo público-alvo ───
    tipo = current["tipo_usuario"]

    if tipo == "admin":
        return result.data

    beneficios_filtrados = []
    for b in result.data:
        # Verifica se o benefício tem público_alvo definido no banco
        publico = b.get("publico_alvo")
        if publico and isinstance(publico, list):
            if tipo in publico:
                beneficios_filtrados.append(b)
        else:
            # Se não tem público_alvo no banco, usa o mapa padrão por nome
            publico_padrao = PUBLICO_ALVO_PADRAO.get(b.get("nome"))
            if publico_valido(publico_padrao, tipo):
                beneficios_filtrados.append(b)

    return beneficios_filtrados


def publico_valido(publico, tipo):
    """Se não tem público definido, permite todos"""
    if not publico:
        return True
    return tipo in publico


@router.post("/")
async def cadastrar_beneficio(dados: dict, current=Depends(get_current_user)):
    if current["tipo_usuario"] != "admin":
        raise HTTPException(403, "Acesso negado")
    if "nome" not in dados or not dados["nome"]:
        raise HTTPException(400, "Nome é obrigatório")
    if "valor_moedas" not in dados:
        raise HTTPException(400, "Valor em moedas é obrigatório")
    if "estoque" not in dados:
        raise HTTPException(400, "Estoque é obrigatório")
    if "id_parceiro" not in dados:
        raise HTTPException(400, "ID do parceiro é obrigatório")
    result = supabase.table("beneficio").insert(dados).execute()
    return {"success": True, "beneficio": result.data[0]}


@router.put("/{beneficio_id}")
async def alterar_beneficio(beneficio_id: int, dados: dict, current=Depends(get_current_user)):
    if current["tipo_usuario"] != "admin":
        raise HTTPException(403, "Acesso negado")
    result = supabase.table("beneficio").update(dados).eq("id_beneficio", beneficio_id).execute()
    if not result.data:
        raise HTTPException(400, "Erro ao atualizar")
    return {"success": True, "beneficio": result.data[0]}


@router.delete("/{beneficio_id}")
async def excluir_beneficio(beneficio_id: int, current=Depends(get_current_user)):
    if current["tipo_usuario"] != "admin":
        raise HTTPException(403, "Acesso negado")
    supabase.table("beneficio").delete().eq("id_beneficio", beneficio_id).execute()
    return {"success": True, "message": "Benefício excluído"}