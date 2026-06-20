function platformAsset() {
  const platforms = {
    linux: "linux",
    darwin: "darwin",
    win32: "windows",
  };
  const archs = {
    x64: "amd64",
    arm64: "arm64",
    riscv64: "riscv64",
    loong64: "loong64",
  };

  const os = platforms[process.platform];
  const arch = archs[process.arch];
  if (!os || !arch) {
    throw new Error(`unsupported platform: ${process.platform}_${process.arch}`);
  }

  if (os === "darwin" && arch !== "arm64") {
    throw new Error("unsupported platform: darwin_amd64. Release builds currently include darwin_arm64 only.");
  }

  if (os === "windows" && arch !== "amd64" && arch !== "arm64") {
    throw new Error(`unsupported platform: windows_${arch}`);
  }

  const extension = os === "windows" ? ".exe" : "";
  return {
    name: `gorse-cli_${os}_${arch}${extension}`,
    binary: `gorse-cli${extension}`,
  };
}

module.exports = { platformAsset };
