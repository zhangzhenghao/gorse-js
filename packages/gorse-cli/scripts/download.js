#!/usr/bin/env node

const fs = require("node:fs");
const https = require("node:https");
const path = require("node:path");
const { platformAsset } = require("./platform");

const repo = process.env.GORSE_REPO || "gorse-io/gorse";
const version = process.env.GORSE_CLI_VERSION || `v${process.env.npm_package_version}`;

function download(url, destination, redirects = 0) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
          if (redirects >= 5) {
            reject(new Error(`too many redirects while downloading ${url}`));
            return;
          }
          response.resume();
          download(response.headers.location, destination, redirects + 1).then(resolve, reject);
          return;
        }

        if (response.statusCode !== 200) {
          response.resume();
          reject(new Error(`download failed: ${response.statusCode} ${response.statusMessage}`));
          return;
        }

        const file = fs.createWriteStream(destination, { mode: 0o755 });
        response.pipe(file);
        file.on("finish", () => file.close(resolve));
        file.on("error", reject);
      })
      .on("error", reject);
  });
}

async function main() {
  const asset = platformAsset();
  const url = `https://github.com/${repo}/releases/download/${version}/${asset.name}`;
  const vendorDir = path.join(__dirname, "..", "vendor");
  const destination = path.join(vendorDir, asset.binary);

  fs.mkdirSync(vendorDir, { recursive: true });
  console.log(`Downloading ${asset.name} from ${repo} ${version}...`);
  await download(url, destination);
  fs.chmodSync(destination, 0o755);
}

main().catch((error) => {
  console.error(`gorse-cli postinstall failed: ${error.message}`);
  process.exit(1);
});
