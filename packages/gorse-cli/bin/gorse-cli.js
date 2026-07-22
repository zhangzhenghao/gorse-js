#!/usr/bin/env node

const { spawn } = require("node:child_process");
const path = require("node:path");
const { platformAsset } = require("../scripts/platform");

const binaryPath = path.join(__dirname, "..", "vendor", platformAsset().name);
const child = spawn(binaryPath, process.argv.slice(2), { stdio: "inherit" });

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});

function forwardSignal(signal) {
  if (child.killed) {
    return;
  }
  try {
    child.kill(signal);
  } catch {
    // Ignore failures while the child is already shutting down.
  }
}

const signalHandlers = new Map();
["SIGINT", "SIGTERM", "SIGHUP"].forEach((signal) => {
  const handler = () => forwardSignal(signal);
  signalHandlers.set(signal, handler);
  process.on(signal, handler);
});

child.on("exit", (code, signal) => {
  if (signal) {
    signalHandlers.forEach((handler, forwardedSignal) => {
      process.removeListener(forwardedSignal, handler);
    });
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 1);
  }
});
