#!/usr/bin/env python3
"""
stop-docker.py — Para os containers do ERP.
Uso: python scripts/stop-docker.py
"""

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOCKER_DIR = ROOT / "docker"


def docker_compose(*args: str) -> None:
    cmd = ["docker", "compose", "--project-directory", str(ROOT), "-f", str(DOCKER_DIR / "docker-compose.yml"), *args]
    print(f"🐳 {' '.join(cmd)}")
    result = subprocess.run(cmd, cwd=ROOT)
    if result.returncode != 0:
        print(f"❌ Comando falhou com código {result.returncode}")
        sys.exit(result.returncode)


def main() -> None:
    print("=" * 50)
    print("  ERP - Parando Containers")
    print("=" * 50)
    print()

    docker_compose("stop")

    print()
    print("✅ Containers parados")


if __name__ == "__main__":
    main()
