#!/bin/bash
echo "Starting Wick Wax & Relax Application Servers..."
echo "This will start both the frontend and backend servers."
echo ""

# Function to kill all child processes on exit
cleanup() {
    echo "Stopping servers..."
    kill -TERM 0 2>/dev/null
    exit
}

# Set up trap to clean up on exit
trap cleanup SIGINT SIGTERM

# Start backend server
echo "Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend server
echo "Starting frontend server..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "Servers are starting up..."
echo "Frontend will be available at: http://localhost:3000"
echo "Backend will be available at: http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for all background processes
wait