from fastapi import APIRouter

from app.catalogs.bom.router import router as boms_router
from app.catalogs.item.router import router as items_router
from app.catalogs.route.router import router as routes_router
from app.catalogs.unit.router import router as units_router
from app.catalogs.work_center.router import router as work_centers_router


router = APIRouter(prefix="/api/v1/catalogs", tags=["catalogs"])

router.include_router(units_router)
router.include_router(items_router)
router.include_router(work_centers_router)
router.include_router(boms_router)
router.include_router(routes_router)
