import { Suspense } from "react";
import { TaskDetail } from "@/components/workspace/TaskDetail";
export default function Page({params}:{params:{id:string}}){return <Suspense fallback={<div className="skeleton"/>}><TaskDetail id={params.id}/></Suspense>}
