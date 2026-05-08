export function detectMissingLoaderExports(loaderText: string, expected: readonly string[]): string[] {
  return expected.filter((name) => {
    const fn = new RegExp(`export\\s+function\\s+${name}\\s*\\(`);
    const cst = new RegExp(`export\\s+const\\s+${name}\\s*=`);
    const reExportNamed = new RegExp(`export\\s*\\{[^}]*\\b${name}\\b[^}]*\\}\\s*from\\s*['"][^'"]+['"]`, 'm');
    const reExportDirect = new RegExp(`export\\s*\\{[^}]*\\b${name}\\b[^}]*\\}\\s*;`, 'm');
    return !fn.test(loaderText) && !cst.test(loaderText) && !reExportNamed.test(loaderText) && !reExportDirect.test(loaderText);
  });
}
