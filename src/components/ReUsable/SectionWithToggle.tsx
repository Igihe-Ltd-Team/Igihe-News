import React from 'react';
import { useState } from "react";
import { ThemedText } from '../ThemedText';
import { formatDate, getCategoryName } from '@/lib/utils';
import { OptimizedImage } from '../ui/OptimizedImage';
interface SectionProps {
    title?: string,
    titleBG?: string,
    showImgs?: boolean,
    showDate?: boolean
}
const advertorials = [
    {
        id: 1,
        image: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=400&h=300&fit=crop",
        title: "Discover Rwanda: Thrilling Adventures and Unforgettable Experiences Await You",
        timeAgo: "5 hours ago"
    },
    {
        id: 2,
        image: "https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=400&h=300&fit=crop",
        title: "Exploring Rwanda: Exciting Activities and Cultural Treasures",
        timeAgo: "5 hours ago"
    },
    {
        id: 3,
        image: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=400&h=300&fit=crop",
        title: "Rwanda Revealed: Engaging Activities and Breathtaking Landscapes",
        timeAgo: "5 hours ago"
    },
    {
        id: 4,
        image: "https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=400&h=300&fit=crop",
        title: "Rwanda Adventures: Exciting Activities and Stunning Scenery",
        timeAgo: "5 hours ago"
    },
    {
        id: 5,
        image: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=300&fit=crop",
        title: "Rwanda's Hidden Gems: Activities and Attractions for Everyone",
        timeAgo: "5 hours ago"
    }
];

const SectionWithToggle = ({ title, titleBG = '#1176BB', showImgs, showDate }: SectionProps) => {
    const [expanded, setExpanded] = useState(false);


    const visiblePosts = expanded ? advertorials : advertorials.slice(0, 4);

    return (
        <div className="card rounded-0 border-0" style={{ backgroundColor: '#F5F6F799' }}>

            <div style={{ backgroundColor: titleBG }} className="card-header text-white d-flex justify-content-between align-items-center py-2">
                <ThemedText type='size20'>{title}</ThemedText>
                <button
                    className="btn btn-sm text-white border-0"
                    style={{ boxShadow: "none" }}
                    onClick={() => setExpanded(!expanded)}
                    aria-label="Toggle list"
                >
                    <i
                        className={`bi bi-chevron-${expanded ? "up" : "down"} fs-5 transition`}
                    ></i>
                </button>
            </div>

            <div className="list-group list-group-flush py-2 px-3"
                style={{
                    maxHeight: expanded ? "480px" : "auto",
                    overflowY: expanded ? "scroll" : "hidden",
                    transition: "max-height 0.4s ease",
                }}
            >
                {visiblePosts.map((item, index) => (
                    <div
                        key={item.id}
                        className={`list-group-item px-0 list-group-item-action ${index !== visiblePosts.length - 1 ? 'border-bottom' : ''}`}
                        style={{ cursor: 'pointer', backgroundColor: 'transparent' }}
                    >
                        <div className="row g-3">
                            {
                                showImgs &&
                                <div className="col-4">
                                    <OptimizedImage
                                        src={item.image || '/images/placeholder.jpg'}
                                        alt={item.title}
                                        fill
                                        height={100}
                                        className="object-cover"
                                    />
                                </div>
                            }

                            <div className={showImgs ? "col-8" : "col-12"}>
                                {
                                    showDate &&
                                    <div className="mb-2">
                                        <small style={{ color: '#999' }}>
                                            <ThemedText className="me-3" type='small'>
                                                {/* {
                                      formatDate(article.date)
                                    } */} 1234 fd
                                            </ThemedText>
                                            <ThemedText type='small'>
                                                {/* {getCategoryName(article)} */}
                                                fvddcsvfdsc
                                            </ThemedText>
                                        </small>
                                    </div>
                                }
                                <ThemedText>
                                    {item.title}
                                </ThemedText>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SectionWithToggle;