import ts from 'typescript';

import type { TsExportKind } from './types.js';

export interface ParsedFlatExport {
  name: string;
  tsKind: TsExportKind;
  exportKind: 'flat';
  sourceSpecifier: string | null;
}

export interface ParsedNamespaceExport {
  name: string;
  exportKind: 'namespace';
  sourceSpecifier: string | null;
}

export type ParsedExport = ParsedFlatExport | ParsedNamespaceExport;

export function parseBarrelExports(source: string, fileName: string): ParsedExport[] {
  const sf = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const exports: ParsedExport[] = [];

  for (const stmt of sf.statements) {
    if (!ts.isExportDeclaration(stmt)) continue;
    const sourceSpecifier =
      stmt.moduleSpecifier && ts.isStringLiteral(stmt.moduleSpecifier)
        ? stmt.moduleSpecifier.text
        : null;
    const clause = stmt.exportClause;
    if (!clause) continue;

    if (ts.isNamespaceExport(clause)) {
      exports.push({
        name: clause.name.text,
        exportKind: 'namespace',
        sourceSpecifier,
      });
      continue;
    }

    if (!ts.isNamedExports(clause)) continue;

    for (const el of clause.elements) {
      const exportName = (el.name ?? el.propertyName)?.text;
      if (!exportName) continue;
      const isTypeOnly = el.isTypeOnly || stmt.isTypeOnly;
      exports.push({
        name: exportName,
        tsKind: isTypeOnly ? 'type' : 'value',
        exportKind: 'flat',
        sourceSpecifier,
      });
    }
  }

  return exports;
}
