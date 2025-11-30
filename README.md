# Race Nutrition

A race nutrition application built with React and TypeScript.

## Project Structure

```
race-nutrition/
├── ui/                 # Frontend React application
│   ├── src/           # Source code
│   ├── public/        # Public assets
│   ├── package.json   # Frontend dependencies
│   ├── Dockerfile     # Docker configuration
│   ├── .env           # Environment variables (create from .env.example)
│   └── ...
├── package.json       # Root project configuration
├── docker-compose.yml # Docker Compose configuration
└── README.md          # This file.
```

## Getting Started

### Prerequisites
- Node.js 20 or higher
- npm

### Environment Setup

1. Copy the environment template:
   ```bash
   cd ui
   cp .env.example .env
   ```

2. Edit `.env` and add your Auth0 credentials:
   ```bash
   VITE_AUTH0_DOMAIN=your-auth0-domain.auth0.com
   VITE_AUTH0_CLIENT_ID=your-auth0-client-id
   ```

### Installation

1. Install frontend dependencies:
   ```bash
   npm run install:ui
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build
- `npm run install:ui` - Install UI dependencies
- `npm run clean` - Clean build artifacts

## Development

The frontend application is located in the `ui/` directory. All React components, styles, and configuration files are contained within this subdirectory.

## Building

To build the application for production:

```bash
npm run build
```

The build output will be placed in the `dist/` directory at the project root.

## Docker Development

### Prerequisites
- Docker
- Docker Compose

### Running with Docker

1. Build and start the UI service:
   ```bash
   docker compose up --build
   ```

2. The application will be available at http://localhost:5173

3. To stop the service:
   ```bash
   docker compose down
   ```

### Docker Features

- **Hot Reloading**: Source code changes are automatically reflected in the running container
- **Node.js 20**: Uses the latest LTS version for optimal compatibility
- **Volume Mounting**: Source files are mounted for real-time development
- **Port Forwarding**: Access the app on your host machine's port 5173

### Troubleshooting Docker Issues

If the frontend is not accessible on port 5173:

1. **Check container status**:
   ```bash
   docker compose ps
   ```

2. **View container logs**:
   ```bash
   docker compose logs ui
   ```

3. **Check if port is bound**:
   ```bash
   docker compose exec ui netstat -tlnp
   ```

4. **Rebuild and restart**:
   ```bash
   docker compose down
   docker compose up --build
   ```

5. **Verify Vite configuration**: Ensure `vite.config.ts` has `host: '0.0.0.0'`
