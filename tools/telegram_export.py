#!/usr/bin/env python3
"""Telegram Desktop eksportini (result.json) saytga mos js/real-data.js fayliga aylantiradi.

Ma'lumotni olish:
  1. Telegram Desktop -> ish kanaliga kiring -> ⋮ -> "Export chat history"
  2. Format: "Machine-readable JSON", rasm/videolarni belgilamang
  3. Bir nechta kanal uchun takrorlang

Ishlatish:
  python3 tools/telegram_export.py kanal1/result.json kanal2/result.json
"""
import json
import re
import sys
from pathlib import Path

VACANCY_RE = re.compile(
    r"kerak|vakansiya|ishga\s+taklif|talab|maosh|oylik|ish\s+haqi|"
    r"вакансия|требуется|зарплата|работа",
    re.IGNORECASE,
)
OUT = Path(__file__).resolve().parent.parent / "js" / "real-data.js"


def message_text(msg):
    text = msg.get("text", "")
    if isinstance(text, list):
        text = "".join(p if isinstance(p, str) else p.get("text", "") for p in text)
    return text.strip()


def main(paths):
    if not paths:
        print(__doc__)
        sys.exit(1)
    rows, seen = [], set()
    for path in paths:
        data = json.loads(Path(path).read_text(encoding="utf-8"))
        channel = data.get("name") or Path(path).parent.name
        for msg in data.get("messages", []):
            if msg.get("type") != "message":
                continue
            text = message_text(msg)
            key = re.sub(r"\s+", " ", text.lower())[:300]
            if len(text) < 40 or not VACANCY_RE.search(text) or key in seen:
                continue
            seen.add(key)
            rows.append({
                "id": len(rows) + 1,
                "text": text,
                "date": msg.get("date", "")[:10],
                "channel": channel,
            })
    OUT.write_text(
        "// tools/telegram_export.py tomonidan yaratilgan\n"
        "window.REAL_VACANCIES = " + json.dumps(rows, ensure_ascii=False, indent=1) + ";\n",
        encoding="utf-8",
    )
    print(f"{len(rows)} ta vakansiya {OUT} ga yozildi ({len(paths)} ta kanal).")


if __name__ == "__main__":
    main(sys.argv[1:])
