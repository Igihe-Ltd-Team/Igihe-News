'use client'

import { useState } from 'react'
import { FooterSubscribeArrow } from './FooterIcons'

const COPY = {
  label: 'Your email address',
  button: 'Subscribe',
  // This site has no newsletter service yet (the Kinyarwanda site's /api/newsletter can be
  // ported when wanted), so the form says so instead of pretending to subscribe.
  unavailable: 'Newsletter sign-up is not available yet.',
}

/** The newsletter sign-up of the footer design: one email field and a Subscribe button with an arrow. */
export default function FooterNewsletterForm() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  return (
    <div className="ft__newsletter-form">
      <form
        className="ft__form"
        noValidate
        onSubmit={event => {
          event.preventDefault()
          setMessage(COPY.unavailable)
        }}
      >
        <label htmlFor="footer-newsletter-email" className="visually-hidden">
          {COPY.label}
        </label>
        <input
          id="footer-newsletter-email"
          className="ft__input"
          type="email"
          name="email"
          inputMode="email"
          autoComplete="email"
          placeholder={COPY.label}
          value={email}
          onChange={event => setEmail(event.target.value)}
          required
        />
        <button className="ft__submit" type="submit">
          {COPY.button}
          <FooterSubscribeArrow />
        </button>
      </form>
      {/* Always rendered so assistive technology announces a change to it. */}
      <p id="footer-newsletter-message" className="ft__form-status" role="status" aria-live="polite">
        {message}
      </p>
    </div>
  )
}
