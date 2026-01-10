# Context Directory

This directory contains project context and configuration files for development tools and AI assistants.

## Files

### openapi-schema.json
**Purpose**: OpenAPI 3.0 specification for the Cinematik API

**What it's used for**:
- **API Documentation**: Source of truth for API endpoints and schemas
- **Client SDK Generation**: Can be used to generate TypeScript/JavaScript client libraries
- **Contract Testing**: Validates API responses against the schema
- **AI Assistant Context**: Provides API structure information for code generation

**How it's generated**:
```bash
# Generate from running server
npm run openapi:generate

# Or manually:
node scripts/generate-openapi-schema.js
```

**When to update**:
- After adding new API endpoints
- After modifying request/response schemas
- After changing authentication requirements
- After updating API version

### project-context.md
**Purpose**: Complete project overview and documentation

**What it contains**:
- Project architecture and technology stack
- Module status and endpoints (including Pairs module)
- Development guidelines and patterns
- Configuration and deployment information
- Testing strategies and requirements
- Recent features (Pair Mode collaborative selection)

**Usage**:
- Onboarding new developers
- Reference for project structure
- AI assistant context for code generation
- Documentation for API design decisions

### test-coverage.md
**Purpose**: Track test implementation status across all modules

**What it contains**:
- Test coverage status for each module
- Test implementation checklist
- Testing standards and requirements
- Recent testing achievements (Pairs: 31 tests)

### implementations/

**Purpose**: Client-side implementation guides for frontend developers

**Files**:
- `CLIENT_PAIRS_IMPLEMENTATION.md` - Complete guide for Pairs feature REST API integration
- `CLIENT_WEBSOCKET_IMPLEMENTATION.md` - WebSocket real-time notifications implementation
- `PAIR_MODE_IMPLEMENTATION.md` - Backend implementation details and architecture

**What they contain**:
- TypeScript types and interfaces
- Service implementations
- React Query hooks examples
- Usage patterns and best practices
- Testing strategies with MSW

## Automation

### Postman Integration
The OpenAPI schema is automatically used to:
- Create environment variables
- Set up authentication flows
- Generate test scripts

### Schema Updates
A workflow for keeping the schema current:
1. Make API changes (e.g., new Pairs endpoints)
2. Run tests to verify functionality
3. Update OpenAPI decorators in controllers
4. Generate new schema: `npm run openapi:generate`
5. Update project-context.md with new features
6. Update test-coverage.md with test status

### CI/CD Integration
Add to your CI pipeline:
```yaml
- name: Generate OpenAPI Schema
  run: |
    npm run start:dev &
    sleep 10
    npm run openapi:generate
```

## Best Practices

### Schema Maintenance
- Keep schema in sync with actual API
- Use descriptive summaries and descriptions
- Include example values for all schemas
- Document authentication requirements
- Tag endpoints by functional area

### Documentation Updates
- Update project-context.md when adding modules
- Keep module status tables current
- Document architectural decisions
- Include troubleshooting information

### Version Control
- Commit both schema and project context
- Use semantic versioning for API changes
- Document breaking changes in project context
- Maintain backward compatibility when possible

## Tools Integration

### OpenAPI Tools
```bash
# Validate schema
npx swagger-validator .cursor/context/openapi-schema.json

# Generate documentation
npx redoc-cli build .cursor/context/openapi-schema.json

# Generate client SDKs
npx openapi-generator-cli generate -i .cursor/context/openapi-schema.json -g typescript-axios -o ./generated/client
```

### VS Code Integration
Install OpenAPI extensions for:
- Schema validation
- Request building
- Documentation viewing
- Auto-completion

## Troubleshooting

### Schema Generation Issues
```bash
# Check if server is running
curl http://localhost:3000/api-json

# Generate with custom URL
API_URL=http://localhost:3333 npm run openapi:generate

# Use default schema if server not available
node scripts/generate-openapi-schema.js
```

### Postman Collection Issues
```bash
# Validate OpenAPI schema first
npm run openapi:generate
```

### Documentation Updates
- Update schema decorators in controllers
- Regenerate schema: `npm run openapi:generate`
- Commit changes with descriptive message
