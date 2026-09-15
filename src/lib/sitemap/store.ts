import { promises as fs } from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import type { Inventory, Manifest, ValidationCache } from './types.ts'
import { emptyInventory } from './sources.ts'

export function getStoreDir(): string {
  return process.env.SITEMAP_STORE_DIR || path.join(process.cwd(), '.cache', 'sitemaps')
}

async function ensureDir(): Promise<string> {
  const dir = getStoreDir()
  await fs.mkdir(dir, { recursive: true })
  return dir
}

export function storePath(fileName: string): string {
  return path.join(getStoreDir(), fileName)
}

export async function writeFileAtomic(fileName: string, content: string): Promise<void> {
  const dir = await ensureDir()
  const target = path.join(dir, fileName)
  const temp = `${target}.${process.pid}.${Date.now()}.tmp`
  await fs.writeFile(temp, content, 'utf8')
  await fs.rename(temp, target)
}

export async function readStoreFile(fileName: string): Promise<string | null> {
  try {
    return await fs.readFile(storePath(fileName), 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
}

export async function storeFileStat(fileName: string): Promise<{ size: number; mtime: Date } | null> {
  try {
    const stat = await fs.stat(storePath(fileName))
    return { size: stat.size, mtime: stat.mtime }
  } catch {
    return null
  }
}

export async function removeStoreFile(fileName: string): Promise<void> {
  await fs.rm(storePath(fileName), { force: true })
}

async function readJson<T>(fileName: string, fallback: () => T): Promise<T> {
  const raw = await readStoreFile(fileName)
  if (!raw) return fallback()
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback()
  }
}

export const INVENTORY_FILE = 'inventory.json'
export const MANIFEST_FILE = 'manifest.json'
export const VALIDATION_FILE = 'validation.json'
export const REPORT_FILE = 'validation-report.json'

export function loadInventory(): Promise<Inventory> {
  return readJson<Inventory>(INVENTORY_FILE, emptyInventory)
}

export function saveInventory(inventory: Inventory): Promise<void> {
  return writeFileAtomic(INVENTORY_FILE, JSON.stringify(inventory))
}

export function emptyManifest(): Manifest {
  return { version: 1, generatedAt: '', files: {}, articleFileCount: 0, validation: null, lastRun: null }
}

export function loadManifest(): Promise<Manifest> {
  return readJson<Manifest>(MANIFEST_FILE, emptyManifest)
}

export function saveManifest(manifest: Manifest): Promise<void> {
  return writeFileAtomic(MANIFEST_FILE, JSON.stringify(manifest, null, 2))
}

export function loadValidationCache(): Promise<ValidationCache> {
  return readJson<ValidationCache>(VALIDATION_FILE, () => ({}))
}

export function saveValidationCache(cache: ValidationCache): Promise<void> {
  return writeFileAtomic(VALIDATION_FILE, JSON.stringify(cache))
}

export function sha256(content: string): string {
  return createHash('sha256').update(content).digest('hex')
}

export function sitemapFileName(name: string): string {
  return `${name}.xml`
}

export function publicSitemapPath(name: string): string {
  return name === 'index' ? '/sitemap-index.xml' : `/sitemap-${name}.xml`
}
