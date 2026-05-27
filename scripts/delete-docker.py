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
COMPOSE_FILE = DOCKER_DIR / "docker-compose.yml"

COMPOSE_BASE = ["docker", "compose", "--project-directory", str(ROOT), "-f", str(COMPOSE_FILE)]


def run(cmd: list[str], fatal: bool = True) -> subprocess.CompletedProcess:
    print(f"🐳 {' '.join(cmd)}")
    result = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True)
    if fatal and result.returncode != 0:
        print(f"❌ Comando falhou com código {result.returncode}")
        sys.exit(result.returncode)
    return result


def get_built_images() -> list[str]:
    """Busca imagens com label do docker compose."""
    project = ROOT.name
    result = run(
        ["docker", "image", "ls", "--filter", f"label=com.docker.compose.project={project}", "--format", "{{.Repository}}:{{.Tag}}"],
        fatal=False,
    )
    return [i for i in result.stdout.strip().splitlines() if i and i != "<none>:<none>"]


def get_base_images() -> list[str]:
    """Extrai imagens base FROM dos Dockerfiles."""
    base = set()
    for df in DOCKER_DIR.glob("*.Dockerfile"):
        for line in df.read_text().splitlines():
            line = line.strip()
            if line.upper().startswith("FROM "):
                img = line.split(None, 2)[1]
                base.add(img)
    return sorted(base)


def main() -> None:
    print("=" * 50)
    print("  ERP - Limpeza Total Docker")
    print("=" * 50)
    print()

    # 1. Para e remove containers + networks
    run([*COMPOSE_BASE, "down", "--remove-orphans", "--volumes"])

    # 2. Remove imagens criadas pelo build do projeto
    images = get_built_images()
    dangling = run(
        ["docker", "images", "--filter", "dangling=true", "--format", "{{.ID}}"],
        fatal=False,
    ).stdout.strip().splitlines()
    all_tags = images + [i for i in dangling if i]

    if all_tags:
        print(f"🧹 Removendo {len(all_tags)} imagem(ns) do projeto...")
        run(["docker", "rmi", "-f", *all_tags], fatal=False)
        print("✅ Imagens do projeto removidas")
    else:
        print("📭 Nenhuma imagem do projeto encontrada")

    # 3. Remove imagens base (bun, nginx, etc.)
    base_images = get_base_images()
    found = []
    for img in base_images:
        r = run(["docker", "image", "ls", "-q", img], fatal=False)
        if r.stdout.strip():
            found.append(img)
    if found:
        print(f"🧹 Removendo {len(found)} imagem(ns) base...")
        run(["docker", "rmi", "-f", *found], fatal=False)
        print("✅ Imagens base removidas")
    else:
        print("📭 Nenhuma imagem base do projeto encontrada")

    # 4. Remove volumes
    project = ROOT.name
    result = run(
        ["docker", "volume", "ls", "--filter", f"label=com.docker.compose.project={project}", "--format", "{{.Name}}"],
        fatal=False,
    )
    volumes = [v for v in result.stdout.strip().splitlines() if v]
    if volumes:
        print(f"🧹 Removendo {len(volumes)} volume(s)...")
        run(["docker", "volume", "rm", "-f", *volumes], fatal=False)
    else:
        print("📭 Nenhum volume do projeto encontrado")

    # 5. Remove network do projeto
    result = run(
        ["docker", "network", "ls", "--filter", f"label=com.docker.compose.project={project}", "--format", "{{.Name}}"],
        fatal=False,
    )
    networks = [n for n in result.stdout.strip().splitlines() if n]
    if networks:
        print(f"🧹 Removendo {len(networks)} rede(s)...")
        run(["docker", "network", "rm", *networks], fatal=False)
    else:
        print("📭 Nenhuma rede do projeto encontrada")

    # 6. Limpa cache de build
    run(["docker", "builder", "prune", "-f"], fatal=False)

    print()
    print("=" * 50)
    print("  ✅ Limpeza concluída")
    print("=" * 50)


if __name__ == "__main__":
    main()
