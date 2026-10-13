# Ролик «Что такое Harness» (Remotion)

Обучающий ролик (~24 мин) для обычных пользователей: что такое харнесс ИИ-агента,
из чего он состоит, примеры и настоящие скриншоты Claude Code.

## Конвейер

```bash
npm install
python3 -m venv .venv && .venv/bin/pip install -r pipeline/requirements.txt

# 1. Сценарий: pipeline/script.py (сцены, фразы, параметры визуала)
# 2. Ударения (для RHVoice): pipeline/probe_stress.py → stress_report.txt, правки в pipeline/pron.py
# 3. Озвучка + таймлайн: pipeline/synth.py → public/audio/voice.wav, src/timeline.json
# 4. Музыка, эффекты, сведение: pipeline/music.py → public/audio/mix.wav
# 5. Скриншоты: pipeline/captures/*.ansi (tmux capture-pane -e) → pipeline/ansi_to_png.py → public/shots/

npx remotion studio            # предпросмотр
npx remotion render HarnessExplainer out/harness.mp4
```

Музыка генерируется кодом (pipeline/music.py), сторонних треков нет.
