import { Suspense } from "react";
import { EditPengirimanClient } from "./EditPengirimanClient";

export const instant = false;

export default function EditPengirimanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="px-4 md:px-8 py-6 space-y-6 animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-48" />
          <div className="h-8 bg-slate-200 rounded w-64" />
          <div className="h-64 bg-slate-200 rounded-2xl" />
        </div>
      }
    >
      <EditPengirimanClient params={params} />
    </Suspense>
  );
}
