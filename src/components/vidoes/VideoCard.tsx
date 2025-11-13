import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
export default function VideoCard() {
    return (
        <div>
            <div className="video-card">
                <div className="holdes-thumbnail">
                    <Image src="/assets/Image.jpg" alt="" className="video-thumbnail" width={302} height={200} />

                </div>
                <div className="videos-rt-details">
                    <Link href="" className='text-decoration-none'>
                        <p className="video-title mb-2 text-dark">
                            Hail shatters windows in
                            Nebraska
                        </p>
                    </Link>
                   
                    <span className="video-duration">
                        11 mins ago
                    </span>
                </div>
                
            </div>
        </div>
    )
}
