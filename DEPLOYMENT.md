# Deployment Guide

This guide covers deploying the Waitlist Landing Page application to Vercel and other platforms.

## Vercel Deployment

### Prerequisites
- Vercel account
- GitHub repository connected
- PostgreSQL database (can use Vercel Postgres or external provider)

### Step 1: Prepare for Deployment

1. **Set up environment variables**:
   Create a `.env` file with production values:
   ```env
   DATABASE_URL=your_production_database_url
   NODE_ENV=production
   PORT=3000
   ```

2. **Update Vercel configuration** (`vercel.json`):
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "server.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "server.js"
       }
     ]
   }
   ```

### Step 2: Deploy to Vercel

#### Option A: Vercel CLI (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

#### Option B: GitHub Integration
1. Connect your GitHub repository to Vercel
2. Vercel will automatically deploy on push to main branch
3. Set environment variables in Vercel dashboard

#### Option C: Vercel Dashboard
1. Go to vercel.com
2. Click "New Project"
3. Import your GitHub repository
4. Configure settings and deploy

### Step 3: Configure Environment Variables in Vercel

In your Vercel project dashboard:
1. Go to Settings → Environment Variables
2. Add the following variables:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `NODE_ENV`: `production`
   - `PORT`: `3000`

### Step 4: Database Setup for Production

#### Using Vercel Postgres (Recommended)
1. In Vercel dashboard, go to Storage → Postgres
2. Create a new database
3. Copy the connection string and add as `DATABASE_URL`
4. Run the schema on the production database:
   ```bash
   # Using psql with connection string
   psql your_connection_string -f database/schema.sql
   ```

#### Using External PostgreSQL
1. Use services like Railway, Neon, Supabase, or Heroku Postgres
2. Get the connection string
3. Add as `DATABASE_URL` environment variable
4. Run the schema on the external database

### Step 5: Verify Deployment

1. **Check health endpoint**: `https://your-app.vercel.app/health`
2. **Test signup endpoints**:
   ```bash
   # Test waitlist signup
   curl -X POST https://your-app.vercel.app/api/signup \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","topics":["technology"]}'

   # Test free signup
   curl -X POST https://your-app.vercel.app/api/signup-free \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com"}'
   ```

## Alternative Deployment Options

### Railway Deployment

1. **Connect GitHub repository** to Railway
2. **Set environment variables** in Railway dashboard
3. **Deploy automatically** on git push

### Heroku Deployment

```bash
# Create Heroku app
heroku create your-app-name

# Set environment variables
heroku config:set DATABASE_URL=your_database_url
heroku config:set NODE_ENV=production

# Deploy
git push heroku main

# Run database migrations
heroku run psql $DATABASE_URL -f database/schema.sql
```

### Docker Deployment

1. **Create Dockerfile**:
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm install --production
   COPY . .
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. **Build and run**:
   ```bash
   docker build -t waitlist-app .
   docker run -p 3000:3000 -e DATABASE_URL=your_url waitlist-app
   ```

## Environment-Specific Configuration

### Development
```env
DATABASE_URL=postgresql://localhost:5432/waitlist_db
NODE_ENV=development
PORT=3000
```

### Production
```env
DATABASE_URL=your_production_database_url
NODE_ENV=production
PORT=3000
```

## Monitoring and Logs

### Vercel Logs
```bash
# View deployment logs
vercel logs

# View function logs
vercel logs --function=api
```

### Custom Logging
The application includes built-in logging:
- API requests are logged to console
- Errors are logged with stack traces
- Database operations are logged

## Performance Optimization

1. **Enable caching** for static assets
2. **Use CDN** for frontend assets
3. **Database connection pooling** is configured
4. **Request limiting** can be added for production

## Security Considerations

1. **Environment variables**: Never commit sensitive data
2. **CORS**: Configured for your domain only
3. **Input validation**: All inputs are validated and sanitized
4. **HTTPS**: Vercel provides SSL by default

## Troubleshooting

### Common Issues

1. **Database connection errors**:
   - Check `DATABASE_URL` format
   - Verify database is accessible from Vercel

2. **CORS errors**:
   - Update CORS origin in `server.js` for your domain

3. **Build failures**:
   - Check Node.js version compatibility
   - Verify all dependencies are in package.json

### Getting Help

1. Check Vercel deployment logs
2. Test API endpoints with curl or Postman
3. Verify database connectivity
4. Check environment variables are set correctly

## Rollback Procedures

### Vercel Rollback
1. Go to Vercel dashboard → Deployments
2. Find previous successful deployment
3. Click "..." → Promote to Production

### Database Rollback
For critical issues, you may need to:
1. Backup current database
2. Restore from previous backup
3. Run specific database migration rollbacks

## Continuous Deployment

Set up GitHub Actions for automated testing and deployment:

```yaml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

Remember to test thoroughly in staging before deploying to production!
