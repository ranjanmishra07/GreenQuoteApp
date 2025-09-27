#!/bin/bash

# GreenQuote App Startup Script
# This script starts the application in the correct order with health checks
# Includes Docker caching fixes to prevent stale builds

set -e  # Exit on any error

# Build configuration
BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
BUILD_VERSION=$(git rev-parse --short HEAD 2>/dev/null || echo "dev")
export BUILD_DATE
export BUILD_VERSION

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

# Function to handle Docker cache invalidation
handle_docker_cache() {
    local force_rebuild=$1
    
    if [ "$force_rebuild" = true ]; then
        print_warning "Force rebuild requested - cleaning Docker cache..."
        
        # Stop all containers
        docker-compose down 2>/dev/null || true
        
        # Remove existing images
        docker rmi greenquoteapp-server greenquoteapp-client 2>/dev/null || true
        
        # Clean unused images and build cache
        docker image prune -f
        docker builder prune -f
        
        print_success "Docker cache cleaned"
    fi
}

# Function to wait for service to be healthy
wait_for_health() {
    local service_name=$1
    local max_attempts=30
    local attempt=1
    
    print_status "Waiting for $service_name to be healthy..."
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose ps $service_name | grep -q "healthy"; then
            print_success "$service_name is healthy!"
            return 0
        fi
        
        print_status "Attempt $attempt/$max_attempts - $service_name not ready yet, waiting 5 seconds..."
        sleep 5
        attempt=$((attempt + 1))
    done
    
    print_error "$service_name failed to become healthy after $max_attempts attempts"
    return 1
}

# Function to check if PostgreSQL is ready to accept connections
wait_for_postgres() {
    local max_attempts=30
    local attempt=1
    
    print_status "Waiting for PostgreSQL to accept connections..."
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose exec -T postgres pg_isready -U postgres -d postgres >/dev/null 2>&1; then
            print_success "PostgreSQL is ready to accept connections!"
            return 0
        fi
        
        print_status "Attempt $attempt/$max_attempts - PostgreSQL not ready yet, waiting 2 seconds..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "PostgreSQL failed to become ready after $max_attempts attempts"
    return 1
}

# Function to ensure database exists
ensure_database_exists() {
    print_status "Ensuring greenquote database exists..."
    
    # Check if database exists
    if docker-compose exec -T postgres psql -U postgres -lqt | cut -d \| -f 1 | grep -qw greenquote; then
        print_success "greenquote database already exists"
    else
        print_status "Creating greenquote database..."
        if docker-compose exec -T postgres psql -U postgres -c "CREATE DATABASE greenquote;" >/dev/null 2>&1; then
            print_success "greenquote database created successfully"
        else
            print_error "Failed to create greenquote database"
            return 1
        fi
        
        # Run initialization script
        print_status "Running database initialization script..."
        if docker-compose exec -T postgres psql -U postgres -d greenquote -f /docker-entrypoint-initdb.d/init-db.sql >/dev/null 2>&1; then
            print_success "Database initialization completed"
        else
            print_warning "Database initialization script not found or failed (this is normal if not first startup)"
        fi
    fi
}

# Function to run migrations
run_migrations() {
    print_status "Starting database migrations..."
    
    # Check if we're in the server directory, if not, navigate to it
    if [ ! -f "package.json" ] || ! grep -q "greenquote-server" package.json; then
        if [ -d "server" ]; then
            cd server
        else
            print_error "Cannot find server directory. Please run this script from the project root."
            exit 1
        fi
    fi
    
    # Check if node_modules exists, if not install dependencies
    if [ ! -d "node_modules" ]; then
        print_status "Installing server dependencies..."
        npm install
    fi
    
    # Run migration down
    print_status "Running migration down..."
    if npm run migrate:down; then
        print_success "Migration down completed successfully"
    else
        print_warning "Migration down failed or no data to remove (this is normal for fresh setup)"
    fi
    
    # Run migration up
    print_status "Running migration up..."
    if npm run migrate:up; then
        print_success "Migration up completed successfully"
    else
        print_error "Migration up failed"
        exit 1
    fi
    
    # Return to original directory if we changed it
    if [ "$(pwd)" != "$ORIGINAL_DIR" ]; then
        cd "$ORIGINAL_DIR"
    fi
}

# Function to start server
start_server() {
    print_status "Starting Node.js server..."
    docker-compose up -d server
    
    if wait_for_health "server"; then
        print_success "Server is running and healthy!"
    else
        print_error "Server failed to start properly"
        exit 1
    fi
}

# Function to start client
start_client() {
    print_status "Starting React client..."
    docker-compose up -d client
    
    if wait_for_health "client"; then
        print_success "Client is running and healthy!"
    else
        print_error "Client failed to start properly"
        exit 1
    fi
}

# Main execution
main() {
    local force_rebuild=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --force-rebuild)
                force_rebuild=true
                shift
                ;;
            --help)
                echo "Usage: $0 [--force-rebuild] [--help]"
                echo ""
                echo "Options:"
                echo "  --force-rebuild    Force rebuild all Docker images (clears cache)"
                echo "  --help            Show this help message"
                echo ""
                echo "Examples:"
                echo "  $0                # Start application normally"
                echo "  $0 --force-rebuild # Start with fresh Docker builds"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done
    
    print_status "🚀 Starting GreenQuote Application..."
    print_status "=================================="
    print_status "Build Date: $BUILD_DATE"
    print_status "Build Version: $BUILD_VERSION"
    print_status "Force Rebuild: $force_rebuild"
    print_status "=================================="
    
    # Store original directory
    ORIGINAL_DIR=$(pwd)
    
    # Handle Docker cache if needed
    handle_docker_cache "$force_rebuild"
    
    # Step 1: Start PostgreSQL
    print_status "Step 1: Starting PostgreSQL database..."
    docker-compose up -d postgres
    
    if wait_for_health "postgres"; then
        print_success "PostgreSQL is running and healthy!"
    else
        print_error "PostgreSQL failed to start properly"
        exit 1
    fi
    
    # Wait a bit more for PostgreSQL to be fully ready
    wait_for_postgres
    
    # Step 2: Ensure database exists
    print_status "Step 2: Ensuring database exists..."
    ensure_database_exists
    
    # Step 3: Run migrations
    print_status "Step 3: Running database migrations..."
    run_migrations
    
    # Step 4: Start server
    print_status "Step 4: Starting Node.js server..."
    start_server
    
    # Step 5: Start client
    print_status "Step 5: Starting React client..."
    start_client
    
    # Final status
    print_success "🎉 All services are running successfully!"
    print_status "=================================="
    print_status "📊 Application Status:"
    print_status "  • PostgreSQL: http://localhost:5432"
    print_status "  • Server API: http://localhost:3000"
    print_status "  • React Client: http://localhost:5000"
    print_status ""
    print_status "🔑 Test Credentials:"
    print_status "  • Admin: admin@greenquote.com / admin123"
    print_status "  • Users: testuser1@gmail.com to testuser10@gmail.com / user123"
    print_status ""
    print_status "📋 Useful Commands:"
    print_status "  • View logs: docker-compose logs -f [service]"
    print_status "  • Stop all: docker-compose down"
    print_status "  • Restart: ./start-app.sh"
    print_status "  • Force rebuild: ./start-app.sh --force-rebuild"
    print_status ""
    print_status "🔧 Docker Cache Management:"
    print_status "  • Normal start: ./start-app.sh"
    print_status "  • Clear cache: ./start-app.sh --force-rebuild"
    print_status "  • Build info: Build Date: $BUILD_DATE, Version: $BUILD_VERSION"
    print_status "=================================="
}

# Handle script interruption
trap 'print_error "Script interrupted. Cleaning up..."; docker-compose down; exit 1' INT TERM

# Run main function
main "$@"