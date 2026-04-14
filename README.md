# Surat Gym Hub - Backend

The core backend system for the Surat Gym Hub platform, built using [NestJS](https://nestjs.com/) and MySQL. It manages members, trainers, memberships, and complex transactional logic like Personal Training (PT) sessions and slot bookings.

## ER-DIAGRAM
# LINK:-  https://dbdiagram.io/d/69ddec8180896296848ed412

## 🚀 Setup & Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables (`.env`)
Create a `.env` file in the root of the `Surat-Gym-Hub-Backend` directory with the following structure:

```env
# Database
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=surat_gym_hub

# JWT
JWT_ACCESS_SECRET=your_access_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_ACCESS_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# App
PORT=3000
```

### 3. Database Seeding
To populate your database with initial data (members, trainers, memberships, slots, etc.), you should execute the provided seed file, `src/common/seed/seed.sql`, directly against your database. You can do this via command line:
```bash
mysql -u root -p surat_gym_hub < src/common/seed/seed.sql
```
*(Alternatively, you can import this file directly using your preferred database client such as MySQL Workbench or DBeaver).*

### 4. Running the Application
```bash
# Development watch mode
npm run start:dev

# Production mode
npm run build && npm run start:prod
```

---

## 🧠 Core Business Logic: Personal Training (PT) Sessions

The PT Session booking process is a critical domain in the platform, carefully built to ensure zero double-bookings and reliable session deductions.

### The 3-Write Transaction (Session + Slot + Count)
Booking a session guarantees data integrity through a strict database transaction. If any of the following steps fail, the entire sequence rolls back automatically:

1. **Lock & Verify Entities:** 
   The database locks and fetches the specific Member, Slot, and Trainer checking statuses (e.g., verifying `MembershipStatus.ACTIVE`).
2. **Decrement Member Session Count (Write 1):** 
   If the session uses the user's membership plan, the database executes an `UPDATE` to decrement their `remaining_pt_sessions` count.
3. **Update Slot Status (Write 2):** 
   The system atomically updates the target slot's status from `AVAILABLE` to `BOOKED`.
4. **Insert Session Record (Write 3):** 
   Finally, the actual `pt_sessions` row is `INSERT`ed with a newly generated session code, linking the member, trainer, slot, tracking source, and cost.

### Plan vs Paid Session Branching Logic
During the transaction, the `bookSession` service dynamically determines the session nature to figure out billing:

*   **Plan Session (`SessionSource.PLAN`):** 
    If the member has `remaining_pt_sessions > 0` on their membership, the system defaults to utilizing their plan. The `amount_charged` is `0`, and their remaining session count reduces by 1.
*   **Paid Session (`SessionSource.PAID`):** 
    If a valid member currently has `0` remaining sessions, the booking shifts to a standalone paid session. The `amount_charged` dynamically pulls the specific `session_rate` of the assigned trainer, treating it as a pay-as-you-go bill.

### Concurrent Slot Booking Approach
To prevent race conditions where two members attempt to book the exact same slot concurrently, the backend relies heavily on atomic DB updates rather than a typical `SELECT -> UPDATE` fallback.

Instead of just checking memory/application logic to see if a slot is available (which inherently faces race condition risks), the system executes an atomic row update:
```sql
UPDATE slots 
SET status = 'BOOKED' 
WHERE id = ? AND status = 'AVAILABLE'
```
If `affectedRows === 0`, the system instantly detects that another concurrent transaction has modified this slot's state, safely catching it and throwing a `ConflictException('Slot already booked')`. This guarantees no double-bookings on a database-level constrainment.
