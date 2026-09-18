# Pulse

A full-stack, multi-role healthcare platform connecting patients, doctors, pharmacies, labs, and hospital administrators.

Built as a solo project while learning full-stack development, to demonstrate real-world application design, authentication, role-based access control, and integration with third-party APIs.

## Features

- **Authentication** — JWT-based signup/login with bcrypt password hashing
- **Medical Records** — patients create and manage their own health records
- **Consent Sharing** — patients grant/revoke doctor access to specific records
- **Appointments** — booking with conflict prevention, doctor confirm/cancel flow
- **Marketplace** — pharmacy and lab product listings, orders, stock tracking, lab result delivery
- **AI Health Companion** — a RAG-style assistant that answers questions using a patient's own records (powered by Groq)
- **Hospital Dashboard (HMIS)** — admin view of hospital staff, appointments, and orders

## Tech Stack

**Backend:** Python, FastAPI, SQLAlchemy, PostgreSQL, JWT, bcrypt
**Frontend:** React, Vite, React Router, Tailwind CSS, Axios
**AI:** Groq API (Llama-family models)

## Architecture

- RESTful API with role-based access control (patient / doctor / pharmacy / lab / admin)
- Relational schema with foreign-key relationships for records, appointments, orders, and hospital staff associations
- JWT authentication with protected routes on both frontend and backend
- CORS-configured API consumed by a separate React SPA

## Running Locally

**Backend**

    cd backend
    python -m venv venv
    venv\Scripts\activate
    pip install -r requirements.txt
    uvicorn main:app --reload

**Frontend**

    cd frontend
    npm install
    npm run dev

Requires a PostgreSQL database and a `.env` file with `DATABASE_URL`, `SECRET_KEY`, and `GROQ_API_KEY`.

## Author

Built by Abdikafar Ibrahim as a portfolio project while learning full-stack development.