"""Узнаём, куда RHVoice (Tatiana) сам ставит ударение в каждом слове сценария.

Метод: синтезируем слово без пометки и с пометкой U+0301 на каждой гласной по очереди.
Вариант, звук которого побайтно совпал с непомеченным, и есть ударение по умолчанию.
Результат: stress_probe.json (слово → форма с ударением) и stress_report.txt для ручной проверки.
"""
import hashlib
import json
import os
import subprocess
import sys
import tempfile
from collections import OrderedDict
from concurrent.futures import ThreadPoolExecutor

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pron import ACUTE, VOWELS, WORD_RE, apply_pron, needs_mark, PROBE_PATH, HERE  # noqa: E402
from script import SCENES  # noqa: E402

VOICE = "tatiana"
TMP = tempfile.mkdtemp(prefix="probe_")


def synth_hash(text):
    fd, path = tempfile.mkstemp(suffix=".wav", dir=TMP)
    os.close(fd)
    subprocess.run(["RHVoice-test", "-q", "max", "-p", VOICE, "-o", path], input=text.encode(), check=True)
    h = hashlib.md5(open(path, "rb").read()).hexdigest()
    os.unlink(path)
    return h


def variants(w):
    out = []
    for i, ch in enumerate(w):
        if ch in VOWELS:
            out.append(w[: i + 1] + ACUTE + w[i + 1:])
    return out


def probe(w):
    base = synth_hash(w)
    vs = variants(w)
    matches = [v for v in vs if synth_hash(v) == base]
    return w, matches, len(vs)


def main():
    contexts = OrderedDict()
    for s in SCENES:
        for line in s["lines"]:
            t = apply_pron(line if isinstance(line, str) else line["t"])
            for m in WORD_RE.finditer(t):
                w = m.group(0)
                if not needs_mark(w):
                    continue
                lw = w.lower()
                if lw not in contexts:
                    a, b = max(0, m.start() - 30), min(len(t), m.end() + 30)
                    contexts[lw] = t[a:b].replace("\n", " ")
    words = list(contexts)
    print("unique words to probe:", len(words), flush=True)
    with ThreadPoolExecutor(max_workers=4) as ex:
        results = list(ex.map(probe, words))

    probe_map, report = {}, []
    for w, matches, nv in results:
        if len(matches) == 1:
            probe_map[w] = matches[0]
            shown = "".join(ch.upper() if i + 1 < len(matches[0]) and matches[0][i + 1] == ACUTE else ch
                            for i, ch in enumerate(matches[0])).replace(ACUTE, "")
            status = "ok"
        else:
            shown = w
            status = "NONE" if not matches else "MULTI:" + ",".join(matches)
        report.append(f"{status:6s} {shown:28s} | {contexts[w]}")
    json.dump(probe_map, open(PROBE_PATH, "w", encoding="utf-8"), ensure_ascii=False, indent=0, sort_keys=True)
    open(os.path.join(HERE, "stress_report.txt"), "w", encoding="utf-8").write("\n".join(report) + "\n")
    print("unique:", sum(1 for _, m, _ in results if len(m) == 1),
          "none:", sum(1 for _, m, _ in results if not m),
          "multi:", sum(1 for _, m, _ in results if len(m) > 1))


if __name__ == "__main__":
    main()
