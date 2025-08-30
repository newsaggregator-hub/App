# Waitlist Landing Page

A modern, responsive waitlist landing page with email collection and database integration. Built with Node.js, Express, PostgreSQL, and vanilla JavaScript.

## Features

- **Dual Signup Options**: Waitlist signup with topic preferences and free access signup
- **Email Validation**: Comprehensive email validation and sanitization
- **Database Integration**: PostgreSQL database with proper schema design
- **CORS Support**: Proper CORS configuration for both development and production
- **Error Handling**: Comprehensive error handling and logging
- **Testing**: Complete test suite for API endpoints
- **Responsive Design**: Mobile-friendly landing page

## Database Schema

The application uses the following tables:
- `waitlist_signups` - For waitlist registrations with topic preferences
- `free_signups` - For free access registrations
- `signup_events` - Event logging for analytics
- `landing_page_metrics` - Metrics tracking

## Setup Instructions

### 1. Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- npm or yarn

### 2. Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd waitlist-landing-page

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
```

### 3. Database Setup

1. Create a PostgreSQL database named `waitlist_db`
2. Update the `.env` file with your database credentials:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/waitlist_db
   NODE_ENV=development
   PORT=3000
   ```

3. Run the database schema:
```bash
psql -d waitlist_db -f database/schema.sql
```

### 4. Running the Application

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start

# Run tests
npm test
```

### 5. Access the Application

- Frontend: http://localhost:3000
- Health Check: http://localhost:3000/health
- API Endpoints:
  - POST /api/signup - Waitlist signup
  - POST /api/signup-free - Free access signup
  - GET /health - Health check

## API Documentation

### Waitlist Signup (POST /api/signup)

**Request Body:**
```json
{
  "email": "user@example.com",
  "topics": ["technology", "business"]
}
```

**Response:**
```json
{
  "message": "Successfully joined the waitlist!",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "topics": ["technology", "business"],
    "position": 42,
    "createdAt": "2023-12-07T10:30:00.000Z"
  }
}
```

### Free Signup (POST /api/signup-free)

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "Successfully registered for free access!",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "createdAt": "2023-12-07T10:30:00.000Z"
  }
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3000` |

## Testing

Run the comprehensive test suite:

```bash
npm test
```

The test suite includes:
- Valid signup scenarios
- Error handling (duplicate emails, invalid inputs)
- Health check endpoint
- Both waitlist and free signup endpoints

## Deployment

### Vercel Deployment

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on git push

### Manual Deployment

1. Build the application: `npm install --production`
2. Set environment variables
3. Start the server: `npm start`

## File Structure

```
├── api/
│   ├── signup.js          # Waitlist signup endpoint
│   └── signup-free.js     # Free signup endpoint
├── database/
│   └── schema.sql         # Database schema
├── index.html            # Landing page
├── styles.css           # CSS styles
├── script.js            # Frontend JavaScript
├── server.js            # Express server
├── test-api.js          # API test suite
├── package.json         # Dependencies
└── README.md           # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
