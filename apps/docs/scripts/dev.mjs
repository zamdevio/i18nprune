#!/usr/bin/env node
/**
 * Run `docs/` → `content/` sync in watch mode and VitePress dev together.
 * Stopping dev (SIGINT/SIGTERM) stops both processes.
 */

import { spawn } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const appRoot = resolve(__dirname, '..')
const syncScript = resolve(__dirname, 'sync.js')

const syncWatcher = spawn(process.execPath, [syncScript, '--watch'], {
  cwd: appRoot,
  stdio: ['ignore', 'inherit', 'inherit'],
  env: process.env,
})

function stopSync() {
  if (syncWatcher.pid != null && !syncWatcher.killed) {
    syncWatcher.kill('SIGTERM')
  }
}

const vitepress = spawn(
  'pnpm',
  ['exec', 'vitepress', 'dev', '.', '--host', '0.0.0.0', '--port', '8282'],
  {
    cwd: appRoot,
    stdio: 'inherit',
    env: process.env,
  },
)

vitepress.on('exit', (code, signal) => {
  stopSync()
  if (signal) process.exit(1)
  process.exit(code ?? 0)
})

syncWatcher.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`[docs:sync-watch] exited with code ${code}`)
    if (vitepress.pid != null && !vitepress.killed) vitepress.kill('SIGTERM')
    process.exit(code)
  }
})

process.on('SIGINT', () => {
  stopSync()
  vitepress.kill('SIGINT')
})

process.on('SIGTERM', () => {
  stopSync()
  vitepress.kill('SIGTERM')
})
