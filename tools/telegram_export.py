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

# js/importer.js dagi filtr bilan bir xil. Keng olingan: firibgar e'lonlar ko'pincha "kerak" demaydi.
VACANCY_RE = re.compile(
    r"kerak|vakansiya|ish(ga|chi|lar|i)?\b|ish\s+haqi|talab|maosh|oylik|oyiga|kuniga|daromad|viza|xorij|tajriba|smena|"
    r"вакансия|требуется|зарплат|работ|доход|заработ|опыт|виза|"
    r"керак|маош|иш(га|чи|лар)?(?!\w)|ойига|даромад|тажриба",
    re.IGNORECASE,
)
OUT = Path(__file__).resolve().parent.parent / "js" / "real-data.js"

# ---------- Shaxsiy ma'lumotni yashirish ----------
# js/pii.js bilan BIR XIL qoidalar (tests/redact-parity.test.mjs tekshiradi). re.ASCII — JS dagi \w, \d, \b kabi.
MASK = {
    "card": "XXXX XXXX XXXX XXXX",
    "pinfl": "[JSHSHIR]",
    "passport": "[pasport]",
    "email": "[email]",
    "tme": "t.me/foydalanuvchi",
    "username": "@foydalanuvchi",
    "phoneRu": "+7 000 000 00 00",
    "phoneUz": "+998 00 000 00 00",
}
RULES = [
    ("card", re.compile(r"(?<!\d)\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}(?!\d)", re.ASCII)),
    ("pinfl", re.compile(r"(?<!\d)\d{14}(?!\d)", re.ASCII)),
    ("passport", re.compile(r"(?<![A-Za-zА-Яа-яЁё\d])(?:[A-Z]{2}|[АК][АВСЕ])\s?\d{7}(?!\d)", re.ASCII)),
    ("email", re.compile(r"[\w.+-]+@[\w-]+\.[A-Za-z.]{2,}", re.ASCII)),
    ("tme", re.compile(r"(?:https?://)?(?:t|telegram)\.me/(?:\+[\w-]{6,}|joinchat/[\w-]{6,}|(?!foydalanuvchi\b)[A-Za-z]\w{3,31})", re.ASCII)),
    ("username", re.compile(r"(?<![\w@./])@(?!foydalanuvchi\b)[A-Za-z]\w{3,31}\b", re.ASCII)),
    ("phoneRu", re.compile(r"(?<![\d+])(?:\+7|8)[\s-]?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}(?!\d)", re.ASCII)),
    ("phoneUz", re.compile(r"(?<!\d)(?:(?:\+?998)[\s-]?)?\(?\d{2}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}(?!\d)", re.ASCII)),
]
STIR_BEFORE = re.compile(r"(stir|inn|инн|стир)(?![a-zа-я])[^\d\n]{0,15}$", re.IGNORECASE)
NAME_RE = re.compile(r"(?<![^\W\d_])[A-ZА-ЯЎҚҒҲ][a-zа-яўқғҳ'ʻ‘]{2,}\s+(opa|aka|опа|ака)(?![^\W\d_])")


def _is_masked(s):
    return not re.search(r"[1-9]", re.sub(r"^\s*\+?(998|7)(?!\d)", "", s))


def redact(text):
    """Matndagi PII'ni yashiradi. Natija: (matn, {tur: soni})."""
    counts = {k: 0 for k in MASK}
    for kind, rx in RULES:
        def repl(m, kind=kind):
            value, start = m.group(0), m.start()
            if _is_masked(value) and re.search(r"\d", value):
                return value
            if kind in ("phoneUz", "pinfl") and STIR_BEFORE.search(m.string[max(0, start - 30):start]):
                return value
            counts[kind] += 1
            return MASK[kind]
        text = rx.sub(repl, text)
    return text, counts


def name_warnings(text):
    return [m.group(0) for m in NAME_RE.finditer(text)]


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
    totals, names = {}, []
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
            clean, counts = redact(text)
            for k, n in counts.items():
                totals[k] = totals.get(k, 0) + n
            for name in name_warnings(clean):
                names.append(name)
            rows.append({
                "id": len(rows) + 1,
                "text": clean,
                "date": msg.get("date", "")[:10],
                "channel": channel,
            })
    OUT.write_text(
        "// tools/telegram_export.py tomonidan yaratilgan\n"
        "window.REAL_VACANCIES = " + json.dumps(rows, ensure_ascii=False, indent=1) + ";\n",
        encoding="utf-8",
    )
    print(f"{len(rows)} ta vakansiya {OUT} ga yozildi ({len(paths)} ta kanal).")
    hidden = ", ".join(f"{n} {k}" for k, n in totals.items() if n) or "hech narsa"
    print(f"Shaxsiy ma'lumot yashirildi: {hidden}")
    if names:
        print(f"⚠️ Ism bo'lishi mumkin ({len(names)} ta): {', '.join(sorted(set(names))[:10])} — js/real-data.js ni qo'lda tekshiring", file=sys.stderr)


if __name__ == "__main__":
    main(sys.argv[1:])
