from fastapi import APIRouter

from app.catalogs.bom.router import router as boms_router
from app.catalogs.item.router import router as items_router
from app.catalogs.operation_type.router import router as operation_types_router
from app.catalogs.route.router import router as routes_router
from app.catalogs.unit.router import router as units_router
from app.catalogs.workstation.router import router as workstations_router


router = APIRouter(prefix="/api/v1/catalogs", tags=["catalogs"])

router.include_router(units_router)
router.include_router(items_router)
router.include_router(workstations_router)
router.include_router(operation_types_router)
router.include_router(boms_router)
router.include_router(routes_router)
