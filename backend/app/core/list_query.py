from typing import Literal

from sqlalchemy import String, cast, func, or_


CatalogSort = Literal["id_asc", "id_desc", "name_asc", "name_desc"]


def search_filter(search: str, *columns):
    # Treat SQL wildcard characters as literal user input.
    value = search.strip().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    return or_(*(cast(column, String).ilike(f"%{value}%", escape="\\") for column in columns))


def catalog_order(model, sort: CatalogSort):
    column = func.lower(model.name) if sort.startswith("name_") else model.id
    return [column.desc() if sort.endswith("_desc") else column.asc(), model.id.asc()]
