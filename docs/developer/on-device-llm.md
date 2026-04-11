# On-Device LLM Setup

ChronoShift uses two on-device LLMs as Stage 2 extractors. Both are optional — the app works without them, but they improve extraction quality for complex or ambiguous timestamps.

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

The prompt asks for a JSON array with `time`, `date`, `timezone`, and `original` fields. Today's date is injected so the model can resolve relative references ("tomorrow", "next Monday").

## Gemini Nano

**Engine:** ML Kit GenAI Prompt API
**Availability:** Device-dependent (requires on-device Gemini support)

### Status Codes

`checkStatus()` returns:
| Code | Meaning |
|---|---|
| 0 | Unavailable (device not supported) |
| 1 | Downloadable |
| 2 | Downloading |
| 3 | Available |

### How It Works

`GeminiNanoExtractor` uses the ML Kit GenAI prompt API. The response is parsed by the same `LlmResultParser` used by LiteRT — both LLMs receive the same prompt format and return JSON in the same schema.

## Shared Parser: LlmResultParser

Both LLM extractors delegate response parsing to `LlmResultParser`, which handles:

- JSON extraction from fenced code blocks (strips `` ```json ... ``` ``)
- Timezone resolution from abbreviations, IANA IDs, and UTC offsets
- Abbreviation-aware timezone matching via `TimezoneAbbreviations`
- Graceful handling of malformed LLM output

## Racing Strategy

`TieredTimeExtractor` runs both LLMs concurrently. Whichever finishes first emits an intermediate result immediately. The second merges in when done. LiteRT is typically faster than Gemini Nano.

If neither LLM is available (no model downloaded, device unsupported), Stage 1 results are the final results.
