#!/usr/bin/env python3
"""
delete-docker.py — Remove tudo: containers, imagens, volumes, networks.
Uso: python scripts/delete-docker.py
"""

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOCKER_DIR = ROOT / "docker"

COMPOSE_BASE = ["docker", "compose", "--project-directory", str(ROOT), "-f", str(DOCKER_DIR / "docker-compose.yml")]


def run(cmd: list[str], fatal: bool = True) -> subprocess.CompletedProcess:
    print(f"🐳 {' '.join(cmd)}")
    result = subprocess.run(cmd, cwd=ROOT)
    if fatal and result.returncode != 0:
        print(f"❌ Comando falhou com código {result.returncode}")
        sys.exit(result.returncode)
    return result


def main() -> None:
    import json

    print("=" * 50)
    print("  ERP - Limpeza Total Docker")
    print("=" * 50)
    print()

    # 1. Para e remove containers + networks
    run([*COMPOSE_BASE, "down", "--remove-orphans"])

    # 2. Descobre imagens criadas por este projeto
    prefix = ROOT.name.lower().replace("-", "").replace("_", "")
    result = run(
        ["docker", "images", "--filter", f"reference={prefix}*", "--format", "{{.Repository}}:{{.Tag}}"],
        fatal=False,
    )
    images = [img for img in result.stdout.strip().splitlines() if img]
    if images:
        print(f"🧹 Removendo {len(images)} imagem(ns)...")
        run(["docker", "rmi", "-f", *images], fatal=False)
    else:
        print("📭 Nenhuma imagem do projeto encontrada")

    # 3. Remove volumes não usados pelo projeto
    result = run(
        ["docker", "volume", "ls", "--filter", f"name={prefix}", "--format", "{{.Name}}"],
        fatal=False,
    )
    volumes = [v for v in result.stdout.strip().splitlines() if v]
    if volumes:
        print(f"🧹 Removendo {len(volumes)} volume(s)...")
        run(["docker", "volume", "rm", *volumes], fatal=False)
    else:
        print("📭 Nenhum volume do projeto encontrado")

    # 4. Remove a network padrão se existir
    result = run(
        ["docker", "network", "ls", "--filter", f"name={prefix}", "--format", "{{.Name}}"],
        fatal=False,
    )
    networks = [n for n in result.stdout.strip().splitlines() if n]
    if networks:
        print(f"🧹 Removendo {len(networks)} rede(s)...")
        run(["docker", "network", "rm", *networks], fatal=False)
    else:
        print("📭 Nenhuma rede do projeto encontrada")

    print()
    print("=" * 50)
    print("  ✅ Limpeza concluída")
    print("=" * 50)


if __name__ == "__main__":
    main()
