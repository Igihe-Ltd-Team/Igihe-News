'use client';
import { useEffect, useState } from "react";
const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

function parseYoutubeDuration(iso: string) {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "0:00";

  const hours = parseInt(match[1] || "0");
  const mins = parseInt(match[2] || "0");
  const secs = parseInt(match[3] || "0");

  const total = hours * 3600 + mins * 60 + secs;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

//   return h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}` : `${m}:${s.toString().padStart(2, "0")}`;
  return h > 0 ? `${h}:${m.toString().padStart(2, "0")}` : `${m}`;
}


export function useYoutubeDuration(videoId: string | null) {

  const [duration, setDuration] = useState<string | null>(null);

  useEffect(() => {
    if (!videoId) return;

    async function fetchDuration() {
      try {
     
        const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=contentDetails&key=${apiKey}`;

        const res = await fetch(url);

        const data = await res.json();
        

        const iso = data?.items?.[0]?.contentDetails?.duration;
        if (iso) setDuration(parseYoutubeDuration(iso));
      } catch (err) {
        console.error("YT API error:", err);
      }
    }

    fetchDuration();
  }, [videoId]);

  return duration;
}