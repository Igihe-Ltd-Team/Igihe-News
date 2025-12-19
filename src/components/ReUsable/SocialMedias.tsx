import React from 'react'
import { ThemedText } from '../ThemedText'

function SocialMedias() {
    return (
        <div className="social-container">
            <div className='social-media-title'>
                <ThemedText type='size20' className='section-title'>Stay In Touch</ThemedText>
                <div className="title-underline"></div>
            </div>

            <div className="row g-3">
                <div className="col-md-6">
                    <a target='_blank' href="https://www.facebook.com/igihe" className="social-card">
                        <i className="bi bi-facebook facebook social-icon"></i>
                        <span className="social-name">Facebook</span>
                    </a>
                </div>

                <div className="col-md-6">
                    <a target='_blank' href="https://www.youtube.com/@IGIHE_Official" className="social-card">
                        <i className="bi bi-youtube youtube social-icon"></i>
                        <span className="social-name">Youtube</span>
                    </a>
                </div>

                <div className="col-md-6">
                    <a target='_blank' href="https://www.tiktok.com/@igihe?lang=en" className="social-card">
                        <i className="bi bi-tiktok tiktok social-icon"></i>
                        <span className="social-name">TikTok</span>
                    </a>
                </div>

                <div className="col-md-6">
                    <a target='_blank' href="#" className="social-card">
                        <i className="bi bi-whatsapp whatsapp social-icon"></i>
                        <span className="social-name">WhatsApp</span>
                    </a>
                </div>

                <div className="col-md-6">
                    <a target='_blank' href="https://x.com/igihe" className="social-card">
                        <i className="bi bi-twitter-x twitter social-icon"></i>
                        <span className="social-name">X (Twitter)</span>
                    </a>
                </div>

                <div className="col-md-6">
                    <a target='_blank' href="https://www.instagram.com/igiheofficial/" className="social-card">
                        <i className="bi bi-instagram instagram social-icon"></i>
                        <span className="social-name">Instagram</span>
                    </a>
                </div>
            </div>
        </div>
    )
}

export default SocialMedias