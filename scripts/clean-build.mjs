import fs from "node:fs";
import path from "node:path";

for (const target of ["dist", "lib", "tsconfig.tsbuildinfo", "lib.tsconfig.tsbuildinfo"]) {
  fs.rmSync(path.resolve(process.cwd(), target), {
    force: true,
    recursive: true,
  });
}
