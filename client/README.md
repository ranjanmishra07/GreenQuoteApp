# GreenQuote Client

React TypeScript client for the GreenQuote application.

## Environment Variables

**Important**: You must copy the `.env.example` file to `.env` before running the application:

```bash
cp .env.example .env
```

The `.env` file contains the following variables that you can customize:

```env
# Client port (default: 5000)
VITE_CLIENT_PORT=5000

# API base URL (default: http://localhost:3000/api)
VITE_API_BASE_URL=http://localhost:3000/api
```

**Note**: The `.env` file is ignored by git, so your local configuration won't be committed to the repository.

## Development

```bash
nvm use
# Install dependencies
npm install
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Configuration

The application uses environment variables for configuration. All environment variables must be prefixed with `VITE_` to be accessible in the client-side code.

### Available Environment Variables

- `VITE_CLIENT_PORT`: Port for the development server (default: 5000)
- `VITE_API_BASE_URL`: Base URL for API requests (default: http://localhost:3000/api)

## Project Structure

```
src/
├── components/     # Reusable UI components
├── config/        # Configuration files
├── hooks/         # Custom React hooks
├── pages/         # Page components
├── services/      # API services
├── types/         # TypeScript type definitions
└── utils/         # Utility functions
```
