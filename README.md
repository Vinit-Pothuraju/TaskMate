# TaskMate - Task Management Application

A comprehensive productivity application that helps users manage tasks, focus with timed sessions, set reminders, and get AI-powered daily suggestions.

## Features

### 🎯 Core Features
- **Task Management**: Create, edit, delete, categorize, filter, search, and mark tasks complete
- **Focus Timer**: Pomodoro-style timer with configurable session lengths and break periods
- **Session Analytics**: Track focus sessions per task, total focus time, streaks, and productivity heatmaps
- **Personal Reminders**: Schedule one-off and recurring reminders
- **AI Daily Suggestions**: Get AI-powered task prioritization based on past activity

### 🔐 Security & Performance
- JWT-based authentication with refresh tokens
- Server-side pagination and MongoDB indexing
- API rate limiting and request validation
- Responsive, mobile-first UI built with Tailwind CSS

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (access + refresh tokens)
- **AI Integration**: OpenAI GPT-4
- **Background Jobs**: node-cron
- **Email**: Nodemailer

### Frontend
- **Framework**: React 19 with Vite
- **Routing**: React Router v6
- **State Management**: Zustand
- **HTTP Client**: Axios with interceptors
- **Data Fetching**: React Query
- **Forms**: React Hook Form
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Charts**: Recharts
- **Date Handling**: date-fns

## Quick Start

### Prerequisites
- Node.js 16+
- MongoDB (local or Atlas)
- OpenAI API key (optional, for AI suggestions)

### Backend Setup

1. **Clone and install dependencies**
```bash
cd backend
npm install
```

2. **Environment setup**
```bash
cp .env.example .env
# Edit .env with your configuration
```

Required environment variables:
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/taskmate
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=15m
FRONTEND_URL=http://localhost:5173
OPENAI_API_KEY=your-openai-api-key  # Optional
EMAIL_HOST=smtp.gmail.com           # Optional
EMAIL_PORT=587                      # Optional
EMAIL_USER=your-email@gmail.com     # Optional
EMAIL_PASS=your-app-password        # Optional
```

3. **Start the server**
```bash
npm run dev
```

The backend will be available at `http://localhost:3000`

### Frontend Setup

1. **Install dependencies**
```bash
cd frontend
npm install
```

2. **Environment setup**
```bash
cp .env.example .env
# Edit with your backend URL
```

```env
VITE_API_URL=http://localhost:3000/api
```

3. **Start the development server**
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Database Seeding

To populate the database with sample data:

```bash
cd backend
npm run db:seed
```

This creates a sample user account:
- **Email**: john@example.com
- **Password**: password123

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout (revoke refresh token)
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Task Management
- `GET /api/tasks` - List tasks (with filtering and pagination)
- `GET /api/tasks/:id` - Get single task
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/:id/toggle` - Toggle task completion
- `GET /api/tasks/stats` - Get task statistics

### Focus Sessions
- `POST /api/focus/start` - Start focus session
- `POST /api/focus/end` - End focus session
- `GET /api/focus/active` - Get active session
- `GET /api/focus/sessions` - List focus sessions
- `GET /api/focus/analytics` - Get focus analytics

### Reminders
- `GET /api/reminders` - List reminders
- `POST /api/reminders` - Create reminder
- `PUT /api/reminders/:id` - Update reminder
- `DELETE /api/reminders/:id` - Delete reminder

### AI Suggestions
- `GET /api/ai/suggestions` - Get daily AI suggestions
- `POST /api/ai/generate` - Generate new suggestions
- `POST /api/ai/feedback/:date` - Provide feedback on suggestions

## Architecture Overview

### Backend Architecture
```
backend/
├── src/
│   ├── controllers/     # Route handlers
│   ├── models/         # MongoDB schemas
│   ├── routes/         # Express routes
│   ├── services/       # Business logic
│   ├── middlewares/    # Auth, validation, error handling
│   ├── jobs/          # Background jobs
│   └── app.js         # Express app setup
```

### Frontend Architecture
```
frontend/
├── src/
│   ├── components/    # Reusable UI components
│   ├── pages/        # Page components
│   ├── store/        # Zustand stores
│   ├── services/     # API client
│   └── hooks/        # Custom React hooks
```

### Key Features Implementation

#### JWT Authentication Flow
1. User logs in with credentials
2. Server returns access token (15min) + refresh token (7 days)
3. Access token used for API requests
4. When access token expires, frontend automatically refreshes using refresh token
5. Refresh tokens are stored securely and can be revoked

#### Focus Timer System
- Client-side timer with pause/resume functionality
- Server tracks sessions for analytics
- Automatic session completion with notifications
- Support for work sessions and break periods
- Task association for time tracking

#### AI-Powered Suggestions
- Daily background job generates suggestions for active users
- Uses OpenAI GPT-4 to analyze user patterns and prioritize tasks
- Considers task urgency, priority, categories, and past focus history
- Provides rationale and estimated durations for each suggestion

#### Real-time Features
- Background jobs for reminder processing
- Session state synchronization
- Automatic token refresh
- Push notifications for session completion

## Development

### Available Scripts

#### Backend
```bash
npm run dev          # Start development server with nodemon
npm start           # Start production server
npm test            # Run tests
npm run lint        # Run ESLint
npm run db:seed     # Seed database with sample data
npm run db:cleanup  # Clean up old data
```

#### Frontend
```bash
npm run dev         # Start development server
npm run build       # Build for production
npm run preview     # Preview production build
npm test           # Run tests
npm run lint       # Run ESLint
```








## Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Standards
- Follow ESLint configuration
- Write tests for new features
- Update documentation as needed
- Use meaningful commit messages






## Roadmap

### Upcoming Features
- [ ] Calendar integration (Google Calendar, Outlook)
- [ ] Team collaboration features
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Offline support with sync
- [ ] Custom themes and dark mode
- [ ] Advanced recurring reminder patterns
- [ ] Time tracking reports
- [ ] Integration with project management tools
- [ ] Voice commands for task creation
- [ ] Pomodoro technique variations
- [ ] Achievement system and gamification


## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.





Built with ❤️ by the Vinit Kumar Pothuraju
