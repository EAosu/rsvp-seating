# Database Connection Troubleshooting Guide

## Intermittent "Application Error" in Production

If you're experiencing intermittent database connection errors in production (works sometimes, fails other times), this is almost always a **connection pooling** issue in serverless environments.

## Root Cause

Vercel (and other serverless platforms) run your code in stateless functions. Each function invocation:
- May create a new database connection
- Has limited connection pool capacity
- Can't reuse connections across invocations like traditional servers

When multiple requests come in simultaneously, they can exhaust the connection pool, causing intermittent failures.

## Solutions

### 1. **USE CONNECTION POOLING (REQUIRED)**

You **MUST** use a pooled connection string in production. Direct connections will fail intermittently.

#### Vercel Postgres
- ✅ Automatically uses connection pooling
- Just ensure `DATABASE_URL` is set in Vercel environment variables

#### Supabase
- ❌ **DON'T use**: `postgresql://...@db.xxx.supabase.co:5432/...` (direct connection)
- ✅ **USE**: `postgresql://...@db.xxx.supabase.co:6543/...` (pooled connection, port 6543)
- Find it in: Supabase Dashboard → Project Settings → Database → Connection Pooling

#### Neon
- ✅ Use the "Pooled" connection string (not "Direct")
- Find it in: Neon Dashboard → Connection Details → Pooled connection

#### Other Providers
- Look for "Transaction" or "Pooled" connection strings
- Avoid "Direct" or "Session" connection strings

### 2. **Verify Your Connection String**

Check your `DATABASE_URL` in Vercel:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Check the `DATABASE_URL` value
3. Ensure it's using a pooled connection (check the port number)

**Common ports:**
- `5432` = Direct connection (❌ will fail in serverless)
- `6543` = Pooled connection (✅ works in serverless)
- Other ports may vary by provider

### 3. **Connection String Format**

A proper pooled connection string should look like:
```
postgresql://user:password@host:6543/database?sslmode=require&pgbouncer=true
```

Or for some providers:
```
postgresql://user:password@host:6543/database?sslmode=require&connection_limit=1
```

### 4. **Code Optimizations**

The codebase has been optimized to:
- ✅ Reduce parallel queries (7 queries → 3 queries on event page)
- ✅ Properly cache Prisma client instance
- ✅ Handle graceful disconnections

### 5. **Check Build Logs**

After deploying, check Vercel build logs:
1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on the latest deployment
3. Check the build logs for:
   - `prisma generate` - Should complete successfully
   - `prisma migrate deploy` - Should complete successfully
   - Any database connection errors

### 6. **Test After Changes**

After updating your connection string:
1. **Redeploy** your application
2. **Test multiple pages** in quick succession
3. **Check Vercel function logs** for errors:
   - Vercel Dashboard → Your Project → Logs
   - Look for "Can't reach database server" or "P1001" errors

## Quick Diagnostic Checklist

- [ ] `DATABASE_URL` is set in Vercel environment variables
- [ ] Using **pooled** connection string (not direct)
- [ ] Connection string uses correct port (6543 for Supabase, or provider's pooled port)
- [ ] Application has been redeployed after connection string changes
- [ ] Build logs show successful Prisma generation and migrations
- [ ] No connection errors in Vercel function logs

## Still Having Issues?

If you've verified all of the above and still have issues:

1. **Check your database provider's connection limits**
   - Some free tiers have very low connection limits
   - Consider upgrading your database plan

2. **Monitor connection usage**
   - Check your database provider's dashboard for active connections
   - If you see many idle connections, that's a sign of connection leaks

3. **Contact your database provider**
   - They may have specific recommendations for serverless usage
   - Some providers offer serverless-optimized connection strings

## Common Error Messages

- `Can't reach database server` → Connection string issue or network problem
- `P1001` → Connection timeout (usually means direct connection instead of pooled)
- `too many connections` → Connection pool exhausted (need pooled connection)
- `Application error: a server-side exception` → Usually a database connection failure

## Additional Resources

- [Prisma Serverless Guide](https://www.prisma.io/docs/guides/deployment/serverless)
- [Vercel Postgres Documentation](https://vercel.com/docs/storage/vercel-postgres)
- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)

