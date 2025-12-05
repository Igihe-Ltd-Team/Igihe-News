'use client';

import { useTheme } from 'next-themes';
import { HTMLAttributes } from 'react';

export type ThemedTextProps = HTMLAttributes<HTMLSpanElement> & {
  lightColor?: string;
  darkColor?: string;
  type?: 'small' | 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'defaultItalic' | 'smallBold' | 'size20' | 'italic34' | 'italic18';
  className?:string
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  className = '',
  ...rest
}: ThemedTextProps) {
  // Base Bootstrap classes
  const baseClasses = 'font-raleway';
  const { theme, systemTheme } = useTheme();
  // Type-specific Bootstrap classes
  const typeClasses = {
    small: 'small-txt fw-normal', // fs-6 ≈ 12px, fw-light
    smallBold: 'small-txt lh-1 fw-bold',
    default: 'normal-text lh-sm fw-medium', // fs-5 ≈ 16px
    defaultItalic: 'normal-text lh-sm fw-normal fst-italic',
    defaultSemiBold: 'normal-text lh-base fw-semibold',
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
    color: theme === "dark" ? darkColor : lightColor
    // ...(lightColor && { color: lightColor }),
    // ...(darkColor && { color: darkColor})
  };

  return (
    <span
      className={combinedClassName}
      style={customStyles}
      {...rest}
    />
  );
}