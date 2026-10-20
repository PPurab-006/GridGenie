#!/usr/bin/env bash
set -e
export PYTHONPATH=backend
export PYTEST_DISABLE_PLUGIN_AUTOLOAD=1
.venv/bin/pytest backend/tests/ "$@"
