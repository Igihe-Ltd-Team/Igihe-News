"use client";

import { Button } from "react-bootstrap";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
        <p className="text-gray-600 mb-6">{error.message}</p>
        <Button
          variant="primary"
          onClick={() => reset()}
          className="px-6 py-2"
        >
          Try Again
        </Button>
      </div>
    </div>
  );
}