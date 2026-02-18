"use client"
import React, { useState } from 'react'
import { ThemedText } from './ThemedText'

interface DividerProps {
    title?: string,
    slug?: string | null
    titleStyle?: 'small' | 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'defaultItalic' | 'smallBold' | 'size20'
}
export default function HeaderDivider({ title, titleStyle = 'subtitle', slug }: DividerProps) {
    const [hover, setHover] = useState(false);


    return (
        <a href={slug ? `/${slug}` : '#'} className="divider-container text-reset text-decoration-none">
            <div className="divider py-3">
                <span className="divider-separator">
                    {/* <span> */}
                    <ThemedText type={titleStyle}
                        onMouseEnter={() => setHover(true)}
                        onMouseLeave={() => setHover(false)}
                        lightColor={hover ? '#0076bf' : '#282F2F'}
                        darkColor='#fff' className="divider__text" >{title}</ThemedText>

                    <span className="nav-hover-effect d-flex">
                        <svg width="14" height="11" viewBox="0 0 14 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" clipRule="evenodd" d="M8.21641 0.139031C8.33864 0.0372324 8.4963 -0.0118628 8.65471 0.00253868C8.81313 0.0169406 8.95934 0.0936599 9.06121 0.215832L13.0608 5.01583C13.1582 5.13853 13.2037 5.29445 13.1876 5.45026C13.1716 5.60607 13.0952 5.74943 12.9749 5.8497C12.8546 5.94998 12.6998 5.99922 12.5436 5.98691C12.3875 5.9746 12.2423 5.90172 12.1392 5.78383L8.13961 0.983831C8.03781 0.8616 7.98872 0.703949 8.00312 0.545532C8.01752 0.387115 8.09424 0.240901 8.21641 0.139031Z" fill="#1176BB" />
                            <path fillRule="evenodd" clipRule="evenodd" d="M8.21641 10.6608C8.09424 10.559 8.01752 10.4128 8.00312 10.2543C7.98872 10.0959 8.03781 9.93828 8.13961 9.81605L12.1392 5.01605C12.2423 4.89816 12.3875 4.82527 12.5436 4.81297C12.6998 4.80066 12.8546 4.8499 12.9749 4.95018C13.0952 5.05045 13.1716 5.19381 13.1876 5.34962C13.2037 5.50543 13.1582 5.66134 13.0608 5.78405L9.06121 10.584C8.95934 10.7062 8.81313 10.7829 8.65471 10.7973C8.4963 10.8117 8.33864 10.7626 8.21641 10.6608Z" fill="#1176BB" />
                            <path fillRule="evenodd" clipRule="evenodd" d="M12.6 5.4C12.6 5.55913 12.5368 5.71174 12.4243 5.82426C12.3117 5.93679 12.1591 6 12 6L0.600006 6C0.440876 6 0.288263 5.93679 0.175741 5.82426C0.0632191 5.71174 5.72205e-06 5.55913 5.72205e-06 5.4C5.72205e-06 5.24087 0.0632191 5.08826 0.175741 4.97574C0.288263 4.86321 0.440876 4.8 0.600006 4.8L12 4.8C12.1591 4.8 12.3117 4.86321 12.4243 4.97574C12.5368 5.08826 12.6 5.24087 12.6 5.4Z" fill="#1176BB" />
                        </svg>
                    </span>
                    {/* <span /> */}
                </span>
            </div>
        </a>
    )
}
