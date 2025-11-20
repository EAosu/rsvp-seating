This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

### Prerequisites

1. **Database Setup**: Set up a PostgreSQL database (Vercel Postgres, Supabase, Neon, or any PostgreSQL provider)
2. **Environment Variables**: Configure all required environment variables in Vercel

### Required Environment Variables

Add these in your Vercel project settings (Settings → Environment Variables):

#### Required:
- `DATABASE_URL` - PostgreSQL connection string
  - Example: `postgresql://user:password@host:5432/database?schema=public`
  - If using Vercel Postgres, this is automatically provided
- `NEXTAUTH_SECRET` - Secret key for JWT encryption
  - Generate with: `openssl rand -base64 32`
- `NEXTAUTH_URL` - Base URL of your application
  - Production: `https://your-app.vercel.app`
  - Preview: `https://your-app-git-branch.vercel.app`

#### Optional (for WhatsApp features):
- `WA_PHONE_NUMBER_ID` - WhatsApp Business Phone Number ID
- `WA_ACCESS_TOKEN` - WhatsApp API Access Token
- `WA_API_VERSION` - WhatsApp API version (default: `v20.0`)
- `WA_TEMPLATE_NAME` - WhatsApp template name (default: `rsvp_inv_heb`)
- `WA_WEBHOOK_VERIFY_TOKEN` - Webhook verification token
- `WA_BUSINESS_NAME` - Business name for WhatsApp messages (default: `העסק שלך`)

### Deployment Steps

1. **Push your code to GitHub/GitLab/Bitbucket**

2. **Import project to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your repository
   - Vercel will auto-detect Next.js

3. **Configure Environment Variables**:
   - Add all required environment variables in Vercel dashboard
   - Make sure to add them for Production, Preview, and Development environments as needed

4. **Database Setup**:
   - If using Vercel Postgres:
     - Add Vercel Postgres integration in your project
     - The `DATABASE_URL` will be automatically set
   - If using external database:
     - Add your database connection string as `DATABASE_URL`

5. **Run Database Migrations**:
   - After first deployment, run migrations:
     ```bash
     npx prisma migrate deploy
     ```
   - Or use Vercel's build command to auto-run migrations:
     - In Vercel project settings, add build command: `npm run build && npx prisma migrate deploy`
   - Alternatively, use Vercel's Post Deploy hook or run migrations manually

6. **Deploy**:
   - Vercel will automatically build and deploy
   - The build process will:
     - Install dependencies
     - Run `postinstall` script (generates Prisma Client)
     - Build the Next.js application

### Post-Deployment

1. **Run Database Migrations** (if not automated):
   ```bash
   npx prisma migrate deploy
   ```

2. **Verify Environment Variables**:
   - Check that all required variables are set
   - Ensure `NEXTAUTH_URL` matches your deployment URL

3. **Test the Application**:
   - Visit your deployment URL
   - Test authentication flow
   - Verify database connections

### Troubleshooting

#### Database Connection Errors in Production

If you're seeing "Database connection error. Please check your database configuration." in production but it works locally, check the following:

1. **Verify DATABASE_URL is set in Vercel**:
   - Go to your Vercel project → Settings → Environment Variables
   - Ensure `DATABASE_URL` is set for Production environment
   - The value should be your PostgreSQL connection string

2. **Use Connection Pooling (REQUIRED for Serverless)**:
   - Serverless functions (Vercel) require connection pooling
   - **If using Vercel Postgres**: The connection string is automatically pooled
   - **If using Supabase**: Use the "Connection Pooling" connection string (port 6543) instead of direct connection (port 5432)
   - **If using Neon**: Use the pooled connection string (ends with `?sslmode=require` or includes pooling parameters)
   - **If using other providers**: Look for a "pooled" or "transaction" connection string option
   
   Example pooled connection string format:
   ```
   postgresql://user:password@host:6543/database?sslmode=require
   ```
   
   **DO NOT use direct connection strings** (port 5432) in production on Vercel - they will fail!

3. **Run Database Migrations**:
   - Migrations are now automatically run during build (configured in `vercel.json`)
   - If migrations fail, you can run them manually:
     ```bash
     npx prisma migrate deploy
     ```
   - Or use Vercel CLI: `vercel env pull` then `npx prisma migrate deploy`

4. **Check Build Logs**:
   - In Vercel dashboard, check the build logs for Prisma errors
   - Look for "Can't reach database server" or "P1001" errors
   - Verify that `prisma generate` and `prisma migrate deploy` completed successfully

#### Other Common Issues

- **Build fails**: Check that all environment variables are set
- **Prisma errors**: Ensure `postinstall` script ran successfully (check build logs)
- **NextAuth errors**: Verify `NEXTAUTH_SECRET` and `NEXTAUTH_URL` are set correctly

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
