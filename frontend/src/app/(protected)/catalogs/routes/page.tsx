import { getCatalogListResult } from "@/entities/catalog/api";
import { RouteForm } from "@/features/catalogs/CatalogForms";
import { RoutesTable } from "@/features/catalogs/CatalogTables";
import { labels } from "@/shared/i18n/labels";
import { ErrorNotice } from "@/shared/ui/Notice";
import { PageHeader } from "@/shared/ui/PageHeader";

export default async function RoutesPage() {
  const [routesResult, itemsResult, workCentersResult] = await Promise.all([
    getCatalogListResult("routes"),
    getCatalogListResult("items"),
    getCatalogListResult("work-centers"),
  ]);

  return (
    <div className="page-content">
      <PageHeader title={labels.entities.routes} />
      {!routesResult.ok ? <ErrorNotice message={routesResult.message} /> : null}
      {!itemsResult.ok ? <ErrorNotice message={itemsResult.message} /> : null}
      {!workCentersResult.ok ? <ErrorNotice message={workCentersResult.message} /> : null}
      <RouteForm
        items={itemsResult.ok ? itemsResult.data.items : []}
        workCenters={workCentersResult.ok ? workCentersResult.data.items : []}
      />
      <RoutesTable routes={routesResult.ok ? routesResult.data.items : []} />
    </div>
  );
}
