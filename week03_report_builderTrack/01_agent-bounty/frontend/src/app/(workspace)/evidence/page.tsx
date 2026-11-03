import { Suspense } from "react";
import { Evidence } from "@/components/workspace/WorkspaceViews";
export default function Page(){return <Suspense fallback={<div className="skeleton" aria-label="Loading workspace"/>}><Evidence/></Suspense>}
