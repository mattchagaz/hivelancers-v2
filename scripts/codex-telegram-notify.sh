#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${CODEX_NOTIFY_ENV_FILE:-${PROJECT_ROOT}/.codex-notify.env}"

if [[ -f "${ENV_FILE}" ]]; then
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
fi

CODEX_BIN="${CODEX_BIN:-codex}"
TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:-}"

usage() {
  cat <<'EOF'
Usage:
  codex-telegram-notify.sh --task "Task name" [codex exec args...]

Examples:
  codex-telegram-notify.sh --task "Corrigir lint" --full-auto "corrija os erros de lint"
  codex-telegram-notify.sh "escreva testes para o login"
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

TASK_NAME="Codex task"

if [[ "${1:-}" == "--task" ]]; then
  if [[ -z "${2:-}" ]]; then
    echo "Missing value for --task" >&2
    exit 1
  fi

  TASK_NAME="${2}"
  shift 2
fi

if [[ "$#" -eq 0 ]]; then
  usage
  exit 1
fi

if [[ -z "${TELEGRAM_BOT_TOKEN}" || -z "${TELEGRAM_CHAT_ID}" ]]; then
  echo "TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be configured in ${ENV_FILE} or the environment." >&2
  exit 1
fi

send_telegram() {
  local text="$1"

  curl --silent --show-error --fail \
    "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    --data-urlencode "chat_id=${TELEGRAM_CHAT_ID}" \
    --data-urlencode "text=${text}" \
    >/dev/null
}

trim_file() {
  local file="$1"

  if [[ ! -s "${file}" ]]; then
    return 0
  fi

  tr '\n' ' ' < "${file}" | sed 's/[[:space:]]\+/ /g' | cut -c1-900
}

START_TS="$(date +%s)"
START_HUMAN="$(date '+%Y-%m-%d %H:%M:%S')"
HOST_NAME="$(hostname -s 2>/dev/null || hostname)"
RUN_DIR="$(pwd)"
LAST_MESSAGE_FILE="$(mktemp)"
STDERR_FILE="$(mktemp)"

cleanup() {
  rm -f "${LAST_MESSAGE_FILE}" "${STDERR_FILE}"
}

trap cleanup EXIT

send_telegram "🚀 ${TASK_NAME}
Iniciada em ${START_HUMAN}
Repo: ${PROJECT_ROOT}
Diretorio: ${RUN_DIR}
Host: ${HOST_NAME}"

set +e
"${CODEX_BIN}" exec --json --output-last-message "${LAST_MESSAGE_FILE}" "$@" 2> >(tee "${STDERR_FILE}" >&2)
STATUS=$?
set -e

END_TS="$(date +%s)"
DURATION_SECONDS="$((END_TS - START_TS))"
LAST_MESSAGE="$(trim_file "${LAST_MESSAGE_FILE}")"
ERROR_SNIPPET="$(tail -n 20 "${STDERR_FILE}" | tr '\n' ' ' | sed 's/[[:space:]]\+/ /g' | cut -c1-900)"

if [[ "${STATUS}" -eq 0 ]]; then
  MESSAGE="✅ ${TASK_NAME}
Concluida em ${DURATION_SECONDS}s"

  if [[ -n "${LAST_MESSAGE}" ]]; then
    MESSAGE="${MESSAGE}
Resumo: ${LAST_MESSAGE}"
  fi

  send_telegram "${MESSAGE}"
else
  MESSAGE="❌ ${TASK_NAME}
Falhou em ${DURATION_SECONDS}s
Exit code: ${STATUS}"

  if [[ -n "${ERROR_SNIPPET}" ]]; then
    MESSAGE="${MESSAGE}
Erro: ${ERROR_SNIPPET}"
  fi

  send_telegram "${MESSAGE}"
fi

exit "${STATUS}"
