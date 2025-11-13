import React from 'react'
import { ThemedText } from './ThemedText'

interface DividerProps{
    title?:string,
    titleStyle?:'small' | 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'defaultItalic' | 'smallBold' | 'size20'
}
export default function HeaderDivider({title,titleStyle='subtitle'}:DividerProps) {
    return (
        <div className="divider-container">
            <div className="divider">
                <span className="divider-separator">
                    <ThemedText type={titleStyle} lightColor='#282F2F' darkColor='#fff' className="divider__text" >{title}</ThemedText>
                </span>
            </div>
        </div>
    )
}
