import Link from "next/link";
export default function NotFound() {
  return (
    <main className="empty-state">
      <h1>That page isn’t here.</h1>
      <p>Return to the workspace to find your next task.</p>
      <Link href="/dashboard" className="button primary">
        Open workspace
      </Link>
    </main>
  );
}
