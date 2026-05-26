#!/usr/bin/env python3
import sys
import subprocess
import os

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
GIT_DIR = os.path.abspath(os.path.join(ROOT_DIR, ".."))

def run(cmd):
    print(f"> {' '.join(cmd)}")
    try:
        subprocess.check_call(cmd, cwd=GIT_DIR)
    except subprocess.CalledProcessError:
        print("❌ Erro ao executar comando")
        sys.exit(1)

def git_status():
    run(["git", "status"])

def git_add():
    run(["git", "add", "."])

def git_commit(message):
    run(["git", "commit", "-m", message])

def git_push():
    run(["git", "push"])

def git_pull():
    run(["git", "pull"])

def git_log():
    run(["git", "log", "--oneline", "--graph", "--decorate"])

# 🔥 NOVO COMANDO
def git_back():
    print("⚡ Voltando para o estado do repositório remoto...")
    # Busca as alterações mais recentes do remoto
    run(["git", "fetch", "origin"])
    # Reseta branch atual para o remoto (perde alterações locais)
    run(["git", "reset", "--hard", "origin/main"])
    print("✅ Branch restaurada para o estado do Git remoto!")

# 🔥 NOVO COMANDO
def git_sync(message):
    print("⚡ Sync automático...")
    git_add()
    git_commit(message)
    git_push()

# 🔥 NOVO COMANDO
def git_remove(file):
    if not os.path.exists(os.path.join(GIT_DIR, file)):
        print(f"❌ Arquivo '{file}' não existe")
        return
    run(["git", "rm", file])
    print(f"✅ '{file}' removido do repositório. Lembre-se de dar commit!")

# 🔥 NOVO COMANDO
def git_clear():
    print("🧹 Limpando todos os arquivos ignorados pelo Git (.gitignore)...")
    # git clean -Xdf: 
    # -X: Remove apenas arquivos ignorados pelo Git
    # -d: Remove diretórios não rastreados
    # -f: Força a remoção
    run(["git", "clean", "-Xdf"])
    print("✅ Todos os arquivos ignorados foram removidos com sucesso!")

def help_menu():
    print(f"""
📦 Git Manager (dir: {GIT_DIR})

Comandos:
  status
  add
  commit "msg"
  push
  pull
  log
  sync "msg"       -> add + commit + push automático 🔥
  remove "file"     -> remove arquivo do repositório e marca para commit ❌
  clear    -> exclui todos os arquivos locais no .gitignore 🧹
""")

def main():
    if len(sys.argv) < 2:
        help_menu()
        return

    cmd = sys.argv[1]

    if cmd == "status":
        git_status()

    elif cmd == "add":
        git_add()

    elif cmd == "commit":
        if len(sys.argv) < 3:
            print("❌ Falta mensagem do commit")
            return
        git_commit(sys.argv[2])

    elif cmd == "back":
        git_back()

    elif cmd == "push":
        git_push()

    elif cmd == "pull":
        git_pull()

    elif cmd == "log":
        git_log()

    elif cmd == "sync":
        if len(sys.argv) < 3:
            print("❌ Falta mensagem do commit")
            return
        git_sync(sys.argv[2])

    elif cmd == "remove":
        if len(sys.argv) < 3:
            print("❌ Falta o nome do arquivo para remover")
            return
        git_remove(sys.argv[2])

    elif cmd == "clear":
        git_clear()

    else:
        help_menu()

if __name__ == "__main__":
    main()