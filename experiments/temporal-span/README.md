# Temporal span feasibility decision — 4 October 2026

**Defer shipping ML and defer BERT-tiny training.** The measured pretrained candidate is too large for the provisional 20 MB model/tokenizer target and did not add conversions beyond an inexpensive deterministic control in this bounded experiment. This completes the optional TIE-302 feasibility/deferral decision; it does not certify a production ML adapter or establish population accuracy. No model, Python dependency or ONNX runtime enters the web app or routine CI.

## Independently frozen evaluation

[holdout.json](holdout.json) has 20 owned synthetic messages and 55 explicit DATE/TIME/TIMEZONE/CITY spans. An independent adversarial reviewer checked spans and exact conversion arithmetic **before inference**, at SHA-256 `a1ed4d32553b09cabe6cef7df1575f8054ebdd71e81dcfb7f9d87596d1a232b3`. Fixed labels and threshold 0.3 were not tuned. There is no training/development split because nothing was trained: all messages are evaluation-only. This is a small feasibility sample, not representative user data or proof of absence from pretraining.

Eighteen launch-style cases cover explicit clocks, city/offset context, multiple events, ambiguous CST, date-only input, negatives, invalid timezone offsets, unknown cities, folds/gaps and cross-zone ranges. Two **desired extensions** use spoken clocks and are scored separately. Entity spans are unordered sets; exact converted instants and range endpoints preserve order. [comparison.json](comparison.json) records original source indices/text, all outputs, warning obligations, missing and unexpected instants. The baseline is the real production converter at `d9109d0a14c0bb2d2c5d2d818c5179c884f56b98`, not fabricated AI responses.

| Method | Launch-style exact messages | Desired spoken-clock exact messages | Unexpected instants |
| --- | ---: | ---: | ---: |
| Production deterministic full text | 18/18 | 0/2 | 0 |
| Same converter + two generic spoken-clock rules | 18/18 | 2/2 | 0 |
| Same rules gated by real GLiNER TIME detections | 18/18 | 2/2 | 0 |

The two rules were motivated by the desired-extension gold, so the control/hybrid are exploratory, **not an independent accuracy estimate for a new normalizer**. No rules are shipped. The baseline returns a date-only result for the half-past example and abstains with a clock warning for quarter-to-noon; these are documented unsupported desired extensions, not claimed supported conversions. The hybrid preserves full-text parsing and ambiguity handling. This sample shows no incremental ML benefit over the same cheap rules; it cannot prove that ML never helps.

## Actual model, export and execution

Strict CPU loading of [`knowledgator/gliner-bi-edge-v2.0`](https://huggingface.co/knowledgator/gliner-bi-edge-v2.0), revision `3a401e4902d93df04971c795fb1f42f37801aced`, succeeded with 60,800,256 parameters and real inference on all messages. [inference.json](inference.json) records package versions, predictions, elapsed times, downloaded file sizes/hashes, exact revision and export failures. No unsafe custom code or partial/random-head loading was enabled.

| Artifact | Measured bytes |
| --- | ---: |
| Published PyTorch checkpoint | 243,267,415 |
| Full-label FP32 ONNX graph | 239,632,030 |
| Full-label quantized ONNX graph | 60,833,113 |
| Exported text tokenizer JSON | 3,584,034 |
| Single-thread ONNX Runtime Web WASM binary | 14,239,897 |

The proposed fixed-label export call failed in GLiNER 0.2.29 with `TypeError: BaseGLiNER._build_dummy_batch() got an unexpected keyword argument 'from_labels_embeddings'`. This is recorded API-path failure evidence, not proof the architecture cannot be optimized. The ordinary full-label export succeeded. Exported graphs and model cache remain temporary and are not committed. [browser-assets.json](browser-assets.json) measures graph/tokenizer/runtime/worker bytes and hashes; label-tokenizer/config and a JS tokenizer/span adapter would add more bytes, so it is not a complete deployable download total.

Both graphs executed on native ONNX Runtime CPU with real tokenization and decoding. [quantization-comparison.json](quantization-comparison.json) compares exact entity sets against Torch FP32 and gold after mapping Python code-point offsets to JS UTF-16:

| Variant | Exact span precision | Recall | F1 | Messages with different detections from Torch FP32 |
| --- | ---: | ---: | ---: | ---: |
| Torch FP32 / FP32 ONNX | 78.7% | 87.3% | 82.8% | 0/20 for ONNX |
| Quantized ONNX | 59.7% | 72.7% | 65.6% | 9/20 |

The conversion comparison uses Torch FP32 detections, **not** quantized detections; the quantization regression is an additional reason to defer. Span F1 is not end-to-end time-conversion accuracy.

## Browser compatibility evidence and limits

The actual Codex browser side panel ran ONNX Runtime Web 1.30.0 in a module Web Worker, WASM provider, **one thread**, local loopback graph/runtime URLs. Three pretokenized messages of two sequence shapes produced matching output dimensions and maximum logit difference ≤0.00000668 against native quantized ONNX. [browser-wasm.json](browser-wasm.json) and [screenshot](../../docs/qa/remaining-acceptance-2026-10-04/ml-wasm.png) record the result: 396.4 ms session initialization and 29.9–52 ms inference on this development computer. These three samples are compatibility evidence, not latency p95, cold network download, phone, peak memory or full browser extraction evidence. Runtime configuration follows [ONNX Runtime's flags documentation](https://onnxruntime.ai/docs/tutorials/web/env-flags-and-session-options.html).

No JS tokenizer/span decoder, long-input windowing, cancel/stale-request integration, model caching, offline reopen or phone/memory tests were implemented. The size budget and absence of incremental conversion gain stop this optional experiment before those deployment costs. There is **no proposed deployment**; any later deployment requires those tests, local cached assets, tested WASM fallback, preserved full-text conversion, Unicode offsets and overlapping windows rather than silent truncation. Baseline conversion remains independent of an AI download.

[`prajjwal1/bert-tiny`](https://huggingface.co/prajjwal1/bert-tiny) is an untrained-for-this-task base encoder requiring temporal labels, annotation, downstream training, linking, held-out evaluation and export. Its roughly 4.4M parameters suggest ~17.6 MB raw FP32 or ~4.4 MB ideal all-INT8 weights, **estimates**, not a measured trained deployment. Under 20 MB model+tokenizer remains a provisional target; runtime is extra. The current result does not justify commissioning training. Revisit only after an independently held-out set demonstrates incremental conversions that inexpensive parsing changes cannot recover.

## Reproduction (optional; outside CI)

Use mise-managed Python 3.13 and an isolated virtual environment. Install public-registry versions: `gliner==0.2.29 torch==2.14.1 transformers==4.57.6 onnx==1.23.1 onnxruntime==1.30.0 onnxscript==0.7.2`. Set `HF_HOME=/tmp/chronoshift-ml-cache`, `HF_HUB_DISABLE_IMPLICIT_TOKEN=1`, `HF_HUB_DISABLE_TELEMETRY=1`. Run `infer.py`, then `prepare_browser.py`; they use strict official loaders, the pinned public revision and temporary `/tmp/chronoshift-ml-export` files. Python helpers use private GLiNER export/preprocessing methods for this version only.

Run `mise exec -- bun experiments/temporal-span/compare.ts` and `mise exec -- bun experiments/temporal-span/quantization.ts` to regenerate scored comparisons. Install `onnxruntime-web@1.30.0` in `/tmp/chronoshift-ml-browser` using Bun. Start `mise exec -- bun experiments/temporal-span/server.ts`, open the printed loopback URL in the browser side panel and press **Run compatibility test**. The server has explicit file routes and binds only 127.0.0.1. Save the visible report as browser-wasm.json; benchmark numbers may differ. No private messages, model weights or generated model-response fixtures are involved.
