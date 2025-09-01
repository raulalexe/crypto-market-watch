# Scripts

## User Seeding

### seedUser.js

Creates a user with specified email, password, and plan.

**Usage:**
```bash
node scripts/seedUser.js <email> <password> <plan>
```

**Parameters:**
- `email`: User's email address
- `password`: User's password (will be hashed)
- `plan`: User's subscription plan

**Valid Plans:**
- `free` - Free tier user
- `pro` - Pro tier user  
- `premium` - Premium tier user
- `admin` - Admin user with full privileges

**Examples:**
```bash
# Create an admin user
node scripts/seedUser.js admin@example.com mypassword admin

# Create a pro user
node scripts/seedUser.js user@example.com mypassword pro

# Create a free user
node scripts/seedUser.js freeuser@example.com mypassword free
```

**Requirements:**
- `DATABASE_URL` environment variable must be set
- PostgreSQL database must be accessible
- Users and subscriptions tables must exist

**Features:**
- Automatically hashes passwords with bcrypt
- Updates existing users if email already exists
- Creates appropriate subscription records
- Validates input parameters
- Provides detailed feedback and error messages
