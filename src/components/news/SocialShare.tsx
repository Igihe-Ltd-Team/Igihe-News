'use client';

import React, { useState, useRef, useEffect } from "react";
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { ThemedText } from "../ThemedText";

const socialMediaLinks = [
  {
    name: "Facebook",
    url: "https://www.facebook.com/sharer/sharer.php?u=",
    img: "Facebook.svg"
  },
  {
    name: "X",
    url: "https://twitter.com/intent/tweet?url=",
    img: "X.svg"
  },
  {
    name: "LinkedIn",
    url: "https://www.linkedin.com/sharing/share-offsite/?url=",
    img: "LinkedIn.svg"
  },
  {
    name: "WhatsApp",
    url: "https://api.whatsapp.com/send?text=",
    img: "Whatsapp.svg"
  },
  {
    name: "Email",
    url: "mailto:?subject=Check this out!&body=",
    img: "Mail.svg"
  }
];

const SocialShare = ({ postUrl }: { postUrl: string }) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const [showPopup, setShowPopup] = useState(false);

  // Handle clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setShowPopup(false);
      }
    };

    if (showPopup) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPopup]);

  return (
    <div className="social-share-container" ref={popupRef}>

      {/* Toggle button (visible on mobile only) */}
      <span
        className="share-toggle-btn z-10"
        onClick={() => setShowPopup(!showPopup)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="19" height="17" fill="#1176BB" className="bi bi-share-fill" viewBox="0 0 16 16">
          <path d="M13.5 1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3M11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.5 2.5 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5m-8.5 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3m11 5.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3" />
        </svg>
      </span>

      <ThemedText type="smallBold" className="text-uppercase d-none d-md-block">Share</ThemedText>

      {/* Social Icons */}
      <ul className={`social-icons list-unstyled ${showPopup ? "show-mobile" : ""} bg-white`}>
        {socialMediaLinks.map((platform, index) => (
          <li key={index}>
            <a
              href={`${platform.url}${encodeURIComponent(postUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <OptimizedImage
                src={`/assets/${platform.img}`}
                alt={platform.name}
                fill
                height={45}
              />
            </a>
          </li>
        ))}
      </ul>

    </div>
  );
};

export default SocialShare;
