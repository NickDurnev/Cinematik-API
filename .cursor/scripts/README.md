# Scripts Directory

This directory contains utility scripts for the Cinematik API development workflow.

## Available Scripts

### Database Scripts
- **`../scripts/generate-openapi-schema.js`** - Generates OpenAPI schema from running NestJS server
  ```bash
  npm run openapi:generate
  ```

### Setup Scripts
- **`setup-git-hooks.sh`** - Git hooks for code quality and consistency

## Module Generation

**❌ Removed**: `module-generator.js` (redundant)

**✅ Use Instead**: `/create-module <module_name>` command

The `/create-module` command provides:
- Complete NestJS module structure
- Database schema with Drizzle ORM
- DTOs with validation
- Repository pattern
- Service layer with business logic
- Controllers with Swagger documentation
- Unit tests
- Internationalization files

### Usage Examples
```bash
# Create a new module
/create-module categories

# Create actors module
/create-module actors

# Create genres module
/create-module genres
```

## Running Scripts

### Git Hooks Setup
```bash
bash .cursor/scripts/setup-git-hooks.sh
```

### OpenAPI Schema Generation
```bash
npm run openapi:generate
```

## Script Dependencies

All scripts require:
- Node.js runtime
- npm/yarn package manager
- Access to project directory structure

Some scripts may require additional tools:
- Drizzle Kit (for database operations)
- Git (for hooks)

## Security Notes

- Scripts should be reviewed before execution
- Database scripts affect production data
- Git hooks modify local Git configuration
- Always backup before running setup scripts

## Troubleshooting

### Permission Issues
```bash
# Make scripts executable
chmod +x .cursor/scripts/*.sh
```

### Node.js Not Found
```bash
# Ensure Node.js is installed
node --version
npm --version
```

### Script Failures
- Check error messages for missing dependencies
- Verify environment variables are set
- Review script logs for detailed error information
