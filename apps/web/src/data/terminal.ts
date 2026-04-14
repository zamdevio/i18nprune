import type { TerminalLine } from "../types/terminal";
import { SITE_DATA } from "./site";

export function storyGitLogSessions(): {
  id: string;
  label: string;
  command: string;
  lines: TerminalLine[];
}[] {
  const { git } = SITE_DATA;
  const lines: TerminalLine[] = [
    {
      kind: "prompt",
      text: `git log --oneline -n ${Math.min(6, git.recentCommits.length)}`,
    },
  ];
  for (const c of git.recentCommits) {
    lines.push({ kind: "out", text: `* ${c.shortHash} ${c.subject}` });
  }
  lines.push({ kind: "comment", text: "" });
  const cc = git.commitCount as number;
  lines.push({
    kind: "ok",
    text: `✔ ${cc} commit${cc === 1 ? "" : "s"} (branch: ${git.headBranch})`,
  });

  return [
    {
      id: "git-log",
      label: "git-log",
      command: "git log",
      lines,
    },
  ];
}

export function openSourceContributeSessions(): {
  id: string;
  label: string;
  command: string;
  lines: TerminalLine[];
}[] {
  const { gitHub, tests, workspace } = SITE_DATA;
  const lines: TerminalLine[] = [
    { kind: "prompt", text: `git clone ${gitHub.cloneUrlHttps}` },
    { kind: "out", text: `Cloning into '${gitHub.repo}'...` },
    { kind: "ok", text: "✔ remote: Ready. (clone your fork the same way.)" },
    { kind: "prompt", text: `cd ${gitHub.repo} && corepack enable && pnpm install` },
    {
      kind: "out",
      text: `Scope: all ${workspace.pnpmWorkspaceProjects} workspace projects`,
    },
    { kind: "ok", text: "✔ Lockfile install complete" },
  ];

  if (tests) {
    const passLabel = tests.allPassed ? "passed" : "done";
    lines.push({ kind: "prompt", text: "pnpm test" });
    lines.push({
      kind: "out",
      text: `Test Files  ${tests.testFiles} ${passLabel} (${tests.testFiles})`,
    });
    lines.push({
      kind: "out",
      text: `     Tests  ${tests.passedTests} ${tests.allPassed ? "passed" : "ran"} (${tests.totalTests})`,
    });
    if (!tests.allPassed || tests.failedTests > 0) {
      lines.push({
        kind: "out",
        text: `  Failed  ${tests.failedTests}`,
      });
    }
    lines.push({
      kind: "ok",
      text: tests.allPassed
        ? "✔ All tests passing (snapshot from site build)"
        : "⚠ Test run finished — see CI for current status",
    });
  } else {
    lines.push({
      kind: "comment",
      text: "# Tests: run `pnpm test` at repo root (data missing in this build)",
    });
  }

  return [
    {
      id: "contribute",
      label: "contribute",
      command: "git clone",
      lines,
    },
  ];
}
