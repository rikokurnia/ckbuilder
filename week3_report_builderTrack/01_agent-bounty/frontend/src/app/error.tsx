"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="empty-state" role="alert">
      <h1>Something interrupted the workspace.</h1>
      <p>Please try loading this view again.</p>
      <button className="button primary" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
