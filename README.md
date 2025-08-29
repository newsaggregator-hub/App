# NewsLens - Multi-Perspective News Aggregation Platform

A static landing page and serverless backend for a news aggregation platform that helps users compare perspectives on the same story from different sources.

## 🚀 Features

- **Responsive Landing Page**: Modern, mobile-first design with hero section and feature showcase
- **Email Signup**: Early access signup form with client-side validation
- **Serverless Backend**: Node.js API endpoint for handling signups
- **Database Integration**: PlanetScale MySQL database for storing user signups
- **Analytics Ready**: Google Analytics integration for tracking user engagement
- **Free Tier Deployment**: Designed to work within free tiers of Vercel and PlanetScale

## 📁 Project Structure

```
news-aggregator/
├── index.html              # Main landing page
├── styles.css              # Responsive CSS styling
├── script.js               # Client-side JavaScript
├── package.json            # Node.js dependencies
├── vercel.json             # Vercel deployment configuration
├── .env.example            # Environment variables template
├── api/
│   └── signup.js           # Serverless function for signup API
├── database/
│   └── schema.sql          # Database schema for PlanetScale
└── README.md               # This file
```

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js (Vercel Functions)
- **Database**: PlanetScale (MySQL)
- **Hosting**: Vercel (Frontend + Backend)
- **Analytics**: Google Analytics

## 📋 Prerequisites

- Node.js 18+ installed
- Git installed
- GitHub account
- Vercel account
- PlanetScale account

## 🚀 Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd news-aggregator

# Install dependencies
npm install
```

### 2. Database Setup (PlanetScale)

1. **Create PlanetScale Database**:
   - Go to [PlanetScale Dashboard](https://app.planetscale.com)
   - Create a new database named `newslens`
   - Create a branch (e.g., `main`)

2. **Run Database Schema**:
   ```bash
   # Connect to your database and run the schema
   # Copy the contents of database/schema.sql and execute in PlanetScale console
   ```

3. **Get Connection Details**:
   - Go to your database → Connect → Create password
   - Copy the connection details for environment variables

### 3. Environment Configuration

1. **Copy environment template**:
   ```bash
   cp .env.example .env.local
   ```

2. **Update `.env.local`** with your PlanetScale credentials:
   ```env
   DATABASE_HOST=your-host.connect.psdb.cloud
   DATABASE_USERNAME=your-username
   DATABASE_PASSWORD=your-password
   DATABASE_NAME=newslens
   ```

3. **Update Google Analytics** (Optional):
   - Replace `GA_MEASUREMENT_ID` in `index.html` with your actual GA ID

### 4. Local Development

```bash
# Start development server
npm run dev

# Or use Vercel CLI
npx vercel dev
```

Visit `http://localhost:3000` to see the landing page.

### 5. Deploy to Vercel

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Import your GitHub repository
   - Add environment variables in Vercel dashboard:
     - `DATABASE_HOST`
     - `DATABASE_USERNAME`
     - `DATABASE_PASSWORD`
     - `DATABASE_NAME`

3. **Test Deployment**:
   - Visit your deployed URL
   - Test the signup form
   - Check database for new entries

## 🔧 API Endpoints

### POST /api/signup

Handles user signup for early access.

**Request Body**:
```json
{
  "email": "user@example.com",
  "topics": ["Politics", "Business", "Technology"]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Successfully signed up for early access!",
  "data": {
    "email": "user@example.com",
    "topics": ["Politics", "Business", "Technology"],
    "isNewSignup": true
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Please provide a valid email address."
}
```

## 🎨 Customization

### Styling
- Modify `styles.css` for design changes
- Update color scheme in CSS custom properties
- Adjust responsive breakpoints as needed

### Content
- Update hero section text in `index.html`
- Modify feature cards and news examples
- Change company name and branding

### Analytics
- Replace Google Analytics ID in `index.html`
- Add additional tracking events in `script.js`

## 📊 Database Schema

```sql
CREATE TABLE signups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  topics JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 🔍 Monitoring and Analytics

### Database Queries

**View all signups**:
```sql
SELECT * FROM signups ORDER BY created_at DESC;
```

**Signup statistics**:
```sql
SELECT 
  COUNT(*) as total_signups,
  DATE(created_at) as signup_date
FROM signups 
GROUP BY DATE(created_at)
ORDER BY signup_date DESC;
```

**Topic preferences**:
```sql
SELECT 
  topic_value as topic,
  COUNT(*) as count
FROM signups
CROSS JOIN JSON_TABLE(topics, '$[*]' COLUMNS (topic_value VARCHAR(50) PATH '$')) as topics_table
GROUP BY topic_value
ORDER BY count DESC;
```

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**:
   - Check environment variables are set correctly
   - Verify PlanetScale database is active
   - Ensure connection string format is correct

2. **CORS Errors**:
   - Check `vercel.json` CORS configuration
   - Verify API endpoint is accessible

3. **Form Validation Issues**:
   - Check browser console for JavaScript errors
   - Verify email regex pattern
   - Ensure topics are being selected

4. **Deployment Issues**:
   - Check Vercel build logs
   - Verify all environment variables are set in Vercel dashboard
   - Ensure `package.json` dependencies are correct

### Debug Mode

Enable debug logging by adding to your environment:
```env
NODE_ENV=development
```

## 📈 Performance Optimization

- **Images**: Add optimized images for better visual appeal
- **Caching**: Implement proper caching headers
- **CDN**: Use Vercel's built-in CDN for static assets
- **Database**: Add indexes for frequently queried columns

## 🔐 Security Considerations

- **Input Validation**: All inputs are validated on both client and server
- **SQL Injection**: Using parameterized queries with mysql2
- **Rate Limiting**: Consider adding rate limiting for production
- **HTTPS**: Vercel provides HTTPS by default

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues and questions:
- Check the troubleshooting section above
- Review Vercel and PlanetScale documentation
- Open an issue in the GitHub repository

---

**Built with ❤️ for better news consumption**
