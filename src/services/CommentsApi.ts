import axios, { AxiosInstance } from 'axios';

/**
 * API client configuration for comments endpoints
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'http://localhost:8000';

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Comment API types
 */
export interface FetchCommentsParams {
  identifier: string;
}

export interface SubmitCommentParams {
  name: string;
  email: string;
  comment: string;
  identifier: string;
  reference: string; // Article title/reference
  url: string; // Article URL
}

export interface CommentResponse {
  commentorName: string;
  comment: string;
  dateAdded: string;
  email?: string;
}

export interface ApiResponse {
  nodes: Array<{
    node: {
      Status?: string;
      commentorName?: string;
      comment?: string;
      dateAdded?: string;
      name?: string;
      email?: string;
    };
  }>;
}

/**
 * Fetch approved comments for a specific page/article
 * @param identifier - Unique identifier for the page
 * @returns Array of comments
 */
export const commentsAPI = {
  /**
   * Fetch all approved comments for an identifier
   */
  fetchComments: async (identifier: string): Promise<CommentResponse[]> => {
    try {
      const response = await apiClient.get('/api/comments.php', {
        params: {
          identifier,
        },
      });

      // Handle the nested response structure from your PHP backend
      if (Array.isArray(response.data) && response.data[0]?.nodes) {
        return response.data[0].nodes
          .map((item: any) => ({
            commentorName: item.node.commentorName || 'Anonymous',
            comment: item.node.comment || '',
            dateAdded: item.node.dateAdded || new Date().toISOString(),
          }))
          .filter((comment: CommentResponse) => comment.comment); // Filter out empty comments
      }

      return [];
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  },

  /**
   * Submit a new comment
   */
  submitComment: async (params: SubmitCommentParams) => {
    try {
      // Build query string manually to match PHP backend expectations
      const queryParams = new URLSearchParams({
        name: params.name,
        email: params.email,
        comment: params.comment,
        identifier: params.identifier,
        title: params.reference,
        url: params.url,
      }).toString();

      const response = await apiClient.get(`/api/comments.php?${queryParams}`);

      // Check if submission was successful
      if (Array.isArray(response.data) && response.data[0]?.nodes) {
        const firstNode = response.data[0].nodes[0]?.node;
        if (firstNode?.Status === 'Success') {
          return {
            success: true,
            data: firstNode,
          };
        }
      }

      return {
        success: false,
        error: 'Failed to submit comment',
      };
    } catch (error) {
      console.error('Error submitting comment:', error);
      throw error;
    }
  },

  /**
   * Get comments count for analytics/display
   */
  getCommentCount: async (identifier: string): Promise<number> => {
    try {
      const comments = await commentsAPI.fetchComments(identifier);
      return comments.length;
    } catch {
      return 0;
    }
  },
};

export default commentsAPI;