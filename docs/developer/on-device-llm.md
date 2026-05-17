# On-Device LLM Setup

ChronoShift uses LiteRT/Gemma as its optional Stage 2 on-device LLM. The app works without a downloaded model, but the model improves extraction quality for complex or ambiguous timestamps without requiring platform-specific LLM support.

## LiteRT (Gemma 4 E2B)

**Engine:** Google LiteRT-LM
**Model:** Gemma (`.litertlm` format, downloaded at runtime)
**Download:** Via the Settings screen, which fetches the model from Hugging Face using `ModelDownloader`

### How It Works

1. User downloads the Gemma model from Settings. The model is saved to `{app filesDir}/models/`.
2. `LiteRtExtractor` scans the models directory for `.litertlm` files or files containing "gemma" in the name, picks the newest.
3. The engine is initialized with CPU backend on first use.
4. Each extraction creates a conversation, sends a structured prompt, and parses the JSON response via `LlmResultParser`.

### Prompt Format

The prompt asks for a JSON array with `time`, `date`, `timezone`, and `original` fields. Today's date is injected so the model can resolve relative references such as "tomorrow" or "next Monday".

## Shared Parser: LlmResultParser

`LiteRtExtractor` delegates response parsing to `LlmResultParser`, which handles:

- JSON extraction from fenced code blocks (strips `` ```json ... ``` ``)
- Timezone resolution from abbreviations, IANA IDs, and UTC offsets
- Abbreviation-aware timezone matching via `TimezoneAbbreviations`
- Graceful handling of malformed LLM output

If LiteRT is unavailable because no model is downloaded, Stage 1 results are the final results.
