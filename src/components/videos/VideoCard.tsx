import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useYoutubeDuration } from '@/hooks/useVideosData';
import { OptimizedImage } from '../ui/OptimizedImage';

interface videoCardProps {
    thumbNail: string;
    slug: string;
    title: string,
    videoId: string | null;
}

export default function VideoCard({ thumbNail, slug, title, videoId }: videoCardProps) {
    // console.log('thumbNail',thumbNail)
    const duration = useYoutubeDuration(videoId);

    return (

        <div className="video-card d-flex flex-column gap-2">
            <div className="holdes-thumbnail ">
                <OptimizedImage src={thumbNail} alt={title}
                    fill
                    height={200}
                    className="object-cover video-thumbnail" />
                <Link href={`/videos/${slug}`} className="play-button">
                    <svg width="8" height="12" viewBox="0 0 8 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1.84777 11.6373C1.26091 12.1088 0.545687 12.0922 0 11.7509V0.249107C0.545687 -0.092226 1.26092 -0.108805 1.84777 0.362707L7.4864 4.89305C8.1712 5.44329 8.1712 6.55672 7.4864 7.10693L1.84777 11.6373Z" fill="#EE0120" />
                    </svg>
                </Link>
            </div>
            <div className="videos-rt-details">
                <Link href={`/single-video/${slug}`} className='text-decoration-none'>
                    <p className="video-title mb-1 text-dark">
                        {title}
                    </p>
                </Link>

                <span className="video-duration">
                    {duration || '0:00'} mins ago
                </span>
            </div>

        </div>

    )
}