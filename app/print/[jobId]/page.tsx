import { notFound } from "next/navigation";
import { readJob } from "@/lib/store";
import { toView } from "@/lib/sample";
import { ReportDocument } from "@/components/report/ReportDocument";

export const dynamic = "force-dynamic";

/**
 * Print-ready render of a generated report job. Headless Chromium loads this
 * page and prints it to PDF (lib/pdf.ts) — the on-screen preview and the PDF
 * share these exact components.
 */
export default async function PrintPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const report = await readJob(jobId);
  if (!report) notFound();
  const view = toView(report, (id) =>
    id.startsWith("sample:") ? `/samples/${id.slice(7)}` : `/api/images/${id}`,
  );
  return <ReportDocument r={view} />;
}
