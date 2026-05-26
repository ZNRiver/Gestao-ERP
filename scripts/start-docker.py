#!/usr/bin/env python3
"""
start-docker.py — Configura e inicia todos os containers do ERP.
Uso: python scripts/start-docker.py
"""

import os
import sys
import shutil
import subprocess
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOCKER_DIR = ROOT / "docker"
ENV_ROOT = ROOT / ".env"
ENV_BACKEND = ROOT / "backend" / ".env"
ENV_EXAMPLE = ROOT / "backend" / ".env.example"

REQUIRED_VARS = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "JWT_SECRET"]


def check_docker() -> None:
    for cmd in ["docker", "docker compose"]:
        if not shutil.which(cmd.split()[0]):
            print(f"❌ {cmd} não encontrado. Instale Docker primeiro.")
            sys.exit(1)
    print("✅ Docker encontrado")


def _parse_env(path: Path) -> dict[str, str]:
    env = {}
    if not path.exists():
        return env
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        env[key.strip()] = val.strip()
    return env


def setup_env() -> None:
    # Tenta usar backend/.env como fonte principal
    source = None
    if ENV_BACKEND.exists():
        source = ENV_BACKEND
    elif ENV_ROOT.exists():
        source = ENV_ROOT
    elif ENV_EXAMPLE.exists():
        source = ENV_EXAMPLE

    if source is None:
        print("❌ Nenhum arquivo .env ou .env.example encontrado")
        sys.exit(1)

    # Garante que root .env exista (docker-compose lê da raiz)
    if not ENV_ROOT.exists():
        shutil.copy(source, ENV_ROOT)
        print(f"📄 .env copiado de {source} para {ENV_ROOT}")
    elif source != ENV_ROOT:
        # Mescla vars que estão em source mas faltam em root
        root_env = _parse_env(ENV_ROOT)
        source_env = _parse_env(source)
        missing = {k: v for k, v in source_env.items() if k not in root_env}
        if missing:
            print(f"📄 Copiando {len(missing)} var(s) de {source} para {ENV_ROOT}")
            with open(ENV_ROOT, "a") as f:
                f.write("\n# Importado de backend/.env\n")
                for k, v in missing.items():
                    f.write(f"{k}={v}\n")

    print(f"📄 .env: {ENV_ROOT}")


def check_env() -> None:
    env = _parse_env(ENV_ROOT)
    missing = []
    for var in REQUIRED_VARS:
        val = os.environ.get(var) or env.get(var)
        if not val or "seu-" in val.lower() or "sua-" in val.lower():
            missing.append(var)

    if missing:
        print(f"❌ Variáveis obrigatórias não configuradas: {', '.join(missing)}")
        print("   Edite o arquivo .env e tente novamente.")
        sys.exit(1)
    print("✅ Variáveis de ambiente OK")


def docker_compose(*args: str) -> None:
    cmd = ["docker", "compose", "--project-directory", str(ROOT), "-f", str(DOCKER_DIR / "docker-compose.yml"), *args]
    print(f"🐳 {' '.join(cmd)}")
    result = subprocess.run(cmd, cwd=ROOT)
    if result.returncode != 0:
        print(f"❌ Comando falhou com código {result.returncode}")
        sys.exit(result.returncode)


def wait_for_health(url: str, timeout: int = 90) -> None:
    import time
    print(f"⏳ Aguardando {url} ficar pronto...", end="", flush=True)
    for _ in range(timeout):
        try:
            resp = urllib.request.urlopen(url, timeout=5)
            if resp.status < 500:
                print(f" {resp.status} ✅")
                return
        except urllib.error.HTTPError as e:
            if e.code < 500:
                print(f" {e.code} ✅")
                return
        except Exception:
            pass
        print(".", end="", flush=True)
        time.sleep(1)
    print(" ⚠️ timeout")


def main() -> None:
    print("=" * 50)
    print("  ERP - Inicialização Docker")
    print("=" * 50)
    print()

    check_docker()
    setup_env()
    check_env()

    print()
    print("🔨 Construindo imagens...")
    docker_compose("build", "--pull")

    print()
    print("🚀 Iniciando containers...")
    docker_compose("up", "-d")

    print()
    wait_for_health("http://localhost/api/auth/me")

    print()
    print("=" * 50)
    print("  ✅ ERP rodando em http://localhost")
    print("=" * 50)


if __name__ == "__main__":
    main()
