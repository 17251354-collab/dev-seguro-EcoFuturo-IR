from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timedelta
from app.database import supabase
from app.schemas.usuario import UsuarioCreate, UsuarioLogin
from app.services.auth_service import hash_senha, verificar_senha, criar_token, decodificar_token

router = APIRouter(prefix="/auth", tags=["Autenticação"])
security = HTTPBearer()

# Controle de tentativas de login
_tentativas = {}
MAX_TENTATIVAS = 5
BLOQUEIO_SEGUNDOS = 60


def _verificar_moedas_expiradas(usuario_id: int) -> float:
    """
    RN010: Verifica e expira moedas não usadas por 12 meses.
    Retorna o total de moedas expiradas.
    """
    try:
        doze_meses_atras = datetime.now() - timedelta(days=365)
        limite = doze_meses_atras.strftime("%Y-%m-%d")

        # Buscar moedas ENTRADA antigas que ainda não foram usadas
        moedas_antigas = supabase.table("moeda") \
            .select("id_movimento, quantidade") \
            .eq("id_usuario", usuario_id) \
            .eq("tipo_movimento", "ENTRADA") \
            .lt("created_at", limite) \
            .is_("id_resgate", None) \
            .is_("id_conversao", None).execute()

        if not moedas_antigas.data:
            return 0

        total_expirado = sum(float(m["quantidade"]) for m in moedas_antigas.data)
        ids = [m["id_movimento"] for m in moedas_antigas.data]

        # Marcar como EXPIRADO
        for id_mov in ids:
            supabase.table("moeda").update({
                "tipo_movimento": "EXPIRADO"
            }).eq("id_movimento", id_mov).execute()

        # Atualizar saldo
        user = supabase.table("usuario").select("qtd_moeda").eq("id_usuario", usuario_id).execute()
        if user.data:
            saldo_atual = float(user.data[0]["qtd_moeda"])
            novo_saldo = max(0, saldo_atual - total_expirado)
            supabase.table("usuario").update({
                "qtd_moeda": novo_saldo
            }).eq("id_usuario", usuario_id).execute()

            # Criar notificação
            supabase.table("notificacao").insert({
                "id_usuario": usuario_id,
                "mensagem": f"💸 {total_expirado:.2f} moedas expiraram por inatividade de 12 meses.",
                "tipo": "ALERTA",
                "status": "NOVA"
            }).execute()

        return total_expirado
    except Exception as e:
        print(f"Erro ao verificar moedas expiradas: {e}")
        return 0


@router.post("/cadastrar")
async def cadastrar(usuario: UsuarioCreate):
    existing = supabase.table("usuario").select("id_usuario").eq("email", usuario.email).execute()
    if existing.data:
        raise HTTPException(400, "E-mail já cadastrado")

    if len(usuario.senha) < 6 or len(usuario.senha) > 8:
        raise HTTPException(400, "Senha deve ter entre 6 e 8 caracteres")

    result = supabase.table("usuario").insert({
        "nome": usuario.nome,
        "email": usuario.email,
        "senha": hash_senha(usuario.senha),
        "tipo_usuario": usuario.tipo_usuario,
        "qtd_moeda": 0,
        "status": "ATIVO"
    }).execute()

    return {"success": True, "message": "Usuário cadastrado"}


@router.post("/login")
async def login(dados: UsuarioLogin):
    agora = datetime.now()
    email = dados.email

    # Verificar se está bloqueado
    if email in _tentativas:
        info = _tentativas[email]
        if info.get("blocked_until") and info["blocked_until"] > agora:
            segundos = int((info["blocked_until"] - agora).total_seconds())
            raise HTTPException(
                429,
                f"Conta temporariamente bloqueada. Tente novamente em {segundos} segundos."
            )

    # Buscar usuário
    result = supabase.table("usuario").select("*").eq("email", email).execute()

    if not result.data:
        _registrar_tentativa(email, agora)
        raise HTTPException(401, "E-mail ou senha inválidos")

    user = result.data[0]
    if not verificar_senha(dados.senha, user["senha"]):
        _registrar_tentativa(email, agora)
        raise HTTPException(401, "E-mail ou senha inválidos")

    # Login OK: limpar tentativas
    if email in _tentativas:
        del _tentativas[email]

    # ─── RN010: Verificar moedas expiradas ───
    moedas_expiradas = _verificar_moedas_expiradas(user["id_usuario"])
    if moedas_expiradas > 0:
        # Recarregar usuário para pegar saldo atualizado
        result = supabase.table("usuario").select("*").eq("id_usuario", user["id_usuario"]).execute()
        if result.data:
            user = result.data[0]

    token = criar_token({"sub": str(user["id_usuario"]), "email": user["email"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "moedas_expiradas": moedas_expiradas,
        "user": {
            "id": user["id_usuario"],
            "nome": user["nome"],
            "email": user["email"],
            "tipo": user["tipo_usuario"],
            "moedas": user["qtd_moeda"]
        }
    }


def _registrar_tentativa(email: str, agora: datetime):
    if email not in _tentativas:
        _tentativas[email] = {"count": 0, "blocked_until": None}

    _tentativas[email]["count"] += 1

    if _tentativas[email]["count"] >= MAX_TENTATIVAS:
        _tentativas[email]["blocked_until"] = agora + timedelta(seconds=BLOQUEIO_SEGUNDOS)
        _tentativas[email]["count"] = 0


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = decodificar_token(credentials.credentials)
    if not payload:
        raise HTTPException(401, "Token inválido")
    result = supabase.table("usuario").select("*").eq("id_usuario", payload["sub"]).execute()
    if not result.data:
        raise HTTPException(401, "Usuário não encontrado")
    return result.data[0]