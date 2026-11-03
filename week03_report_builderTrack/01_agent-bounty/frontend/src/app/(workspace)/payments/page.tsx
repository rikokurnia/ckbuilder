import { Suspense } from "react";
import { Payments } from "@/components/workspace/WorkspaceViews";
export default function Page(){return <Suspense fallback={<div className="skeleton" aria-label="Loading workspace"/>}><Payments/></Suspense>}
