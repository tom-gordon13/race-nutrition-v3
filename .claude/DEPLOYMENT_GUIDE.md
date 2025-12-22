# RaceFuel PWA - Deployment Guide

## ✅ API Configuration Fixed!

Your localhost API issues have been resolved. The app now intelligently detects the environment and uses the correct API URL.

## How It Works

### Smart API URL Detection (`ui/src/config/api.ts`)

The app automatically determines the correct API URL based on:

1. **Local Development** (`localhost:5173`):
   - Uses `http://localhost:3001` for API calls
   - Perfect for local development

2. **Production/Deployed** (any non-localhost domain):
   - Uses `window.location.origin` (same domain as frontend)
   - Works with Vercel's rewrite rules (`/api/*` → API function)

### Configuration Priority

```javascript
// 1. Explicit environment variable (non-localhost)
VITE_API_URL=https://api.custom-domain.com → Uses this

// 2. Production detection
Deployed on Vercel → Uses same origin + /api path

// 3. Development fallback
Running locally → Uses http://localhost:3001
```

## Deployment Instructions

### Option 1: Vercel (Recommended)

**Your app is already configured for Vercel!**

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Deploy from project root**:
   ```bash
   vercel --prod
   ```

3. **Set Environment Variables in Vercel**:
   - Go to your project → Settings → Environment Variables
   - Add these variables:
     ```
     VITE_AUTH0_DOMAIN=dev-786y8f6gl4llhc5a.us.auth0.com
     VITE_AUTH0_CLIENT_ID=LmYiksEN266fLbhExHAY4TepT8dL89S1
     ```
   - Do NOT set `VITE_API_URL` - it will auto-detect!

4. **Done!** Your PWA is live at `https://your-project.vercel.app`

**How it works:**
- Vercel builds the UI and serves from CDN
- `/api/*` requests are routed to `api/index.ts` serverless function
- Same domain = no CORS issues!

### Option 2: Netlify

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Deploy**:
   ```bash
   netlify deploy --prod --dir=dist
   ```

3. **Set Environment Variables**:
   - Site settings → Build & deploy → Environment
   - Add Auth0 variables (same as Vercel)

4. **Configure API Proxy** (create `netlify.toml`):
   ```toml
   [[redirects]]
     from = "/api/*"
     to = "https://your-api-domain.com/:splat"
     status = 200
   ```

### Option 3: Custom Domain with Separate API

If your API is hosted separately (e.g., `api.yourdomain.com`):

1. **Set Environment Variable**:
   ```
   VITE_API_URL=https://api.yourdomain.com
   ```

2. **Update CORS on API** to allow your frontend domain

3. **Deploy** using any method above

## Testing Locally

### Test Production Build Locally

```bash
# From project root
npm run build
npm run preview
```

Open `http://localhost:4173` - should work just like localhost:5173

### Test with Local API Running

```bash
# Terminal 1: API
npm run dev:api

# Terminal 2: UI
cd ui
npm run dev
```

The app will use `http://localhost:3001` automatically.

## Environment Variables Reference

### Required for Deployment

```bash
# Auth0 (Required)
VITE_AUTH0_DOMAIN=your-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id

# API URL (Optional - auto-detected)
# Only set if you have a custom API domain
VITE_API_URL=https://api.custom-domain.com
```

### Local Development (.env.local)

```bash
VITE_AUTH0_DOMAIN=dev-786y8f6gl4llhc5a.us.auth0.com
VITE_AUTH0_CLIENT_ID=LmYiksEN266fLbhExHAY4TepT8dL89S1
VITE_API_URL=http://localhost:3001  # Optional, auto-detected
```

## PWA Features After Deployment

Once deployed to HTTPS:

### ✅ Automatically Available
- Service Worker registers
- App can be installed (home screen)
- Offline functionality works
- Update notifications appear
- Fast loading with caching

### Testing PWA on Mobile

1. **Deploy to Vercel** (or any HTTPS hosting)

2. **Open on Mobile**:
   - **Android (Chrome)**:
     - Visit your deployed URL
     - Look for "Install app" banner or prompt
     - Or: Menu → "Install app" or "Add to Home Screen"

   - **iOS (Safari)**:
     - Visit your deployed URL
     - Tap Share button
     - Tap "Add to Home Screen"
     - Enter app name
     - Tap "Add"

3. **Launch from Home Screen**:
   - Opens in full-screen mode
   - No browser UI
   - Feels like a native app!

4. **Test Offline**:
   - Turn on Airplane Mode
   - App still works!
   - Previously visited pages load from cache

## Troubleshooting

### "API calls failing with 404"

**Cause**: API URL not configured correctly

**Fix**:
- Check `vercel.json` has correct rewrites
- Verify API function is deployed
- Check console logs: `🔧 API Configuration` shows detected URL

### "Can't install PWA"

**Cause**: Not on HTTPS or PWA requirements not met

**Fix**:
- Must be deployed to HTTPS domain
- Run Lighthouse PWA audit in DevTools
- Check service worker is registered (DevTools → Application)

### "Environment variables not working"

**Cause**: Vercel/Netlify doesn't have variables set

**Fix**:
- Set in platform UI (not just .env files)
- Redeploy after setting variables
- Variables must start with `VITE_` to be exposed to browser

### "CORS errors"

**Cause**: API and frontend on different domains without CORS configured

**Solution 1**: Use Vercel (same domain, no CORS needed)
**Solution 2**: Configure CORS on your API to allow frontend domain

## What Was Changed

### Files Modified

1. **Created**: `ui/src/config/api.ts`
   - Smart API URL detection logic
   - Handles dev/prod environments automatically

2. **Updated**: All components using API calls
   - Changed from: `const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'`
   - Changed to: `import { API_URL } from './config/api'`

3. **Files Updated**:
   - `src/hooks/useUserSync.ts`
   - `src/Events.tsx`
   - `src/FoodItems.tsx`
   - `src/Preferences.tsx`
   - `src/Nutrients.tsx`
   - `src/Users.tsx`
   - `src/CreateFoodItem.tsx`
   - All component files in `src/components/events/`
   - All component files in `src/components/food-items/`

## Quick Deploy Checklist

- [ ] Run `npm run build` successfully
- [ ] Set environment variables in deployment platform
- [ ] Deploy to HTTPS domain
- [ ] Test app opens correctly
- [ ] Test API calls work (check Network tab)
- [ ] Test PWA install on mobile
- [ ] Test offline functionality
- [ ] Update Auth0 allowed callbacks to include production URL

## Next Steps

1. **Deploy Now**:
   ```bash
   vercel --prod
   ```

2. **Update Auth0**:
   - Add production URL to:
     - Allowed Callback URLs
     - Allowed Logout URLs
     - Allowed Web Origins

3. **Test on Phone**:
   - Install PWA
   - Test offline mode
   - Verify notifications work

4. **Monitor**:
   - Check Vercel analytics
   - Monitor error logs
   - Track PWA install rates

---

**Your PWA is now ready for deployment!** 🚀

The localhost issues will be completely resolved once deployed to a live HTTPS domain.
