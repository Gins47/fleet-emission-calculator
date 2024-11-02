const esbuild = require("esbuild");

esbuild
  .build({
    entryPoints: ["lib/resources/lambdas/src/handlers/*.ts"],
    bundle: true,
    platform: "node",
    target: "node20",
    outdir: "dist/handlers",
  })
  .catch(() => process.exit(1));
