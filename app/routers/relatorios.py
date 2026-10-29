from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.database import supabase
from app.services.auth_service import decodificar_token

router = APIRouter(prefix="/relatorios", tags=["Relatórios"])
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = decodificar_token(credentials.credentials)
    if not payload:
        raise HTTPException(401, "Token inválido")
    result = supabase.table("usuario").select("*").eq("id_usuario", payload["sub"]).execute()
    if not result.data:
        raise HTTPException(401, "Usuário não encontrado")
    return result.data[0]

@router.get("/pessoal")
async def relatorio_pessoal(current=Depends(get_current_user)):
    atividades = supabase.table("atividade") \
        .select("*, emissao_co2(quantidade_co2)") \
        .eq("id_usuario", current["id_usuario"]).execute()

    total_co2 = 0
    total_km = 0
    for a in atividades.data:
        total_km += float(a["distancia"])
        emissao = a.get("emissao_co2")
        if emissao:
            if isinstance(emissao, list) and len(emissao) > 0:
                total_co2 += float(emissao[0]["quantidade_co2"])
            elif isinstance(emissao, dict):
                total_co2 += float(emissao["quantidade_co2"])

    return {
        "usuario": {
            "id": current["id_usuario"],
            "nome": current["nome"],
            "email": current["email"],
            "moedas": float(current["qtd_moeda"])
        },
        "total_co2_reduzido": round(total_co2, 2),
        "total_km": round(total_km, 2),
        "total_atividades": len(atividades.data)
    }

@router.get("/impacto")
async def impacto(current=Depends(get_current_user)):
    atividades = supabase.table("atividade") \
        .select("distancia, transport_type, emissao_co2(quantidade_co2)") \
        .eq("id_usuario", current["id_usuario"]).execute()

    por_transporte = {
        "bicicleta": {"km": 0, "co2": 0, "atividades": 0},
        "caminhada": {"km": 0, "co2": 0, "atividades": 0},
        "transportePublico": {"km": 0, "co2": 0, "atividades": 0},
        "carroEletrico": {"km": 0, "co2": 0, "atividades": 0}
    }

    for a in atividades.data:
        t = a.get("transport_type", "bicicleta")
        if t in por_transporte:
            por_transporte[t]["km"] += float(a["distancia"])
            por_transporte[t]["atividades"] += 1
            emissao = a.get("emissao_co2")
            if emissao:
                if isinstance(emissao, list) and len(emissao) > 0:
                    por_transporte[t]["co2"] += float(emissao[0]["quantidade_co2"])
                elif isinstance(emissao, dict):
                    por_transporte[t]["co2"] += float(emissao["quantidade_co2"])

    return {
        "por_transporte": por_transporte,
        "total_atividades": len(atividades.data)
    }

@router.get("/resgates")
async def historico_resgates(current=Depends(get_current_user)):
    result = supabase.table("resgate") \
        .select("*, beneficio(nome)") \
        .eq("id_usuario", current["id_usuario"]) \
        .order("dt_resgate", desc=True).execute()

    resgates = []
    for r in result.data:
        beneficio_nome = "?"
        if r.get("beneficio"):
            if isinstance(r["beneficio"], dict):
                beneficio_nome = r["beneficio"].get("nome", "?")
            elif isinstance(r["beneficio"], list) and len(r["beneficio"]) > 0:
                beneficio_nome = r["beneficio"][0].get("nome", "?")

        resgates.append({
            "id_resgate": r["id_resgate"],
            "id_beneficio": r["id_beneficio"],
            "moedas_usadas": r["moedas_usadas"],
            "dt_resgate": r["dt_resgate"],
            "status_resgate": r["status_resgate"],
            "beneficio": beneficio_nome
        })

    return resgates

@router.get("/vouchers")
async def meus_vouchers(current=Depends(get_current_user)):
    result = supabase.table("voucher") \
        .select("*, resgate!inner(id_usuario, beneficio(nome))") \
        .eq("resgate.id_usuario", current["id_usuario"]) \
        .order("dt_emissao", desc=True).execute()

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

@router.get("/vouchers-expirando")
async def vouchers_expirando(current=Depends(get_current_user)):
    from datetime import date, timedelta

    hoje = date.today()
    limite = hoje + timedelta(days=7)

    result = supabase.table("voucher") \
        .select("*, resgate!inner(id_usuario, beneficio(nome))") \
        .eq("resgate.id_usuario", current["id_usuario"]) \
        .eq("status", "ATIVO") \
        .gte("dt_validade", str(hoje)) \
        .lte("dt_validade", str(limite)).execute()

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
            "beneficio": beneficio_nome,
            "dt_validade": v["dt_validade"],
            "dias_restantes": (date.fromisoformat(v["dt_validade"]) - hoje).days
        })

    return {
        "total": len(vouchers),
        "vouchers": vouchers
    }

@router.get("/comunidade")
async def relatorio_comunidade(current=Depends(get_current_user)):
    atividades = supabase.table("atividade") \
        .select("distancia, emissao_co2(quantidade_co2)") \
        .execute()

    total_co2 = 0
    total_km = 0
    for a in atividades.data:
        total_km += float(a["distancia"])
        emissao = a.get("emissao_co2")
        if emissao:
            if isinstance(emissao, list) and len(emissao) > 0:
                total_co2 += float(emissao[0]["quantidade_co2"])
            elif isinstance(emissao, dict):
                total_co2 += float(emissao["quantidade_co2"])

    moedas = supabase.table("moeda") \
        .select("quantidade") \
        .eq("tipo_movimento", "ENTRADA") \
        .execute()

    total_moedas = sum(float(m["quantidade"]) for m in moedas.data)

    usuarios = supabase.table("usuario") \
        .select("id_usuario") \
        .neq("tipo_usuario", "admin") \
        .execute()

    total_usuarios = len(usuarios.data)

    resgates = supabase.table("resgate").select("id_resgate").execute()
    total_resgates = len(resgates.data)

    por_transporte = {
        "bicicleta": 0,
        "caminhada": 0,
        "transportePublico": 0,
        "carroEletrico": 0
    }
    atividades_tipo = supabase.table("atividade").select("transport_type").execute()
    for a in atividades_tipo.data:
        t = a.get("transport_type", "bicicleta")
        if t in por_transporte:
            por_transporte[t] += 1

    return {
        "impacto_ambiental": {
            "total_co2_reduzido_kg": round(total_co2, 2),
            "total_km_percorridos": round(total_km, 2),
            "total_atividades": len(atividades.data)
        },
        "economia": {
            "total_moedas_distribuidas": round(total_moedas, 2),
            "total_resgates_realizados": total_resgates
        },
        "comunidade": {
            "total_usuarios_ativos": total_usuarios
        },
        "por_transporte": por_transporte
    }

@router.get("/mensal")
async def relatorio_mensal(current=Depends(get_current_user)):
    if current["tipo_usuario"] != "admin":
        raise HTTPException(403, "Acesso negado. Apenas admin.")

    from datetime import date

    hoje = date.today()
    inicio_mes = date(hoje.year, hoje.month, 1)

    resgates = supabase.table("resgate") \
        .select("*, beneficio(nome)") \
        .gte("dt_resgate", str(inicio_mes)).execute()

    total_moedas = 0
    total_resgates = len(resgates.data)
    por_beneficio = {}

    for r in resgates.data:
        moedas = float(r.get("moedas_usadas", 0))
        total_moedas += moedas

        beneficio_nome = "?"
        if r.get("beneficio"):
            if isinstance(r["beneficio"], dict):
                beneficio_nome = r["beneficio"].get("nome", "?")
            elif isinstance(r["beneficio"], list) and len(r["beneficio"]) > 0:
                beneficio_nome = r["beneficio"][0].get("nome", "?")

        if beneficio_nome not in por_beneficio:
            por_beneficio[beneficio_nome] = {"quantidade": 0, "moedas": 0}
        por_beneficio[beneficio_nome]["quantidade"] += 1
        por_beneficio[beneficio_nome]["moedas"] += moedas

    atividades = supabase.table("atividade") \
        .select("distancia, emissao_co2(quantidade_co2)") \
        .gte("dt_registro", str(inicio_mes)).execute()

    total_co2 = 0
    total_km = 0
    for a in atividades.data:
        total_km += float(a["distancia"])
        emissao = a.get("emissao_co2")
        if emissao:
            if isinstance(emissao, list) and len(emissao) > 0:
                total_co2 += float(emissao[0]["quantidade_co2"])
            elif isinstance(emissao, dict):
                total_co2 += float(emissao["quantidade_co2"])

    por_beneficio_lista = []
    for nome, dados in por_beneficio.items():
        por_beneficio_lista.append({
            "beneficio": nome,
            "quantidade": dados["quantidade"],
            "moedas": round(dados["moedas"], 2)
        })

    return {
        "periodo": {
            "inicio": str(inicio_mes),
            "fim": str(hoje)
        },
        "resgates": {
            "total_resgates": total_resgates,
            "total_moedas_utilizadas": round(total_moedas, 2),
            "por_beneficio": por_beneficio_lista
        },
        "atividades": {
            "total_atividades": len(atividades.data),
            "total_km": round(total_km, 2),
            "total_co2_reduzido": round(total_co2, 2)
        }
    }