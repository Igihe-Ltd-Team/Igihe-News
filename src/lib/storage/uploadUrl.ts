/**
 * Whether `url` is a genuine upload this app itself produced for the given
 * `folder` — never an arbitrary client-supplied URL (which would let a
 * contributor set a third-party tracking pixel as their "avatar," or claim
 * someone else's already-uploaded asset as their own by copying its URL).
 *
 * Two valid shapes:
 * - Legacy local-disk uploads made before the Cloudinary swap (fileStorage.ts):
 *   `/uploads/<folder>/...`
 * - Current Cloudinary-hosted uploads (cloudinaryFileStorage.ts):
 *   `https://res.cloudinary.com/<our cloud>/image/upload/[v<version>/]<folder>/...`
 *
 * The folder check matters even for a genuinely-ours Cloudinary URL — every
 * upload path (articles, avatars, ad banners, media reports) shares the
 * same account and URL prefix, differing only by folder, so without this a
 * user could submit an ad banner's or another user's avatar's URL as their
 * own article photo. Scoped by folder for exactly the reason
 * validation/profile.ts's avatarUrl check has always used
 * `/uploads/avatars/`, not just `/uploads/`.
 */
export function isTrustedUploadUrl(url: string, folder: string, resourceType: 'image' | 'video' = 'image'): boolean {
  // A bare startsWith() alone doesn't stop "/uploads/articles/../../../etc/passwd"
  // from matching the local-disk branch below — this must run for every
  // caller, not be left to each validation schema to remember separately.
  if (url.includes('..')) return false

  if (resourceType === 'image' && url.startsWith(`/uploads/${folder}/`)) return true

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  if (!cloudName) return false
  // Cloudinary files audio under "video" too (there's no separate "audio"
  // resource type) — a community voice note's URL is a video/upload/ one
  // even though it's audio, see communityVoiceNote.ts.
  const prefix = `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/`
  if (!url.startsWith(prefix)) return false
  const afterVersion = url.slice(prefix.length).replace(/^v\d+\//, '')
  return afterVersion.startsWith(`${folder}/`)
}

/**
 * Whether `url` is an upload this app produced **for this specific user**.
 *
 * `isTrustedUploadUrl` above proves only that a URL is ours and sits in the
 * right feature folder — it says nothing about *whose* it is. Every
 * server-side image upload used to land in a flat, shared folder
 * (`avatars/2026/09/...`, `community/2026/09/...`), and Cloudinary delivery
 * URLs are public and visible in rendered pages, so one user could paste
 * another's image URL into their own avatar or post and pass validation.
 * That was both an impersonation route (render someone else's photo as your
 * own) and a destructive one: the owner-scoped delete paths
 * (settings/profile, community/posts/[id]) then destroyed the *other* user's
 * asset when the borrower changed or deleted their own record.
 *
 * Uploads are now written under `<folder>/<userId>/<year>/<month>/`, so
 * ownership is provable from the URL alone — the same property that already
 * made community video and voice notes safe (see communityVideo.ts, which
 * signs `community/video/<userId>` and has Cloudinary enforce it at upload
 * time).
 */
export function isOwnedUploadUrl(
  url: string,
  folder: string,
  ownerId: string,
  resourceType: 'image' | 'video' = 'image'
): boolean {
  if (!ownerId) return false
  return isTrustedUploadUrl(url, `${folder}/${ownerId}`, resourceType)
}

/**
 * Ownership check for a URL arriving on a create/update request.
 *
 * Accepts either a URL this user demonstrably uploaded, or one of
 * `alreadyStored` — the values the entity being edited *already* holds. The
 * second case exists only so records written before uploads were
 * owner-scoped stay editable: a user resubmitting their own unchanged
 * avatar or article image must not be rejected. It grants nothing, because
 * a URL can only qualify if it is already persisted on that user's own
 * record; it cannot be used to claim a new one.
 */
export function isAcceptableUploadUrl(
  url: string,
  folder: string,
  ownerId: string,
  alreadyStored: readonly (string | null | undefined)[],
  resourceType: 'image' | 'video' = 'image'
): boolean {
  if (isOwnedUploadUrl(url, folder, ownerId, resourceType)) return true
  return alreadyStored.includes(url) && isTrustedUploadUrl(url, folder, resourceType)
}
