import React from 'react'
import { ThemedText } from '../ThemedText'
import { OptimizedImage } from '../ui/OptimizedImage'
interface SectionProps{
    size?:number
}
function CardAdds({size}:SectionProps) {
    return (
        <div className='mt-3 p-2' style={{ backgroundColor: '#f5f5f5' }}>
            <ThemedText className='d-flex justify-content-center' type='small'>Advertisement</ThemedText>
            <OptimizedImage
                src="https://new.igihe.com/wp-content/uploads/2025/06/ca68c8f5595ed47529d84f21ab560f08e700bd97-1.gif"
                alt="Featured content"
                fill
                height={size}
                className="object-cover"
            />
        </div>
    )
}

export default CardAdds