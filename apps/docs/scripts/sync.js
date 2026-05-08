#!/usr/bin/env node

import { watch, readdirSync, statSync, copyFileSync, mkdirSync, rmSync, existsSync, readFileSync, writeFileSync } from 'fs'
import { join, relative, resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DOCS2_DIR = resolve(__dirname, '..')
const REPO_ROOT = resolve(__dirname, '../../..')
const SOURCE_DIR = resolve(REPO_ROOT, 'docs')
const TARGET_DIR = resolve(DOCS2_DIR, 'content')
/** `@see` — optional skip set for top-level `docs/` children; maintainer docs live outside `docs/`. */
const DOCS_SYNC_SKIP = new Set([])

function toVitePressTarget(target) {
  if (target.endsWith('/README.md')) return `${target.slice(0, -'README.md'.length)}index.md`
  if (target.endsWith('/README')) return `${target.slice(0, -'README'.length)}index.md`
  return target
}

function normalizeReadmeTarget(target) {
  if (/^[a-z]+:\/\//i.test(target) || target.startsWith('mailto:')) return target
  if (target.startsWith('#') || target.startsWith('?')) return target
  const [pathOnly, suffix = ''] = target.split(/([?#].*)/, 2)
  const noReadme = pathOnly.replace(/\/README(?:\.md)?\/?$/i, '')
  const noTrailingSlash = noReadme.replace(/\/+$/g, '')
  const normalizedPath = noTrailingSlash === '' ? '/' : noTrailingSlash
  return `${normalizedPath}${suffix}`
}

function sanitizeMarkdownForVitePress(raw) {
  const rewriteInlineLinks = (input) =>
    input.replace(/\]\(([^)\s]+)([^)]*)\)/g, (_m, target, tail) => `](${normalizeReadmeTarget(target)}${tail})`)
  const rewriteReferenceLinks = (input) =>
    input.replace(/^(\[[^\]]+\]:\s+)(\S+)(.*)$/gm, (_m, prefix, target, tail) => `${prefix}${normalizeReadmeTarget(target)}${tail}`)

  // Nextra docs sometimes use literal `{{ ... }}` notation in prose.
  const escapedMustache = raw.replace(/\{\{([\s\S]*?)\}\}/g, (_m, inner) => `&#123;&#123;${inner}&#125;&#125;`)
  // Escape `${...}` so Vue template compilation doesn't treat it as expressions.
  const escapedInterpolations = escapedMustache.replace(/\$\{/g, '&#36;{')
  return rewriteReferenceLinks(rewriteInlineLinks(escapedInterpolations))
}

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

function copyRecursive(source, target) {
  const stats = statSync(source)
  if (stats.isDirectory()) {
    ensureDir(target)
    const entries = readdirSync(source)
    for (const entry of entries) copyRecursive(join(source, entry), join(target, entry))
    return
  }

  const vitepressTarget = toVitePressTarget(target)
  ensureDir(dirname(vitepressTarget))
  if (source.endsWith('.md')) {
    const raw = readFileSync(source, 'utf8')
    writeFileSync(vitepressTarget, sanitizeMarkdownForVitePress(raw), 'utf8')
  } else {
    copyFileSync(source, vitepressTarget)
  }
}

function syncDirectory(source, target) {
  if (existsSync(target)) rmSync(target, { recursive: true, force: true })
  ensureDir(target)
  const entries = readdirSync(source)
  for (const entry of entries) {
    if (source === SOURCE_DIR && DOCS_SYNC_SKIP.has(entry)) continue
    copyRecursive(join(source, entry), join(target, entry))
  }
  console.log(`✓ Synced: ${relative(REPO_ROOT, source)} → ${relative(REPO_ROOT, target)}`)
}

export function runSyncOnce() {
  console.log('🔄 Performing sync...')
  if (!existsSync(SOURCE_DIR)) {
    console.error(`✗ Source directory does not exist: ${SOURCE_DIR}`)
    process.exit(1)
  }
  syncDirectory(SOURCE_DIR, TARGET_DIR)
  console.log('✅ Sync complete!')
}

export function runSyncWatch() {
  runSyncOnce()
  console.log('👀 Watching for changes in', SOURCE_DIR)
  watch(SOURCE_DIR, { recursive: true }, (_eventType, filename) => {
    if (!filename) return
    const sourcePath = join(SOURCE_DIR, filename)
    const targetPath = join(TARGET_DIR, filename)
    const vitepressTargetPath = toVitePressTarget(targetPath)
    try {
      if (!existsSync(sourcePath)) {
        if (existsSync(vitepressTargetPath)) {
          rmSync(vitepressTargetPath, { recursive: true, force: true })
          console.log(`✓ Removed: ${relative(REPO_ROOT, vitepressTargetPath)}`)
        }
        return
      }
      const stats = statSync(sourcePath)
      if (stats.isDirectory()) {
        syncDirectory(sourcePath, targetPath)
      } else {
        ensureDir(dirname(vitepressTargetPath))
        if (sourcePath.endsWith('.md')) {
          const raw = readFileSync(sourcePath, 'utf8')
          writeFileSync(vitepressTargetPath, sanitizeMarkdownForVitePress(raw), 'utf8')
        } else {
          copyFileSync(sourcePath, vitepressTargetPath)
        }
        console.log(`✓ Synced: ${relative(REPO_ROOT, sourcePath)}`)
      }
    } catch (error) {
      console.error(`✗ Error processing ${filename}:`, error.message)
    }
  })
}

if (process.argv.includes('--watch')) {
  runSyncWatch()
} else {
  runSyncOnce()
}
