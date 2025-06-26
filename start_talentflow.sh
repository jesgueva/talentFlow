#!/bin/bash

# TalentFlow Quick Start Script
echo "🚀 Starting TalentFlow - Multi-Agent Recruitment System"
echo "======================================================="

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ to continue."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ to continue."
    exit 1
fi

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Please start MongoDB service."
    echo "   On macOS: brew services start mongodb-community"
    echo "   On Ubuntu: sudo systemctl start mongod"
    echo "   Or use MongoDB Atlas cloud service"
fi

echo ""
echo "🔧 Setting up TalentFlow..."

# Backend Setup
echo ""
echo "📦 Setting up Backend (Python/Flask)..."
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "   Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "   Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "   Installing Python dependencies..."
pip install -r requirements.txt

# Check for environment variables
if [ ! -f ".env" ]; then
    echo "   Creating environment variables file..."
    cat > .env << EOL
SECRET_KEY=dev-secret-key-change-in-production
MONGODB_URI=mongodb://localhost:27017/
DATABASE_NAME=talentflow_db
OPENAI_API_KEY=your-openai-api-key-here
COMPANY_NAME=Your Company
EMAIL_FROM=hr@yourcompany.com
EOL
    echo "   ⚠️  Please update .env file with your OpenAI API key!"
fi

# Frontend Setup
echo ""
echo "🎨 Setting up Frontend (React/TypeScript)..."
cd ../frontend

# Install dependencies
echo "   Installing Node.js dependencies..."
npm install

# Create environment file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "   Creating frontend environment file..."
    echo "REACT_APP_API_URL=http://localhost:5000" > .env
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 Starting TalentFlow servers..."

# Start backend in background
echo "   Starting Backend server on http://localhost:5000..."
cd ../backend
source venv/bin/activate
python app.py &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "   Starting Frontend server on http://localhost:3000..."
cd ../frontend
npm start &
FRONTEND_PID=$!

# Wait for user input to stop servers
echo ""
echo "🎉 TalentFlow is now running!"
echo ""
echo "📍 Access points:"
echo "   • Frontend: http://localhost:3000"
echo "   • Backend API: http://localhost:5000"
echo ""
echo "👤 Default login:"
echo "   • Email: admin@talentflow.com"
echo "   • Password: admin123"
echo ""
echo "⚠️  Important:"
echo "   • Make sure MongoDB is running"
echo "   • Update your OpenAI API key in backend/.env"
echo ""
echo "Press Ctrl+C to stop all servers..."

# Function to handle cleanup
cleanup() {
    echo ""
    echo "🛑 Stopping TalentFlow servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Servers stopped successfully!"
    exit 0
}

# Set trap to catch Ctrl+C
trap cleanup SIGINT

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID