import React, { useState, useEffect, useRef } from 'react';
import { Modal, Form, ListGroup, Badge, Spinner } from 'react-bootstrap';
import { useNewsData } from '@/hooks/useNewsData';
import { useRouter } from 'next/navigation';
import { NewsItem } from '@/types/fetchData';
import { stripHtml } from '@/lib/utils';
import { ThemedText } from './ThemedText';

export default function SearchModal() {
  const [show, setShow] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NewsItem[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  // const inputRef = useRef(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  const { 
    searchAsync, 
    searchLoading,
    popularArticles
  } = useNewsData();

  // Load recent searches
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Focus input when modal opens
  useEffect(() => {
    if (show && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [show]);

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e:KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShow(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const results = await searchAsync({ query: searchQuery });
        setSearchResults(results.articles.data || []);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchAsync]);

  const saveRecentSearch = (query: string) => {
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 4);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const handleClose = () => {
    setShow(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSearch = (e:React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      saveRecentSearch(searchQuery.trim());
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      handleClose();
    }
  };

  const handleResultClick = (article: NewsItem) => {
    saveRecentSearch(stripHtml(article.title.rendered));
    router.push(`/news/article/${article.slug}`);
    handleClose();
  };

  const handleRecentSearchClick = (search: string) => {
    setSearchQuery(search);
  };

  const handleTrendingClick = (article: NewsItem) => {
    router.push(`/news/article/${article.slug}`);
    handleClose();
  };

  

  return (
    <>
      <div className="searchButton" onClick={() => setShow(true)}>
        <svg
          width="18"
          height="18"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M17.5 17.5L14.5834 14.5833M16.6667 9.58333C16.6667 13.4953 13.4953 16.6667 9.58333 16.6667C5.67132 16.6667 2.5 13.4953 2.5 9.58333C2.5 5.67132 5.67132 2.5 9.58333 2.5C13.4953 2.5 16.6667 5.67132 16.6667 9.58333Z"
            stroke="black"
            strokeWidth="1.66667"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* React Bootstrap Modal */}
      <Modal 
        show={show} 
        onHide={handleClose}
        size="lg"
        centered
        className="search-modal"
      >
        <div className="gradient-header"></div>
        
        <Modal.Header closeButton={false}  className="border-bottom-0 pb-0">
          <div className="w-100">
            <div className="position-relative">
              {searchLoading ? (
                <div className="position-absolute start-0 top-50 translate-middle-y ms-3">
                  <Spinner animation="border" size="sm" variant="primary" />
                </div>
              ) : (
                <i className="bi bi-search position-absolute start-0 top-50 translate-middle-y ms-3 text-muted fs-5"></i>
              )}
              <Form.Control
                ref={inputRef}
                type="text"
                size="lg"
                placeholder="Search articles, news, and more..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                // onKeyPress={(e:KeyboardEvent) => e.key === 'Enter' && handleSearch(e)}
  //               onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
  //   if (e.key === 'Enter') {
  //     handleSearch(e);
  //   }
  // }}
                className="ps-5 pe-5 border-0 bg-light"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="btn btn-link position-absolute end-0 top-50 translate-middle-y text-muted p-0 me-2"
                  onClick={() => setSearchQuery('')}
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              )}
            </div>
            <div className="d-flex align-items-center gap-2 mt-2 text-muted small">
              <i className="bi bi-stars text-warning"></i>
              <span>ESC to close</span>
            </div>
          </div>
        </Modal.Header>

        <Modal.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {/* Search Results */}
          {searchQuery && searchResults.length > 0 && (
            <div className="mb-4">
              <div className="d-flex align-items-center gap-2 mb-3">
                <i className="bi bi-file-text text-primary"></i>
                <h6 className="mb-0 fw-bold">Search Results</h6>
                <Badge bg="primary" pill>{searchResults.length}</Badge>
              </div>
              <ListGroup>
                {searchResults.map((article) => (
                  <ListGroup.Item
                    key={article.id}
                    action
                    onClick={() => handleResultClick(article)}
                    className="rounded-3 mb-2 border cursor-pointer"
                  >
                    <ThemedText className="fw-medium text-truncate">
                      {stripHtml(article.title.rendered)}
                    </ThemedText>
                    {article.excerpt?.rendered && (
                      <ThemedText className="text-muted text-truncate d-block mt-1">
                        {stripHtml(article.excerpt.rendered)}
                      </ThemedText>
                    )}
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </div>
          )}

          {/* No Results */}
          {searchQuery && searchResults.length === 0 && !searchLoading && (
            <div className="text-center py-5">
              <i className="bi bi-search text-muted display-1 opacity-25"></i>
              <p className="text-muted mt-3">No results found for "{searchQuery}"</p>
            </div>
          )}

          {/* Default View */}
          {!searchQuery && (
            <div className="row g-4">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="col-md-6">
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <i className="bi bi-clock-history text-muted"></i>
                    <h6 className="mb-0 fw-bold">Recent Searches</h6>
                  </div>
                  <ListGroup>
                    {recentSearches.map((search, index) => (
                      <ListGroup.Item
                        key={index}
                        action
                        onClick={() => handleRecentSearchClick(search)}
                        className="rounded-3 mb-2 d-flex justify-content-between align-items-center"
                      >
                        <ThemedText className="text-truncate">{search}</ThemedText>
                        <i className="bi bi-arrow-right text-muted"></i>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </div>
              )}

              {/* Trending Articles */}
              {popularArticles.length > 0 && (
                <div className="col-md-6">
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <i className="bi bi-fire text-danger"></i>
                    <h6 className="mb-0 fw-bold">Populor Now</h6>
                  </div>
                  <ListGroup>
                    {popularArticles.slice(0, 4).map((article) => (

                        <ListGroup.Item
                        key={article.id}
                        action
                        onClick={() => handleTrendingClick(article)}
                        className="rounded-3 mb-2 d-flex justify-content-between align-items-center"
                      >
                        <ThemedText className="text-truncate">{stripHtml(article.title.rendered)}</ThemedText>
                      </ListGroup.Item>

                    ))}
                  </ListGroup>
                </div>
              )}
            </div>
          )}
        </Modal.Body>

        <Modal.Footer className="border-top">
          <div className="d-flex justify-content-between align-items-center w-100">
            <div className="d-flex gap-3 text-muted small">
              {/* <span className="d-flex align-items-center gap-1">
                <kbd className="bg-light border px-2 py-1 rounded">
                  <i className="bi bi-arrow-return-left"></i>
                </kbd>
                <span>to search</span>
              </span>
              <span className="d-flex align-items-center gap-1">
                <kbd className="bg-light border px-2 py-1 rounded">ESC</kbd>
                <span>to close</span>
              </span> */}
            </div>
            <button
              onClick={handleClose}
              className="btn btn-link text-muted text-decoration-none d-flex align-items-center gap-2"
            >
              <span>Close</span>
              <i className="bi bi-x-circle"></i>
            </button>
          </div>
        </Modal.Footer>
      </Modal>

      <style jsx global>{`
        .btn-gradient {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }

        .btn-gradient:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
          color: white;
        }

        .gradient-header {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
        }

        .search-modal .modal-content {
          border-radius: 1rem;
          border: none;
          overflow: hidden;
        }

        .bg-gradient-light {
          background: linear-gradient(135deg, #fff5f5 0%, #ffe5f0 100%);
        }

        .cursor-pointer {
          cursor: pointer;
        }

        kbd {
          font-family: ui-monospace, monospace;
          font-size: 0.75rem;
        }

        .list-group-item {
          transition: all 0.2s ease;
        }

        .list-group-item:hover {
          transform: translateX(4px);
          background-color: #f8f9fa;
        }
      `}</style>
    </>
  );
}