FROM python:3.13-alpine

# Создаём рабочую директорию
WORKDIR /app

# Устанавливаем библиотеки
COPY requirements.txt .
RUN pip install -r requirements.txt

# Копируем файлы проекта в контейнер
COPY . .

# Запускаем скрипт
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

# docker build -t delous/mes-backend .
# docker push delous/mes-backend