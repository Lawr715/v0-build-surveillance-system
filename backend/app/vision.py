from __future__ import annotations

import base64
import json
import os
import re
from pathlib import Path
from typing import Any, Optional
from urllib import error as urllib_error
from urllib import request as urllib_request

VISION_ANNOTATE_URL = "https://vision.googleapis.com/v1/images:annotate"
DEFAULT_TIMEOUT_SECONDS = 15
DEFAULT_TRACK_ENRICHMENT_LIMIT = 150
GENERIC_OBJECT_NAMES = {"human", "person"}
VISION_FEATURES = (
    ("LABEL_DETECTION", 8),
    ("OBJECT_LOCALIZATION", 6),
    ("LOGO_DETECTION", 4),
    ("TEXT_DETECTION", 5),
)


def vision_api_key() -> str:
    return (
        os.getenv("GOOGLE_CLOUD_VISION_API_KEY")
        or os.getenv("GOOGLE_VISION_API_KEY")
        or os.getenv("GOOGLE_API_KEY")
        or os.getenv("GEMINI_API_KEY")
        or ""
    ).strip()


def track_enrichment_limit() -> int:
    raw_value = str(os.getenv("VISION_ENRICHMENT_MAX_TRACKS") or "").strip()
    if not raw_value:
        return DEFAULT_TRACK_ENRICHMENT_LIMIT

    try:
        parsed_value = int(raw_value)
    except ValueError:
        return DEFAULT_TRACK_ENRICHMENT_LIMIT

    return max(0, min(500, parsed_value))


def track_enrichment_enabled() -> bool:
    return bool(vision_api_key()) and track_enrichment_limit() > 0


def _normalized_term(value: Any) -> str:
    return re.sub(r"[^a-z0-9]+", " ", str(value or "").strip().lower()).strip()


def _unique_terms(values: list[Any], *, limit: int, ignored: Optional[set[str]] = None) -> list[str]:
    normalized: list[str] = []
    seen: set[str] = set()
    ignored_terms = ignored or set()
    for value in values:
        term = _normalized_term(value)
        if not term or term in seen or term in ignored_terms:
            continue
        seen.add(term)
        normalized.append(term)
        if len(normalized) >= limit:
            break
    return normalized


def _text_annotations(response: dict[str, Any], *, limit: int = 5) -> list[str]:
    annotations = response.get("textAnnotations") or []
    extracted: list[str] = []
    seen: set[str] = set()
    for item in annotations:
        if not isinstance(item, dict):
            continue
        description = str(item.get("description") or "").strip()
        if not description:
            continue
        for line in description.replace("\r", "\n").split("\n"):
            cleaned = " ".join(line.split()).strip()
            normalized = cleaned.lower()
            if len(cleaned) < 2 or normalized in seen:
                continue
            seen.add(normalized)
            extracted.append(cleaned)
            if len(extracted) >= limit:
                return extracted
    return extracted


def _metadata_summary(labels: list[str], objects: list[str], logos: list[str], text: list[str]) -> str:
    parts: list[str] = []
    if labels:
        parts.append("Cloud Vision labels: " + ", ".join(labels[:4]) + ".")
    if objects:
        parts.append("Detected objects: " + ", ".join(objects[:3]) + ".")
    if logos:
        parts.append("Detected logos: " + ", ".join(logos[:2]) + ".")
    if text:
        parts.append("Visible text: " + ", ".join(text[:2]) + ".")
    return " ".join(parts)


def annotate_image_bytes(image_bytes: bytes, *, timeout: int = DEFAULT_TIMEOUT_SECONDS) -> Optional[dict[str, Any]]:
    api_key = vision_api_key()
    if not api_key or not image_bytes:
        return None

    request_body = {
        "requests": [
            {
                "image": {"content": base64.b64encode(image_bytes).decode("ascii")},
                "features": [{"type": feature_name, "maxResults": max_results} for feature_name, max_results in VISION_FEATURES],
            }
        ]
    }
    request = urllib_request.Request(
        f"{VISION_ANNOTATE_URL}?key={api_key}",
        data=json.dumps(request_body).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib_request.urlopen(request, timeout=timeout) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except (urllib_error.HTTPError, urllib_error.URLError, TimeoutError, json.JSONDecodeError):
        return None

    responses = payload.get("responses") or []
    if not responses or not isinstance(responses[0], dict):
        return None

    response = responses[0]
    if response.get("error"):
        return None

    labels = _unique_terms([item.get("description") for item in response.get("labelAnnotations") or [] if isinstance(item, dict)], limit=8)
    objects = _unique_terms(
        [item.get("name") for item in response.get("localizedObjectAnnotations") or [] if isinstance(item, dict)],
        limit=6,
        ignored=GENERIC_OBJECT_NAMES,
    )
    logos = _unique_terms([item.get("description") for item in response.get("logoAnnotations") or [] if isinstance(item, dict)], limit=4)
    text = _text_annotations(response)
    summary = _metadata_summary(labels, objects, logos, text)

    if not any((labels, objects, logos, text, summary)):
        return None

    return {
        "labels": labels,
        "objects": objects,
        "logos": logos,
        "text": text,
        "summary": summary,
    }


def enrich_track_thumbnail(thumbnail_path: Path, *, timeout: int = DEFAULT_TIMEOUT_SECONDS) -> Optional[dict[str, Any]]:
    try:
        image_bytes = thumbnail_path.read_bytes()
    except OSError:
        return None
    return annotate_image_bytes(image_bytes, timeout=timeout)