import React from 'react'
import { ThemedText } from './ThemedText'
import Link from 'next/link'

interface DividerProps{
    title?:string,
    slug?:string | null
    titleStyle?:'small' | 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'defaultItalic' | 'smallBold' | 'size20'
}
export default function HeaderDivider({title,titleStyle='subtitle',slug}:DividerProps) {
    return (
        <Link href={slug ? `/${slug}` : '#'} className="divider-container text-reset text-decoration-none">
            <div className="divider py-3">
                <span className="divider-separator">
                    <ThemedText type={titleStyle} lightColor='#282F2F' darkColor='#fff' className="divider__text" >{title}</ThemedText>
                </span>
            </div>
        </Link>
    )
}
