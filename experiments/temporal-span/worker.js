import * as ort from "/ort/ort.wasm.min.mjs";
onmessage = async () => {
  const report = {
    runtime: "onnxruntime-web 1.30.0",
    executionProvider: "wasm",
    numThreads: 1,
    method:
      "Local module worker; pretokenized numeric tensors compared with native INT8 ONNX logits. No JS tokenizer/span adapter or phone claim.",
    cases: [],
  };
  try {
    ort.env.wasm.numThreads = 1;
    ort.env.wasm.wasmPaths = "/ort/";
    ort.env.wasm.proxy = false;
    const fixtures = await (await fetch("/browser-inputs.json")).json();
    report.holdoutSha256 = fixtures.holdoutSha256;
    let start = performance.now();
    const session = await ort.InferenceSession.create("/model_quantized.onnx", {
      executionProviders: ["wasm"],
    });
    report.sessionLoadMs = performance.now() - start;
    for (const fixture of fixtures.cases) {
      const feeds = {};
      for (const [name, value] of Object.entries(fixture.feeds)) {
        const data =
          value.type === "int64"
            ? BigInt64Array.from(value.data, BigInt)
            : value.type === "bool"
              ? Uint8Array.from(value.data, Number)
              : Float32Array.from(value.data);
        feeds[name] = new ort.Tensor(value.type, data, value.dims);
      }
      start = performance.now();
      const output = await session.run(feeds);
      const logits = output[session.outputNames[0]];
      const shapeMatches =
        JSON.stringify(logits.dims) === JSON.stringify(fixture.expected.dims);
      let maxAbsDelta = 0;
      for (let i = 0; i < logits.data.length; i++)
        maxAbsDelta = Math.max(
          maxAbsDelta,
          Math.abs(logits.data[i] - fixture.expected.data[i]),
        );
      const finite = Number.isFinite(maxAbsDelta);
      report.cases.push({
        name: fixture.name,
        dims: logits.dims,
        inferenceMs: performance.now() - start,
        shapeMatches,
        maxAbsDelta,
        passed: shapeMatches && finite && maxAbsDelta <= 0.01,
      });
    }
    report.status = report.cases.every((c) => c.passed)
      ? "passed"
      : "output-mismatch";
    await session.release();
  } catch (error) {
    report.status = "failed";
    report.error = String(error);
    report.stack = error.stack;
  }
  postMessage(report);
};
