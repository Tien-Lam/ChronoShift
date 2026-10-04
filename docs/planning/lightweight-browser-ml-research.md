# Lightweight browser ML for ChronoShift

Research date: 3 October 2026. Recommendation based on primary model cards, papers and runtime documentation, plus the current Android implementation. The original research below predates the measured experiment. On 4 October the pretrained model was downloaded, exported and evaluated; see the decision and evidence below. No model was trained. Sizes marked as estimates remain estimates.

## Recommendation

Use **temporal span tagging plus deterministic parsing**. A compact encoder identifies date/time/timezone/city phrases and their character positions. Chrono and explicit context rules normalize them; the timezone adapter computes exact instants, DST and offsets. Preserve ambiguous interpretations. This matches the existing ML Kit span-detector interface and avoids requiring generated JSON for conversion.

**First pretrained candidate to benchmark: `knowledgator/gliner-bi-edge-v2.0`.** It supports custom entity labels and independent label embeddings, with an approximately 60M-parameter model. Fixed labels can be encoded ahead of time, creating an opportunity to deploy only the text/span path. This is an optimization proposal, not an existing verified browser package. The author's published speed figures use an H100 and cannot establish phone/browser latency. [Author's model card](https://huggingface.co/knowledgator/gliner-bi-edge-v2.0), [paper](https://arxiv.org/abs/2602.18487).

**Small-download production candidate: a fine-tuned `prajjwal1/bert-tiny` token classifier.** It is a two-layer, 128-hidden-dimension English base model under MIT. The author explicitly says it needs downstream training. It is not an already trained temporal extractor. Train DATE/TIME/TIMEZONE/CITY labels and evaluate context linking separately. [BERT-tiny model card](https://huggingface.co/prajjwal1/bert-tiny).

Benchmark the pretrained candidate first to establish whether ML actually closes deterministic parsing gaps. If it does, compare a task-trained tiny encoder against it. Keep the full-text parser active as a fallback. Do not let an uncertain or unavailable model remove a valid deterministic conversion.

## Comparison and size evidence

Sizes use decimal MB. Download size, in-memory size and full app size are different quantities.

| Candidate | Published artifact or estimate | Fit and limitation |
| --- | --- | --- |
| Task-trained BERT-tiny | About 4.4M parameters from its architecture; approximately 17.6 MB raw FP32 weights or 4.4 MB if all weights could be INT8. A practical model/tokenizer target is **under 20 MB**, subject to export measurement. Runtime is extra. | Best proposed small-download path; requires annotation, training and independent accuracy evaluation. |
| GLiNER-bi-edge-v2.0 | Upstream PyTorch weights **243 MB**. INT8 of all roughly 60M weights would have a raw lower-order budget around 60 MB; removing the label encoder may reduce that. Measured later: 239.63 MB FP32 ONNX, 60.83 MB quantized ONNX (see experiment). | Best first pretrained candidate: configurable labels, fixed-label caching. Requires export, tokenizer/span adapter and real WASM testing. |
| GLiNER small v2.1 ONNX | Published quantized ONNX graph **183 MB**, plus tokenizer/runtime. | Existing ONNX export for a useful comparison; too large for the preferred lightweight default. |
| GLiNER2.5 small | Author reports **74M parameters and ~296 MB FP32 weights**. | Can extract records and relations, potentially useful for linking several dates/times/zones. Current inspected instructions are Python; no verified browser export found. More capability and export work than the first span-only prototype needs. |
| BERT temporal tagger | Model card reports approximately **0.1B parameters** with DATE/TIME/DURATION/SET labels. | Direct temporal specialization makes it an accuracy reference/possible training teacher. No timezone label and substantially larger than tiny encoders. |
| NuExtract-tiny | A **0.5B** generative extraction model. Even ideal four-bit raw weights imply about **250 MB**, before tokenizer/runtime and unquantized overhead. | Better aligned with structured extraction than a generic LLM, but still a poor default download fit. The original NuExtract family is extractive; date normalization remains separate work. |

Evidence: [GLiNER-bi-edge files](https://huggingface.co/knowledgator/gliner-bi-edge-v2.0/tree/main), [GLiNER small ONNX files](https://huggingface.co/onnx-community/gliner_small-v2.1/tree/main/onnx), [GLiNER2.5 model details](https://huggingface.co/fastino/gliner2.5-small-v1), [temporal BERT labels and limitations](https://huggingface.co/satyaalmasian/temporal_tagger_BERT_tokenclassifier), [NuMind's original extraction-model description](https://about.nuextract.ai/blog/nuextract-a-foundation-model-for-structured-extraction).

Quantization does not imply that every parameter becomes one byte: embeddings, unsupported operations, graph constants and retained floating-point tensors affect exported size. Quantization can also reduce accuracy or fail to improve latency. Measure the exported graph and compare predictions against FP32. [ONNX quantization documentation](https://onnxruntime.ai/docs/performance/model-optimizations/quantization.html).

An independent LiteRT conversion of GLiNER-bi-edge reports a 54.1 MB INT8 text path at sequence length 256. That supports investigating a compact split graph, but it is **Android LiteRT evidence, not an ONNX/WebAssembly size, browser benchmark or accuracy guarantee**. [Converter's artifact table](https://huggingface.co/ckg/gliner-bi-edge-v20-litert).

## What the model should do

Example input: `January 11 at 4:30 a.m. PT / 7:30 a.m. ET / 19:30 CST`.

The learned detector should suggest spans for the date, each clock time and each timezone expression. Context assembly must keep the shared date and the relevant zone attached to each clock time. Normalization resolves the year/reference-date rules and explicit offset versus IANA-zone semantics. CST remains multiple valid interpretations unless the product contract supports an explicit user choice.

For `Shanghai office review at 10am CST`, a city span may provide useful context, but a model's preferred geographic interpretation must not silently erase the existing ambiguity policy.

The span model does not replace:
- Reference clock/date handling, date inheritance and relative-date normalization.
- Range endpoints, ordering and event-to-zone association.
- IANA timezone data, DST folds/gaps, fixed offsets and exact arithmetic.
- Unknown-city correction, Unix-seconds detection and duplicate/ambiguity rules.

Research supports separating learned detection from normalization: temporal token classifiers already label DATE/TIME spans; modular temporal extraction research combines deep detection with grammar-based normalization. Our choice to retain Chrono is a project-specific inference. [Temporal BERT model](https://huggingface.co/satyaalmasian/temporal_tagger_BERT_tokenclassifier), [modular temporal extraction paper](https://arxiv.org/abs/2304.14221).

## Browser deployment

Prefer **ONNX Runtime Web with WebAssembly in a Web Worker** as the compatibility baseline. WebGPU is an optional acceleration path only after the actual model/operator export is tested. ONNX Runtime documents local browser inference and a wider operator path for WASM than its GPU execution providers. Framework support alone does not prove a specific export works. [ONNX Runtime Web](https://onnxruntime.ai/docs/tutorials/web/).

Transformers.js supports token classification, quantized variants and custom local model paths, so it can simplify a conventional BERT-tiny adapter. GLiNER-bi-edge's span/label architecture may need a direct ONNX Runtime adapter; do not assume the generic NER pipeline supports it unchanged. [Transformers.js tasks](https://huggingface.co/docs/transformers.js/main/en/index), [custom models/local assets](https://huggingface.co/docs/transformers.js/custom_usage).

Self-host/cache the model, tokenizer, WASM binaries and worker assets; disable remote model loading. Verify an offline reopen with all networking blocked. Track total bytes, load time and peak memory, including the runtime. A tiny weight file does not make the runtime free.

Use overlapping token windows for long pasted messages; do not silently truncate the 10,000-character input limit. Preserve offsets through tokenization, including Unicode and JavaScript UTF-16 indexing. Sentence/paragraph windows must preserve date and timezone context across boundaries. Cancellation and stale-request protection must cover both parsing and model inference.

## Proposed evaluation

1. Establish the real Chrono-only baseline using F3 fixtures. The existing AI fixtures are hand-written model responses; they prove parsing behavior, not actual model accuracy.
2. Annotate representative meeting announcements, emails, ranges, relative dates, multi-zone text and city mentions. Add hard negatives: version numbers, prices, IDs, ordinary words resembling abbreviations, logs and ambiguous numeric dates.
3. Hold out complete messages, sources and generation templates. Do not train and test on permutations of the same pattern. Use licensed/owned public or synthetic text with review; do not upload private pasted messages for training.
4. Benchmark GLiNER-bi-edge with labels such as date, time, timezone abbreviation, UTC offset and city. Calibrate thresholds on validation data; record failures and export feasibility.
5. Train/evaluate BERT-tiny only if the pretrained hybrid improves the actual conversion baseline. Start with a few thousand reviewed examples as a planning experiment, not an asserted sufficient dataset.
6. Compare exact end-to-end conversion precision/recall, wrong-instant rate, retained ambiguity count, source spans/order and range endpoints. Span F1 alone is insufficient.
7. Compare FP32 vs INT8, cold load vs warm inference, short input vs max-length windows, Android Chrome vs iOS Safari and WASM single-thread fallback. Report actual model+tokenizer+runtime bytes and peak memory.
8. Ship only if the hybrid measurably improves recall with no launch-fixture correctness regression, remains usable offline, and meets agreed phone latency/memory/download budgets. Otherwise keep the deterministic baseline.

Provisional targets for the tiny trained candidate: model+tokenizer under 20 MB; warm ML pass p95 under 1 second for a typical 2,000-character message on the named representative phone. These are acceptance targets, **not measured results**. Deterministic results should remain immediately available while optional enhancement runs.

## Roadmap impact

Refine F11 from generic browser LLM discovery to a lightweight temporal-span benchmark. Allow it after F2/F3 so it can inform the ML Kit replacement while the main engine is being ported. Keep it outside the launch critical path until measured results justify making ML a required feature. Keep ML feasibility separate from promising a trained production model.

The subsequent user instruction authorized Linear publication and execution. This research informs [TIE-302](https://linear.app/tienlam/issue/TIE-302), the optional temporal-span benchmark; deterministic launch work proceeds independently.

## Measured feasibility decision — 4 October 2026

**Defer bundling ML and defer BERT-tiny training.** [The isolated experiment](../../experiments/temporal-span/README.md) records actual pinned GLiNER inference, FP32/quantized exports, native ONNX decoding, browser single-thread WASM tensor compatibility, artifact hashes and an independently frozen 20-message comparison. The 60.83 MB quantized graph alone exceeds the provisional 20 MB model/tokenizer target. On this small synthetic sample, ML gated normalization adds no conversions over the same cheap parsing-rule control; quantization changes detections on 9/20 messages and reduces span F1. This bounded result does not establish population accuracy.

WASM compatibility passed on three pretokenized inputs in the actual browser side panel; a JS tokenizer/span adapter, caching, long-message windows and phone/memory evidence remain unimplemented. There is no proposed production ML deployment. The deterministic launch remains local/offline and requires no model download; optional feasibility work stays outside CI and all launch gates.
