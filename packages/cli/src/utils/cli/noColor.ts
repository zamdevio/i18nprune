/** True when `--no-color` is set or `NO_COLOR` is present ([no-color.org](https://no-color.org/)). */
export function resolveNoColor(cliFlag: boolean, env: NodeJS.ProcessEnv = process.env): boolean {
  if (cliFlag) return true;
  return Object.prototype.hasOwnProperty.call(env, 'NO_COLOR');
}
