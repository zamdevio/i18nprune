/**
 * Environment snapshot captured by the host at report-generation time.
 *
 * Core never probes `process.*` or `os.*` directly — the CLI (or any host)
 * fills this and passes it via {@link ReportHostHooks}.
 *
 * @remarks Fields mirror `ProjectReportEnvironment` from `@i18nprune/report`
 * so the document shape stays consistent without a hard type dependency.
 */
export type ReportEnvironmentSnapshot = {
  /** Node.js `process.platform` (e.g. `'linux'`, `'darwin'`, `'win32'`). */
  platform: string;
  /** Node.js `process.arch` (e.g. `'x64'`, `'arm64'`). */
  arch: string;
  /** Node.js version string (e.g. `'v20.12.0'`). */
  nodeVersion: string;
  /** OS kernel release string from `os.release()`. */
  osRelease: string;
  /** Linux distribution name from `/etc/os-release`, if available. */
  distro?: string;
  /** WSL distribution name from `WSL_DISTRO_NAME` env var, if running under WSL. */
  wslDistroName?: string;
  /**
   * Runtime/filesystem compatibility family.
   * `edge-worker` is a synthetic hosted runtime (no local filesystem assumptions).
   */
  runtimeFamily: 'windows' | 'darwin' | 'linux' | 'linux-wsl' | 'edge-worker';
};
