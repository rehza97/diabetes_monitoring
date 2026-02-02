#!/usr/bin/env node
/**
 * Build script that runs tsc and vite build without forwarding extra CLI args.
 * Use this when the deploy platform runs "npm run build run" (e.g. Render)
 * so that "run" is not passed to Vite as the root and break the build.
 */
import { execSync } from "child_process";

execSync("npx tsc -b", { stdio: "inherit" });
execSync("npx vite build", { stdio: "inherit" });
