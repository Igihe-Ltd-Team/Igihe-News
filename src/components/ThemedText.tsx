// 'use client';

// import { useTheme } from 'next-themes';
// import { HTMLAttributes } from 'react';
// import DOMPurify from 'isomorphic-dompurify';

// export type ThemedTextProps = HTMLAttributes<HTMLSpanElement> & {
//   lightColor?: string;
//   darkColor?: string;
//   type?: 'small' | 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'defaultItalic' | 'smallBold' | 'size20' | 'italic34' | 'italic18';
//   className?: string
// };


// const parseCustomMarkup = (content: string) => {
//     if (!content) return '';

//     return content
//         // Convert [text->url] to <a href="url">text</a>
//         .replace(/\[([^\]]+)->([^\]]+)\]/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
//         // Convert {{text}} to <strong>text</strong>
//         .replace(/\{\{([^}]+)\}\}/g, '<strong>$1</strong>')
//         .replace(/&#8217;/g, "'")
//     .replace(/&#8216;/g, "'")   // opening single quote
//     .replace(/&#8220;/g, '"')   // opening double quote
//     .replace(/&#8221;/g, '"')   // closing double quote
//     .replace(/&#8211;/g, '–')   // en dash
//     .replace(/&#8212;/g, '—')   // em dash
//     .replace(/&#038;/g, '&')    // ampersand
//     .replace(/&amp;/g, '&')     // ampersand (named)
//     // Convert [text->url] to <a>
//     .replace(/\[([^\]]+)->([^\]]+)\]/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
//     // Convert {{text}} to <strong>
//     .replace(/\{\{([^}]+)\}\}/g, '<strong>$1</strong>');
// };


// export function ThemedText({
//   style,
//   lightColor,
//   darkColor,
//   type = 'default',
//   className = '',
//   ...rest
// }: ThemedTextProps) {
//   // Base Bootstrap classes
//   const baseClasses = 'font-raleway';
//   const { theme, systemTheme } = useTheme();
//   // Type-specific Bootstrap classes
//   const typeClasses = {
//     small: 'small-txt fw-normal', // fs-6 ≈ 12px, fw-light
//     smallBold: 'small-txt lh-1 fw-bold',
//     default: 'normal-text lh-sm fw-medium', // fs-5 ≈ 16px
//     defaultItalic: 'normal-text lh-sm fw-normal fst-italic',
//     defaultSemiBold: 'normal-text lh-sm fw-semibold',
//     title: 'fs-1 lh-1 fw-bold', // fs-1 ≈ 32px
//     subtitle: 'fs-3 lh-sm fw-bold', // fs-3 ≈ 20px
//     link: 'fs-5 lh-lg text-primary text-decoration-underline cursor-pointer fw-normal',
//     size20: 'fs-4 lh-1 fw-semibold',
//     italic34: 'fs-1 fw-light lh-1 fst-italic',
//     italic18: 'fs-4 fw-light lh-1 fst-italic'
//   };

//   // Combine all classes
//   const combinedClassName = `${baseClasses} ${typeClasses[type]} ${className}`;


//   const customStyles: React.CSSProperties = {
//     ...style,
//     color: theme === "dark" ? darkColor : lightColor
//   };


// const clean = DOMPurify.sanitize(parseCustomMarkup(rest.children as string));

//   return (
//     <span className={combinedClassName}
//       style={customStyles}
//       dangerouslySetInnerHTML={{ __html: clean || '' }}

      
//     />
//   );
// }


'use client';
import { useTheme } from 'next-themes';
import { HTMLAttributes } from 'react';
import DOMPurify from 'isomorphic-dompurify';

export type ThemedTextProps = HTMLAttributes<HTMLSpanElement> & {
  lightColor?: string;
  darkColor?: string;
  type?: 'small' | 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'defaultItalic' | 'smallBold' | 'size20' | 'italic34' | 'italic18';
  className?: string;
};

const parseCustomMarkup = (content: string): string => {
  if (!content) return '';

  return content
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#038;/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/\[([^\]]+)->([^\]]+)\]/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\{\{([^}]+)\}\}/g, '<strong>$1</strong>');
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  className = '',
  children,
  ...rest
}: ThemedTextProps) {
  const baseClasses = 'font-raleway';
  const { theme } = useTheme();

  const typeClasses = {
    small: 'small-txt fw-normal',
    smallBold: 'small-txt lh-1 fw-bold',
    default: 'normal-text lh-sm fw-medium',
    defaultItalic: 'normal-text lh-sm fw-normal fst-italic',
    defaultSemiBold: 'normal-text lh-sm fw-semibold',
    title: 'fs-1 lh-1 fw-bold',
    subtitle: 'fs-3 lh-sm fw-bold',
    link: 'fs-5 lh-lg text-primary text-decoration-underline cursor-pointer fw-normal',
    size20: 'fs-4 lh-1 fw-semibold',
    italic34: 'fs-1 fw-light lh-1 fst-italic',
    italic18: 'fs-4 fw-light lh-1 fst-italic',
  };

  const combinedClassName = `${baseClasses} ${typeClasses[type]} ${className}`;

  const customStyles: React.CSSProperties = {
    ...style,
    color: theme === 'dark' ? darkColor : lightColor,
  };

  // If children is a string, parse and sanitize it
  // Otherwise render normally without dangerouslySetInnerHTML
  if (typeof children === 'string') {
    const clean = DOMPurify.sanitize(parseCustomMarkup(children), {
      ADD_TAGS: ['iframe'],
      ADD_ATTR: ['allowfullscreen', 'frameborder', 'src', 'allow', 'loading'],
    });

    return (
      <span
        className={combinedClassName}
        style={customStyles}
        dangerouslySetInnerHTML={{ __html: clean }}
        {...rest}
      />
    );
  }

  return (
    <span className={combinedClassName} style={customStyles} {...rest}>
      {children}
    </span>
  );
}