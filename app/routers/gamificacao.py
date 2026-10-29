from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.database import supabase
from app.services.auth_service import decodificar_token

router = APIRouter(prefix="/gamificacao", tags=["Gamificação"])
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = decodificar_token(credentials.credentials)
    if not payload:
        raise HTTPException(401, "Token inválido")
    result = supabase.table("usuario").select("*").eq("id_usuario", payload["sub"]).execute()
    if not result.data:
        raise HTTPException(401, "Usuário não encontrado")
    return result.data[0]

@router.get("/ranking")
async def ranking(current=Depends(get_current_user)):
    result = supabase.table("usuario") \
        .select("id_usuario, nome, email, tipo_usuario, qtd_moeda") \
        .neq("tipo_usuario", "admin") \
        .order("qtd_moeda", desc=True) \
        .limit(20).execute()

    ranking = []
    for i, u in enumerate(result.data):
        ranking.append({
            "posicao": i + 1,
            "nome": u["nome"],
            "email": u["email"],
            "tipo": u["tipo_usuario"],
            "moedas": float(u["qtd_moeda"])
        })
    return ranking

@router.get("/medalhas")
async def medalhas(current=Depends(get_current_user)):
    atividades = supabase.table("atividade") \
        .select("distancia, emissao_co2(quantidade_co2)") \
        .eq("id_usuario", current["id_usuario"]).execute()

    total_km = sum(float(a["distancia"]) for a in atividades.data)
    total_atividades = len(atividades.data)

    total_co2 = 0
    for a in atividades.data:
        emissao = a.get("emissao_co2")
        if emissao:
            if isinstance(emissao, list) and len(emissao) > 0:
                total_co2 += float(emissao[0]["quantidade_co2"])
            elif isinstance(emissao, dict):
                total_co2 += float(emissao["quantidade_co2"])

    ranking = supabase.table("usuario") \
        .select("id_usuario, qtd_moeda") \
        .neq("tipo_usuario", "admin") \
        .order("qtd_moeda", desc=True).execute()

    posicao = 0
    for i, u in enumerate(ranking.data):
        if int(u["id_usuario"]) == int(current["id_usuario"]):
            posicao = i + 1
            break

    medalhas = [
        {"id": "first_km", "nome": "🥇 Primeiro Passo", "descricao": "Percorra 1 km", "icone": "🥇", "desbloqueada": total_km >= 1},
        {"id": "ten_km", "nome": "🏃 10 km", "descricao": "Percorra 10 km", "icone": "🏃", "desbloqueada": total_km >= 10},
        {"id": "fifty_km", "nome": "🚀 50 km", "descricao": "Percorra 50 km", "icone": "🚀", "desbloqueada": total_km >= 50},
        {"id": "hundred_km", "nome": "💯 100 km", "descricao": "Percorra 100 km", "icone": "💯", "desbloqueada": total_km >= 100},
        {"id": "first_activity", "nome": "🌱 Primeira Atividade", "descricao": "Registre sua 1ª atividade", "icone": "🌱", "desbloqueada": total_atividades >= 1},
        {"id": "ten_activities", "nome": "📋 10 Atividades", "descricao": "Registre 10 atividades", "icone": "📋", "desbloqueada": total_atividades >= 10},
        {"id": "fifty_activities", "nome": "🔥 50 Atividades", "descricao": "Registre 50 atividades", "icone": "🔥", "desbloqueada": total_atividades >= 50},
        {"id": "top_ten", "nome": "🏆 Top 10", "descricao": "Esteja entre os 10 primeiros", "icone": "🏆", "desbloqueada": 0 < posicao <= 10},
        {"id": "top_three", "nome": "🥉 Top 3", "descricao": "Esteja entre os 3 primeiros", "icone": "🥉", "desbloqueada": 0 < posicao <= 3},
        {"id": "first_place", "nome": "👑 Primeiro Lugar", "descricao": "Seja o nº 1 no ranking", "icone": "👑", "desbloqueada": posicao == 1},
        {"id": "co2_ten", "nome": "🌳 10 kg CO₂", "descricao": "Reduza 10 kg de CO₂", "icone": "🌳", "desbloqueada": total_co2 >= 10},
        {"id": "co2_fifty", "nome": "🌲 50 kg CO₂", "descricao": "Reduza 50 kg de CO₂", "icone": "🌲", "desbloqueada": total_co2 >= 50}
    ]
    return medalhas

@router.get("/missoes")
async def missoes(current=Depends(get_current_user)):
    from datetime import date, timedelta

    hoje = date.today()
    inicio_semana = hoje - timedelta(days=hoje.weekday())

    atividades = supabase.table("atividade") \
        .select("distancia, dt_registro") \
        .eq("id_usuario", current["id_usuario"]) \
        .gte("dt_registro", str(inicio_semana)).execute()

    km_semana = sum(float(a["distancia"]) for a in atividades.data)
    total_atividades = len(atividades.data)

    missoes = [
        {
            "id": "weekly_km",
            "titulo": "📏 Desafio Semanal",
            "descricao": "Percorra 10 km esta semana",
            "progresso": min(km_semana, 10),
            "alvo": 10,
            "recompensa": 5,
            "tipo": "semanal",
            "concluida": km_semana >= 10
        },
        {
            "id": "weekly_eco",
            "titulo": "♻️ Eco Semana",
            "descricao": "Registre 5 atividades esta semana",
            "progresso": min(total_atividades, 5),
            "alvo": 5,
            "recompensa": 3,
            "tipo": "semanal",
            "concluida": total_atividades >= 5
        }
    ]
    return missoes

@router.get("/desafios")
async def desafios(current=Depends(get_current_user)):
    from datetime import date

    hoje = date.today()
    inicio_mes = date(hoje.year, hoje.month, 1)

    atividades = supabase.table("atividade") \
        .select("distancia, transport_type, dt_registro") \
        .eq("id_usuario", current["id_usuario"]) \
        .gte("dt_registro", str(inicio_mes)).execute()

    km_mes = sum(float(a["distancia"]) for a in atividades.data)
    count_bike = sum(1 for a in atividades.data if a.get("transport_type") == "bicicleta")
    count_walk = sum(1 for a in atividades.data if a.get("transport_type") == "caminhada")

    desafios = [
        {
            "id": "month_30km",
            "titulo": "🏅 30 km no Mês",
            "descricao": "Percorra 30 km neste mês",
            "progresso": min(km_mes, 30),
            "alvo": 30,
            "recompensa": 10,
            "concluido": km_mes >= 30
        },
        {
            "id": "month_bike_10",
            "titulo": "🚲 Ciclista Dedicado",
            "descricao": "Use bicicleta 10 vezes no mês",
            "progresso": min(count_bike, 10),
            "alvo": 10,
            "recompensa": 8,
            "concluido": count_bike >= 10
        },
        {
            "id": "month_walk_10",
            "titulo": "🚶 Pedestre Fiel",
            "descricao": "Caminhe 10 vezes no mês",
            "progresso": min(count_walk, 10),
            "alvo": 10,
            "recompensa": 8,
            "concluido": count_walk >= 10
        }
    ]
    return desafios