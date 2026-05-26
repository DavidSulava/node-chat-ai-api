# 🚀 Chat AI API

[Русская версия](readme.ru.md) | [Frontend Repository](https://github.com/DavidSulava/vue-chat-ai-ui)

A robust, production-ready Node.js backend for the Chat AI ecosystem. Built using **Express** and **TypeScript**, this API acts as the orchestration layer between real-time messaging services, relational storage, and advanced AI models.

---

## ✨ Features & Tech Stack

*  **Express & [TypeScript](https://www.typescriptlang.org/)** — Scalable architectural foundation with strict typing.
*  **[Stream Chat API](https://www.getstream.io)** — Seamless chat orchestration, real-time message history, and user state sync.
*  **[Google Gemini AI](https://aistudio.google.com/)** — Powered by the official `@google/genai` SDK for intelligent, contextual interactions.
*  **[Neon PostgreSQL](https://www.neon.tech) & [Drizzle ORM](https://orm.drizzle.team/)** — Cloud-native, serverless relational database with Type-Safe queries and lightweight migrations.
*  **Security & Performance**:
    * **JWT Authentication**: Secure user management via `jsonwebtoken`.
    * **Password Hashing**: Cryptographic salt rounds implemented with `bcrypt`.
    * **Rate Limiting**: Protection against DDoS and brute-force attacks via `express-rate-limit`.
    * **Data Validation**: Strict runtime schema definition using `zod`.
* 🧪 **Testing & Quality**: Fully backed by `vitest` unit-testing and `eslint` code styling.

---

## 🛠 Installation & Setup

### 1. Clone & Install
```bash
git clone [https://github.com](https://github.com)
cd chat-ai-api
npm install