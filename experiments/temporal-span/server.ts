// Isolated loopback harness; weights/runtime stay outside the repository.
const root = import.meta.dir;
const runtime = "/tmp/chronoshift-ml-browser/node_modules/onnxruntime-web/dist";
const routes = new Map([
  ["/", `${root}/browser.html`],
  ["/worker.js", `${root}/worker.js`],
  ["/browser-inputs.json", `${root}/browser-inputs.json`],
  [
    "/model_quantized.onnx",
    "/tmp/chronoshift-ml-export/full-label-encoder/model_quantized.onnx",
  ],
  ...[
    "ort.wasm.min.mjs",
    "ort-wasm-simd-threaded.mjs",
    "ort-wasm-simd-threaded.wasm",
  ].map((name) => [`/ort/${name}`, `${runtime}/${name}`]),
]);
const server = Bun.serve({
  hostname: "127.0.0.1",
  port: 0,
  fetch(request) {
    const path = routes.get(new URL(request.url).pathname);
    return path
      ? new Response(Bun.file(path))
      : new Response("Not found", { status: 404 });
  },
});
console.log(`ML harness: ${server.url}`);
