'use client';

interface SkeletonProps {
    count?: number
}
export default function NewsSkeleton({count = 6}:SkeletonProps) {
  const items = Array.from({ length: count });

  return (
    <div className="container">
      <div className="row g-4">
        {items.map((_, i) => (
          <div className="col-md-4" key={i}>
            <div className="card border-0 shadow-sm">
              <div
                className="placeholder-glow"
                style={{
                  height: '200px',
                  backgroundColor: '#e9ecef',
                  borderRadius: '8px',
                }}
              />
              <div className="card-body">
                <h5 className="card-title placeholder-glow">
                  <span className="placeholder col-8"></span>
                </h5>
                <p className="card-text placeholder-glow">
                  <span className="placeholder col-7"></span>
                  <span className="placeholder col-4"></span>
                  <span className="placeholder col-4"></span>
                  <span className="placeholder col-6"></span>
                </p>
                <button
                  className="btn btn-primary disabled placeholder col-6"
                  aria-disabled="true"
                ></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
