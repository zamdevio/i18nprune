#!/usr/bin/env node

import { watch, readdirSync, statSync, copyFileSync, mkdirSync, rmSync, existsSync, readFileSync, writeFileSync } from 'fs'
import { join, relative, resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DOCS_APP_DIR = resolve(__dirname, '..')
const REPO_ROOT = resolve(__dirname, '../../..')
const SOURCE_DIR = resolve(REPO_ROOT, 'docs')
const TARGET_DIR = resolve(DOCS_APP_DIR, 'content')
const HOME_SOURCE = resolve(DOCS_APP_DIR, 'index.md')
const ROOT_PACKAGE_JSON = resolve(REPO_ROOT, 'package.json')
/** Top-level docs/ entries skipped during sync (home is apps/docs/index.md). */
const DOCS_SYNC_SKIP = new Set(['README.md'])

/**
 * Tokens authors write under docs/. Substituted from root package.json at sync
 * so release bumps do not require hand-editing every “current release” example.
 *
 * - `__I18NPRUNE_VERSION__` → `1.2.3`
 * - `__I18NPRUNE_TAG__` → `v1.2.3`
 *
 * Prefer these for current-release examples. Pin a concrete tag/version only when
 * documenting a specific historical release (changelog, migration, “shipped in v1.0.1”).
 *
 * Do not confuse with locale MT mask sentinels (`__I18NPRUNE_MISSING__`, `__I18NPRUNE_*`)
 * — those are product strings, not docs sync tokens.
 */
const VERSION_TOKEN = '__I18NPRUNE_VERSION__'
const TAG_TOKEN = '__I18NPRUNE_TAG__'

function readPublishedVersion() {
  const pkg = JSON.parse(readFileSync(ROOT_PACKAGE_JSON, 'utf8'))
  const version = typeof pkg.version === 'string' ? pkg.version.trim() : ''
  if (!/^\d+\.\d+\.\d+/.test(version)) {
    throw new Error(`Root package.json missing a semver "version" (got ${JSON.stringify(pkg.version)})`)
  }
  return version
}

function applyVersionTokens(raw, version = readPublishedVersion()) {
  const tag = `v${version}`
  return raw.split(VERSION_TOKEN).join(version).split(TAG_TOKEN).join(tag)
}

function prepareMarkdown(raw) {
  return sanitizeMarkdownForVitePress(applyVersionTokens(raw))
}

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
    writeFileSync(vitepressTarget, prepareMarkdown(raw), 'utf8')
  } else {
    copyFileSync(source, vitepressTarget)
  }
}

function installHomePage() {
  if (!existsSync(HOME_SOURCE)) {
    console.error(`✗ Home page missing: ${HOME_SOURCE}`)
    process.exit(1)
  }
  const homeTarget = join(TARGET_DIR, 'index.md')
  ensureDir(TARGET_DIR)
  writeFileSync(homeTarget, prepareMarkdown(readFileSync(HOME_SOURCE, 'utf8')), 'utf8')
  console.log(`✓ Home: ${relative(REPO_ROOT, HOME_SOURCE)} → ${relative(REPO_ROOT, homeTarget)}`)
}

function syncDirectory(source, target) {
  if (existsSync(target)) rmSync(target, { recursive: true, force: true })
  ensureDir(target)
  const entries = readdirSync(source)
  for (const entry of entries) {
    if (source === SOURCE_DIR && DOCS_SYNC_SKIP.has(entry)) continue
    copyRecursive(join(source, entry), join(target, entry))
  }
  installHomePage()
  console.log(`✓ Synced: ${relative(REPO_ROOT, source)} → ${relative(REPO_ROOT, target)}`)
}

export function runSyncOnce() {
  console.log('🔄 Performing sync...')
  if (!existsSync(SOURCE_DIR)) {
    console.error(`✗ Source directory does not exist: ${SOURCE_DIR}`)
    process.exit(1)
  }
  const version = readPublishedVersion()
  console.log(`· Substituting ${VERSION_TOKEN} → ${version}, ${TAG_TOKEN} → v${version}`)
  syncDirectory(SOURCE_DIR, TARGET_DIR)
  console.log('✅ Sync complete!')
}

export function runSyncWatch() {
  runSyncOnce()
  console.log('👀 Watching for changes in', SOURCE_DIR, 'and', HOME_SOURCE)
  watch(SOURCE_DIR, { recursive: true }, (_eventType, filename) => {
    if (!filename) return
    const sourcePath = join(SOURCE_DIR, filename)
    const targetPath = join(TARGET_DIR, filename)
    const vitepressTargetPath = toVitePressTarget(targetPath)
    try {
      if (DOCS_SYNC_SKIP.has(filename.split(/[/\\]/)[0])) return
      if (!existsSync(sourcePath)) {
        if (existsSync(vitepressTargetPath)) {
          rmSync(vitepressTargetPath, { recursive: true, force: true })
          console.log(`✓ Removed: ${relative(REPO_ROOT, vitepressTargetPath)}`)
        }
        installHomePage()
        return
      }
      const stats = statSync(sourcePath)
      if (stats.isDirectory()) {
        syncDirectory(sourcePath, targetPath)
      } else {
        ensureDir(dirname(vitepressTargetPath))
        if (sourcePath.endsWith('.md')) {
          const raw = readFileSync(sourcePath, 'utf8')
          writeFileSync(vitepressTargetPath, prepareMarkdown(raw), 'utf8')
        } else {
          copyFileSync(sourcePath, vitepressTargetPath)
        }
        console.log(`✓ Synced: ${relative(REPO_ROOT, sourcePath)}`)
      }
      installHomePage()
    } catch (error) {
      console.error(`✗ Error processing ${filename}:`, error.message)
    }
  })

  watch(HOME_SOURCE, () => {
    try {
      installHomePage()
      console.log(`✓ Home updated: ${relative(REPO_ROOT, HOME_SOURCE)}`)
    } catch (error) {
      console.error('✗ Error updating home page:', error.message)
    }
  })
}

if (process.argv.includes('--watch')) {
  runSyncWatch()
} else {
  runSyncOnce()
}
