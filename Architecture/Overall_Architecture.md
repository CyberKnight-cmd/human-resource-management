                               ┌──────────────────────┐
                               │     Web Frontend     │
                               │ React / Next.js      │
                               └──────────┬───────────┘
                                          │
                               HTTPS REST API + JWT
                                          │
                    ┌─────────────────────▼─────────────────────┐
                    │               FastAPI Backend             │
                    │         Authentication Middleware         │
                    └───────────────────────────────────────────┘
                                          │
        ┌─────────────────────────────────┼─────────────────────────────────┐
        │                                 │                                 │
        ▼                                 ▼                                 ▼
┌────────────────┐               ┌────────────────┐               ┌────────────────┐
│ Auth Module    │               │ Dashboard      │               │ User Module    │
│ Login          │               │ Employee View  │               │ Employee CRUD  │
│ Signup         │               │ Admin View     │               │ Documents      │
│ JWT            │               │ Analytics      │               │ Profile        │
└────────────────┘               └────────────────┘               └────────────────┘
        │                                 │                                 │
        ├─────────────────────────────────┼─────────────────────────────────┤
        ▼                                 ▼                                 ▼
┌────────────────┐               ┌────────────────┐               ┌────────────────┐
│ Attendance     │               │ Leave Module   │               │ Payroll Module │
│ Check-In       │               │ Apply Leave    │               │ Salary View    │
│ Check-Out      │               │ Approval       │               │ Salary Update  │
│ Daily Report   │               │ Balance        │               │ History        │
└────────────────┘               └────────────────┘               └────────────────┘
                                          │
                                          ▼
                              ┌──────────────────────┐
                              │ Business Services    │
                              │ Validation           │
                              │ Permission Checks    │
                              │ Audit Logging        │
                              └──────────┬───────────┘
                                         │
                    ┌────────────────────┼─────────────────────┐
                    ▼                    ▼                     ▼
          Repository Layer      Email Service        File Storage
                    │
                    ▼
        PostgreSQL Database (SQLAlchemy ORM)
                    │
                    ▼
        Users • Employees • Attendance
        Leave • Payroll • Audit Logs