# AQI Monitor Backend Setup Guide

## Prerequisites
- Node.js (v14 or higher)
- MongoDB (installed and running)
- Ngrok account (free)

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment Variables
Create a `.env` file in the root directory:
```bash
MONGO_URI=mongodb://localhost:27017/aqi-monitor
JWT_SECRET=your_hackathon_secret_key_123
PORT=5000
NGROK_URL=https://your-ngrok-url.ngrok-free.dev
```

### 3. Start MongoDB
Make sure MongoDB is running on your machine:
```bash
# Windows
mongod

# Mac/Linux
sudo systemctl start mongod
```

### 4. Start the Backend Server
```bash
npm start
```

You should see:
```
✅ MongoDB Connected Successfully
👤 Demo Govt User Created: admin@delhi.gov.in / govt123
🚀 Server active on http://localhost:5000
```

### 5. Setup Ngrok

#### Install Ngrok
1. Go to https://ngrok.com/download
2. Download and extract ngrok
3. Sign up at https://dashboard.ngrok.com/signup
4. Get your auth token from https://dashboard.ngrok.com/get-started/your-authtoken

#### Configure Ngrok
```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

#### Start Ngrok (in a separate terminal)
```bash
ngrok http 5000
```

You'll get a URL like: `https://abc-xyz-123.ngrok-free.dev`

#### Update the .env file
Copy the ngrok URL and update your `.env` file:
```
NGROK_URL=https://abc-xyz-123.ngrok-free.dev
```

Then restart the server.

### 6. Test the API

**Local test:**
```
http://localhost:5000
```

**Public test:**
```
https://your-ngrok-url.ngrok-free.dev
```

**Health check:**
```
https://your-ngrok-url.ngrok-free.dev/api/health
```

## Demo User Credentials
- Email: `admin@delhi.gov.in`
- Password: `govt123`
- Role: `govt`

## API Endpoints

### Authentication
- `POST /api/login` - Login
- `POST /api/signup/start` - Start signup (verify email)
- `POST /api/signup/complete` - Complete signup (create password)
- `GET /api/profile` - Get user profile (requires auth)

### Ward Data
- `GET /api/ward/:name` - Get ward AQI data

### Complaints
- `POST /api/submit-complaint` - Submit complaint (public)
- `GET /api/govt/complaints` - Get all complaints (govt only)
- `PATCH /api/govt/complaints/:id` - Update complaint status (govt only)

### Admin
- `GET /api/admin/users` - Get all users (admin/govt only)
- `PATCH /api/admin/users/:userId/role` - Update user role (admin/govt only)

## Important Notes

1. **Keep both terminals running:**
   - Terminal 1: Backend server (`npm start`)
   - Terminal 2: Ngrok tunnel (`ngrok http 5000`)

2. **Ngrok URL changes** every time you restart ngrok (unless you have a paid account)

3. **Update CORS:** If you change the ngrok URL, update it in `server.js` and restart the server

4. **MongoDB must be running** before starting the backend server

## Troubleshooting

### MongoDB Connection Error
- Make sure MongoDB is installed and running
- Check if port 27017 is available

### Ngrok Error 4018
- Sign up for ngrok account
- Add your auth token: `ngrok config add-authtoken YOUR_TOKEN`

### CORS Error
- Make sure the ngrok URL in `.env` matches the actual ngrok URL
- Restart the server after updating the URL

### Login Error
- Check if MongoDB is connected
- Verify the demo user was created (check server logs)

## Support
For issues, check the server logs in the terminal where you ran `npm start`.