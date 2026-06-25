# Setting Up Admin Access - New Architecture

## Overview

The authentication system now uses **two separate, independent tables**:

- **`employees`** - For consumer app users (store checkers)
- **`admins`** - For admin panel access (management)

They do NOT depend on each other. An admin doesn't need to be an employee, and vice versa.

---

## Step 1: Create the `admins` Table in Supabase

Go to Supabase Dashboard → **SQL Editor** and run this:

```sql
-- Create admins table
CREATE TABLE admins (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  admin_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'editor', 'viewer')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_admins_admin_id ON admins(admin_id);
CREATE INDEX idx_admins_status ON admins(status);

-- Disable RLS for now (add proper policies in production)
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;

-- Optional: Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admins_updated_at
BEFORE UPDATE ON admins
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();
```

---

## Step 2: Add Your Admin Account

Insert your admin record:

```sql
INSERT INTO admins (admin_id, name, email, status, role)
VALUES ('w.rodriguez', 'Your Name', 'your.email@mail-cca.com', 'active', 'admin');
```

**Important:** Use your actual admin ID format (e.g., `w.rodriguez`, `sela.pa.admin001`, etc.)

---

## Step 3: Test Admin Login

1. Go to: `http://localhost:5173/admin/login`
2. Enter your **Admin ID** (e.g., `w.rodriguez`)
3. Click "Send OTP"
4. Check your email for the 6-digit code
5. Enter code and verify
6. You're in the admin panel!

---

## Step 4 (Optional): Add More Admins

Repeat Step 2 with other admin credentials:

```sql
INSERT INTO admins (admin_id, name, email, status, role)
VALUES 
  ('admin.user2', 'Admin User 2', 'admin2@mail-cca.com', 'active', 'admin'),
  ('admin.user3', 'Admin User 3', 'admin3@mail-cca.com', 'active', 'editor');
```

---

## Important: Do NOT Delete `admin_access` Table

The `admin_access` table was created for future multi-admin permission management. It's still in the database but is no longer used for login. Leave it as-is for now.

---

## Key Differences from Old Architecture

| Feature | Before | Now |
|---------|--------|-----|
| **Admin Table** | `admin_access` (linked to employees) | `admins` (independent) |
| **Admin ID Format** | Must match employee ID | Flexible (w.rodriguez, admin001, etc.) |
| **Relationship** | Foreign key to employees | Completely separate |
| **Required** | Admin must be an employee | No relationship required |
| **Login** | Checked `employee_id` | Checks `admin_id` |

---

## Database Schema Summary

### `admins` table
```
id:          BIGINT (Primary Key)
admin_id:    TEXT (Unique) - Flexible format: w.rodriguez, sela.pa.admin001, etc.
name:        TEXT - Admin's full name
email:       TEXT - Email for OTP delivery
status:      TEXT - 'active' or 'inactive'
role:        TEXT - 'admin', 'editor', or 'viewer' (for future role-based access)
created_at:  TIMESTAMP - Record creation time
updated_at:  TIMESTAMP - Last modification time
```

### `employees` table (Unchanged)
```
id:           BIGINT (Primary Key)
country:      TEXT
employee_id:  TEXT (Unique)
name:         TEXT
email:        TEXT
status:       TEXT - 'active' or 'inactive'
created_at:   TIMESTAMP
updated_at:   TIMESTAMP
```

---

## Security Notes

✅ **Admins and employees are now completely separate**  
✅ **No foreign key constraints to maintain**  
✅ **Flexible admin ID format supports any naming convention**  
✅ **OTP codes are generated fresh for each login (no remember device for admins)**  
✅ **Session expires on browser close**  

---

## Troubleshooting

**Q: "Admin access denied" when trying to login?**  
A: Make sure your admin_id is in the `admins` table and `status = 'active'`

**Q: OTP not sending?**  
A: Check that Resend API key is set in `.env.local` with valid format

**Q: Can I use the same email for both admin and employee?**  
A: Yes, no restrictions on email uniqueness across tables

**Q: What if I want to be both admin and employee?**  
A: Add records to both `admins` and `employees` tables with your credentials

---

## Next: Add Employee Data

Once admins are set up, go to the admin panel and import employees using the **Employees** tab!
