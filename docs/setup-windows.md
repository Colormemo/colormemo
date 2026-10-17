# Настройка проекта на Windows

Инструкция для работы в PowerShell. WSL не нужен — все команды выполняются
в обычном окне PowerShell. Для macOS смотри README в корне репозитория.

## 1. Доступ

Прими приглашение в организацию **Colormemo** — письмо на почту или
уведомление на github.com.

Сразу включи двухфакторную аутентификацию: **Settings → Password and
authentication → Two-factor authentication**. GitHub требует её от участников
организаций, без неё в какой-то момент заблокируют действия с аккаунтом.
Выбирай приложение-аутентификатор, не SMS.

Восстановительные коды сохрани отдельно от телефона: при его потере это
единственный способ вернуть доступ.

## 2. Что поставить

- [Node.js 22 LTS](https://nodejs.org/) — обычный установщик
- [Git for Windows](https://git-scm.com/download/win)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

Docker при установке предложит включить WSL2 — соглашайся, это его внутренний
движок, иначе на Windows он не работает. Работать в терминале Ubuntu при этом
не нужно.

## 3. Настроить git

```powershell
git config --global core.autocrlf false
git config --global user.name "Имя Фамилия"
git config --global user.email "почта_от_гитхаба"
```

Первая строка обязательна. Команда уже работает на macOS и на Windows,
и без этой настройки Windows будет сохранять файлы со своими переносами строк:
git начнёт показывать, что при каждой правке изменился весь файл целиком,
и читать различия станет невозможно.

## 4. Склонировать

```powershell
cd $HOME
mkdir projects
cd projects
git clone https://github.com/Colormemo/colormemo.git
cd colormemo
```

Пароль от аккаунта при запросе не подойдёт, GitHub его больше не принимает.
Нужен токен: **Settings → Developer settings → Personal access tokens →
Tokens (classic) → Generate new token**, галочка `repo`. Полученную строку
вставляешь вместо пароля.

## 5. Запустить

```powershell
npm install
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
npm test
```

Тесты должны показать 13 пройденных.

Если `npm install` упадёт на Prisma и загрузке её движков:

```powershell
npm install --ignore-scripts
npx prisma generate
```

Проверь, что база поднимается:

```powershell
npm run db:up
```

Это PostgreSQL в Docker на порту 5433 и Adminer на http://localhost:8080 для
просмотра данных: сервер `db`, пользователь `app`, пароль `dev`, база `colormemo`.

Если контейнер не поднимется с ошибкой про доступ к сокету — порт занят
системой. Поменяй `5433` в `compose.yaml` и в `backend/.env` на другой,
например 5434.

## 6. Работа над проектом

В двух окнах PowerShell:

```powershell
npm run dev:back     # сервер, http://localhost:3000
npm run dev:front    # фронт, http://localhost:5173
```

Команда `npm run dev:nodb` поднимает сервер без базы, задания хранятся
в памяти процесса. Удобно, пока база ещё не настроена.

## 7. Что читать в первую очередь

| Файл                           | О чём                                       |
| ------------------------------ | ------------------------------------------- |
| `README.md`                    | Что готово, что нет, кто за что отвечает    |
| `backend/README.md`            | Задачи серверной части и заметки по ним     |
| `frontend/README.md`           | Задачи клиентской части                     |
| `packages/shared/src/api.ts`   | Контракт API, менять только по согласованию |
| `backend/prisma/schema.prisma` | Схема базы данных                           |

## 8. Порядок работы

В `main` напрямую не пушим — это запрещено правилом репозитория. На каждую
задачу заводится своя ветка:

```powershell
git switch main
git pull
git switch -c feature/database
# работа, коммиты
git push -u origin feature/database
```

Дальше на GitHub появится кнопка «Compare & pull request». Вторая участница
смотрит код во вкладке Files changed и нажимает Review changes → Approve.
Только после одобрения разблокируется кнопка слияния.

При открытии пул-реквеста автоматически запускается проверка кода: сборка
фронта, тесты, проверка форматирования. Её результат виден прямо
в пул-реквесте.

## Известные особенности

Скрипты проекта совместимы с Windows: переменные окружения задаются через
`cross-env`, шаблоны файлов раскрывает сам Node, а не оболочка. Если будешь
добавлять свои скрипты в `package.json`, придерживайся того же —
запись вида `VAR=value команда` на Windows не работает.
