                User Opens Website
                       │
                       ▼
               Login / Sign Up
                       │
         Email Verification Required?
               │               │
             Yes              No
               │               │
        Verify Email      Login Failed
               │
               ▼
      JWT Authentication
               │
               ▼
      Role Identification
      (Admin / Employee)
               │
      ┌────────┴─────────┐
      ▼                  ▼
 Employee Dashboard   Admin Dashboard
      │                  │
      │                  │
 ┌────┼────┐      ┌──────┼─────────┐
 ▼    ▼    ▼      ▼      ▼         ▼
Profile Attendance Leave Employee Payroll
                     Approval Management