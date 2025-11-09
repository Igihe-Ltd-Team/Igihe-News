'use client';

import { HTMLAttributes } from 'react';

export type ThemedTextProps = HTMLAttributes<HTMLSpanElement> & {
  lightColor?: string;
  type?: 'small' | 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'defaultItalic' | 'smallBold' | 'size20' | 'italic34' | 'italic18';
  className?:string
};

export function ThemedText({
  style,
  lightColor,
  type = 'default',
  className = '',
  ...rest
}: ThemedTextProps) {
  // Base Bootstrap classes
  const baseClasses = 'font-raleway';
  
  // Type-specific Bootstrap classes
  const typeClasses = {
    small: 'fs-7 lh-sm fw-light', // fs-6 ≈ 12px, fw-light
    smallBold: 'fs-7 lh-1 fw-medium',
    default: 'fs-6 lh-sm fw-medium', // fs-5 ≈ 16px
    defaultItalic: 'fs-6 lh-sm fw-normal fst-italic',
    defaultSemiBold: 'fs-6 lh-base fw-semibold',
    title: 'fs-1 lh-1 fw-bold', // fs-1 ≈ 32px
    subtitle: 'fs-3 lh-sm fw-bold', // fs-3 ≈ 20px
    link: 'fs-5 lh-lg text-primary text-decoration-underline cursor-pointer fw-normal',
    size20:'fs-4 lh-1 fw-semibold',
    italic34: 'fs-1 fw-light lh-1 fst-italic',
    italic18: 'fs-4 fw-light lh-1 fst-italic'
  };

  // Combine all classes
  const combinedClassName = `${baseClasses} ${typeClasses[type]} ${className}`;

  
  const customStyles: React.CSSProperties = {
    ...style,
    ...(lightColor && { color: lightColor }),
  };

  return (
    <span
      className={combinedClassName}
      style={customStyles}
      {...rest}
    />
  );
}