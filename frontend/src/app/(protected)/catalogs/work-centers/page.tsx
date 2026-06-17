import { getCatalogListResult } from "@/entities/catalog/api";
import { WorkCenterForm } from "@/features/catalogs/CatalogForms";
import { WorkCentersTable } from "@/features/catalogs/CatalogTables";
import { labels } from "@/shared/i18n/labels";
import { ErrorNotice } from "@/shared/ui/Notice";
import { PageHeader } from "@/shared/ui/PageHeader";

export default async function WorkCentersPage() {
  const result = await getCatalogListResult("work-centers");

  return (
    <div className="page-content">
      <PageHeader title={labels.entities.workCenters} />
      {!result.ok ? <ErrorNotice message={result.message} /> : null}
      <WorkCenterForm />
      <WorkCentersTable workCenters={result.ok ? result.data.items : []} />
    </div>
  );
}
