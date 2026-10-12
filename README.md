# VESTORA — Onboarding Guide

Добро пожаловать в проект **VESTORA**! Это инновационная fashion-tech платформа для параметрической генерации 3D-тел человека и виртуальной примерки одежды.

Этот документ поможет вам быстро развернуться и начать работу над проектом.

## 🌟 Видение продукта

VESTORA позволяет пользователям:
1. Вводить свои антропометрические данные.
2. Генерировать 3D-модель тела на основе измерений.
3. Виртуально примерять и кастомизировать одежду.
4. Использовать AI для изменения дизайна одежды.

## 🛠 Технологический стек

### Frontend
- **React 19** + **TypeScript**
- **Vite** (сборка)
- **Three.js** + **React Three Fiber** + **Drei** (3D визуализация)
- **Tailwind CSS 4** (стилизация)

### Backend
- **Python 3.11+**
- **FastAPI** (API оркестратор)
- **Blender 4.5 LTS** (движок генерации геометрии)
- **MPFB2** (плагин MakeHuman для Blender)

## 📁 Структура репозитория

```text
vestora-mvp-clean/
├── backend/                # Исходный код бэкенда
│   ├── app/                # FastAPI приложение
│   │   └── main.py         # Точка входа API
│   ├── blender/            # Скрипты для работы внутри Blender
│   │   ├── base_human.blend # Базовая 3D-модель человека
│   │   ├── generate_body.py # Основной скрипт генерации
│   │   └── measurement_engine.py # Движок обсчета измерений
│   ├── tests/              # Тесты Body Engine
│   └── generated/          # Временное хранилище моделей (в .gitignore)
├── src/                    # Исходный код фронтенда
│   ├── components/         # React компоненты
│   ├── App.tsx             # Основной компонент и роутинг
│   ├── Landing.tsx         # Главная страница (Landing Page)
│   └── main.tsx            # Точка входа React
├── public/                 # Статические ассеты и базовые 3D-модели
├── package.json            # Зависимости фронтенда
└── README.md               # Этот файл
```

## 🚀 Быстрый старт

### 1. Установка Frontend
Если вы работаете **только над Landing Page**, вам **не обязательно** устанавливать Blender и Python.

```bash
# Установка зависимостей (npm или bun)
npm install

# Запуск в режиме разработки
npm run dev
```
Фронтенд будет доступен по адресу: `http://localhost:5173`

### 2. Установка Backend (необязательно для Frontend-задач)
Для полной работы Body Engine требуются:
- Python 3.11
- Blender 4.5 LTS (путь по умолчанию: `C:\Program Files\Blender Foundation\Blender 4.5\blender.exe`)

```powershell
cd backend
python -m venv .venv
# Активация в PowerShell:
.\.venv\Scripts\Activate.ps1

# Установка базовых зависимостей (requirements.txt пока отсутствует):
pip install fastapi uvicorn pydantic
```

**Важно:** Если Blender установлен в другую папку, обновите путь в `backend/app/main.py` (переменная `BLENDER_EXECUTABLE`).

Запуск API:
```bash
# Из папки backend
python -m uvicorn app.main:app --reload
```
API будет доступно по адресу: `http://127.0.0.1:8000`

## 🛠 Устранение неполадок

- **CORS Error**: Фронтенд должен быть на `http://localhost:5173`.
- **Blender not found**: Проверьте путь в `main.py`. На разных компьютерах путь к Blender может отличаться.
- **Модель не грузится**: Убедитесь, что бэкенд запущен, если вы нажимаете "Generate Body".

## 🔗 Дополнительная документация

- [ARCHITECTURE.md](ARCHITECTURE.md) — детальное описание архитектуры.
- [CONTRIBUTING.md](CONTRIBUTING.md) — правила разработки и чек-лист.
- [ROADMAP.md](ROADMAP.md) — текущий статус и планы.

---
🤖 Generated for VESTORA team.
