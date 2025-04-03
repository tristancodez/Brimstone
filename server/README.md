# Bolt Backend Server

This is the backend server for the Bolt application.

## Deployment Instructions

### Deploying to Render (Free Tier)

1. Sign up for a free account at [Render](https://render.com/)

2. Create a new Web Service:
   - Click "New" and select "Web Service"
   - Connect your GitHub repository (you'll need to push this code to GitHub first)
   - Select the repository and the branch you want to deploy
   - Set the root directory to `project/server` if your repo contains both frontend and backend

3. Configure your service:
   - Name: bolt-backend (or any name you prefer)
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Select the free plan

4. Add Environment Variables:
   - JWT_SECRET: (create a secure random string)
   - FRONTEND_URL: (your Vercel frontend URL)
   - NODE_VERSION: 18.x

5. Click "Create Web Service"

### Important Notes

- The free tier of Render will spin down after 15 minutes of inactivity, causing a slight delay on the first request after inactivity.
- For production, consider using a persistent database instead of in-memory storage.
- Update your frontend code to point to your new backend URL.

## Local Development

1. Install dependencies:
   ```
   npm install
   ```

2. Start the server:
   ```
   npm start
   ```

3. For development with auto-restart:
   ```
   npm run dev
   ```
