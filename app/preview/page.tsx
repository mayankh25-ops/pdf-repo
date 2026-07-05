import { TEMPLATES } from "@/lib/templates";
import { sampleReport } from "@/lib/sample";
import { Cover } from "@/components/report/covers";
import { ReportDocument } from "@/components/report/ReportDocument";
import type { TemplateId } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Design review route.
 *   /preview               → all five cover pages with sample data
 *   /preview?template=<id> → the full sample document for one template
 */
export default async function PreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string; paired?: string }>;
}) {
  const { template, paired } = await searchParams;

  if (template) {
    const r = sampleReport(template as TemplateId);
    if (paired) r.paired = true;
    return <ReportDocument r={r} />;
  }

  return (
    <main>
      {TEMPLATES.map((t) => (
        <div key={t.id}>
          <div
            className="no-print doc-mono"
            style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-muted)" }}
          >
            {t.name} — {t.blurb}
          </div>
          <Cover r={sampleReport(t.id)} />
        </div>
      ))}
    </main>
  );
}
