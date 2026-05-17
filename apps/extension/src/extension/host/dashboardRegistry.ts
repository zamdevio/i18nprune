import type * as vscode from 'vscode';

const dashboards = new Set<vscode.Webview>();

export function registerDashboardWebview(webview: vscode.Webview): vscode.Disposable {
  dashboards.add(webview);
  return {
    dispose: () => {
      dashboards.delete(webview);
    },
  };
}

/** Broadcast progress/results to every mounted dashboard (panel + editor tab). */
export function postToAllDashboards(message: unknown): void {
  for (const w of dashboards) {
    void w.postMessage(message);
  }
}
