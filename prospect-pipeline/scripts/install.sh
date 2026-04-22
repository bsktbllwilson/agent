#!/usr/bin/env bash
# install.sh — deploy the prospect-pipeline cron or systemd timer.
#
# Usage:
#   sudo ./scripts/install.sh [--prefix /opt/prospect-pipeline] [--user deploy] [--timer|--cron]
#
# What it does:
#   - Renders scripts/prospect-pipeline.service + .timer with the correct prefix + user
#   - Installs them to /etc/systemd/system/ (timer mode)
#     OR drops a cron entry to /etc/cron.d/ (cron mode)
#   - Creates /var/log/prospect-pipeline/ with correct ownership
#   - Enables + starts the timer (timer mode)
#
# Idempotent — safe to rerun after pulling new code.

set -euo pipefail

PREFIX="/opt/prospect-pipeline"
RUN_USER="deploy"
MODE="timer"  # timer | cron
LOOKBACK="8"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --prefix)   PREFIX="$2"; shift 2 ;;
    --user)     RUN_USER="$2"; shift 2 ;;
    --timer)    MODE="timer"; shift ;;
    --cron)     MODE="cron";  shift ;;
    --lookback) LOOKBACK="$2"; shift 2 ;;
    -h|--help)
      grep '^#' "$0" | sed 's/^# \{0,1\}//'
      exit 0 ;;
    *) echo "unknown flag: $1" >&2; exit 2 ;;
  esac
done

if [[ $EUID -ne 0 ]]; then
  echo "This script writes to /etc and /var — please run under sudo." >&2
  exit 1
fi

if [[ ! -d "$PREFIX" ]]; then
  echo "Prefix does not exist: $PREFIX. Clone the repo there first." >&2
  exit 1
fi

if ! id -u "$RUN_USER" >/dev/null 2>&1; then
  echo "User does not exist: $RUN_USER" >&2
  exit 1
fi

LOG_DIR="/var/log/prospect-pipeline"
mkdir -p "$LOG_DIR"
chown "$RUN_USER":"$RUN_USER" "$LOG_DIR"
chmod 0750 "$LOG_DIR"

VENV_PY="$PREFIX/.venv/bin/python"
if [[ ! -x "$VENV_PY" ]]; then
  echo "venv not found at $VENV_PY — run: python -m venv $PREFIX/.venv && $PREFIX/.venv/bin/pip install -r $PREFIX/requirements.txt" >&2
  exit 1
fi

ENV_FILE="$PREFIX/.env"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "WARN: $ENV_FILE not found — the run will use environment defaults only." >&2
fi

echo "Preflight health-check..."
sudo -u "$RUN_USER" "$VENV_PY" -m prospect_pipeline.cli health-check --skip-network --skip-smoke || {
  echo "Preflight failed. Fix issues and rerun." >&2
  exit 1
}

case "$MODE" in
  timer)
    SERVICE_OUT="/etc/systemd/system/prospect-pipeline.service"
    TIMER_OUT="/etc/systemd/system/prospect-pipeline.timer"

    cat > "$SERVICE_OUT" <<EOF
[Unit]
Description=NYC Luxury Buyer Prospecting Pipeline — weekly run
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
User=$RUN_USER
WorkingDirectory=$PREFIX
Environment=PYTHONUNBUFFERED=1
EnvironmentFile=-$ENV_FILE
ExecStartPre=$VENV_PY -m prospect_pipeline.cli health-check --skip-smoke
ExecStart=$VENV_PY -m prospect_pipeline.cli prospect-week --lookback-days $LOOKBACK
StandardOutput=append:$LOG_DIR/stdout.log
StandardError=append:$LOG_DIR/stderr.log
EOF

    cat > "$TIMER_OUT" <<EOF
[Unit]
Description=Weekly prospect pipeline — Monday 8am ET

[Timer]
OnCalendar=Mon *-*-* 08:00 America/New_York
Persistent=true
Unit=prospect-pipeline.service

[Install]
WantedBy=timers.target
EOF

    systemctl daemon-reload
    systemctl enable --now prospect-pipeline.timer
    echo "Installed + enabled prospect-pipeline.timer. Status:"
    systemctl status --no-pager prospect-pipeline.timer || true
    ;;

  cron)
    CRON_OUT="/etc/cron.d/prospect-pipeline"
    cat > "$CRON_OUT" <<EOF
# Installed by install.sh on $(date -u +%Y-%m-%dT%H:%M:%SZ)
TZ=America/New_York
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
0 8 * * MON  $RUN_USER  cd $PREFIX && $VENV_PY -m prospect_pipeline.cli health-check --skip-smoke && $VENV_PY -m prospect_pipeline.cli prospect-week --lookback-days $LOOKBACK >> $LOG_DIR/cron.log 2>&1
EOF
    chmod 0644 "$CRON_OUT"
    echo "Installed $CRON_OUT"
    ;;
esac

# Basic logrotate config
LR_OUT="/etc/logrotate.d/prospect-pipeline"
cat > "$LR_OUT" <<EOF
$LOG_DIR/*.log {
    weekly
    rotate 12
    compress
    missingok
    notifempty
    create 0640 $RUN_USER $RUN_USER
}
EOF
echo "Installed logrotate config at $LR_OUT"

echo "Done. Next run: Monday 8:00 America/New_York (lookback=$LOOKBACK days)."
