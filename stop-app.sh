#!/bin/bash

# GreenQuote App Stop Script
# This script stops all running services

set -e  # Exit on any error

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

# Main execution
main() {
    print_status "🛑 Stopping GreenQuote Application..."
    print_status "=================================="
    
    # Stop all services
    print_status "Stopping all Docker Compose services..."
    if docker-compose down; then
        print_success "All services stopped successfully!"
    else
        print_error "Failed to stop some services"
        exit 1
    fi
    
    print_status "=================================="
    print_status "✅ Application stopped successfully!"
    print_status "To start again, run: ./start-app.sh"
    print_status "=================================="
}

# Run main function
main "$@"
