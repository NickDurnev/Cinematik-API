# Cinematik API - NestJS Project

## Project Overview

**Cinematik API** is a NestJS-based backend for movie management platform with authentication, user profiles, movie catalog, and review systems.

## Technology Stack

### Backend Framework
- **NestJS** - Progressive Node.js framework for building efficient applications
- **TypeScript** - Type-safe JavaScript
- **Drizzle ORM** - Modern TypeScript ORM for SQL databases
- **PostgreSQL** - Primary database

### Authentication & Security
- **JWT** - JSON Web Token authentication
- **Passport** - Authentication middleware for NestJS
- **bcrypt** - Password hashing

### Documentation & API
- **Swagger** - API documentation with @nestjs/swagger
- **class-validator** - DTO validation
- **class-transformer** - Data transformation

### Internationalization
- **nestjs-i18n** - Internationalization support (English, Ukrainian)

### Development Tools
- **Jest** - Testing framework
- **Biome** - Code formatting and linting
- **Husky** - Git hooks
- **Commitlint** - Conventional commits

## Project Structure

```
src/
├── app.module.ts           # Root application module
├── main.ts                 # Application entry point
├── auth/                   # Authentication module
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── jwt.strategy.ts
│   ├── user.repository.ts
│   ├── dto/               # Data Transfer Objects
│   │   ├── auth-credentials.dto.ts
│   │   └── ...
│   └── entities/          # Database entities
├── movies/                # Movies management
│   ├── movies.module.ts
│   ├── movies.controller.ts
│   ├── movies.service.ts
│   ├── movies.repository.ts
│   ├── schema.ts          # Drizzle schema
│   ├── dto/
│   │   ├── create.dto.ts
│   │   ├── update.dto.ts
│   │   ├── query.dto.ts
│   │   └── response.dto.ts
│   └── docs/              # Swagger docs
├── reviews/               # Reviews management
├── profile/               # User profile management
├── database/              # Database configuration
│   ├── database.module.ts
│   ├── database.service.ts
│   └── drizzle.provider.ts
├── common/                # Common utilities
│   ├── common.module.ts
│   ├── services/
│   │   ├── email.service.ts
│   │   └── format-data.service.ts
│   └── templates/         # Email templates
├── i18n/                  # Internationalization files
│   ├── en/
│   └── ua/
├── types.ts               # Common types
├── transform.interceptor.ts
└── utils/
    └── response/          # Response utilities
        └── response-wrapper.ts
```

## Database Schema

### Core Tables
- **users** - User accounts
- **movies** - Movie catalog
- **reviews** - Movie reviews
- **profiles** - User profiles

### Authentication Tables
- **user_tokens** - JWT tokens
- **password_resets** - Password reset tokens

## API Endpoints

### Authentication (`/auth`)
- `POST /auth/signup` - Register new user
- `POST /auth/signin` - User login
- `POST /auth/social` - Social media login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password

### Movies (`/movies`)
- `GET /movies` - List movies with pagination
- `GET /movies/:id` - Get movie details
- `POST /movies` - Create new movie (admin)
- `PUT /movies/:id` - Update movie (admin)
- `DELETE /movies/:id` - Delete movie (admin)

### Reviews (`/reviews`)
- `GET /reviews` - List reviews
- `GET /reviews/:id` - Get review details
- `POST /reviews` - Create review
- `PUT /reviews/:id` - Update review
- `DELETE /reviews/:id` - Delete review

### Profile (`/profile`)
- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile
- `POST /profile/avatar` - Upload profile picture

## Configuration

### Environment Variables
- `STAGE` - Environment (dev, prod)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `RESEND_API_KEY` - Email service API key

### Configuration Schema
- `config.schema.ts` - Zod validation for environment variables

## Development Workflow

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run start:dev

# Run tests
npm test

# Run with coverage
npm run test:cov

# Format code
npm run format:fix

# Lint code
npm run lint:fix
```

### Database Migrations
```bash
# Generate migration
npm run db:migrate

# Apply migration
npm run db:push
```

## Response Format

All API responses follow this format:

```typescript
interface ResponseWrapper<T> {
  data: T;
  code: ResponseCode;
  message: string;
  timestamp: string;
}

enum ResponseCode {
  OK = "OK",
  CREATED = "CREATED",
  BAD_REQUEST = "BAD_REQUEST",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
}
```

## Authentication Flow

1. **Registration**: User signs up with email and password
2. **Email Verification**: Optional verification email sent
3. **Login**: User credentials validated, JWT tokens issued
4. **Protected Routes**: JWT token required for access
5. **Token Refresh**: Refresh token used to get new access token

## Internationalization

- Supported languages: English (`en`), Ukrainian (`ua`)
- Language detection via `x-accept-language` header
- Translation files in `src/i18n/{lang}/`

## Testing Strategy

### Unit Tests
- Service layer business logic
- Repository database operations
- Utility functions

### Integration Tests
- API endpoints
- Database operations
- Authentication flows

### E2E Tests
- Complete user journeys
- Multi-module interactions

## Security Considerations

- Password hashing with bcrypt
- JWT token expiration
- Input validation with class-validator
- SQL injection prevention with Drizzle ORM
- CORS configuration for production
- Rate limiting (if implemented)

## Performance Optimizations

- Database connection pooling
- Query optimization with Drizzle
- Caching strategies (if implemented)
- Pagination for large datasets

## Monitoring & Logging

- Structured logging with NestJS Logger
- Database query logging in development
- Error tracking and reporting

## Deployment

### Development
- Local development with hot reload
- Environment-based configuration

### Production
- Environment variables for secrets
- Optimized build with Tree shaking
- Database migrations on startup

## Code Quality

### Standards
- TypeScript strict mode
- ESLint + Biome for linting
- Conventional commits with Commitlint
- Pre-commit hooks with Husky

### Patterns
- Dependency injection
- Repository pattern for data access
- DTO pattern for API contracts
- Service layer for business logic
- Guard-based authentication

## Modules Status

| Module | Status | Endpoints | Tests |
|--------|--------|-----------|-------|
| Auth | ✅ Complete | 6 endpoints | ✅ Unit + Integration |
| Movies | ✅ Complete | 5 endpoints | ✅ Unit + Integration |
| Reviews | ✅ Complete | 5 endpoints | ✅ Unit + Integration |
| Profile | ✅ Complete | 3 endpoints | ✅ Unit + Integration |
| Database | ✅ Complete | - | ✅ Connection Tests |

## Planned Features

- Advanced movie search and filtering
- User recommendations
- Movie ratings and statistics
- Social features (follow, watchlists)
- Admin dashboard
- API rate limiting
- File upload for movie posters
- Email notifications
- Password policies
- Two-factor authentication

## Dependencies

### Core Dependencies
```json
{
  "@nestjs/common": "^11.1.3",
  "@nestjs/config": "^4.0.2",
  "@nestjs/core": "^11.1.3",
  "@nestjs/jwt": "^11.0.0",
  "@nestjs/passport": "^11.0.5",
  "@nestjs/platform-express": "^11.1.3",
  "@nestjs/swagger": "^11.2.0",
  "nestjs-i18n": "^10.5.1",
  "drizzle-orm": "^0.44.2",
  "drizzle-kit": "^0.31.1",
  "pg": "^8.16.2"
}
```

### Development Dependencies
```json
{
  "@nestjs/cli": "^11.0.7",
  "@nestjs/testing": "^11.1.3",
  "@types/jest": "^30.0.0",
  "jest": "^30.0.2",
  "ts-jest": "^29.4.0",
  "@biomejs/biome": "^2.0.4",
  "husky": "^9.1.7",
  "@commitlint/cli": "^19.8.1"
}
```

## Scripts

```json
{
  "start": "STAGE=prod nest start",
  "start:dev": "STAGE=dev nest start --watch",
  "test": "STAGE=dev jest",
  "test:cov": "jest --coverage",
  "test:e2e": "jest --config ./test/jest-e2e.json",
  "build": "nest build",
  "lint:fix": "biome lint --write .",
  "format:fix": "biome format --write .",
  "db:migrate": "npx drizzle-kit migrate",
  "prepare": "husky"
}
```

## Contributing Guidelines

1. Follow conventional commit format
2. Write tests for new features
3. Update documentation
4. Run linting and formatting before commits
5. Ensure all tests pass before PR
6. Use TypeScript for type safety

## Troubleshooting

### Common Issues
- Database connection: Check DATABASE_URL
- JWT errors: Verify JWT_SECRET
- Import errors: Check tsconfig.json paths
- Build failures: Check TypeScript types

### Debug Commands
```bash
# Check database connection
npm run db:migrate

# Validate configuration
node -e "console.log(require('./src/config.schema.ts'))"

# Test environment setup
npm run test:e2e
```
