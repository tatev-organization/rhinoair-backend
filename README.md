# Rhino Air Portal - Backend

## Getting Started

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   Copy the example environment file and fill in your database credentials and other keys:
   ```bash
   cp .env.example .env
   ```

3. **Database Setup & Migrations:**
   Ensure your PostgreSQL database is running and accessible via the `DATABASE_URL` in your `.env`.
   Run the Prisma migrations to generate the schema:
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

4. **Run the Development Server:**
   ```bash
   npm run start:dev
   ```

5. **API Access:**
   The API will be available at `http://localhost:3001/api/v1` (or whichever port you configured).

## Build for Production
```bash
npm run build
npm run start:dev
```
