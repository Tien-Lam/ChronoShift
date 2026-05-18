#!/usr/bin/env python3
"""Validate model-manifest.json against remote download headers.

This script intentionally performs network I/O and is not part of the normal
unit test suite. It verifies Hugging Face LFS metadata without downloading the
multi-GB model file.
"""

from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def head_no_redirect(url: str):
    opener = urllib.request.build_opener(NoRedirect)
    request = urllib.request.Request(
        url,
        method="HEAD",
        headers={"User-Agent": "ChronoShift-manifest-validator/1.0"},
    )
    try:
        return opener.open(request, timeout=30)
    except urllib.error.HTTPError as error:
        if 300 <= error.code < 400:
            return error
        raise


def clean_etag(value: str | None) -> str:
    if value is None:
        return ""
    return value.strip().strip('"').lower()


def validate_model(model: dict) -> list[str]:
    errors: list[str] = []
    model_id = model.get("id", "<missing id>")
    url = model.get("url", "")
    expected_size = int(model.get("sizeBytes", 0))
    expected_sha = str(model.get("sha256", "")).lower()

    if not url:
        return [f"{model_id}: missing url"]

    try:
        response = head_no_redirect(url)
    except Exception as exc:  # noqa: BLE001 - command-line validator should report the concrete failure
        return [f"{model_id}: HEAD failed for {url}: {exc}"]

    headers = response.headers
    linked_size = headers.get("X-Linked-Size")
    linked_etag = clean_etag(headers.get("X-Linked-ETag"))

    if linked_size is None:
        errors.append(f"{model_id}: HEAD response did not include X-Linked-Size")
    elif int(linked_size) != expected_size:
        errors.append(f"{model_id}: X-Linked-Size {linked_size} != manifest sizeBytes {expected_size}")

    if not linked_etag:
        errors.append(f"{model_id}: HEAD response did not include X-Linked-ETag")
    elif linked_etag != expected_sha:
        errors.append(f"{model_id}: X-Linked-ETag {linked_etag} != manifest sha256 {expected_sha}")

    print(f"{model_id}: size={linked_size or 'missing'} sha256={linked_etag or 'missing'}")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "manifest",
        nargs="?",
        default=Path(__file__).resolve().parents[1] / "model-manifest.json",
        type=Path,
        help="Path to model-manifest.json",
    )
    args = parser.parse_args()

    manifest = json.loads(args.manifest.read_text(encoding="utf-8"))
    errors: list[str] = []
    for model in manifest.get("models", []):
        errors.extend(validate_model(model))

    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1

    print("Manifest download headers match.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
