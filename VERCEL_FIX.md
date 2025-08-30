# Vercel Deployment Fix Guide

This document addresses common issues when deploying Node.js applications to Vercel and provides specific fixes for this waitlist landing page application.

## Common Vercel Deployment Issues

### 1. Serverless Function Timeouts
**Problem**: Vercel has a 10-second timeout for serverless functions.
**Solution**: Optimize database queries and ensure proper connection handling.

### 2. Database Connection Issues
**Problem**: Vercel serverless functions require proper database connection management.
**Solution**: Use connection pooling and ensure proper cleanup.

### 3. CORS Configuration
**Problem**: Cross-origin requests blocked in production.
**Solution**: Configure CORS properly for your domain.

### 4. Environment Variables
**Problem**: Environment variables not available in production.
**Solution**: Set them correctly in Vercel dashboard.

## Specific Fixes for This Application

### Fix 1: Update Server.js for Vercel Compatibility

The main `server.js` file needs to be optimized for Vercel's serverless environment:

```javascript
// Add this at the top of server.js
const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Vercel-specific middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? [process.env.VERCEL_URL, 'https://your-actual-domain.vercel.app']
        : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
}));

// ... rest of your server.js code
```

### Fix 2: Database Connection Optimization

Update your database connection logic to handle Vercel's serverless environment:

```javascript
// In your API files, use connection pooling
const { Pool } = require('pg');

// Create a pool instead of single client
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Use pool.query instead of client.query
async function query(text, params) {
    const client = await pool.connect();
    try {
        const result = await client.query(text, params);
        return result;
    } finally {
        client.release();
    }
}
```

### Fix 3: Vercel.json Configuration

Ensure your `vercel.json` is properly configured:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    },
    {
      "src": "api/**/*.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ],
  "functions": {
    "server.js": {
      "maxDuration": 30
    },
    "api/*.js": {
      "maxDuration": 30
    }
  }
}
```

### Fix 4: Environment Variables Setup

In Vercel dashboard, set these environment variables:

- `DATABASE_URL`: Your PostgreSQL connection string
- `NODE_ENV`: `production`
- `PORT`: `3000`
- `VERCEL_URL`: Your Vercel deployment URL

### Fix 5: Static File Serving

For better static file serving on Vercel:

```javascript
// In server.js, update static file serving
app.use(express.static(path.join(__dirname), {
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : '0',
    setHeaders: (res, path) => {
        if (path.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
        }
    }
}));
```

### Fix 6: Error Handling for Serverless

Add proper error handling for Vercel:

```javascript
// Wrap your routes in try-catch blocks
app.post('/api/signup', async (req, res, next) => {
    try {
        // your signup logic
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
```

## Step-by-Step Deployment Fix

### 1. Update Package.json
Ensure your `package.json` has the correct start script:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

### 2. Test Locally First
```bash
npm install
npm run dev
```

### 3. Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### 4. Set Environment Variables
In Vercel dashboard → Settings → Environment Variables:
- `DATABASE_URL`
- `NODE_ENV=production`
- `PORT=3000`
- `VERCEL_URL` (your actual Vercel URL)

### 5. Test Production Endpoints
```bash
curl https://your-app.vercel.app/health
curl -X POST https://your-app.vercel.app/api/signup -H "Content-Type: application/json" -d '{"email":"test@example.com"}'
```

## Troubleshooting Common Errors

### Error: "Module not found"
**Solution**: Ensure all dependencies are in package.json and run `npm install` before deploying.

### Error: "Database connection failed"
**Solution**: Check your `DATABASE_URL` format and ensure the database is accessible from Vercel.

### Error: "CORS policy"
**Solution**: Update the CORS origin in `server.js` to match your Vercel domain.

### Error: "Function timeout"
**Solution**: Optimize database queries and consider increasing timeout in `vercel.json`.

## Performance Optimizations

1. **Database Indexing**: Add indexes on frequently queried columns
2. **Connection Pooling**: Use pg-pool for better connection management
3. **Caching**: Implement Redis for frequent queries
4. **CDN**: Use Vercel's built-in CDN for static assets

## Monitoring

1. **Vercel Analytics**: Monitor function performance
2. **Logging**: Use `console.log` for debugging (view in Vercel dashboard)
3. **Error Tracking**: Consider adding Sentry for error monitoring

## Rollback Procedure

If deployment fails:
1. Go to Vercel dashboard → Deployments
2. Find last working deployment
3. Click "..." → Promote to Production

Remember to test thoroughly in preview deployments before promoting to production!
