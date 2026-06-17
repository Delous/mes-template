from fastapi import FastAPI

from app.auth.router import router as auth_router
from app.admin.router import router as admin_router
from app.catalogs.common.router import router as catalogs_router
from app.orders.router import router as orders_router
from app.sensors.router import router as sensors_router
from app.tasks.router import router as tasks_router


app = FastAPI(title="Prokabel API", version="1.0.0")

app.include_router(sensors_router)
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(catalogs_router)
app.include_router(orders_router)
app.include_router(tasks_router)

# Для локального запуска:
# docker run --name postgres -e POSTGRES_USER=prokabel -e POSTGRES_PASSWORD=devpassword -e POSTGRES_DB=prokabel -p 5432:5432 -d postgres:17
# uvicorn app.main:app --reload
