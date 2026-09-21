# Чтобы собрать и запушить образы

```
cd backend && docker build -t delous/pervolit-backend . && docker push delous/pervolit-backend && cd ../frontend && docker build -t delous/pervolit-frontend . && docker push delous/pervolit-frontend
```

```
docker compose down && docker compose pull && docker compose up -d
```

# Чтобы запустить бэкенд локально
```
docker run --name test-postgres -e POSTGRES_DB=postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=devpassword -p 5432:5432 -d postgres:17
```

```
uvicorn app.main:app --reload
```
