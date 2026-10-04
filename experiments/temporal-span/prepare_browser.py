"""Prepare explicit public numeric feeds and compare native ONNX outputs."""
import hashlib
import json
import os
from pathlib import Path
import traceback
os.environ.setdefault("HF_HOME", "/tmp/chronoshift-ml-cache")
os.environ.setdefault("HF_HUB_DISABLE_IMPLICIT_TOKEN", "1")
os.environ.setdefault("HF_HUB_DISABLE_TELEMETRY", "1")
import torch
from gliner import GLiNER
import onnxruntime as ort

root=Path(__file__).resolve().parent
holdout=json.loads((root/"holdout.json").read_text())
inference=json.loads((root/"inference.json").read_text())
torch.set_num_threads(2)
model=GLiNER.from_pretrained(inference["model"]["id"],revision=inference["model"]["revision"],strict=True,token=False,local_files_only=True,map_location="cpu",_attn_implementation="eager")
model.eval()
export=Path("/tmp/chronoshift-ml-export/full-label-encoder")
options=ort.SessionOptions()
options.intra_op_num_threads=2
options.inter_op_num_threads=1
report={"holdoutSha256":inference["holdoutSha256"],"method":"Native CPU ONNX execution with real GLiNER preprocessing; exact entity-set comparison to native FP32 and frozen gold. Browser inputs are pretokenized numeric tensors, not a completed JS tokenizer/span adapter.","variants":[]}
browser={"holdoutSha256":inference["holdoutSha256"],"cases":[]}
for filename in ["model.onnx","model_quantized.onnx"]:
    row={"file":filename}
    try:
        session=ort.InferenceSession(str(export/filename),sess_options=options,providers=["CPUExecutionProvider"])
        row["inputs"]=[{"name":i.name,"type":i.type,"shape":i.shape} for i in session.get_inputs()]
        runtime=GLiNER.from_pretrained(str(export),runtime="onnxruntime",runtime_model_file=filename,local_files_only=True,token=False,runtime_options={"session_options":options,"providers":["CPUExecutionProvider"]})
        row["predictions"]=[]
        for case in holdout["cases"]:
            batch=model._build_dummy_batch(labels=holdout["labels"],text=case["text"])
            feeds={i.name:batch[i.name].cpu().numpy() for i in session.get_inputs()}
            result=session.run(None,feeds)
            entities=runtime.predict_entities(case["text"],holdout["labels"],threshold=holdout["threshold"])
            row["predictions"].append({"name":case["name"],"entities":entities})
            if filename=="model_quantized.onnx" and case["name"] in ["explicit UTC invitation","cross-zone range","spoken explicit PM clock"]:
                browser["cases"].append({"name":case["name"],"text":case["text"],
                    "feeds":{name:{"type":str(array.dtype),"dims":list(array.shape),"data":array.reshape(-1).tolist()} for name,array in feeds.items()},
                    "expected":{"dims":list(result[0].shape),"data":result[0].reshape(-1).tolist()}})
        row["status"]="executed"
    except Exception as error:
        row["status"]="failed"
        row["error"]=f"{type(error).__name__}: {error}"
        row["traceback"]=traceback.format_exc()
    report["variants"].append(row)
    (root/"native-onnx.json").write_text(json.dumps(report,indent=2)+"\n")
    print(filename,row["status"],row.get("error",""),flush=True)
(root/"browser-inputs.json").write_text(json.dumps(browser,indent=2)+"\n")
