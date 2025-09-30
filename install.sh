#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    local port=$1
    if command -v ss >/dev/null 2>&1; then
        ss -lnt | grep -q ":${port}\b"
    elif command -v lsof >/dev/null 2>&1; then
        lsof -i TCP:"${port}" -sTCP:LISTEN >/dev/null 2>&1
    elif command -v netstat >/dev/null 2>&1; then
        netstat -lnt | grep -q ":${port}\b"
    else
        print_warning "Could not check port status, 'ss', 'lsof', or 'netstat' not found."
        return 1
    fi
}

echo -e "${BLUE}🚀 Welcome to B(build)stack Setup!${NC}"
echo "This script will help you set up your development environment."
echo ""

# Step 1: Check and install basics
print_status "Step 1: Checking basic dependencies..."

# Check for pnpm
if ! command_exists pnpm; then
    print_error "pnpm is not installed. Please install it first:"
    echo "npm install -g pnpm"
    exit 1
fi
print_success "pnpm is installed"

# Check for bun
if ! command_exists bun; then
    print_warning "bun is not installed. Installing bun..."
    curl -fsSL https://bun.sh/install | bash
    if [ $? -eq 0 ]; then
        print_success "bun installed successfully"
        print_warning "Please restart your terminal or run 'source ~/.bashrc' to use bun"
    else
        print_error "Failed to install bun. Please install manually from https://bun.sh/docs/installation"
        exit 1
    fi
else
    print_success "bun is installed"
fi

# Install dependencies
print_status "Installing project dependencies..."
pnpm install
if [ $? -eq 0 ]; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

echo ""

# Step 2: Check database configuration
print_status "Step 2: Checking database configuration..."

DB_ENV_FILE="packages/db/.env"
if [ ! -f "$DB_ENV_FILE" ]; then
    print_warning "Database environment file not found. Creating $DB_ENV_FILE..."
    echo "DATABASE_URL=" > "$DB_ENV_FILE"
fi

# Check if DATABASE_URL is set
if ! grep -q "DATABASE_URL=.*[^[:space:]]" "$DB_ENV_FILE"; then
    print_error "DATABASE_URL is not set in $DB_ENV_FILE"
    echo ""
    print_status "To get your database URL:"
    echo "1. Go to https://supabase.com and create a new project"
    echo "2. Go to Settings > Database"
    echo "3. Copy the 'Connection string' under 'Connection parameters'"
    echo "4. Add it to $DB_ENV_FILE like: DATABASE_URL=postgresql://..."
    echo ""
    print_warning "Please set up your DATABASE_URL and run this script again"
    exit 1
fi

print_success "DATABASE_URL is configured"

# Step 3: Push database schema
print_status "Step 3: Setting up database schema..."

cd packages/db
print_status "Running 'pnpm db:push' to initialize database..."
output=$(pnpm db:push 2>&1)
exit_code=$?
echo "$output"
if [ $exit_code -ne 0 ] || echo "$output" | grep -q "PostgresError:"; then
    print_error "Failed to push database schema"
    cd ../..
    exit 1
else
    print_success "Database schema pushed successfully"
fi

print_status "Database setup complete!"
echo ""
print_status "For future database changes, use this two-step process:"
echo "1. pnpm db:generate (creates migration files you'll check in)"
echo "2. pnpm db:migrate (executes the migration)"
echo ""
print_status "For Row-Level Security (RLS) policies, see the RLS documentation"
echo "and create migration files in packages/db/drizzle/"

cd ../..
echo ""

# Step 4: Check Redis
print_status "Step 4: Checking Redis..."

if port_in_use 6379; then
    print_success "Redis is already running on port 6379"
else
    print_warning "Redis is not running"
    
    # Check if Docker is installed
    if ! command_exists docker; then
        print_error "Docker is not installed. Please install Docker first:"
        echo "- macOS: Install Docker Desktop from https://www.docker.com/products/docker-desktop"
        echo "- Linux: Follow instructions at https://docs.docker.com/engine/install/"
        echo "- Windows: Install Docker Desktop from https://www.docker.com/products/docker-desktop"
        exit 1
    fi
    
    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker Desktop first."
        exit 1
    fi
    
    print_status "Starting Redis using redis.sh..."
    ./redis.sh
    if [ $? -eq 0 ]; then
        print_success "Redis started successfully"
    else
        print_error "Failed to start Redis"
        exit 1
    fi
fi

echo ""

# Step 5: Check Clerk configuration
print_status "Step 5: Checking Clerk configuration..."

BACKEND_ENV_FILE="apps/backend/.env"
if [ ! -f "$BACKEND_ENV_FILE" ]; then
    print_warning "Backend environment file not found. Creating $BACKEND_ENV_FILE..."
    echo "# Clerk Configuration" > "$BACKEND_ENV_FILE"
    echo "CLERK_SECRET_KEY=" >> "$BACKEND_ENV_FILE"
    echo "CLERK_SIGNING_SECRET=" >> "$BACKEND_ENV_FILE"
    echo "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=" >> "$BACKEND_ENV_FILE"
fi

# Check for required Clerk environment variables
MISSING_CLERK_VARS=()

if ! grep -q "CLERK_SECRET_KEY=.*[^[:space:]]" "$BACKEND_ENV_FILE"; then
    MISSING_CLERK_VARS+=("CLERK_SECRET_KEY")
fi

if ! grep -q "CLERK_SIGNING_SECRET=.*[^[:space:]]" "$BACKEND_ENV_FILE"; then
    MISSING_CLERK_VARS+=("CLERK_SIGNING_SECRET")
fi

if ! grep -q "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=.*[^[:space:]]" "$BACKEND_ENV_FILE"; then
    MISSING_CLERK_VARS+=("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY")
fi

if [ ${#MISSING_CLERK_VARS[@]} -gt 0 ]; then
    print_warning "Missing Clerk configuration: ${MISSING_CLERK_VARS[*]}"
    echo ""
    print_status "To set up Clerk:"
    echo "1. Go to https://clerk.com and create a free account"
    echo "2. Create a new application"
    echo "3. Copy your API keys to $BACKEND_ENV_FILE"
    echo ""
    print_status "For webhook setup:"
    echo "1. Install ngrok: npm install -g ngrok"
    echo "2. In a separate terminal, run: ngrok http 3004"
    echo "3. Copy the https URL that ngrok provides"
    echo "4. In Clerk dashboard, go to Webhooks > Add Endpoint"
    echo "5. Use the ngrok URL + '/api/webhook' as the endpoint URL"
    echo "6. Select 'user.created' and 'user.updated' events"
    echo "7. Copy the webhook signing secret to CLERK_SIGNING_SECRET"
    echo ""
    print_warning "Please configure Clerk and run this script again"
    exit 1
fi

print_success "Clerk configuration is complete"

echo ""
print_success "🎉 Setup complete! You're ready to start developing."
echo ""
print_status "Next steps:"
echo "1. Run 'turbo dev' to start the development servers"
echo "2. Backend will be available at http://localhost:3004"
echo "3. Frontend will be available at http://localhost:3000"
echo ""
print_status "Useful commands:"
echo "- turbo dev          # Start development servers"
echo "- pnpm db:studio     # Open database studio"
echo "- ./redis.sh         # Restart Redis if needed"
echo ""
print_success "Happy coding! 🚀"
