#!/usr/bin/env python3
"""Gera a CSP da entrada desktop a partir do JavaScript inline realmente carregado."""

from __future__ import annotations

import base64
import hashlib
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "index.html"
OUTPUT = ROOT / "ops" / "desktop-csp.txt"
INLINE_SCRIPT = re.compile(r"<script\b(?P<attrs>[^>]*)>(?P<body>.*?)</script>", re.IGNORECASE | re.DOTALL)


def production_editor_source() -> str:
    source = INDEX.read_text(encoding="utf-8")
    # Deve permanecer equivalente às transformações de desktop/loader.js.
    return source.replace("./assets/", "../assets/").replace("./vendor/", "../vendor/")


def inline_script_hashes(source: str) -> list[str]:
    hashes: list[str] = []
    for match in INLINE_SCRIPT.finditer(source):
        if re.search(r"\bsrc\s*=", match.group("attrs"), re.IGNORECASE):
            continue
        digest = hashlib.sha256(match.group("body").encode("utf-8")).digest()
        hashes.append(f"'sha256-{base64.b64encode(digest).decode('ascii')}'")
    if not hashes:
        raise SystemExit("Nenhum script inline foi encontrado no editor.")
    return hashes


def main() -> None:
    scripts = " ".join(inline_script_hashes(production_editor_source()))
    policy = "; ".join(
        [
            "default-src 'none'",
            f"script-src 'self' {scripts}",
            f"script-src-elem 'self' {scripts}",
            "script-src-attr 'none'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob:",
            "font-src 'self' data:",
            "media-src 'self' data: blob:",
            "worker-src 'self' blob:",
            "connect-src 'self' https://yhjetfilhsjtjfvgqfod.supabase.co wss://yhjetfilhsjtjfvgqfod.supabase.co ipc: http://ipc.localhost",
            "frame-src 'none'",
            "frame-ancestors 'none'",
            "object-src 'none'",
            "base-uri 'none'",
            "form-action 'none'",
        ]
    )
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(f"{policy}\n", encoding="utf-8")
    print(OUTPUT)


if __name__ == "__main__":
    main()
