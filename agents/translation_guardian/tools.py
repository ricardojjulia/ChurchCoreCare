import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlparse, urlunparse

from playwright.async_api import async_playwright

from .config import (
    CHALLENGE_ARTIFACTS_DIR,
    DEFAULT_BASE_URL,
    DEFAULT_LOGIN_EMAIL,
    DEFAULT_LOGIN_PASSWORD,
    GLOSSARY_DIR,
    I18N_DIR,
    SETTINGS_PATH,
    SOURCE_LOCALE,
)

_LOCALE_PATTERN = re.compile(r"^[a-z]{2}(?:-[A-Z]{2})?$")
_PLACEHOLDER_PATTERN = re.compile(r"\{[a-zA-Z0-9_]+\}")

_KNOWN_LOCALE_ALIASES = {
    "english": "en",
    "en": "en",
    "spanish": "es",
    "espanol": "es",
    "español": "es",
    "es": "es",
    "french": "fr",
    "francais": "fr",
    "français": "fr",
    "fr": "fr",
    "portuguese": "pt",
    "portugues": "pt",
    "português": "pt",
    "pt": "pt",
}

_DEFAULT_LOCALE_LABELS = {
    "en": "English",
    "es": "Spanish",
    "fr": "French",
    "pt": "Portuguese",
}


def _load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def _save_json(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")


def _validate_locale(locale: str) -> None:
    if not _LOCALE_PATTERN.match(locale):
        raise ValueError("Locale must be like 'es' or 'pt-BR'.")


def _locale_path(locale: str) -> Path:
    return I18N_DIR / f"{locale}.json"


def _extract_placeholders(text: str) -> set[str]:
    return set(_PLACEHOLDER_PATTERN.findall(text or ""))


def _derive_origin_from_base_url(base_url: str) -> str:
    parsed = urlparse(base_url)
    if not parsed.scheme or not parsed.netloc:
        raise ValueError("base_url must be an absolute URL.")
    return urlunparse((parsed.scheme, parsed.netloc, "", "", "", ""))


def _resolve_locale_input(language_or_locale: str) -> tuple[str, str]:
    if not isinstance(language_or_locale, str) or not language_or_locale.strip():
        raise ValueError("language_or_locale is required.")

    normalized = language_or_locale.strip().lower()
    locale = _KNOWN_LOCALE_ALIASES.get(normalized, normalized)

    if len(locale) > 2 and "-" not in locale and normalized.isalpha():
        locale = normalized[:2]

    _validate_locale(locale)
    label = _DEFAULT_LOCALE_LABELS.get(locale, locale.upper())
    return locale, label


def _normalize_visible_text(text: str) -> str:
    return " ".join((text or "").split()).strip().lower()


async def _collect_visible_text(
    page,
    selectors: list[str],
    *,
    per_selector_limit: int = 30,
) -> list[str]:
    collected: list[str] = []
    for selector in selectors:
        nodes = page.locator(selector)
        count = await nodes.count()
        for i in range(min(count, per_selector_limit)):
            text = (await nodes.nth(i).inner_text()).strip()
            if text:
                collected.append(text)
    return collected


async def _apply_language_selection(page, locale: str, locale_label: str) -> None:
    # Support both native <select> and combobox-based controls (Mantine style).
    native = page.locator('select[aria-label="Language"]').first
    if await native.count() > 0 and await native.is_visible():
        await native.select_option(value=locale)
        return

    combo = page.locator('input[aria-label="Language"]').first
    if await combo.count() == 0 or not await combo.is_visible():
        raise RuntimeError("Language picker not found on main screen.")

    await combo.click()
    option_selectors = [
        f'[role="option"][data-value="{locale}"]',
        f'[role="option"][value="{locale}"]',
        f'[role="option"]:has-text("{locale_label}")',
        f'[role="option"]:has-text("{locale}")',
    ]

    for selector in option_selectors:
        option = page.locator(selector).first
        if await option.count() > 0 and await option.is_visible():
            await option.click()
            return

    raise RuntimeError(f"Language option '{locale}' is not available in the picker.")


async def _api_json(page, method: str, url: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
    response = await page.request.fetch(
        url,
        method=method,
        headers={"content-type": "application/json"},
        data=json.dumps(payload or {}),
    )
    text = await response.text()
    data = {}
    if text:
        try:
            data = json.loads(text)
        except Exception:
            data = {"raw": text}

    if not response.ok:
        message = data.get("error") if isinstance(data, dict) else text
        raise RuntimeError(f"{method} {url} failed ({response.status}): {message}")

    return data if isinstance(data, dict) else {"value": data}


async def prepare_locale_in_application(
    language_or_locale: str,
    base_url: str = DEFAULT_BASE_URL,
    login_email: str = DEFAULT_LOGIN_EMAIL,
    login_password: str = DEFAULT_LOGIN_PASSWORD,
) -> dict[str, Any]:
    """Create locale, generate translations, save config, and verify language switch on the main app."""
    locale, locale_label = _resolve_locale_input(language_or_locale)
    origin = _derive_origin_from_base_url(base_url)

    api_locales = f"{origin}/v1/i18n/locales"
    api_settings = f"{origin}/v1/i18n/settings/{locale}"
    api_translate = f"{origin}/v1/i18n/translate"
    api_catalog = f"{origin}/v1/i18n/catalog?locale={locale}"

    CHALLENGE_ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    screenshot_before = CHALLENGE_ARTIFACTS_DIR / f"{locale}-main-before-{stamp}.png"
    screenshot_after = CHALLENGE_ARTIFACTS_DIR / f"{locale}-main-after-{stamp}.png"

    run_summary: dict[str, Any] = {
        "locale": locale,
        "label": locale_label,
        "baseUrl": base_url,
        "status": "pass",
    }

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()

        await page.goto(base_url, wait_until="domcontentloaded")
        if await page.locator("#loginEmail").is_visible():
            await page.locator("#loginEmail").fill(login_email)
            await page.locator("#loginPassword").fill(login_password)
            await page.locator("#loginPassword").press("Enter")
            await page.wait_for_timeout(1200)

        await _api_json(page, "POST", api_locales, {"locale": locale, "label": locale_label})
        await _api_json(
            page,
            "PATCH",
            api_settings,
            {
                "settings": {
                    "sourceLocale": SOURCE_LOCALE,
                    "tone": "neutral",
                    "fallbackMode": "copy",
                    "useGlossary": True,
                }
            },
        )

        integrity_before_translate = evaluate_locale_integrity(locale)
        if integrity_before_translate.get("missingKeyCount") or integrity_before_translate.get("blankValueCount"):
            translated = await _api_json(page, "POST", api_translate, {"locale": locale})
        else:
            translated = {"messages": {}}
        catalog_payload = await _api_json(page, "GET", api_catalog)

        visible_selectors = [
            ".workspace-topbar-kicker",
            ".workspace-topbar-title",
            ".workspace-topbar-subtitle",
            "[data-nav-key]",
            "button",
            "h1, h2, h3",
        ]
        before_visible = await _collect_visible_text(page, visible_selectors)
        await page.screenshot(path=str(screenshot_before), full_page=True)

        language_picker_exists = await page.locator('select[aria-label="Language"], input[aria-label="Language"]').count()
        if language_picker_exists == 0:
            await page.evaluate(
                "(nextLocale) => localStorage.setItem('faith.locale', nextLocale)",
                locale,
            )
            await page.reload(wait_until="domcontentloaded")
            await page.wait_for_timeout(1200)
        else:
            await _apply_language_selection(page, locale, locale_label)
            await page.wait_for_timeout(1200)

        after_visible = await _collect_visible_text(page, visible_selectors)
        await page.screenshot(path=str(screenshot_after), full_page=True)

        await context.close()
        await browser.close()

    translations = catalog_payload.get("messages", {}) if isinstance(catalog_payload, dict) else {}
    if not translations:
        translations = {
            key: value
            for key, value in _load_json(_locale_path(locale)).items()
            if key != "__label"
        }
    source_messages = _load_json(_locale_path(SOURCE_LOCALE))
    translated_values = {
        _normalize_visible_text(value)
        for value in translations.values()
        if isinstance(value, str) and value.strip()
    }
    english_values = {
        _normalize_visible_text(value)
        for value in source_messages.values()
        if isinstance(value, str) and value.strip()
    }
    normalized_visible = [_normalize_visible_text(value) for value in after_visible if _normalize_visible_text(value)]

    matching_translated = sum(1 for value in normalized_visible if value in translated_values)
    english_after = sum(1 for value in normalized_visible if value in english_values)
    translated_ratio = round(matching_translated / max(len(after_visible), 1), 4)

    status = "pass"
    if translated_ratio < 0.35:
        status = "warn"
    if translated_ratio < 0.15:
        status = "fail"

    run_summary.update(
        {
            "status": status,
            "translatedKeyCount": len(translations),
            "autoTranslateResultKeys": len(translated.get("messages", {})) if isinstance(translated, dict) else 0,
            "visibleTextCount": len(after_visible),
            "translatedVisibleMatches": matching_translated,
            "englishVisibleCountAfterSwitch": english_after,
            "translatedVisibleRatio": translated_ratio,
            "screenshotBefore": str(screenshot_before),
            "screenshotAfter": str(screenshot_after),
            "beforeSample": before_visible[:20],
            "afterSample": after_visible[:20],
        }
    )

    return run_summary


def _load_glossary(locale: str) -> dict[str, Any]:
    glossary_path = GLOSSARY_DIR / f"{locale}.json"
    if not glossary_path.exists():
        return {"locale": locale, "terms": []}
    return _load_json(glossary_path)


def bootstrap_locale(
    locale: str,
    locale_label: str,
    tone: str = "neutral",
    fallback_mode: str = "copy",
    use_glossary: bool = True,
) -> dict[str, Any]:
    """Generate locale data/settings safely from the English source baseline."""
    _validate_locale(locale)
    source = _load_json(_locale_path(SOURCE_LOCALE))
    settings = _load_json(SETTINGS_PATH)

    target_path = _locale_path(locale)
    target = _load_json(target_path) if target_path.exists() else {"__label": locale_label}

    added_keys = 0
    for key, source_text in source.items():
        if key not in target:
            target[key] = source_text
            added_keys += 1

    target["__label"] = locale_label
    _save_json(target_path, target)

    settings[locale] = {
        "sourceLocale": SOURCE_LOCALE,
        "tone": tone,
        "fallbackMode": fallback_mode,
        "useGlossary": bool(use_glossary),
        "glossary": settings.get(locale, {}).get("glossary", {}),
    }
    _save_json(SETTINGS_PATH, settings)

    return {
        "locale": locale,
        "localeFile": str(target_path),
        "settingsFile": str(SETTINGS_PATH),
        "sourceKeyCount": len(source),
        "targetKeyCount": len(target),
        "keysAdded": added_keys,
        "status": "ok",
        "note": "Locale bootstrapped from English baseline with safe copy fallback.",
    }


def evaluate_locale_integrity(locale: str) -> dict[str, Any]:
    """Evaluate key safety, placeholders, and translation coverage for a locale."""
    _validate_locale(locale)
    source = _load_json(_locale_path(SOURCE_LOCALE))
    target = _load_json(_locale_path(locale))

    source_keys = {k for k in source.keys() if k != "__label"}
    target_keys = {k for k in target.keys() if k != "__label"}

    missing = sorted(source_keys - target_keys)
    extra = sorted(target_keys - source_keys)

    blank: list[str] = []
    untranslated: list[str] = []
    placeholder_issues: list[dict[str, Any]] = []

    translated_count = 0
    for key in sorted(source_keys):
        source_text = str(source.get(key, ""))
        target_text = str(target.get(key, ""))

        if not target_text.strip():
            blank.append(key)
            continue

        if target_text == source_text:
            untranslated.append(key)
        else:
            translated_count += 1

        source_ph = sorted(_extract_placeholders(source_text))
        target_ph = sorted(_extract_placeholders(target_text))
        if source_ph != target_ph:
            placeholder_issues.append(
                {
                    "key": key,
                    "sourcePlaceholders": source_ph,
                    "targetPlaceholders": target_ph,
                }
            )

    total = len(source_keys) if source_keys else 1
    coverage = round(translated_count / total, 4)

    status = "pass"
    if missing or placeholder_issues:
        status = "fail"
    elif untranslated or blank or extra:
        status = "warn"

    return {
        "locale": locale,
        "status": status,
        "totalKeys": len(source_keys),
        "translatedKeys": translated_count,
        "translationCoverage": coverage,
        "missingKeyCount": len(missing),
        "extraKeyCount": len(extra),
        "blankValueCount": len(blank),
        "untranslatedCount": len(untranslated),
        "placeholderIssueCount": len(placeholder_issues),
        "missingKeys": missing[:50],
        "extraKeys": extra[:50],
        "blankKeys": blank[:50],
        "untranslatedKeys": untranslated[:50],
        "placeholderIssues": placeholder_issues[:50],
    }


def evaluate_accepted_terms(locale: str) -> dict[str, Any]:
    """Compare translated strings with accepted/rejected locale terminology."""
    _validate_locale(locale)
    source = _load_json(_locale_path(SOURCE_LOCALE))
    target = _load_json(_locale_path(locale))
    glossary = _load_glossary(locale)

    terms = glossary.get("terms", [])
    issues: list[dict[str, Any]] = []

    for key, source_text in source.items():
        target_text = str(target.get(key, ""))
        for term in terms:
            source_term = term.get("source", "")
            if not source_term:
                continue
            if source_term.lower() not in source_text.lower():
                continue

            accepted = term.get("accepted", [])
            rejected = term.get("rejected", [])

            matched_accepted = any(a.lower() in target_text.lower() for a in accepted)
            matched_rejected = [r for r in rejected if r.lower() in target_text.lower()]

            if matched_rejected or (accepted and not matched_accepted):
                issues.append(
                    {
                        "key": key,
                        "source": source_text,
                        "target": target_text,
                        "term": source_term,
                        "accepted": accepted,
                        "rejectedFound": matched_rejected,
                    }
                )

    return {
        "locale": locale,
        "status": "pass" if not issues else "warn",
        "termRuleCount": len(terms),
        "issueCount": len(issues),
        "issues": issues[:200],
    }


def build_translation_challenge_dataset(locale: str) -> dict[str, Any]:
    """Build a challenge dataset from locale integrity and accepted terms checks."""
    integrity = evaluate_locale_integrity(locale)
    terms = evaluate_accepted_terms(locale)

    challenged_keys = set(integrity.get("missingKeys", []))
    challenged_keys.update(integrity.get("blankKeys", []))
    challenged_keys.update(integrity.get("untranslatedKeys", []))
    for issue in integrity.get("placeholderIssues", []):
        challenged_keys.add(issue.get("key"))
    for issue in terms.get("issues", []):
        challenged_keys.add(issue.get("key"))

    return {
        "locale": locale,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "challengeKeyCount": len(challenged_keys),
        "challengeKeys": sorted(challenged_keys)[:500],
        "integrity": integrity,
        "acceptedTerms": terms,
    }


async def run_browser_translation_challenge(
    locale: str,
    base_url: str = DEFAULT_BASE_URL,
    login_email: str = DEFAULT_LOGIN_EMAIL,
    login_password: str = DEFAULT_LOGIN_PASSWORD,
) -> dict[str, Any]:
    """Log in, apply locale, and compare visible UI strings to accepted terms."""
    _validate_locale(locale)
    glossary = _load_glossary(locale)
    terms = glossary.get("terms", [])

    CHALLENGE_ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    screenshot_path = CHALLENGE_ARTIFACTS_DIR / f"{locale}-{stamp}.png"

    issues: list[dict[str, Any]] = []

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()

        await page.goto(base_url, wait_until="domcontentloaded")

        email = page.locator("#loginEmail")
        if await email.is_visible():
            await page.locator("#loginEmail").fill(login_email)
            await page.locator("#loginPassword").fill(login_password)
            await page.locator("#loginPassword").press("Enter")
            await page.wait_for_timeout(1500)

        language_picker_exists = await page.locator('select[aria-label="Language"], input[aria-label="Language"]').count()
        if language_picker_exists > 0:
            try:
                locale_label = _DEFAULT_LOCALE_LABELS.get(locale, locale.upper())
                await _apply_language_selection(page, locale, locale_label)
                await page.wait_for_timeout(800)
            except Exception:
                # If locale not available in picker yet, keep current language and continue diagnostic pass.
                pass
        else:
            await page.evaluate(
                "(nextLocale) => localStorage.setItem('faith.locale', nextLocale)",
                locale,
            )
            await page.reload(wait_until="domcontentloaded")
            await page.wait_for_timeout(800)

        selectors = [
            "#userBadge",
            ".workspace-topbar-kicker",
            ".workspace-topbar-title",
            ".workspace-topbar-subtitle",
            "[data-nav-key]",
            ".metric-card",
            "button",
            "h1, h2, h3",
        ]
        collected_text = await _collect_visible_text(page, selectors)
        page_text = "\n".join(collected_text)

        for term in terms:
            source_term = term.get("source", "")
            accepted = term.get("accepted", [])
            rejected = term.get("rejected", [])
            matched_rejected = [r for r in rejected if r.lower() in page_text.lower()]
            matched_accepted = any(a.lower() in page_text.lower() for a in accepted)

            if matched_rejected or (accepted and not matched_accepted):
                issues.append(
                    {
                        "term": source_term,
                        "accepted": accepted,
                        "rejectedFound": matched_rejected,
                    }
                )

        await page.screenshot(path=str(screenshot_path), full_page=True)
        await context.close()
        await browser.close()

    return {
        "locale": locale,
        "status": "pass" if not issues else "warn",
        "baseUrl": base_url,
        "issueCount": len(issues),
        "issues": issues,
        "artifactScreenshot": str(screenshot_path),
    }
