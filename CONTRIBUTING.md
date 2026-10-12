# Руководство по разработке (Contributing Guide)

## Зоны ответственности

- **Project Owner**: Архитектура, Body Engine, Review.
- **Frontend Developer**: Landing Page, UI/UX, Анимации.

## 🚀 Чек-лист первого дня (Onboarding)

1. [ ] Клонировать репозиторий `vestora-mvp-clean`.
2. [ ] Установить Node.js или Bun.
3. [ ] Запустить фронтенд: `npm install && npm run dev`.
4. [ ] Изучить структуру лендинга в `src/Landing.tsx` и `src/components/CyberFashion.tsx`.
5. [ ] Создать свою первую рабочую ветку: `git checkout -b feature/landing-update`.

## Git Workflow

Мы используем обязательный механизм Feature Branches и Pull Requests.

1. **Ветки**: Все изменения делаются в отдельных ветках `feature/*`.
2. **Обновление**: Перед началом работы всегда делайте `git pull origin main`.
3. **Pull Request**: После завершения задачи создайте PR. Прямые коммиты в `main` запрещены (если не оговорено иное).
4. **Review**: Владелец проекта проводит обзор кода перед слиянием.

## Правила безопасности

- **.env**: Никогда не коммитьте файлы окружения.
- **Secrets**: Не добавляйте ключи API (Gemini, Supabase) в публичные переменные фронтенда без необходимости.
- **Generated**: Папка `backend/generated/` игнорируется Git — не пытайтесь добавить её содержимое в репозиторий.

---
🤖 Generated for VESTORA team.
