# Hotel Management System - Frontend

This is the frontend application for the Hotel Management System, built with React.

## Project Structure

The project follows a standard React application structure:

```
Frontend/
├── public/               # Static files
├── src/                  # Source files
│   ├── assets/           # CSS and other assets
│   ├── components/       # React components
│   │   ├── Layout/       # Layout components (Sidebar, TopBar)
│   │   ├── Login/        # Login page components
│   │   └── RoomStatus/   # Room Status page components
│   ├── context/          # React context providers
│   ├── services/         # API services
│   ├── App.js            # Main App component
│   └── index.js          # Entry point
└── package.json          # Dependencies and scripts
```

## Features

The application includes the following key features:

1. **Authentication**
   - Login/logout functionality
   - JWT token management
   - Protected routes

2. **Layout System**
   - Responsive sidebar navigation
   - Top navigation bar with user info
   - Consistent layout across pages

3. **Room Status Management**
   - View all rooms in a grid layout
   - Color-coded status indicators (Available, Occupied, Under Maintenance)
   - Filter rooms by:
     - Room number
     - Status
     - Date range
     - Room features (TV, Minibar, Wi-Fi)
   - Card and Calendar view options
   - Room details and reservation capabilities

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Navigate to the Frontend directory:
   ```
   cd Frontend
   ```

2. Install the dependencies:
   ```
   npm install
   ```
   or
   ```
   yarn install
   ```

### Running the Application

To start the development server:

```
npm start
```
or
```
yarn start
```

The application will be available at `http://localhost:3000`.

## Connecting to the Backend

By default, the application is configured to connect to a backend API at `http://localhost:5000/api/v1`.

You can change this by setting the `REACT_APP_API_URL` environment variable.

## Development Login

During development, you can use these credentials to log in:
- Username: admin
- Password: admin 