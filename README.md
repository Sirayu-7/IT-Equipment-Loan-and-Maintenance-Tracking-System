# IT Equipment Management System

A full-stack web application for managing IT equipment borrowing-return and repair workflows, built with React, Node.js/Express, and MySQL.

## Features

- **Authentication & Authorization**: JWT-based authentication with RBAC (Role-Based Access Control)
- **User Management**: CRUD for users, roles, permissions, and departments
- **Asset Management**: Full inventory tracking with categories, locations, and statuses
- **Borrow Request Workflow**: Create, submit, approve, reject, borrow, return with asset availability checks
- **Repair Request Workflow**: Report, accept, in-progress, waiting parts, fixed, closed with full lifecycle tracking
- **Spare Parts Inventory**: Parts management with stock tracking, reservations, consumptions, stock alerts, and transaction history
- **Dashboard**: KPI cards, status distribution, category breakdown, overdue items, latest activities, warranty alerts
- **Notifications**: In-app notifications for approvals, rejections, and status updates
- **Audit Logging**: Full history tracking for assets and business events
- **Reports**: Summary views for asset and activity metrics

## Tech Stack

- **Frontend**: React 18, React Router 6, Axios, React Icons, React Toastify
- **Backend**: Node.js, Express 4, MySQL2, JWT, bcryptjs, Multer, Winston
- **Database**: MySQL 8.0+

## Project Structure

```
it-equipment-management/
├── database/
│   ├── schema.sql                    # Main database schema
│   └── schema_parts.sql              # Parts inventory schema
├── backend/
│   ├── .env                          # Environment variables
│   ├── package.json
│   ├── uploads/                      # File uploads directory
│   ├── logs/                         # Application logs
│   └── src/
│       ├── server.js                 # Entry point
│       ├── app.js                    # Express app setup
│       ├── seed.js                   # Database seeder
│       ├── config/
│       │   └── database.js           # MySQL connection pool
│       ├── middleware/
│       │   ├── auth.js               # JWT authentication
│       │   ├── rbac.js               # Role-based access control
│       │   ├── errorHandler.js       # Error handling
│       │   └── upload.js             # File upload handling
│       ├── validators/
│       │   ├── authValidator.js
│       │   └── assetValidator.js
│       ├── services/
│       │   ├── authService.js
│       │   ├── assetService.js
│       │   ├── borrowService.js
│       │   ├── repairService.js
│       │   ├── userService.js
│       │   ├── dashboardService.js
│       │   ├── notificationService.js
│       │   └── partService.js
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── assetController.js
│       │   ├── borrowController.js
│       │   ├── repairController.js
│       │   ├── userController.js
│       │   ├── dashboardController.js
│       │   ├── notificationController.js
│       │   └── partController.js
│       ├── routes/
│       │   ├── authRoutes.js
│       │   ├── assetRoutes.js
│       │   ├── borrowRoutes.js
│       │   ├── repairRoutes.js
│       │   ├── userRoutes.js
│       │   ├── dashboardRoutes.js
│       │   ├── notificationRoutes.js
│       │   └── partRoutes.js
│       └── utils/
│           ├── constants.js
│           ├── response.js
│           └── logger.js
└── frontend/
    ├── package.json
    ├── public/
    │   └── index.html
    └── src/
        ├── index.js
        ├── App.js
        ├── services/
        │   └── api.js                 # Axios API service
        ├── context/
        │   └── AuthContext.js          # Auth context provider
        ├── components/
        │   ├── common/
        │   └── layouts/
        │       ├── MainLayout.js
        │       └── MainLayout.css
        └── pages/
            ├── Login.js
            ├── Dashboard.js
            ├── Profile.js
            ├── assets/
            ├── borrows/
            ├── repairs/
            ├── users/
            ├── roles/
            ├── notifications/
            ├── reports/
            └── parts/
```

## วิธีรัน (How to Run)

### ความต้องการเบื้องต้น (Prerequisites)

- Node.js 18+ 
- MySQL 8.0+
- npm หรือ yarn

### ขั้นตอนที่ 1: สร้างฐานข้อมูล (Database Setup)

```bash
# เปิด Command Prompt หรือ Terminal ที่ตำแหน่ง it-equipment-management

# นำเข้า schema หลัก
mysql -u root -p < database\schema.sql

# นำเข้า schema สำหรับ spare parts
mysql -u root -p < database\schema_parts.sql
```

หรือถ้าใช้ phpMyAdmin:
1. เปิด phpMyAdmin (http://localhost/phpmyadmin)
2. สร้างฐานข้อมูลชื่อ `it_equipment_management`
3. ไปที่แท็บ SQL แล้ววางเนื้อหาจาก `database/schema.sql` แล้วกด Go
4. ทำซ้ำกับ `database/schema_parts.sql`

### ขั้นตอนที่ 2: รัน Backend

```bash
cd backend

# ติดตั้ง dependencies
npm install

# แก้ไขไฟล์ .env ให้ตรงกับ MySQL ของคุณ
# (โดยปกติไม่ต้องแก้ถ้าใช้ root ไม่มีรหัสผ่านใน XAMPP)

# รัน seed (สร้างข้อมูลทดสอบ)
npm run seed

# เริ่มเซิร์ฟเวอร์
npm run dev
```

API จะเริ่มทำงานที่ http://localhost:5000

### ขั้นตอนที่ 3: รัน Frontend (เปิดอีก Terminal หนึ่ง)

```bash
cd frontend

# ติดตั้ง dependencies
npm install

# เริ่มเซิร์ฟเวอร์
npm start
```

Frontend จะเริ่มทำงานที่ http://localhost:3000

### สรุปคำสั่ง (Quick Start)

เปิด **สองหน้าต่าง Terminal** พร้อมกัน:

| Terminal 1 (Backend) | Terminal 2 (Frontend) |
|---|---|
| `cd it-equipment-management/backend` | `cd it-equipment-management/frontend` |
| `npm install` | `npm install` |
| `npm run seed` | `npm start` |
| `npm run dev` | |

## บัญชีทดสอบ (Test Accounts)

หลังจากรัน seed แล้ว สามารถเข้าสู่ระบบด้วยบัญชีเหล่านี้:

| บทบาท (Role)     | อีเมล (Email)              | รหัสผ่าน (Password) |
|------------------|----------------------------|-------------------|
| Super Admin      | superadmin@company.com     | admin123          |
| IT Admin         | itadmin@company.com        | admin123          |
| IT Technician    | tech@company.com           | admin123          |
| Approver         | approver@company.com       | admin123          |
| Employee         | employee@company.com       | admin123          |

## API Endpoints

### Authentication
- `POST /api/auth/login` - เข้าสู่ระบบ
- `POST /api/auth/logout` - ออกจากระบบ
- `GET /api/auth/me` - ดูโปรไฟล์
- `PUT /api/auth/change-password` - เปลี่ยนรหัสผ่าน
- `POST /api/auth/refresh-token` - ขอ token ใหม่

### Assets
- `GET /api/assets` - รายการครุภัณฑ์
- `GET /api/assets/:id` - ดูรายละเอียดครุภัณฑ์
- `POST /api/assets` - เพิ่มครุภัณฑ์
- `PUT /api/assets/:id` - แก้ไขครุภัณฑ์
- `DELETE /api/assets/:id` - ลบครุภัณฑ์
- `GET /api/assets/categories` - ดูหมวดหมู่
- `GET /api/assets/locations` - ดูสถานที่

### Borrow Requests
- `GET /api/borrow-requests` - รายการขอยืม
- `POST /api/borrow-requests` - สร้างคำขอยืม
- `PUT /api/borrow-requests/:id/submit` - ส่งขออนุมัติ
- `PUT /api/borrow-requests/:id/approve` - อนุมัติ
- `PUT /api/borrow-requests/:id/reject` - ไม่อนุมัติ
- `PUT /api/borrow-requests/:id/borrow-confirm` - ยืนยันการยืม
- `PUT /api/borrow-requests/:id/return` - คืนครุภัณฑ์
- `PUT /api/borrow-requests/:id/cancel` - ยกเลิก

### Repair Requests
- `GET /api/repair-requests` - รายการแจ้งซ่อม
- `POST /api/repair-requests` - สร้างแจ้งซ่อม
- `PUT /api/repair-requests/:id/status` - อัปเดตสถานะ
- `PUT /api/repair-requests/:id/close` - ปิดงานซ่อม
- `PUT /api/repair-requests/:id/assign` - มอบหมายช่าง
- `PUT /api/repair-requests/:id/cancel` - ยกเลิกงานซ่อม

### Spare Parts
- `GET /api/parts` - รายการอะไหล่
- `GET /api/parts/:id` - ดูรายละเอียดอะไหล่
- `POST /api/parts` - เพิ่มอะไหล่
- `PUT /api/parts/:id` - แก้ไขอะไหล่
- `PUT /api/parts/:id/stock-adjust` - ปรับสต็อก
- `GET /api/parts/categories` - หมวดหมู่อะไหล่
- `GET /api/parts/locations` - สถานที่จัดเก็บ
- `GET /api/parts/suppliers` - ผู้จัดจำหน่าย
- `GET /api/parts/stock-alerts` - แจ้งเตือนสต็อก
- `GET /api/parts/transactions` - ประวัติธุรกรรม
- `POST /api/parts/reservations` - จองอะไหล่
- `DELETE /api/parts/reservations/:id` - ยกเลิกการจอง
- `POST /api/parts/consumptions` - เบิกอะไหล่
- `GET /api/parts/reports/inventory` - รายงานสต็อก
- `GET /api/parts/reports/repair-parts` - รายงานอะไหล่แยกตามงานซ่อม

### Users
- `GET /api/users` - รายชื่อผู้ใช้
- `POST /api/users` - เพิ่มผู้ใช้
- `PUT /api/users/:id` - แก้ไขผู้ใช้
- `DELETE /api/users/:id` - ลบผู้ใช้
- `GET /api/users/roles` - ดูบทบาท
- `GET /api/users/departments` - ดูแผนก

### Dashboard
- `GET /api/dashboard/admin-summary` - สรุปภาพรวม
- `GET /api/dashboard/asset-status` - สถานะครุภัณฑ์
- `GET /api/dashboard/borrow-trends` - แนวโน้มการยืม
- `GET /api/dashboard/repair-trends` - แนวโน้มการซ่อม
- `GET /api/dashboard/assets-by-category` - ครุภัณฑ์แยกตามหมวด
- `GET /api/dashboard/overdue-items` - รายการค้างส่ง
- `GET /api/dashboard/latest-activities` - กิจกรรมล่าสุด
- `GET /api/dashboard/warranty-expiring-soon` - ครุภัณฑ์ใกล้หมดประกัน

### Notifications
- `GET /api/notifications` - รายการแจ้งเตือน
- `GET /api/notifications/unread-count` - จำนวนที่ยังไม่อ่าน
- `PUT /api/notifications/:id/read` - ทำเครื่องหมายว่าอ่านแล้ว
- `PUT /api/notifications/read-all` - อ่านทั้งหมด

## Role-Based Access

| Module          | Super Admin | IT Admin | IT Technician | Approver | Employee |
|-----------------|:-----------:|:--------:|:-------------:|:--------:|:--------:|
| Dashboard       | ✓           | ✓        | ✓             | ✓        | ✓        |
| Assets (View)   | ✓           | ✓        | ✓             | ✓        | ✓        |
| Assets (Manage) | ✓           | ✓        | ✗             | ✗        | ✗        |
| Borrow (View)   | ✓           | ✓        | ✓             | ✓        | ✓        |
| Borrow (Create) | ✓           | ✓        | ✓             | ✗        | ✓        |
| Approve/Reject  | ✓           | ✓        | ✗             | ✓        | ✗        |
| Confirm Return  | ✓           | ✓        | ✗             | ✗        | ✗        |
| Repairs (View)  | ✓           | ✓        | ✓             | ✗        | ✓        |
| Repairs (Update)| ✓           | ✓        | ✓             | ✗        | ✗        |
| Spare Parts     | ✓           | ✓        | ✓             | ✗        | ✗        |
| Users (Manage)  | ✓           | ✓        | ✗             | ✗        | ✗        |
| Roles (Manage)  | ✓           | ✗        | ✗             | ✗        | ✗        |
| Reports         | ✓           | ✓        | ✗             | ✗        | ✗        |

## Assumptions

1. **Default password** for new users is `changeme123`
2. **Borrow duration** defaults to 7 days when confirming a borrow
3. **File uploads** are stored locally in `backend/uploads/`
4. **Rate limiting** is set to 100 requests per 15 minutes per IP
5. **Asset status** is automatically managed by the system (e.g., changes to "borrowed" when confirmed, "available" when returned)

## Environment Variables

| Variable           | Description            | Default                         |
|--------------------|------------------------|---------------------------------|
| PORT               | Backend server port    | 5000                            |
| DB_HOST            | MySQL host             | localhost                       |
| DB_PORT            | MySQL port             | 3306                            |
| DB_USER            | MySQL user             | root                            |
| DB_PASSWORD        | MySQL password         |                                 |
| DB_NAME            | Database name          | it_equipment_management         |
| JWT_SECRET         | JWT signing secret     | (change in production)          |
| JWT_EXPIRES_IN     | Token expiration       | 8h                              |
| CORS_ORIGIN        | Allowed CORS origin    | http://localhost:3000            |