# Логин и регистрация — React + Node.js + PostgreSQL

Проект с авторизацией: фронтенд на React (Vite), бэкенд на Node.js (Express), база PostgreSQL. JWT для сессий.

## Что есть

- **Регистрация**: email, пароль, имя (опционально)
- **Вход**: email + пароль
- **Защищённая страница** «Личный кабинет» (доступна только после входа)
- **Выход** из аккаунта

## Требования

- Node.js 18+
- PostgreSQL (локально или облако)

## 1. База данных PostgreSQL

Создайте базу (например `program`) или используйте существующую. Пользователь по умолчанию — `postgres`. Таблица `users` создаётся автоматически при запуске бэкенда (Sequelize sync).

## 2. Бэкенд (Node.js)

```bash
cd backend
cp .env.example .env
```

В файле `.env` укажите (или скопируйте из `.env.example`):

- `PORT=5000` — порт сервера
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` — параметры PostgreSQL
- `JWT_SECRET` — длинная случайная строка для подписи токенов
- `NODE_ENV=development`

Установка и запуск:

```bash
npm install
npm start
```

Сервер: http://localhost:5000

## 3. Фронтенд (React)

```bash
cd frontend
npm install
npm run dev
```

Сайт: http://localhost:5173  
Запросы к API идут через прокси на `http://localhost:5000`.

## Маршруты

| Маршрут       | Описание                    |
|---------------|-----------------------------|
| `/`           | Личный кабинет (только для авторизованных) |
| `/login`      | Страница входа              |
| `/register`   | Страница регистрации        |

## API (бэкенд)

- `POST /api/auth/register` — регистрация (body: `email`, `password`, `name?`)
- `POST /api/auth/login` — вход (body: `email`, `password`)
- `GET /api/auth/me` — текущий пользователь (заголовок `Authorization: Bearer <token>`)

После успешного входа или регистрации в ответе приходят `user` и `token`. Токен сохраняется на фронте и передаётся в заголовке при запросах к `/api/auth/me`.
