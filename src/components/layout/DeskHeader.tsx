"use client"

import { Category } from "@/types/fetchData"
import MobileHeader from "./MobileHeader"
import { useResponsive } from "@/hooks/useResponsive"

interface HeaderClientProps {
    categories: Category[]
    children: React.ReactNode
}

export default function DeskHeader({
    categories,
    children
}: HeaderClientProps) {

    const { isMobile } = useResponsive()

    return (
        <>
            {
                isMobile ? <MobileHeader categories={categories} /> :

                    children

            }
        </>
    )
}