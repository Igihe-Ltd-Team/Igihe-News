"use client"

import React from 'react';
import { useState } from "react";
import { ThemedText } from '../ThemedText';
import { formatDate, getCategoryName, getCategorySlug, getFeaturedImage, isImageMedia, stripHtml } from '@/lib/utils';
import { OptimizedImage } from '../ui/OptimizedImage';
import { NewsItem } from '@/types/fetchData';
import { useTheme } from 'next-themes';
interface SectionProps {
    title?: string,
    titleBG?: string,
    showImgs?: boolean,
    showDate?: boolean,
    articles?: NewsItem[],
    isFile?: boolean
    slug?: string
    // data?:{
    //     data:NewsItem[]
    //     pagination:any
    // }
}


const SectionWithToggle = ({ slug, title, titleBG = '#1176BB', showImgs, showDate, articles = [], isFile = false }: SectionProps) => {
    const [expanded, setExpanded] = useState(false);
    const { theme, setTheme, systemTheme } = useTheme();


    // const visiblePosts = expanded ? articles : articles.slice(0, 4);
    const visiblePosts = articles;

    return (
        <div className="card rounded-0 border-0" style={{ backgroundColor: theme === 'dark' ? '#1D3D47' : '#F5F6F799' }}>
            <a href={`/${slug}`} className='text-decoration-none text-reset'>
                <div style={{ backgroundColor: titleBG }} className="card-header text-white d-flex justify-content-between align-items-center py-2">
                    <ThemedText type='size20'>{title}</ThemedText>
                    {/* <button
                    className="btn btn-sm text-white border-0"
                    style={{ boxShadow: "none" }}
                    onClick={() => setExpanded(!expanded)}
                    aria-label="Toggle list"
                >
                    <i
                        className={`bi bi-chevron-${expanded ? "up" : "down"} fs-5 transition`}
                    ></i>
                </button> */}
                </div>
            </a>
            <div className="list-group list-group-flush py-2 px-3"
                style={{
                    // maxHeight: expanded ? "480px" : "auto",
                    // overflowY: expanded ? "scroll" : "hidden",
                    maxHeight: "780px",
                    overflowY: "scroll",
                    transition: "max-height 0.4s ease",
                }}
            >
                {visiblePosts.map((item, index) => {
                    const chechedfile = isImageMedia(item, true)
                    return (
                        <a
                            // href={chechedfile.isImage? `/advertorial/article/${item.slug}` : chechedfile.filePath} 
                            href={isFile ? item?.file?.url : `/advertorial/article/${item.slug}`}
                            target={isFile ? '_blank' : '_parent'}
                            key={item.id}
                            className={`list-group-item px-0 list-group-item-action ${index !== visiblePosts.length - 1 ? 'border-bottom' : ''}`}
                            style={{ cursor: 'pointer', backgroundColor: 'transparent' }}
                        >
                            <div className="row g-3">
                                {
                                    showImgs &&
                                    <div className="col-4">
                                        <OptimizedImage
                                            src={chechedfile.img || '/assets/igiheIcon.png'}
                                            alt={stripHtml(item.title.rendered)}
                                            fill
                                            height={100}
                                            imgClass="object-fit-contain"
                                        />
                                    </div>
                                }

                                <div className={showImgs ? "col-8" : "col-12"}>
                                    {
                                        showDate &&
                                        <div className="mb-2">
                                            <small style={{ color: '#999' }}>
                                                <ThemedText className="me-3" type='small'>
                                                    {
                                                        formatDate(item.date)
                                                    }
                                                </ThemedText>
                                                <ThemedText type='small'>
                                                    {getCategoryName(item)}
                                                </ThemedText>
                                            </small>
                                        </div>
                                    }
                                    <ThemedText type='small' darkColor='#fff' lightColor='#282F2F'>
                                        {stripHtml(item.title.rendered)}
                                    </ThemedText>
                                </div>
                            </div>
                        </a>
                    )
                })}
            </div>
        </div>
    );
};

export default SectionWithToggle;