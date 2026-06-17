import { getCatalogListResult } from "@/entities/catalog/api";
import { UnitForm } from "@/features/catalogs/CatalogForms";
import { UnitsTable } from "@/features/catalogs/CatalogTables";
import { labels } from "@/shared/i18n/labels";
import { ErrorNotice } from "@/shared/ui/Notice";
import { PageHeader } from "@/shared/ui/PageHeader";

export default async function UnitsPage() {
  const result = await getCatalogListResult("units");

  return (
    <div className="page-content">
      <PageHeader title={labels.entities.units} />
      {!result.ok ? <ErrorNotice message={result.message} /> : null}
      <UnitForm />
      <UnitsTable units={result.ok ? result.data.items : []} />
    </div>
  );
}
