// // lib/postRegistry.ts

// const usedIds = new Set<number>()

// export function registerPosts(posts: { id: number }[]) {
//   posts.forEach((p) => usedIds.add(p.id))
// }

// export function getExcludeList(): number[] {
//   return Array.from(usedIds)
// }

// export function resetRegistry() {
//   usedIds.clear()
// }




// lib/postRegistry.ts

const registry = new Map<string, Set<number>>()

export function registerPosts(section: string, posts: { id: number }[]) {
  if (!registry.has(section)) registry.set(section, new Set())
  posts.forEach(p => registry.get(section)!.add(p.id))
}

export function excludeFrom(...sections: string[]): number[] {
  const ids = new Set<number>()
  sections.forEach(section => {
    registry.get(section)?.forEach(id => ids.add(id))
  })
  return Array.from(ids)
}

export function resetRegistry() {
  registry.clear()
}