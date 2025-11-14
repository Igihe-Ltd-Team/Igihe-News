"use client";

import React, { Suspense } from "react";
import HeaderDivider from "@/components/HeaderDivider";
import { useNewsData } from "@/hooks/useNewsData";
import { useParams } from "next/navigation";
import VideoCard from "@/components/videos/VideoCard";
import { extractYouTubeEmbed, getYouTubeVideoId, stripHtml } from "@/lib/utils";
import NewsSkeleton from "@/components/NewsSkeleton";
import { NewsItem } from "@/types/fetchData";

export default function Page() {
  const { slug } = useParams(); // ✅ get the slug from the route
  const { videos, videosLoading } = useNewsData();

  // ✅ Find the video that matches the slug
  const currentVideo = videos?.find((video: NewsItem) => video.slug === slug);

  const igiheVideoId = getYouTubeVideoId(currentVideo?.acf?.igh_yt_video_url!)

  const embedUrl = igiheVideoId
    ? `https://www.youtube.com/embed/${igiheVideoId}?controls=1&rel=0&playsinline=1`
    : null;

  return (
    <div className="single-video-template container">
      <div className="row">
        <div className="col-md-8">
          <div className="single-video-wrapper d-flex flex-column gap-4">
            {/* <Suspense fallback={<NewsSkeleton/>}></Suspense> */}
            {videosLoading ? (
              <NewsSkeleton/>
            ) : currentVideo && embedUrl ? (
              <>
                <iframe
                  className="igihe-video"
                  width="640"
                  height="360"
                  src={embedUrl}
                  title={currentVideo?.title?.rendered || "Video"}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                ></iframe>

                <h1 className="video-title">
                  {stripHtml(currentVideo?.title?.rendered) || "Untitled Video"}
                </h1>
                <p className="random-text">
                  {currentVideo?.excerpt?.rendered?.replace(/<[^>]+>/g, "") ||
                    "No description available."}
                </p>
              </>
            ) : (
              <p>Video not found.</p>
            )}
          </div>
        </div>

        <div className="col-md-4 d-flex flex-column gap-3">
          <HeaderDivider title="Related Videos" />
          <div className="related-videos">
            {videosLoading ? (
              <NewsSkeleton count={1}/>
            ) : videos && videos.length > 0 ? (
              videos
                .filter((v: any) => v.slug !== slug).slice(0, 4)// exclude the current video
                .map((video: any) => (
                  <VideoCard
                    key={video.id}
                    thumbNail={
                      video?._embedded?.["wp:featuredmedia"]?.[0]?.source_url
                    }
                    title={video?.title?.rendered || "Untitled Video"}
                    slug={video.slug} // ✅ link to single video
                    videoId={getYouTubeVideoId(video?.acf?.igh_yt_video_url)}
                  />
                ))
            ) : (
              <p>No related videos available.</p>
            )}
           
          </div>
        </div>
      </div>
    </div>
  );
}