# TayBac Shop - Demo scaffold

This package contains a demo full-stack project scaffold for "Đặc Sản Tây Bắc".
- Backend: Node + Express + SQLite (better-sqlite3)
- Frontend: React (Vite) + Tailwind

How to run backend:
1. cd backend
2. npm install
3. copy .env.example to .env and edit JWT_SECRET
4. npm run init-db
5. npm start

How to run frontend:
1. cd frontend
2. npm install
3. npm run dev

Notes:
- This is a scaffold and demo. For production: secure secrets, use persistent DB, add image upload, use HTTPS, input validation, rate limiting, and real payment gateway integration.