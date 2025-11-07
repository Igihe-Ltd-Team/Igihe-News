import React from 'react'
import { ThemedText } from './ThemedText'

interface DividerProps{
    title?:string
}
export default function HeaderDivider({title}:DividerProps) {
    return (
        <div className="divider-container">
            <div className="divider">
                <span className="divider-separator">
                    <ThemedText type='subtitle' className="divider__text">{title}</ThemedText>
                </span>
            </div>
        </div>
    )
}
