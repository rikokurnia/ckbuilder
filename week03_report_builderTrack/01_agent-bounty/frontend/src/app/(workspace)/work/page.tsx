import { Suspense } from "react";
import { Marketplace } from "@/components/workspace/WorkspaceViews";
export default function Page(){return <Suspense fallback={<div className="skeleton" aria-label="Loading workspace"/>}><Marketplace mine/></Suspense>}
