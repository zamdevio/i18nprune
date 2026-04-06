#!/usr/bin/env node

import { watch, readdirSync, statSync, copyFileSync, mkdirSync, rmSync, existsSync } from 'fs'
import { join, relative, resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execSync, spawn } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const NEXTRA_DIR = resolve(__dirname, '..')
const REPO_ROOT = resolve(__dirname, '../..')
/** Repo `docs/` — works whether cwd is repo root or `nextra/`. */
const SOURCE_DIR = resolve(REPO_ROOT, 'docs')
const TARGET_DIR = resolve(NEXTRA_DIR, 'content')
const GIT_SYNC_SCRIPT = resolve(__dirname, 'git-sync.sh')
const PORT = process.env.PORT || '8181'

/** Top-level names under `docs/` that are not copied to the Nextra site (dev-only; e.g. gitignored planning). */
const DOCS_SYNC_SKIP = new Set(['phases'])

function ensureDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

function copyRecursive(source, target) {
  const stats = statSync(source)
  
  if (stats.isDirectory()) {
    ensureDir(target)
    const entries = readdirSync(source)
    for (const entry of entries) {
      copyRecursive(join(source, entry), join(target, entry))
    }
  } else {
    ensureDir(dirname(target))
    copyFileSync(source, target)
  }
}

function syncDirectory(source, target) {
  try {
    if (existsSync(target)) {
      rmSync(target, { recursive: true, force: true })
    }
    ensureDir(target)
    
    const entries = readdirSync(source)
    for (const entry of entries) {
      if (source === SOURCE_DIR && DOCS_SYNC_SKIP.has(entry)) continue
      copyRecursive(join(source, entry), join(target, entry))
    }
    
    console.log(`✓ Synced: ${relative(REPO_ROOT, source)} → ${relative(REPO_ROOT, target)}`)
  } catch (error) {
    console.error(`✗ Error syncing ${source}:`, error.message)
  }
}

function runGitSync() {
  try {
    if (existsSync(GIT_SYNC_SCRIPT)) {
      execSync(`bash "${GIT_SYNC_SCRIPT}"`, { stdio: 'inherit', cwd: NEXTRA_DIR })
    }
  } catch (error) {
    console.error('⚠️  Git sync failed (this is okay if not in a git repo):', error.message)
  }
}

function initialSync() {
  console.log('🔄 Performing initial sync...')
  if (!existsSync(SOURCE_DIR)) {
    console.error(`✗ Source directory does not exist: ${SOURCE_DIR}`)
    process.exit(1)
  }
  
  syncDirectory(SOURCE_DIR, TARGET_DIR)
  console.log('✅ Initial sync complete!')
  
  if (!process.argv.includes('--no-git')) {
    console.log('\n📝 Syncing git changes...')
    runGitSync()
  }
  console.log('')
}

let gitSyncTimeout = null

function debounceGitSync() {
  if (gitSyncTimeout) {
    clearTimeout(gitSyncTimeout)
  }
  
  gitSyncTimeout = setTimeout(() => {
    if (!process.argv.includes('--no-git')) {
      console.log('\n📝 Syncing git changes...')
      runGitSync()
      console.log('')
    }
  }, 2000)
}

function watchForChanges() {
  console.log('👀 Watching for changes in', SOURCE_DIR)
  console.log('   Syncing to', TARGET_DIR)
  console.log('   Press Ctrl+C to stop\n')

  watch(SOURCE_DIR, { recursive: true }, (eventType, filename) => {
    if (!filename) return
    
    const sourcePath = join(SOURCE_DIR, filename)
    const targetPath = join(TARGET_DIR, filename)
    
    try {
      if (!existsSync(sourcePath)) {
        if (existsSync(targetPath)) {
          rmSync(targetPath, { recursive: true, force: true })
          console.log(`✓ Removed: ${relative(REPO_ROOT, targetPath)}`)
          debounceGitSync()
        }
        return
      }
      
      const stats = statSync(sourcePath)
      if (stats.isDirectory()) {
        syncDirectory(sourcePath, targetPath)
        debounceGitSync()
      } else {
        ensureDir(dirname(targetPath))
        copyFileSync(sourcePath, targetPath)
        console.log(`✓ Synced: ${relative(REPO_ROOT, sourcePath)}`)
        debounceGitSync()
      }
    } catch (error) {
      console.error(`✗ Error processing ${filename}:`, error.message)
    }
  })
}

function startNextDev() {
  console.log(`\n🚀 Starting Next.js dev server on port ${PORT}...`)
  console.log(`   Visit http://localhost:${PORT} when ready\n`)
  
  const nextDev = spawn('npx', ['next', 'dev', '-p', PORT], {
    stdio: 'inherit',
    shell: true,
    cwd: NEXTRA_DIR,
  })
  
  nextDev.on('error', (error) => {
    console.error('✗ Failed to start Next.js dev server:', error.message)
    process.exit(1)
  })
  
  nextDev.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`\n✗ Next.js dev server exited with code ${code}`)
      process.exit(code)
    }
  })
  
  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down...')
    nextDev.kill('SIGINT')
    process.exit(0)
  })
  
  process.on('SIGTERM', () => {
    nextDev.kill('SIGTERM')
    process.exit(0)
  })
  
  return nextDev
}

if (process.argv.includes('--once')) {
  initialSync()
} else {
  // Watch mode: sync first, then watch and optionally start dev server
  initialSync()
  watchForChanges()
  
  // If --dev flag is present, start Next.js dev server
  if (process.argv.includes('--dev')) {
    startNextDev()
  }
}
