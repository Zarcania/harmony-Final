# Supabase Auth Setup Instructions

## Overview
Your application has been successfully migrated from custom authentication to Supabase Auth. This provides enhanced security, automatic password hashing, JWT token management, and session handling.

## Steps to Complete Setup

### 1. Create Admin User in Supabase Auth

You need to create an admin user through the Supabase Dashboard:

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project: `cbelpqfkxvxwrrbxiyww`
3. Navigate to **Authentication** > **Users** in the left sidebar
4. Click **"Add user"** or **"Invite user"**
5. Fill in the user details:
   - **Email**: `castro.oceane@laposte.net`
   - **Password**: Create a secure password (you'll use this to login)
   - **Auto Confirm User**: Check this box (so the user doesn't need email verification)

### 2. Add Admin Role to User Metadata

After creating the user:

1. In the Users list, click on the newly created user
2. Scroll down to **"User Metadata"** section
3. Click **"Edit"**
4. Add the following JSON to **user_metadata**:
   ```json
   {
     "role": "admin"
   }
   ```
5. Click **"Save"**

### 3. Test the Login

1. Open your application
2. Click the admin toggle button in the footer (look for the lock icon or admin option)
3. Login with:
   - **Email**: `castro.oceane@laposte.net`
   - **Password**: The password you created in step 1

### 4. Verify Admin Access

Once logged in, you should see:
- A welcome banner at the top saying "Bienvenue Océane"
- Access to Planning and Admin Panel buttons
- The ability to edit content across the site

## What Changed

### Authentication Flow
- **Before**: Used custom `admin_users` table with plain-text passwords
- **After**: Uses Supabase Auth with encrypted passwords and JWT tokens

### Security Improvements
- Passwords are now securely hashed by Supabase
- JWT tokens for session management
- Automatic token refresh
- Secure session persistence in localStorage
- Row Level Security (RLS) policies protect all admin operations

### Code Changes
1. **AdminContext**: Now uses `supabase.auth.signInWithPassword()` instead of custom database query
2. **AdminLogin**: Changed from username to email input
3. **Auth Persistence**: Sessions persist across page refreshes automatically
4. **Logout**: Properly clears Supabase session

## Troubleshooting

### "Email or password incorrect" error
- Verify the user exists in Supabase Dashboard > Authentication > Users
- Ensure you're using the correct email and password
- Check that the user has `"role": "admin"` in their user_metadata

### Admin features not showing
- Open browser console (F12) and check for errors
- Verify the user has admin role in metadata
- Try logging out and logging back in

### Session lost after refresh
- Check browser console for auth errors
- Ensure cookies/localStorage are not blocked
- Try clearing browser cache and logging in again

## Database Notes

- The old `admin_users` table still exists but is no longer used
- All authentication now goes through Supabase's built-in `auth.users` table
- RLS policies have been updated to check for admin role using JWT claims
- Admin role is checked via the `is_admin()` database function

## Support

If you encounter any issues:
1. Check the browser console for error messages
2. Verify Supabase connection in .env file
3. Ensure the admin user is properly configured with role metadata
