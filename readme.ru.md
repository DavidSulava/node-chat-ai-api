# Chat AI API

[English version](./readme.md)

Это бэкенд для приложения Chat AI. Node/Express/TypeScript API, который использует [Stream](https://www.getStream.io) для чата, истории сообщений и управления пользователями. Также используется PostgreSQL база данных от [Neon](https://www.neon.tech) для хранения информации о пользователях и истории чата. Для взаимодействия с базой данных используется Drizzle ORM. [Gemini](https://aistudio.google.com/) используется для AI чат-бота.

Фронтенд на Vue.js для этого приложения можно найти [здесь](https://github.com/DavidSulava/vue-chat-ai-ui).

## Установка

1. Клонируйте репозиторий
2. Запустите `npm install`
3. Создайте файл `.env` в корневой директории и добавьте следующие переменные окружения:

```
PORT=5000
STREAM_API_KEY=""
STREAM_API_SECRET=""
GEMINI_API_KEY=""
DATABASE_URL="postgresql://username:password@localhost:5432/dbname"
```

Вы можете получить эти ключи, зарегистрировавшись на Stream, Gemini и Neon.

4. Запустите миграции базы данных с помощью Drizzle Kit:

```
npx drizzle-kit generate
npx drizzle-kit migrate
```

Это создаст необходимые таблицы в вашей базе данных.

5. Запустите сервер с `npm run dev` и откройте `http://localhost:5000`

## Эндпоинты

- POST `/register-user` - Создание пользователя в Stream чате и в нашей базе данных
- POST `/chat` - Создание нового канала Stream чата, отправка запроса в Open AI для генерации ответа и сохранение истории чата в базе данных
- POST `/get-messages` - Получение истории чата для конкретного пользователя

## Сборка для продакшена

Это TypeScript проект, поэтому перед запуском в продакшене необходимо собрать проект. Запустите `npm run build` для сборки проекта. Затем вы можете запустить сервер с `npm start`. Файлы будут в директории `dist`.