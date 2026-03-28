import os
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
I18N_DIR = REPO_ROOT / "apps" / "api" / "data" / "i18n"
SETTINGS_PATH = I18N_DIR / "settings.json"
SOURCE_LOCALE = "en"
GLOSSARY_DIR = Path(__file__).resolve().parent / "data" / "glossaries"
CHALLENGE_ARTIFACTS_DIR = REPO_ROOT / "test-results" / "translation-challenge"

DEFAULT_BASE_URL = os.getenv("TRANSLATION_QA_BASE_URL", "http://127.0.0.1:3002/index.html")
DEFAULT_LOGIN_EMAIL = os.getenv("TRANSLATION_QA_EMAIL", "admin@faithcounseling.local")
DEFAULT_LOGIN_PASSWORD = os.getenv("TRANSLATION_QA_PASSWORD", "ChangeMe!Dev2024#")
