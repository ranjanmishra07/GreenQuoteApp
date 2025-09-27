#!/bin/bash

# GreenQuote App Test Script
# This script tests if all services are running and accessible

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

# Function to test HTTP endpoint
test_endpoint() {
    local url=$1
    local description=$2
    local expected_status=${3:-200}
    
    print_status "Testing $description..."
    
    if response=$(curl -s -w "%{http_code}" -o /dev/null "$url" 2>/dev/null); then
        if [ "$response" = "$expected_status" ]; then
            print_success "$description is accessible (HTTP $response)"
            return 0
        else
            print_error "$description returned HTTP $response (expected $expected_status)"
            return 1
        fi
    else
        print_error "$description is not accessible"
        return 1
    fi
}

# Function to test login
test_login() {
    print_status "Testing user login..."
    
    local response=$(curl -s -X POST http://localhost:3000/api/users/login \
        -H "Content-Type: application/json" \
        -d '{"email":"admin@greenquote.com","password":"admin123"}' 2>/dev/null)
    
    if echo "$response" | grep -q '"success":true'; then
        print_success "Login test passed - admin user can authenticate"
        return 0
    else
        print_error "Login test failed - admin user cannot authenticate"
        return 1
    fi
}

# Main execution
main() {
    print_status "🧪 Testing GreenQuote Application..."
    print_status "=================================="
    
    local all_tests_passed=true
    
    # Test PostgreSQL
    print_status "Testing PostgreSQL connection..."
    if docker-compose exec -T postgres pg_isready -U postgres -d greenquote >/dev/null 2>&1; then
        print_success "PostgreSQL is accessible"
    else
        print_error "PostgreSQL is not accessible"
        all_tests_passed=false
    fi
    
    # Test Server Health
    if test_endpoint "http://localhost:3000/api/health" "Server Health Check"; then
        # Test Login
        if test_login; then
            print_success "Authentication is working"
        else
            all_tests_passed=false
        fi
    else
        all_tests_passed=false
    fi
    
    # Test Client
    if test_endpoint "http://localhost:5000" "React Client"; then
        print_success "Client is accessible"
    else
        all_tests_passed=false
    fi
    
    print_status "=================================="
    
    if [ "$all_tests_passed" = true ]; then
        print_success "🎉 All tests passed! Application is working correctly."
        print_status ""
        print_status "📊 Application URLs:"
        print_status "  • React Client: http://localhost:5000"
        print_status "  • Server API: http://localhost:3000"
        print_status "  • Health Check: http://localhost:3000/api/health"
        print_status ""
        print_status "🔑 Test Credentials:"
        print_status "  • Admin: admin@greenquote.com / admin123"
        print_status "  • Users: testuser1@gmail.com to testuser10@gmail.com / user123"
    else
        print_error "❌ Some tests failed. Please check the logs:"
        print_status "  • Server logs: docker-compose logs server"
        print_status "  • Client logs: docker-compose logs client"
        print_status "  • Database logs: docker-compose logs postgres"
        exit 1
    fi
    
    print_status "=================================="
}

# Run main function
main "$@"
