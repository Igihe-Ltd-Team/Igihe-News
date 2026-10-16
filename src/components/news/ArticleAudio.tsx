'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const BASE = (process.env.NEXT_PUBLIC_NARRATOR_URL!).replace(/\/$/, '')
const API = `${BASE}/api/public`
const RATES = [1, 1.25, 1.5, 2, 0.75]

const SILENT = `${BASE}/embed/silence.wav`

const VOICE_STORAGE_KEY = 'igihe-audio-voice'
const VOICE_LABELS: Record<string, Record<string, string>> = {
    en: { female: 'Woman', male: 'Man' },
    fr: { female: 'Femme', male: 'Homme' },
    rw: { female: 'Umugore', male: 'Umugabo' },   // best effort: have a native speaker review
}

// Sites the narrator can read, with their voice choices (loaded once).
interface PlayerLook { color?: string | null; label?: string | null }
interface NarratorSource { key: string; base_url: string; voices?: string[]; player?: PlayerLook }
let sourcesPromise: Promise<NarratorSource[]> | null = null
function narratorSources(): Promise<NarratorSource[]> {
    sourcesPromise ??= fetch(`${API}/sources`).then(r => (r.ok ? r.json() : [])).catch(() => [])
    return sourcesPromise
}

interface Segment { index: number; ready: boolean; failed: boolean; url: string | null }
interface Manifest {
    status: 'ready' | 'generating' | 'failed' | 'unavailable' | 'not_generated'
    segments?: Segment[]
    segments_total?: number
    segments_ready?: number
}

type Phase = 'idle' | 'loading' | 'playing' | 'paused' | 'waiting' | 'error' | 'hidden'

interface Props {
    /** WordPress address of the article (the `link` of the WP REST post). */
    url?: string
    source?: string
    postId?: number
    label?: string
    /** Accent colour. */
    color?: string
}

const LABELS: Record<string, { listen: string; pause: string; resume: string; preparing: string; waiting: string; part: string; of: string; more: string; error: string }> = {
    en: { listen: 'Listen to this article', pause: 'Pause', resume: 'Resume', preparing: 'Preparing audio…', waiting: 'Waiting for the next part…', part: 'Part', of: 'of', more: 'generating the rest…', error: 'Audio is unavailable right now.' },
    fr: { listen: 'Écouter cet article', pause: 'Pause', resume: 'Reprendre', preparing: "Préparation de l'audio…", waiting: 'En attente de la partie suivante…', part: 'Partie', of: 'sur', more: 'génération de la suite…', error: "L'audio est indisponible pour le moment." },
    // Kinyarwanda strings are a best effort: please have a native speaker review them.
    rw: { listen: 'Umva iyi nkuru', pause: 'Hagarika', resume: 'Komeza', preparing: 'Turimo gutegura amajwi…', waiting: 'Dutegereje igice gikurikira…', part: 'Igice', of: 'muri', more: 'turimo gutegura ibindi…', error: 'Amajwi ntaboneka ubu.' },
}

// Only one article plays at a time on a page.
let stopCurrent: (() => void) | null = null

function pickLang(url: string | undefined, source: string | undefined): 'en' | 'fr' | 'rw' {
    const s = (source || '').toLowerCase()
    if (s === 'fr' || s === 'en') return s
    if (s.startsWith('rw')) return 'rw'
    const u = (url || '').toLowerCase()
    if (u.includes('/french')) return 'fr'
    if (u.includes('/kinyarwanda') || u.includes('old.igihe.com')) return 'rw'
    return 'en'
}

const icon = (d: string) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d={d} /></svg>
)
const PLAY = 'M8 5v14l11-7z'
const PAUSE = 'M6 5h4v14H6zm8 0h4v14h-4z'
const NEXT = 'M6 6l9 6-9 6zM16 6h2v12h-2z'
const PREV = 'M18 6l-9 6 9 6zM6 6h2v12H6z'
const PHONES = 'M12 3a9 9 0 0 0-9 9v7a2 2 0 0 0 2 2h2v-8H5v-1a7 7 0 0 1 14 0v1h-2v8h2a2 2 0 0 0 2-2v-7a9 9 0 0 0-9-9z'

export default function ArticleAudio({ url, source, postId, label: labelProp, color: colorProp = '#0f766e' }: Props) {
    // What the administrator set in the Ask IGIHE dashboard (colour, button text) wins over the props of this component.
    const [look, setLook] = useState<PlayerLook>({})
    const color = look.color || colorProp
    const label = look.label || labelProp
    const t = LABELS[pickLang(url, source)] ?? LABELS.en!
    const [phase, setPhase] = useState<Phase>('idle')
    const [manifest, setManifest] = useState<Manifest | null>(null)
    const [current, setCurrent] = useState(0)
    const [rateIdx, setRateIdx] = useState(0)
    const [message, setMessage] = useState('')
    const [voices, setVoices] = useState<string[]>([])
    const [voiceKey, setVoiceKey] = useState('')
    const voiceRef = useRef('')

    const audio = useRef<HTMLAudioElement | null>(null)
    const manifestRef = useRef<Manifest | null>(null)
    const currentRef = useRef(0)
    const wantPlay = useRef(false)
    const poll = useRef<number | undefined>(undefined)
    const alive = useRef(true)
    const rateRef = useRef(1)
    const unlocked = useRef(false)

    const query = useCallback((create: boolean) => {
        const p = new URLSearchParams({ create: create ? '1' : '0', at: String(currentRef.current) })
        if (voiceRef.current && voiceRef.current !== 'default') p.set('voice', voiceRef.current)
        if (postId && source) { p.set('source', source); p.set('post', String(postId)) }
        else if (url) { p.set('url', url); if (source) p.set('source', source) }
        return `${API}/audio?${p.toString()}`
    }, [url, source, postId])

    const segmentSrc = (i: number): string | null => {
        const s = manifestRef.current?.segments?.[i]
        return s?.ready && s.url ? `${BASE}${s.url}` : null   // the server returns URLs relative to its own root
    }

    const finish = useCallback(() => {
        wantPlay.current = false
        currentRef.current = 0
        setCurrent(0)
        audio.current?.removeAttribute('data-src')
        setPhase('idle')
    }, [])

    const tryStart = useCallback(() => {
        const segs = manifestRef.current?.segments
        const el = audio.current
        if (!segs || !el) return
        while (currentRef.current < segs.length && segs[currentRef.current]?.failed) currentRef.current++   // skip failed parts
        if (currentRef.current >= segs.length) return finish()
        setCurrent(currentRef.current)
        const src = segmentSrc(currentRef.current)
        if (!src) { setPhase(currentRef.current === 0 ? 'loading' : 'waiting'); return }   // not generated yet: keep polling
        if (el.getAttribute('data-src') !== src) {
            el.src = src
            el.setAttribute('data-src', src)
            el.playbackRate = rateRef.current
        }
        el.play().then(() => setPhase('playing'), (err: unknown) => {
            wantPlay.current = false
            const name = (err as { name?: string })?.name || 'Error'
            if (name === 'NotAllowedError') {   // the browser wants another tap before it plays sound
                setPhase('paused'); setMessage('')
            } else if (name !== 'AbortError') {
                // e.g. NotSupportedError: the file could not be loaded (blocked by the site's Content-Security-Policy, a network problem, ...)
                console.warn('[ArticleAudio] could not play', src, err)
                setPhase('error'); setMessage(`Could not play the audio (${name}). Check the browser console / Content-Security-Policy.`)
            }
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [finish])

    const fetchManifest = useCallback(async (create: boolean) => {
        const res = await fetch(query(create))
        if (res.status === 429) throw new Error('Too many requests, try again in a moment.')
        if (res.status === 404 || res.status === 422) { setPhase('hidden'); throw new Error('hidden') }
        if (!res.ok) throw new Error(t.error)
        const m: Manifest = await res.json()
        if (!alive.current) return m
        if (m.status === 'unavailable') { setPhase('hidden'); return m }
        manifestRef.current = m
        setManifest(m)
        if (m.status === 'failed' && !m.segments_ready) {
            wantPlay.current = false
            setPhase('error'); setMessage(t.error)
            return m
        }
        if (wantPlay.current && audio.current?.paused) tryStart()
        if (m.status === 'generating' && wantPlay.current) {
            window.clearTimeout(poll.current)
            poll.current = window.setTimeout(() => void fetchManifest(true).catch(() => undefined), 900)
        }
        return m
    }, [query, tryStart, t.error])

    const stop = useCallback(() => {
        wantPlay.current = false
        window.clearTimeout(poll.current)
        audio.current?.pause()
        setPhase(p => (p === 'idle' || p === 'hidden' ? p : 'paused'))
    }, [])

    useEffect(() => {
        alive.current = true
        const el = new Audio()
        el.preload = 'auto'
        audio.current = el
        el.addEventListener('ended', () => {
            if (!el.getAttribute('data-src')) return   // the silent unlock clip ending is not a finished part
            currentRef.current += 1
            el.removeAttribute('data-src')
            if (!manifestRef.current?.segments || currentRef.current >= manifestRef.current.segments.length) return finish()
            tryStart()
        })
        el.addEventListener('error', () => {
            if (el.getAttribute('data-src')) {
                wantPlay.current = false
                console.warn('[ArticleAudio] audio element error', el.error?.code, el.error?.message, el.getAttribute('data-src'))
                setPhase('error'); setMessage(`Could not load the audio (code ${el.error?.code ?? '?'}). Check the browser console / Content-Security-Policy.`)
            }
        })
        return () => {
            alive.current = false
            window.clearTimeout(poll.current)
            el.pause()
            el.removeAttribute('src')
            if (stopCurrent === stop) stopCurrent = null
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // A different article (client-side navigation): start from scratch.
    useEffect(() => {
        stop()
        manifestRef.current = null
        currentRef.current = 0
        unlocked.current = false
        setManifest(null); setCurrent(0); setPhase('idle'); setMessage('')
        audio.current?.removeAttribute('data-src')
    }, [url, source, postId, stop])

    // Which voices does this article's site offer? (e.g. woman / man)
    useEffect(() => {
        let cancelled = false
        narratorSources().then(list => {
            if (cancelled) return
            const target = (url || '').toLowerCase().replace(/\/$/, '')
            const base = (s: NarratorSource) => s.base_url.toLowerCase().replace(/\/$/, '')
            const match = list.find(s => source && s.key === source)
                ?? list.filter(s => target === base(s) || target.startsWith(base(s) + '/')).sort((a, b) => b.base_url.length - a.base_url.length)[0]
            setLook(match?.player ?? {})
            if (list.length && !match) { setPhase('hidden'); return }   // the dashboard turned the player off for this site
            const choices = match?.voices ?? []
            let saved = ''
            try { saved = localStorage.getItem(VOICE_STORAGE_KEY) ?? '' } catch { /* storage unavailable: choice just is not remembered */ }
            const initial = choices.includes(saved) ? saved : (choices[0] ?? '')
            voiceRef.current = initial
            setVoices(choices)
            setVoiceKey(initial)
        })
        return () => { cancelled = true }
    }, [url, source])

    const unlock = () => {
        const el = audio.current
        if (!el || unlocked.current) return
        unlocked.current = true
        el.src = SILENT
        el.play().catch(() => { unlocked.current = false })
    }

    const begin = async () => {
        stopCurrent?.()
        stopCurrent = stop
        wantPlay.current = true
        setMessage('')
        setPhase('loading')
        try {
            await fetchManifest(true)
            if (wantPlay.current) tryStart()
        } catch (e) {
            wantPlay.current = false
            if ((e as Error).message !== 'hidden') { setPhase('error'); setMessage((e as Error).message || t.error) }
        }
    }

    const toggle = () => {
        unlock()
        if (phase === 'playing') return stop()
        if (manifestRef.current?.segments) {
            stopCurrent?.()
            stopCurrent = stop
            wantPlay.current = true
            void fetchManifest(true).catch(() => undefined)
            tryStart()
        } else void begin()
    }

    const jump = (delta: number) => {
        unlock()
        const n = manifestRef.current?.segments?.length ?? 0
        if (!n) return
        currentRef.current = Math.max(0, Math.min(n - 1, currentRef.current + delta))
        setCurrent(currentRef.current)
        audio.current?.removeAttribute('data-src')
        wantPlay.current = true
        tryStart()
    }

    // Switch between the woman's and the man's voice: restart cleanly with the other version of the audio.
    const chooseVoice = (key: string) => {
        if (key === voiceRef.current) return
        const wasActive = wantPlay.current || phase === 'playing'
        stop()
        window.clearTimeout(poll.current)
        manifestRef.current = null
        setManifest(null)
        currentRef.current = 0
        setCurrent(0)
        audio.current?.removeAttribute('data-src')
        voiceRef.current = key
        setVoiceKey(key)
        setPhase('idle'); setMessage('')
        try { localStorage.setItem(VOICE_STORAGE_KEY, key) } catch { /* ignore */ }
        if (wasActive) void begin()
    }

    const cycleRate = () => {
        const next = (rateIdx + 1) % RATES.length
        setRateIdx(next)
        rateRef.current = RATES[next] ?? 1
        if (audio.current) audio.current.playbackRate = rateRef.current
    }

    if (phase === 'hidden' || (!url && !(postId && source))) return null

    const total = manifest?.segments_total ?? manifest?.segments?.length ?? 0
    const busy = phase === 'loading' || phase === 'waiting'
    const active = phase !== 'idle'
    const generatingMore = manifest?.status === 'generating' && phase === 'playing'

    const btn: React.CSSProperties = { all: 'unset', boxSizing: 'border-box', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, minWidth: 34, height: 34, padding: '0 10px', borderRadius: 999, fontSize: 13, fontWeight: 600, color: '#1f2933', background: '#eef1f4' }

    return (
        <div role="region" aria-label={label || t.listen}
            style={{ border: '1px solid #d7dde3', borderRadius: 12, padding: '10px 14px', margin: '16px 0', background: '#fff', fontFamily: 'inherit' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <button type="button" onClick={toggle} aria-label={phase === 'playing' ? t.pause : t.listen}
                    style={{ ...btn, background: color, color: '#fff', minWidth: 40, height: 40, padding: 0 }}>
                    {busy ? <span style={{ fontSize: 12 }}>…</span> : icon(phase === 'playing' ? PAUSE : active ? PLAY : PHONES)}
                </button>
                <span style={{ fontSize: 14, fontWeight: 600, flex: '1 1 140px', minWidth: 0 }}>
                    {label || t.listen}
                </span>

            {voices.length > 1 && (
                <div role="group" aria-label="Voice" style={{ display: 'inline-flex', marginTop: 8, borderRadius: 999, border: '1px solid #d7dde3', overflow: 'hidden' }}>
                    {voices.map(key => (
                        <button key={key} type="button" aria-pressed={voiceKey === key} onClick={() => chooseVoice(key)}
                            style={{ ...btn, borderRadius: 0, minWidth: 0, height: 28, fontSize: 12, background: voiceKey === key ? color : '#fff', color: voiceKey === key ? '#fff' : '#1f2933' }}>
                            {(VOICE_LABELS[pickLang(url, source)] ?? VOICE_LABELS.en!)[key] ?? key}
                        </button>
                    ))}
                </div>
            )}
                {active && total > 0 && (
                    <>
                        <button type="button" onClick={() => jump(-1)} disabled={current <= 0} aria-label="Previous part" style={{ ...btn, opacity: current <= 0 ? 0.4 : 1 }}>{icon(PREV)}</button>
                        <button type="button" onClick={() => jump(1)} disabled={current >= total - 1} aria-label="Next part" style={{ ...btn, opacity: current >= total - 1 ? 0.4 : 1 }}>{icon(NEXT)}</button>
                        <button type="button" onClick={cycleRate} aria-label="Playback speed" style={btn}>{RATES[rateIdx]}×</button>
                    </>
                )}
            </div>
            {active && total > 0 && (
                <>
                    <div aria-hidden="true" style={{ height: 6, borderRadius: 999, background: '#e5e9ed', overflow: 'hidden', marginTop: 10 }}>
                        <div style={{ height: '100%', width: `${((current + (phase === 'playing' ? 0.5 : 0)) / total) * 100}%`, background: color, transition: 'width .25s linear' }} />
                    </div>
                    <div role="status" aria-live="polite" style={{ fontSize: 12, color: '#52606d', marginTop: 6, minHeight: 16 }}>
                        {phase === 'loading' ? t.preparing
                            : phase === 'waiting' ? t.waiting
                                : `${t.part} ${current + 1} ${t.of} ${total}${generatingMore ? ` · ${t.more}` : ''}`}
                    </div>
                </>
            )}
            {phase === 'loading' && !(total > 0) && <div role="status" style={{ fontSize: 12, color: '#52606d', marginTop: 6 }}>{t.preparing}</div>}
            {phase === 'error' && <div role="alert" style={{ fontSize: 12, color: '#b42318', marginTop: 6 }}>{message || t.error}</div>}
            {phase === 'paused' && current === 0 && total > 0 && <div style={{ fontSize: 12, color: '#52606d', marginTop: 6 }}>Press play to start.</div>}
        </div>
    )
}
