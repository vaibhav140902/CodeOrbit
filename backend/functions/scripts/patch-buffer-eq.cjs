const fs = require("fs");
const path = require("path");

const targetFile = path.join(
  __dirname,
  "..",
  "node_modules",
  "buffer-equal-constant-time",
  "index.js"
);

if (!fs.existsSync(targetFile)) {
  process.exit(0);
}

const source = fs.readFileSync(targetFile, "utf8");
if (source.includes("__SLOW_BUFFER_SAFE_PATCH__")) {
  process.exit(0);
}

let patched = source;
patched = patched.replace(
  "  Buffer.prototype.equal = SlowBuffer.prototype.equal = function equal(that) {\n    return bufferEq(this, that);\n  };",
  [
    "  /* __SLOW_BUFFER_SAFE_PATCH__ */",
    "  var equal = function equal(that) {",
    "    return bufferEq(this, that);",
    "  };",
    "  Buffer.prototype.equal = equal;",
    "  if (SlowBuffer && SlowBuffer.prototype) {",
    "    SlowBuffer.prototype.equal = equal;",
    "  }",
  ].join("\n")
);

patched = patched.replace(
  "var origSlowBufEqual = SlowBuffer.prototype.equal;",
  "var origSlowBufEqual = (SlowBuffer && SlowBuffer.prototype) ? SlowBuffer.prototype.equal : undefined;"
);

patched = patched.replace(
  "  SlowBuffer.prototype.equal = origSlowBufEqual;",
  [
    "  if (SlowBuffer && SlowBuffer.prototype) {",
    "    SlowBuffer.prototype.equal = origSlowBufEqual;",
    "  }",
  ].join("\n")
);

if (patched !== source) {
  fs.writeFileSync(targetFile, patched);
  // eslint-disable-next-line no-console
  console.log("Applied compatibility patch to buffer-equal-constant-time.");
}

