# Production API Fix Guide

## What Was Broken

1. **TypeScript Import Issues**: API routes imported with `.js` extensions but files are `.ts`
2. **Vercel Configuration**: Missing proper serverless function configuration
3. **No TypeScript Config**: API directory had no `tsconfig.json`
4. **Missing Error Handling**: No health check or 404 handlers

## What I Fixed

### 1. Fixed API Index (`api/index.ts`)

**Before**:
```typescript
import authRoutes from './src/routes/auth.js'; // ❌ Wrong extension
```

**After**:
```typescript
import authRoutes from './src/routes/auth'; // ✅ Correct, TypeScript handles it
```

**Added**:
- Health check endpoint: `/api/health`
- 404 handler for debugging
- Proper TypeScript types

### 2. Updated Vercel Configuration (`vercel.json`)

**Before**:
```json
{
  "rewrites": [...],  // Simple rewrites only
  "functions": {...}
}
```

**After**:
```json
{
  "version": 2,
  "builds": [{
    "src": "api/index.ts",
    "use": "@vercel/node"  // ✅ Tells Vercel how to build
  }],
  "routes": [...]  // ✅ Explicit routing
}
```

### 3. Added TypeScript Configuration (`api/tsconfig.json`)

Created proper TypeScript config for the API:
- ES2022 module system
- Node resolution
- Strict mode enabled

### 4. Enhanced Debugging (`ui/src/config/api.ts`)

Added logging that shows in production:
```typescript
console.log('🔧 API Configuration:', {
  API_URL: getApiUrl(),
  environment: import.meta.env.MODE,
  isProduction: import.meta.env.PROD,
  hostname: window.location.hostname,
  origin: window.location.origin,
});
```

## Deploy & Test

### Step 1: Rebuild and Deploy

```bash
# From project root
vercel --prod
```

### Step 2: Check Console Logs

Open browser DevTools Console. You should see:
```
🔧 API Configuration: {
  API_URL: "https://your-app.vercel.app",
  environment: "production",
  isProduction: true,
  hostname: "your-app.vercel.app",
  origin: "https://your-app.vercel.app"
}
```

### Step 3: Test Health Endpoint

Open in browser:
```
https://your-app.vercel.app/api/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2025-12-22T..."
}
```

### Step 4: Check Network Tab

1. Open DevTools → Network tab
2. Try logging in or loading data
3. Look for API calls to `/api/...`
4. Click on a failed request to see details

## Common Issues & Solutions

### Issue 1: "Function not found" or 404

**Symptom**: All `/api/*` requests return 404

**Cause**: Vercel didn't detect the function

**Fix**:
```bash
# Check Vercel deployment logs
vercel logs your-deployment-url
```

Look for build errors. If you see TypeScript errors, check that all imports are correct.

### Issue 2: Database Connection Errors

**Symptom**: API returns 500, logs show database errors

**Cause**: `DATABASE_URL` environment variable not set

**Fix**:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add `DATABASE_URL` with your Postgres connection string
3. Redeploy

### Issue 3: CORS Errors

**Symptom**: Browser console shows CORS policy errors

**Cause**: Frontend and API on different domains

**Fix**: Should NOT happen with this setup (same domain), but if it does:
1. Check that requests go to same origin
2. Verify vercel.json routing is correct

### Issue 4: "Cannot find module"

**Symptom**: Vercel build fails with module not found

**Cause**: Missing dependencies or wrong paths

**Fix**:
```bash
# Make sure all dependencies are installed
cd api
npm install

# Check package.json has all needed packages
```

## Debugging Steps

### 1. Check Vercel Build Logs

```bash
vercel logs --follow
```

Look for:
- ✅ "Build completed"
- ✅ "Function: api/index.ts"
- ❌ Any TypeScript errors
- ❌ Any missing module errors

### 2. Test API Directly

Open these URLs in your browser:

```
https://your-app.vercel.app/api/health
https://your-app.vercel.app/api/nutrients
```

First should return health check, second should return nutrients data (or auth error if you're not logged in).

### 3. Check Browser Console

Look for:
```
🔧 API Configuration: {...}
```

If `API_URL` is not your production domain, something is wrong with the detection logic.

### 4. Check Network Requests

In DevTools Network tab:
- Filter by "Fetch/XHR"
- Look for requests to `/api/...`
- Check the full URL - should be `https://your-app.vercel.app/api/...`
- If it's `http://localhost:3001/api/...`, the environment detection failed

## If Still Broken

### Get Detailed Error Info

1. Open failing request in Network tab
2. Click "Response" tab - see actual error message
3. Click "Headers" tab - check request URL

### Check Vercel Function Logs

```bash
vercel logs --follow
```

This shows real-time logs from your API function. You'll see:
- Incoming requests
- Any console.log statements
- Error stack traces

### Manual Override (Temporary)

If you need to deploy NOW and debug later:

1. Deploy API to a separate service (Railway, Render, etc.)
2. Set environment variable:
   ```
   VITE_API_URL=https://your-api-domain.com
   ```
3. Redeploy frontend

## Expected Behavior

### Local Development
- API URL: `http://localhost:3001`
- Calls go to local API server

### Production
- API URL: `https://your-app.vercel.app`
- Calls go to `/api/*` which routes to serverless function
- Same domain = no CORS issues

## Files Changed

- ✅ `api/index.ts` - Fixed imports, added health check
- ✅ `vercel.json` - Proper serverless configuration
- ✅ `api/tsconfig.json` - New TypeScript config
- ✅ `ui/src/config/api.ts` - Better logging

## Next Deploy Commands

```bash
# Test build locally first
npm run build

# If successful, deploy
vercel --prod

# Watch logs
vercel logs --follow
```

After deploying, test:
1. ✅ Health endpoint: `/api/health`
2. ✅ Login flow
3. ✅ Data loading (food items, events, etc.)
4. ✅ PWA install prompt appears
5. ✅ Offline mode works

If everything works, you're good! If not, check the debugging steps above.
