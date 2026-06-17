import { getCatalogListResult } from "@/entities/catalog/api";
import { NewOrderForm } from "@/features/orders/NewOrderForm";
import { labels } from "@/shared/i18n/labels";
import { ErrorNotice } from "@/shared/ui/Notice";
import { PageHeader } from "@/shared/ui/PageHeader";

export default async function NewOrderPage() {
  const [itemsResult, routesResult, bomsResult] = await Promise.all([
    getCatalogListResult("items"),
    getCatalogListResult("routes"),
    getCatalogListResult("boms"),
  ]);

  return (
    <div className="page-content">
      <PageHeader title={`${labels.actions.create}: ${labels.entities.order}`} />
      {!itemsResult.ok ? <ErrorNotice message={itemsResult.message} /> : null}
      {!routesResult.ok ? <ErrorNotice message={routesResult.message} /> : null}
      {!bomsResult.ok ? <ErrorNotice message={bomsResult.message} /> : null}
      <NewOrderForm
        items={itemsResult.ok ? itemsResult.data.items : []}
        routes={routesResult.ok ? routesResult.data.items : []}
        boms={bomsResult.ok ? bomsResult.data.items : []}
      />
    </div>
  );
}
