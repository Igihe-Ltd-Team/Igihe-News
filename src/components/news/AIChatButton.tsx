'use client'

import { useState, useRef, useEffect } from 'react'
import { useGemini } from '@/hooks/useGemini'
import { NewsItem } from '@/types/fetchData'

interface Message {
  id: string
  type: 'user' | 'ai' | 'loading'
  text: string
}

export default function AIChatButton({ article }: { article?: NewsItem }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { loading, error, ...gemini } = useGemini()

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: '1',
          type: 'ai',
          text: article
            ? `Hi! I'm your AI assistant for this article. Ask me to summarize, get key points, or explain!`
            : `Hello! Ask me to summarize, explain, or find articles.`,
        },
      ])
    }
  }, [isOpen, article])

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMsg: Message = { id: Date.now().toString(), type: 'user', text: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')

    const loadingMsg: Message = { id: (Date.now() + 1).toString(), type: 'loading', text: '' }
    setMessages(prev => [...prev, loadingMsg])

    try {
      let response = ''
      const lower = input.toLowerCase()

      if (lower.includes('summarize') || lower.includes('summary')) {
        response = article ? await gemini.summarize(article) : 'No article selected.'
      } else if (lower.includes('key points') || lower.includes('takeaways')) {
        const points = article ? await gemini.getKeyPoints(article) : []
        response = points.length > 0 ? points.map(p => `• ${p}`).join('<br/>') : 'No key points.'
      } else if (lower.includes('explain')) {
        const term = input.split(/explain/i)[1]?.trim() || ''
        response = term ? await gemini.explainText(term) : 'What to explain?'
      } 
    //   else if (lower.includes('listen') || lower.includes('read aloud')) {
    //     if (article) {
    //       const url = await gemini.generateNarration(article)
    //       response = `Narration ready! [Play](${url})`
    //     } else {
    //       response = 'No article to read.'
    //     }
    //   }
      else if (article) {
        response = await gemini.askQuestion(article, input)
      } else {
        response = 'Try: summarize, key points, explain...'
      }

      setMessages(prev => prev.map(m => (m.type === 'loading' ? { ...m, type: 'ai', text: response } : m)))
    } catch {
      setMessages(prev =>
        prev.map(m =>
          m.type === 'loading' ? { ...m, type: 'ai', text: 'Sorry, something went wrong.' } : m
        )
      )
    }
  }

  const quickActions = article
    ? [
        { label: 'Summarize', cmd: 'summarize this article' },
        { label: 'Key Points', cmd: 'key points' },
        // { label: 'Read Aloud', cmd: 'read aloud' },
      ]
    : [
        { label: 'Explain', cmd: 'explain' },
        { label: 'Digest', cmd: 'daily digest' },
      ]

  const sendQuick = (cmd: string) => {
    setInput(cmd)
    setTimeout(sendMessage, 100)
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="btn btn-lg btn-primary rounded-circle position-fixed bottom-0 end-0 m-4 shadow-lg d-flex align-items-center justify-content-center"
        style={{
          width: '60px',
          height: '60px',
          background: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
          border: 'none',
          zIndex: 1050,
        }}
      >
        <i className="bi bi-robot fs-3 text-white"></i>
        <span
          className="position-absolute top-0 end-0 translate-middle-x badge rounded-pill bg-success"
          style={{ width: '12px', height: '12px' }}
        ></span>
      </button>

      {/* Chat Modal */}
      <div
        className={`modal fade ${isOpen ? 'show d-block' : ''}`}
        style={{ display: isOpen ? 'block' : 'none', background: 'rgba(0,0,0,0.5)' }}
        tabIndex={-1}
        onClick={() => setIsOpen(false)}
      >
        <div
          className="modal-dialog modal-dialog-scrollable modal-lg position-fixed bottom-0 end-0 m-4"
          style={{ maxWidth: '380px' }}
          onClick={e => e.stopPropagation()}
        >
          <div
            className="modal-content rounded-3 shadow-lg"
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            {/* Header */}
            <div
              className="modal-header border-0 text-white"
              style={{
                background: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
                borderRadius: '12px 12px 0 0',
              }}
            >
              <div className="d-flex align-items-center gap-2">
                <div className="position-relative">
                  <i className="bi bi-robot fs-4"></i>
                  <span
                    className="position-absolute bottom-0 end-0 badge rounded-pill bg-success"
                    style={{ width: '8px', height: '8px' }}
                  ></span>
                </div>
                <div>
                  <h5 className="mb-0">Ask IGIHE</h5>
                  <small>Gemini Powered</small>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="btn-close btn-close-white"
                aria-label="Close"
              ></button>
            </div>

            {/* Messages */}
            <div className="modal-body p-3" style={{ maxHeight: '400px' }}>
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`d-flex mb-3 ${
                    msg.type === 'user' ? 'justify-content-end' : 'justify-content-start'
                  }`}
                >
                  <div
                    className={`rounded-3 px-3 py-2 max-w-75 ${
                      msg.type === 'user'
                        ? 'bg-primary text-white'
                        : msg.type === 'loading'
                        ? 'bg-light text-muted'
                        : 'bg-white text-dark'
                    }`}
                    style={{
                      boxShadow: msg.type === 'ai' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    }}
                  >
                    {msg.type === 'loading' ? (
                      <div className="d-flex align-items-center gap-2">
                        <div className="spinner-border spinner-border-sm" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <small>Thinking...</small>
                      </div>
                    ) : (
                        <div
                            className="post-content d-block whitespace-pre-wrap"
                            style={{
                                overflow: 'hidden',
                                width: '100%'
                            }}
                            dangerouslySetInnerHTML={{ __html: msg.text || '' }}
                        />
                    //   <small className="d-block whitespace-pre-wrap">{msg.text}</small>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            {quickActions.length > 0 && (
              <div className="border-top border-white border-opacity-10 bg-white bg-opacity-5 p-2">
                <div className="d-flex gap-1">
                  {quickActions.map((action, i) => (
                    <button
                      key={i}
                      onClick={() => sendQuick(action.cmd)}
                      disabled={loading}
                      className="btn btn-sm flex-fill"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="modal-footer border-0 p-3 bg-white bg-opacity-5">
              <div className="input-group">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Ask AI..."
                  className="form-control form-control-sm bg-white bg-opacity-10 border-0 placeholder-white placeholder-opacity-75"
                  style={{ borderRadius: '8px 0 0 8px' }}
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  className="btn btn-primary btn-sm"
                  style={{ borderRadius: '0 8px 8px 0' }}
                >
                  {loading ? (
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                  ) : (
                    <i className="bi bi-send"></i>
                  )}
                </button>
              </div>
              {error && <div className="text-danger small mt-1">{error}</div>}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}