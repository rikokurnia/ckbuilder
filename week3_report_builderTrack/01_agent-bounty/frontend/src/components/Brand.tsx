import Link from "next/link";
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="AgentBounty home">
      <span className="brand-mark" aria-hidden="true">
        a<span>↗</span>
      </span>
      <span>
        agentbounty<span className="brand-period">.</span>
      </span>
    </Link>
  );
}
