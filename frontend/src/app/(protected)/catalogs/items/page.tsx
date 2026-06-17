import { getCatalogListResult } from "@/entities/catalog/api";
import { ItemForm } from "@/features/catalogs/CatalogForms";
import { ItemsTable } from "@/features/catalogs/CatalogTables";
import { labels } from "@/shared/i18n/labels";
import { ErrorNotice } from "@/shared/ui/Notice";
import { PageHeader } from "@/shared/ui/PageHeader";

export default async function ItemsPage() {
  const [itemsResult, unitsResult] = await Promise.all([
    getCatalogListResult("items"),
    getCatalogListResult("units"),
  ]);

  return (
    <div className="page-content">
      <PageHeader title={labels.entities.items} />
      {!itemsResult.ok ? <ErrorNotice message={itemsResult.message} /> : null}
      {!unitsResult.ok ? <ErrorNotice message={unitsResult.message} /> : null}
      <ItemForm units={unitsResult.ok ? unitsResult.data.items : []} />
      <ItemsTable items={itemsResult.ok ? itemsResult.data.items : []} />
    </div>
  );
}
