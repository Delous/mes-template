import { getCatalogListResult } from "@/entities/catalog/api";
import { BomForm } from "@/features/catalogs/CatalogForms";
import { BomsTable } from "@/features/catalogs/CatalogTables";
import { labels } from "@/shared/i18n/labels";
import { ErrorNotice } from "@/shared/ui/Notice";
import { PageHeader } from "@/shared/ui/PageHeader";

export default async function BomsPage() {
  const [bomsResult, itemsResult] = await Promise.all([
    getCatalogListResult("boms"),
    getCatalogListResult("items"),
  ]);

  return (
    <div className="page-content">
      <PageHeader title={labels.entities.boms} />
      {!bomsResult.ok ? <ErrorNotice message={bomsResult.message} /> : null}
      {!itemsResult.ok ? <ErrorNotice message={itemsResult.message} /> : null}
      <BomForm items={itemsResult.ok ? itemsResult.data.items : []} />
      <BomsTable boms={bomsResult.ok ? bomsResult.data.items : []} />
    </div>
  );
}
