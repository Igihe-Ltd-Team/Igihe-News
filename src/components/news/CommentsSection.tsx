'use client'
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import HeaderDivider from '../HeaderDivider';

interface Comment {
  id: string;
  commentorName: string;
  comment: string;
  dateAdded: string;
  replyTo: string; // "0" = top-level, otherwise parent comment id
}

interface CommentFormData {
  name: string;
  email: string;
  comment: string;
  saveInfo: boolean;
}
interface ToastProps{
  type?: string
  message?: string
}

const API_BASE_URL = '/api/comments';


const Toast = ({ type, message }: ToastProps) => {
  if (!message) return null;
  const c = type === "success" ? "#36D146" : "#EF4444";
  return (
    <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 9999, background: "#181818", border: `1px solid ${c}40`, borderRadius: 12, padding: "13px 18px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 12px 40px rgba(0,0,0,0.7)", animation: "slideUp 0.25s ease", maxWidth: 360 }}>
      <div style={{ width: 7, height: 7, borderRadius: "50%", background: c, flexShrink: 0 }} />
      <span style={{ fontSize: 13, color: "#ddd", fontWeight: 500 }}>{message}</span>
    </div>
  );
};


const fetchComments = async (identifier: number): Promise<Comment[]> => {
  const response = await axios.get(`${API_BASE_URL}?identifier=${identifier}`);
  const data = response.data.data;

  if (Array.isArray(data)) {
    return data.map((item: any) => ({
      id: String(item.id),
      commentorName: item.name,
      comment: item.comment,
      dateAdded: item.date_added,
      replyTo: String(item.reply_to), // normalize to string
    }));
  }
  return [];
};

const submitComment = async (
  formData: CommentFormData,
  identifier: number,
  reference: string,
  url: string,
  replyTo?: string // NEW
) => {
  const payload: Record<string, string> = {
    name: formData.name,
    email: formData.email,
    comment: formData.comment,
    identifier: identifier.toString(),
    reference: reference,
    url: url,
  };

  if (replyTo) {
    payload.reply_to = replyTo; // only attach if replying
  }

  const response = await axios.post(API_BASE_URL, payload);
  return response.data.data;
};

interface CommentsSectionProps {
  identifier: number;
  reference: string;
  url: string;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({ identifier, reference, url }) => {
  const [formData, setFormData] = useState<CommentFormData>({
    name: '',
    email: '',
    comment: '',
    saveInfo: false,
  });

  const [toast, setToast]         = useState<ToastProps | null>(null);

  // Track which comment is being replied to
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);

  const queryClient = useQueryClient();

  const { data: comments = [], isLoading, error } = useQuery({
    queryKey: ['comments', identifier],
    queryFn: () => fetchComments(identifier),
    staleTime: 1000 * 60 * 5,
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      submitComment(formData, identifier, reference, url, replyingTo?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', identifier] });
      setFormData(prev => ({
        name: prev.saveInfo ? prev.name : '',
        email: prev.saveInfo ? prev.email : '',
        comment: '',
        saveInfo: prev.saveInfo,
      }));
      setReplyingTo(null); // clear reply context after submit
      showToast("Your idea has been submitted successfully. It will be visible after review. Thank you!");
    },
    onError: (error) => {
      console.error('Failed to submit comment:', error);
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.comment.trim()) {
      alert('Please fill in all required fields');
      return;
    }
    submitMutation.mutate();
  };

  // Separate top-level comments from replies
  const topLevelComments = comments.filter(c => c.replyTo === '0');
  const getReplies = (parentId: string) => comments.filter(c => c.replyTo === parentId);


  const showToast = (message: string, type: string = "success") => {
  setToast({ message, type });
  setTimeout(() => setToast(null), 3500);
};

// useEffect(()=>{
//       showToast("Your idea has been submitted successfully. It will be visible after review. Thank you!");},[])
  return (
    <div className="comments-section">
      <div className="comments-header">
        <HeaderDivider title={`${topLevelComments.length} Comment${topLevelComments.length !== 1 ? 's' : ''}`} />
      </div>

      {isLoading && <p>Loading comments...</p>}
      {error && <p>Failed to load comments. Please try again later.</p>}

      {/* Comments List */}
      {!isLoading && topLevelComments.length > 0 && (
        <div className="comments-list">
          {topLevelComments.map((comment) => {
            const replies = getReplies(comment.id);

            return (
              <div key={comment.id} className="comment-thread">
                {/* Parent comment */}
                <CommentItem
                  comment={comment}
                  onReply={() => {
                    setReplyingTo({ id: comment.id, name: comment.commentorName });
                    // Scroll form into view
                    document.getElementById('comment-form')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                />

                {/* Replies — indented */}
                {replies.length > 0 && (
                  <div className="comment-replies">
                    {replies.map((reply) => (
                      <CommentItem
                        key={reply.id}
                        comment={reply}
                        isReply
                        onReply={() => {
                          // Replies-to-replies also point to the top-level comment
                          // to keep threading flat (one level deep)
                          setReplyingTo({ id: comment.id, name: reply.commentorName });
                          document.getElementById('comment-form')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && comments.length === 0 && !error && (
        <p>No comments yet. Be the first to comment!</p>
      )}

      {/* Comment Form */}
      <div className="comment-form-section" id="comment-form">
        {/* Reply context banner */}
        {replyingTo && (
          <div className="reply-context">
            <span>↩ Replying to <strong>{replyingTo.name}</strong></span>
            <button
              className="cancel-reply"
              onClick={() => setReplyingTo(null)}
              type="button"
            >
              ✕ Cancel
            </button>
          </div>
        )}

        <h2 className="form-title">{replyingTo ? 'Leave a reply' : 'Leave a comment'}</h2>

        <form onSubmit={handleSubmit} className="comment-form">
          <div className="form-group">
            <textarea
              name="comment"
              value={formData.comment}
              onChange={handleInputChange}
              placeholder="Comment"
              className="form-textarea"
              required
              disabled={submitMutation.isPending}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Name"
                className="form-input"
                required
                disabled={submitMutation.isPending}
              />
            </div>
            <div className="form-group">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Email"
                className="form-input"
                required
                disabled={submitMutation.isPending}
              />
            </div>
          </div>

          <div className="form-checkbox">
            <input
              type="checkbox"
              id="saveInfo"
              name="saveInfo"
              checked={formData.saveInfo}
              onChange={handleInputChange}
              disabled={submitMutation.isPending}
            />
            <label htmlFor="saveInfo">
              Save my name and email in this browser for the next time I comment.
            </label>
          </div>

          {submitMutation.isError && (
            <div className="form-error">Failed to submit comment. Please try again.</div>
          )}

          <button type="submit" className="submit-button" disabled={submitMutation.isPending}>
            {submitMutation.isPending ? 'Posting...' : replyingTo ? 'Post Reply' : 'Post Comment'}
          </button>
        </form>
      </div>
    <Toast {...toast} />
    </div>
  );
};


// Extracted reusable comment item
interface CommentItemProps {
  comment: Comment;
  isReply?: boolean;
  onReply: () => void;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, isReply = false, onReply }) => (
  <div className={`comment-item ${isReply ? 'comment-item--reply' : ''}`}>
    <div className="comment-avatar">
      <Image
        src="/assets/user-avatar.png"
        alt="avatar"
        width={isReply ? 35 : 45}
        height={isReply ? 35 : 45}
        className="avatar-image"
      />
    </div>
    <div className="comment-content d-flex flex-column">
      <div className="comment-header d-flex gap-1">
        <h3 className="comment-author">{comment.commentorName}</h3>
        <span className="comment-timestamp">on {formatDate(comment.dateAdded)}</span>
      </div>
      <p className="comment-text">{comment.comment}</p>
      <button className="reply-button align-self-end" onClick={onReply} type="button">
        REPLY <span className="reply-arrow">›</span>
      </button>
    </div>
  </div>
);


function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return dateString;
  }
}

export default CommentsSection;