"""Текст субтитров → текст для синтезатора речи (RHVoice, голос Tatiana).

1. Латиница, аббревиатуры и имена файлов заменяются русским произношением.
2. Каждое многосложное слово получает явное ударение (U+0301 после ударной гласной):
   берётся проверенное ударение из stress_probe.json, поверх него — ручные правки из STRESS_FIX.
"""
import json
import os
import re

ACUTE = "́"
VOWELS = "аеиоуыэюяё"
HERE = os.path.dirname(os.path.abspath(__file__))
PROBE_PATH = os.path.join(HERE, "stress_probe.json")

# порядок важен: длинные шаблоны раньше коротких
PRON = [
    (r"Claude Code", "Клод Код"),
    (r"CLAUDE\.md", "клод точка эм дэ"),
    (r"SKILL\.md", "скилл точка эм дэ"),
    (r"Claude", "Клод"),
    (r"Harness", "Ха́рнесс"),
    (r"\bGPT\b", "джи пи ти́"),
    (r"Gemini", "Дже́мини"),
    (r"\bMCP\b", "эм си пи́"),
    (r"USB-C", "ю эс би си́"),
    (r"Excel", "Э́ксель"),
    (r"Google", "Гугл"),
    (r"/context", "конте́кст"),
    (r"/skills", "ски́ллз"),
    (r"\.pdf\b", " точка пэ дэ эф"),
    (r"\bИИ-", "и и́ "),
    (r"\bИИ\b", "и и́"),
]

# Ручные правки ударений (слово в нижнем регистре → форма с ударением).
# Заполняется после просмотра отчёта stress_report.txt.
STRESS_FIX = {
    # «харнесс» RHVoice по умолчанию читает «харнЕсс»
    "харнесс": "ха́рнесс", "харнесса": "ха́рнесса", "харнессу": "ха́рнессу", "харнессом": "ха́рнессом",
    "харнессе": "ха́рнессе", "харнессы": "ха́рнессы", "харнессов": "ха́рнессов", "харнессах": "ха́рнессах",
    "другом": "друго́м",        # «в другом приложении», а не «с другом»
    "мало": "ма́ло",
    "места": "ме́ста",          # «немного места», «сколько места» — родительный падеж
    "промптом": "про́мптом",
    "кто-то": "кто́-то", "что-то": "что́-то", "куда-то": "куда́-то", "какой-то": "како́й-то", "где-то": "где́-то",
}

WORD_RE = re.compile(r"[А-Яа-яЁё" + ACUTE + r"]+(?:-[А-Яа-яЁё" + ACUTE + r"]+)*")


def vowel_count(w):
    return sum(1 for ch in w.lower() if ch in VOWELS)


def needs_mark(w):
    lw = w.lower()
    return vowel_count(lw) >= 2 and "ё" not in lw and ACUTE not in lw


def apply_pron(text):
    for pat, rep in PRON:
        text = re.sub(pat, rep, text)
    return text


def caption_text(text):
    return text.replace(ACUTE, "")


def load_probe():
    if os.path.exists(PROBE_PATH):
        return json.load(open(PROBE_PATH, encoding="utf-8"))
    return {}


def mark(word_lower, stressed_lower, original):
    """Перенести ударение из stressed_lower на original с сохранением регистра."""
    out, j = [], 0
    for ch in stressed_lower:
        if ch == ACUTE:
            out.append(ACUTE)
            continue
        out.append(original[j])
        j += 1
    return "".join(out)


def tts_text(text, probe=None):
    probe = probe if probe is not None else load_probe()
    text = apply_pron(text)

    def repl(m):
        w = m.group(0)
        if not needs_mark(w):
            return w
        lw = w.lower()
        stressed = STRESS_FIX.get(lw) or probe.get(lw)
        if not stressed:
            return w
        return mark(lw, stressed, w)

    return WORD_RE.sub(repl, text)
