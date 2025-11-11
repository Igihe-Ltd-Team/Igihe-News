'use client';

interface SkeletonProps {
    count?: number
}
export default function SingleSkeleton({count = 1}:SkeletonProps) {
  const items = Array.from({ length: count });

  return (
    <div className="container">
      <div className="row g-4">
          <div className="col-md-8">
            <div className="card border-0">
              <div
                className="placeholder-glow"
                style={{
                  height: '300px',
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
                  <span className="placeholder col-7"></span>
                  <span className="placeholder col-7"></span>
                  <span className="placeholder col-6"></span>
                  <span className="placeholder col-4"></span>
                </p>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <p className="card-text placeholder-glow">
              <span className="placeholder col-7"></span>
              <span className="placeholder col-4"></span>
              <span className="placeholder col-4"></span>
              <span className="placeholder col-6"></span>
              <span className="placeholder col-7"></span>
              <span className="placeholder col-7"></span>
              <span className="placeholder col-6"></span>
              <span className="placeholder col-4"></span>
            </p>
            <div
                className="placeholder-glow"
                style={{
                  height: '190px',
                  backgroundColor: '#e9ecef',
                  borderRadius: '8px',
                }}
              />

          </div>
      </div>
    </div>
  );
}
