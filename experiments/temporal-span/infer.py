"""Isolated feasibility experiment; never imported by ChronoShift or routine CI."""
import hashlib
import importlib.metadata
import json
import os
from pathlib import Path
import platform
import sys
import time
import traceback

os.environ.setdefault("HF_HOME", "/tmp/chronoshift-ml-cache")
os.environ.setdefault("HF_HUB_DISABLE_IMPLICIT_TOKEN", "1")
os.environ.setdefault("HF_HUB_DISABLE_TELEMETRY", "1")
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")

import requests
import torch
from gliner import GLiNER

ROOT = Path(__file__).resolve().parent
holdout_bytes = (ROOT / "holdout.json").read_bytes()
holdout = json.loads(holdout_bytes)
labels = holdout["labels"]
MODEL = "knowledgator/gliner-bi-edge-v2.0"
REVISION = "3a401e4902d93df04971c795fb1f42f37801aced"
report_path = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "inference.json"
export_dir = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("/tmp/chronoshift-ml-export")
export_dir.mkdir(parents=True, exist_ok=True)
torch.set_num_threads(2)
torch.manual_seed(0)

report = {
    "measuredAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    "holdoutSha256": hashlib.sha256(holdout_bytes).hexdigest(),
    "environment": f"{platform.system()}/{platform.machine()}, Python {platform.python_version()}",
    "packages": {name: importlib.metadata.version(name) for name in ["gliner", "torch", "transformers", "onnx", "onnxruntime", "onnxscript"]},
    "method": "20 evaluation-only owned synthetic messages frozen and independently reviewed before inference; no training/dev split, threshold tuning or claim of representative/unseen-pretraining accuracy. Atomic explicit clock/date/timezone/city spans scored as sets. Spoken-clock desired extensions scored separately from supported launch cases. Native CPU FP32 inference is not browser/WASM or phone evidence.",
    "labels": labels,
    "threshold": holdout["threshold"],
    "predictions": [],
    "exports": [],
    "browserInference": "Not exercised: only a verified compatible graph could be tested in WASM.",
}

def save():
    report_path.write_text(json.dumps(report, indent=2) + "\n")

try:
    metadata_response = requests.get(f"https://huggingface.co/api/models/{MODEL}/revision/{REVISION}", params={"blobs": "true"}, timeout=60)
    metadata_response.raise_for_status()
    metadata = metadata_response.json()
    report["model"] = {"id": MODEL, "revision": metadata["sha"], "publishedFiles": [
        {"name": f["rfilename"], "size": f.get("size"), "lfs": f.get("lfs")} for f in metadata.get("siblings", [])
    ]}
    save()
    print(f"Loading {MODEL}@{metadata['sha']}", flush=True)
    start = time.perf_counter()
    model = GLiNER.from_pretrained(MODEL, revision=metadata["sha"], token=False, strict=True, map_location="cpu", _attn_implementation="eager")
    model.eval()
    report["nativeModelLoadMs"] = (time.perf_counter() - start) * 1000
    report["modelClass"] = type(model).__name__
    report["parameters"] = sum(p.numel() for p in model.parameters())
    for case in holdout["cases"]:
        start = time.perf_counter()
        with torch.inference_mode():
            entities = model.predict_entities(case["text"], labels, threshold=holdout["threshold"])
        # GLiNER Python offsets are Unicode code-point offsets. Persist JS UTF-16
        # positions explicitly, rather than assuming they match for emoji.
        for entity in entities:
            raw_start, raw_end = entity["start"], entity["end"]
            if case["text"][raw_start:raw_end] != entity["text"]:
                raise ValueError(f"Invalid model span in {case['name']}")
            entity["pythonStart"], entity["pythonEnd"] = raw_start, raw_end
            entity["start"] = len(case["text"][:raw_start].encode("utf-16-le")) // 2
            entity["end"] = len(case["text"][:raw_end].encode("utf-16-le")) // 2
        report["predictions"].append({"name": case["name"], "family": case["family"], "nativeInferenceMs": (time.perf_counter()-start)*1000, "entities": entities})
        save()
        print(f"Inferred: {case['name']} ({len(entities)} spans)", flush=True)
    for mode, precomputed in [("fixed-label", True), ("full-label-encoder", False)]:
        target = export_dir / mode
        target.mkdir(parents=True, exist_ok=True)
        attempt = {"mode": mode, "fromLabelsEmbeddings": precomputed}
        start = time.perf_counter()
        try:
            export_kwargs = {"from_labels_embeddings": True} if precomputed else {}
            output = model.export_to_onnx(save_dir=str(target), labels=labels, quantize=True, **export_kwargs)
            attempt["output"] = output
            attempt["files"] = [{"name": p.name, "bytes": p.stat().st_size, "sha256": hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(target.iterdir()) if p.is_file()]
            attempt["status"] = "exported-not-browser-validated"
        except Exception as error:
            attempt["status"] = "failed"
            attempt["error"] = f"{type(error).__name__}: {error}"
            attempt["traceback"] = traceback.format_exc()
        attempt["elapsedMs"] = (time.perf_counter()-start)*1000
        report["exports"].append(attempt)
        save()
        print(f"Export {mode}: {attempt['status']}", flush=True)
except Exception as error:
    report["failure"] = {"error": f"{type(error).__name__}: {error}", "traceback": traceback.format_exc()}
finally:
    cached_files = []
    cache = Path(os.environ["HF_HOME"]) / "hub"
    if cache.exists():
        for p in sorted(cache.glob("models--*/snapshots/*/*")):
            if p.is_file():
                cached_files.append({"snapshotPath": str(p.relative_to(cache)), "bytes": p.stat().st_size, "sha256": hashlib.sha256(p.read_bytes()).hexdigest()})
    report["downloadedArtifacts"] = cached_files
    save()
    print(f"Report: {report_path}", flush=True)
