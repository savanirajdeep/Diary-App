# 📝 Diary App - Your Personal Digital Journal

A beautiful, secure, and feature-rich digital diary application built with React, Node.js, and MySQL. Write, store, and organize your daily thoughts and memories with a modern, responsive interface.

## ✨ Features

### 🔐 Authentication & Security
- **JWT-based authentication** for secure login and session management
- **Password hashing** with bcrypt for enhanced security
- **Protected routes** ensuring only authenticated users can access their data
- **Password change functionality** with current password verification

### 📝 Diary Entry Management
- **Rich text editor** with formatting options (bold, italic, lists, etc.)
- **Title, content, tags, and mood tracking** for comprehensive entries
- **Auto-save functionality** to prevent data loss
- **Search and filter** entries by title, content, or tags
- **Pagination** for better performance with large datasets
- **Edit and delete** existing entries with confirmation

### 🎨 User Experience
- **Dark/Light mode toggle** for comfortable reading in any environment
- **Responsive design** that works perfectly on desktop, tablet, and mobile
- **Modern UI** inspired by popular note-taking apps like Notion
- **Real-time notifications** for user actions and errors
- **Loading states** and smooth transitions throughout the app

### 📊 Analytics & Insights
- **Dashboard statistics** showing total entries, monthly counts, and daily activity
- **Entry metadata** including creation and last update timestamps
- **Mood tracking** with emoji selection for emotional context
- **Tag organization** for easy categorization and filtering

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **React Router** - Client-side routing and navigation
- **TailwindCSS** - Utility-first CSS framework for styling
- **React Quill** - Rich text editor for diary entries
- **Axios** - HTTP client for API communication
- **React Hot Toast** - Toast notifications
- **Lucide React** - Beautiful icon library
- **Date-fns** - Date formatting and manipulation

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **Prisma ORM** - Database toolkit and ORM
- **MySQL** - Relational database for data persistence
- **JWT** - JSON Web Tokens for authentication
- **Bcrypt** - Password hashing
- **Express Validator** - Input validation and sanitization
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- npm or yarn package manager

### 1. Clone the Repository
```bash
git clone <repository-url>
cd DiaryApp
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd server && npm install

# Install frontend dependencies
cd ../client && npm install

# Return to root
cd ..
```

### 3. Database Setup
1. Create a MySQL database:
```sql
CREATE DATABASE diary_app;
```

2. Copy the environment example file:
```bash
cd server
cp env.example .env
```

3. Update the `.env` file with your database credentials:
```env
DATABASE_URL="mysql://username:password@localhost:3306/diary_app"
JWT_SECRET="your-super-secret-jwt-key-here"
PORT=5000
NODE_ENV=development
CORS_ORIGIN="http://localhost:3000"
```

4. Set up the database schema:
```bash
npx prisma db push
npx prisma generate
```

### 4. Start the Application

#### Development Mode (Recommended)
```bash
# Start both frontend and backend concurrently
npm run dev
```

#### Or start them separately:
```bash
# Terminal 1 - Start backend
npm run server

# Terminal 2 - Start frontend
npm run client
```

### 5. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Prisma Studio: http://localhost:5555 (run `npx prisma studio` in server directory)

## 📁 Project Structure

```
DiaryApp/
├── client/                 # React frontend
│   ├── public/            # Static files
│   │   ├── components/    # Reusable components
│   │   ├── contexts/      # React contexts
│   │   ├── pages/         # Page components
│   │   ├── App.js         # Main app component
│   │   └── index.js       # Entry point
│   ├── package.json
│   └── tailwind.config.js
├── server/                # Node.js backend
│   ├── middleware/        # Express middleware
│   ├── routes/           # API routes
│   ├── utils/            # Utility functions
│   ├── prisma/           # Database schema
│   ├── index.js          # Server entry point
│   └── package.json
├── package.json          # Root package.json
└── README.md
```

## 🔧 Available Scripts

### Root Directory
- `npm run dev` - Start both frontend and backend in development mode
- `npm run server` - Start only the backend server
- `npm run client` - Start only the frontend client
- `npm run build` - Build the frontend for production
- `npm run install-all` - Install dependencies for all packages
- `npm run setup-db` - Set up database schema

### Server Directory
- `npm run dev` - Start server with nodemon (development)
- `npm start` - Start server in production mode
- `npm run db:push` - Push database schema changes
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

### Client Directory
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info
- `PUT /api/auth/change-password` - Change password

### Diary Entries
- `GET /api/entries` - Get all entries (with pagination, search, filters)
- `GET /api/entries/:id` - Get a specific entry
- `POST /api/entries` - Create a new entry
- `PUT /api/entries/:id` - Update an entry
- `DELETE /api/entries/:id` - Delete an entry
- `GET /api/entries/stats/summary` - Get entry statistics

## 🚀 Deployment

### Frontend Deployment (Vercel)
1. Build the frontend:
```bash
cd client
npm run build
```

2. Deploy to Vercel:
```bash
vercel --prod
```

### Backend Deployment (Heroku/DigitalOcean)
1. Set up environment variables in your hosting platform
2. Deploy the server directory
3. Run database migrations:
```bash
npx prisma db push
```

### Environment Variables for Production
```env
DATABASE_URL="your-production-database-url"
JWT_SECRET="your-production-jwt-secret"
PORT=5000
NODE_ENV=production
CORS_ORIGIN="your-frontend-url"
```

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - Bcrypt with salt rounds for password security
- **Input Validation** - Server-side validation for all inputs
- **Rate Limiting** - Protection against brute force attacks
- **CORS Configuration** - Controlled cross-origin requests
- **Helmet Security** - Various HTTP headers for security
- **SQL Injection Protection** - Prisma ORM prevents SQL injection

## 🎨 Customization

### Styling
The app uses TailwindCSS for styling. You can customize the theme in `client/tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        // Customize primary colors
      }
    }
  }
}
```

### Database Schema
Modify the database schema in `server/prisma/schema.prisma` and run:
```bash
npx prisma db push
npx prisma generate
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - A JavaScript library for building user interfaces
- [TailwindCSS](https://tailwindcss.com/) - A utility-first CSS framework
- [Prisma](https://www.prisma.io/) - Next-generation ORM for Node.js
- [Lucide](https://lucide.dev/) - Beautiful & consistent icon toolkit

## 📞 Support

If you encounter any issues or have questions, please:
1. Check the [Issues](https://github.com/yourusername/diary-app/issues) page
2. Create a new issue with detailed information
3. Contact the maintainers

---

**Happy Journaling! 📖✨** 