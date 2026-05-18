# On-Device LLM Setup

ChronoShift uses LiteRT/Gemma as its optional Stage 2 on-device LLM. The app works without a downloaded model, but the model improves extraction quality for complex or ambiguous timestamps without requiring platform-specific LLM support.

## LiteRT (Gemma 4 E2B)

**Engine:** Google LiteRT-LM
**Model:** Gemma (`.litertlm` format, downloaded at runtime)
**Download:** Via the Settings screen, which fetches a compatible model from the manifest-backed `ModelRepository` using `ModelDownloader`

### How It Works

1. `ModelRepository` fetches `model-manifest.json` from the project repository and filters entries to compatible LiteRT-LM models for this app version and prompt contract.
2. User downloads the recommended model, or an update when the manifest advertises a newer compatible recommendation. The model is saved to `{app filesDir}/models/`.
3. `ModelDownloader` downloads to a temp file, verifies `sha256` when the manifest provides one, then stores selected-model metadata.
4. `LiteRtExtractor` loads the selected installed model. It does not auto-select arbitrary newer local files.
5. The engine is initialized with CPU backend on first use.
6. Each extraction creates a conversation, sends a structured prompt, and parses the JSON response via `LlmResultParser`.

### Model Manifest

The manifest lives at the repository root as `model-manifest.json`. Add new models there only when they are compatible with:

- LiteRT-LM `.litertlm` format
- `promptVersion` 1
- The JSON response contract parsed by `LlmResultParser`
- The current app version or newer via `minAppVersionCode`

Newer remote models are offered in Settings as updates; the app does not silently switch models.

### Prompt Format

The prompt asks for a JSON array with `time`, `date`, `timezone`, and `original` fields. Today's date is injected so the model can resolve relative references such as "tomorrow" or "next Monday".

## Shared Parser: LlmResultParser

`LiteRtExtractor` delegates response parsing to `LlmResultParser`, which handles:

- JSON extraction from fenced code blocks (strips `` ```json ... ``` ``)
- Timezone resolution from abbreviations, IANA IDs, and UTC offsets
- Abbreviation-aware timezone matching via `TimezoneAbbreviations`
- Graceful handling of malformed LLM output

If LiteRT is unavailable because no model is downloaded, Stage 1 results are the final results.
