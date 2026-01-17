# Create Tests Command

Create unit tests for a NestJS module following the Cinematik-API testing patterns.

## Usage

```
/create-tests <module_name>
```

Examples:

- `/create-tests movies` - Tests for movies module
- `/create-tests auth` - Tests for auth module
- `/create-tests reviews` - Tests for reviews module

## Test Structure Overview

Tests are organized into the same directory as the module:

```
src/{module_name}/
├── {module_name}.controller.spec.ts    # Controller unit tests
├── {module_name}.service.spec.ts       # Service unit tests
├── {module_name}.repository.spec.ts     # Repository unit tests (optional)
└── dto/
    └── {dto}.spec.ts                   # DTO validation tests (optional)
```

### Key Testing Types

| Aspect | Controller Tests | Service Tests | Repository Tests |
|--------|------------------|---------------|-----------------|
| **Purpose** | HTTP request/response handling | Business logic | Database operations |
| **Dependencies** | Mock Service & Auth | Mock Repository | Mock Database |
| **Focus** | Status codes, responses, validation | Logic, error handling, data transformation | Queries, error handling |
| **Tools** | Supertest, Jest mocking | Jest mocking | Jest mocking |

## Pre-Flight Checklist

Before starting, verify:

1. ✅ Module implementation is complete (`src/{module_name}/`)
2. ✅ Check existing test patterns in `src/movies/movies.service.spec.ts`
3. ✅ Check existing test patterns in other module `.spec.ts` files
4. ✅ Understand the module's controller, service, and repository methods
5. ✅ Check DTOs for validation rules
6. ✅ Review the database schema for the module

---

## Instructions

You are creating tests for a NestJS module. **You must create unit tests for controller and service layers**.

### Step 0: Create TODO List

Create a TODO list to track progress:

```
1. Review module implementation (controller, service, repository)
2. Create CONTROLLER tests in src/{module}/{controller}.spec.ts (for each controller):
   - Mock service and auth dependencies
   - Write endpoint tests for all HTTP methods
   - Write error case tests
   - Write edge case tests
3. Create SERVICE tests in src/{module}/{module}.service.spec.ts:
   - Mock repository
   - Write business logic tests
   - Write error case tests
   - Write edge case tests
4. (Optional) Create REPOSITORY tests in src/{module}/{module}.repository.spec.ts:
   - Mock database connection
   - Write query tests
   - Write error case tests
5. Run all tests: npm test -- {module}/{module}.controller.spec.ts
6. Verify all tests pass
```

### Step 1: Review Module Implementation

Before writing tests, understand what needs testing:

1. **Check `src/{module}/*.controller.ts`** - List all endpoints from all controllers in the module:
   - GET endpoints (single and list)
   - POST endpoints (create)
   - PUT/PATCH endpoints (update)
   - DELETE endpoints (soft delete)
   - Authentication requirements
   - Request/response DTOs
   - Swagger decorators

2. **Check `src/{module}/{module}.service.ts`** - Understand business logic:
   - What validation is done?
   - What error cases exist?
   - What repository methods are called?
   - Data transformation logic

3. **Check `src/{module}/{module}.repository.ts`** - Note method signatures:
   - What queries are executed?
   - What error handling exists?
   - Database connection patterns

4. **Check `src/{module}/dto/`** - Understand validation rules:
   - Required fields
   - Optional fields
   - Custom validators
   - Transformation rules

### Step 2: Create Controller Tests

Create controller tests following this structure:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from '@nestjs/passport';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MockRepository } from '../test-utils/mock-repository';
import { Request } from 'express';
import { I18nService } from 'nestjs-i18n';

import { {Module}Controller } from './{module}.controller';
import { {Module}Service } from './{module}.service';
import { {Entity} } from './schema';
import { {Module}Dto } from './dto';

// Mock data
const mock{Entity} = {
  id: '1',
  name: 'Test {Module}',
  // ... other fields
} as {Entity};

const mockUser = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
};

// Mock service
const mock{Module}Service = {
  create{Module}: jest.fn(),
  get{Module}s: jest.fn(),
  get{Module}ById: jest.fn(),
  update{Module}: jest.fn(),
  delete{Module}: jest.fn(),
  // ... other methods
};

describe('{Module}Controller', () => {
  let controller: {Module}Controller;
  let service: {Module}Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [{Module}Controller],
      providers: [
        {
          provide: {Module}Service,
          useValue: mock{Module}Service,
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn((key: string) => key),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: jest.fn((context: ExecutionContext) => {
          const request = context.switchToHttp().getRequest<Request>();
          request.user = mockUser;
          return true;
        }),
      })
      .compile();

    controller = module.get<{Module}Controller>({Module}Controller);
    service = module.get<{Module}Service>({Module}Service);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /{module}', () => {
    it('should create a new {module}', async () => {
      const createDto = { name: 'New {Module}' };
      mock{Module}Service.create{Module}.mockResolvedValue(mock{Entity});

      const result = await controller.create{Module}(createDto as any, mockUser as any);

      expect(service.create{Module}).toHaveBeenCalledWith(createDto, mockUser);
      expect(result).toBeDefined();
    });
  });

  // ... more controller tests
});
```

### Step 3: Create Service Tests

Create service tests following this structure:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { I18nService, I18nContext } from 'nestjs-i18n';
import { InternalServerErrorException, NotFoundException } from '@nestjs/common';

import { {Module}Service } from './{module}.service';
import { {Module}Repository } from './{module}.repository';
import { {Entity} } from './schema';
import { Create{Module}Dto, Update{Module}Dto } from './dto';

// Mock data
const mock{Entity} = {
  id: '1',
  name: 'Test {Module}',
  // ... other fields
} as {Entity};

const mockUser = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
};

// Mock repository
const mock{Module}Repository = {
  create{Module}: jest.fn(),
  get{Module}s: jest.fn(),
  get{Module}ById: jest.fn(),
  update{Module}: jest.fn(),
  delete{Module}: jest.fn(),
  // ... other methods
};

describe('{Module}Service', () => {
  let service: {Module}Service;
  let repository: {Module}Repository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {Module}Service,
        {
          provide: {Module}Repository,
          useValue: mock{Module}Repository,
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn((key: string) => key),
          },
        },
      ],
    }).compile();

    service = module.get<{Module}Service>({Module}Service);
    repository = module.get<{Module}Repository>({Module}Repository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create{Module}', () => {
    it('should create a new {module}', async () => {
      const createDto: Create{Module}Dto = { name: 'New {Module}' };
      mock{Module}Repository.create{Module}.mockResolvedValue(mock{Entity});

      const result = await service.create{Module}(createDto, mockUser);

      expect(repository.create{Module}).toHaveBeenCalledWith(createDto, mockUser);
      expect(result).toEqual(mock{Entity});
    });

    it('should throw InternalServerErrorException on repository error', async () => {
      const createDto: Create{Module}Dto = { name: 'New {Module}' };
      mock{Module}Repository.create{Module}.mockRejectedValue(new Error('Database error'));

      await expect(service.create{Module}(createDto, mockUser)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  // ... more service tests
});
```

### Step 4: Create Repository Tests (Optional)

Create repository tests following this structure:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { I18nService, I18nContext } from 'nestjs-i18n';
import { InternalServerErrorException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { {Module}Repository } from './{module}.repository';
import { {Entity}, {module}s } from './schema';
import { Create{Module}Dto, Update{Module}Dto } from './dto';

// Mock data
const mock{Entity} = {
  id: '1',
  name: 'Test {Module}',
  // ... other fields
} as {Entity};

const mockUser = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
};

// Mock database connection
const mockDatabase = {
  select: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
} as unknown as NodePgDatabase;

describe('{Module}Repository', () => {
  let repository: {Module}Repository;
  let database: NodePgDatabase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {Module}Repository,
        {
          provide: DATABASE_CONNECTION,
          useValue: mockDatabase,
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn((key: string) => key),
          },
        },
      ],
    }).compile();

    repository = module.get<{Module}Repository>({Module}Repository);
    database = module.get<NodePgDatabase>(DATABASE_CONNECTION);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create{Module}', () => {
    it('should create a new {module}', async () => {
      const createDto: Create{Module}Dto = { name: 'New {Module}' };
      const mockInsert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mock{Entity}]),
        }),
      });

      mockDatabase.insert = mockInsert;

      const result = await repository.create{Module}(createDto, mockUser);

      expect(database.insert).toHaveBeenCalledWith({module}s);
      expect(result).toEqual(mock{Entity});
    });

    it('should throw InternalServerErrorException on database error', async () => {
      const createDto: Create{Module}Dto = { name: 'New {Module}' };
      const mockInsert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockRejectedValue(new Error('Database error')),
        }),
      });

      mockDatabase.insert = mockInsert;

      await expect(repository.create{Module}(createDto, mockUser)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  // ... more repository tests
});
```

### Step 5: Run Tests

Run tests and verify all pass:

```bash
# Run all tests
npm test

# Run specific test file
npm test -- {module}/{module}.controller.spec.ts
npm test -- {module}/{module}.service.spec.ts

# Run tests with coverage
npm run test:cov -- {module}/{module}.service.spec.ts
```

---

## Test Patterns by Endpoint

### GET Single Entity

```typescript
// Controller test
it('should return a {module} by id', async () => {
  mock{Module}Service.get{Module}ById.mockResolvedValue(mock{Entity});

  const result = await controller.get{Module}ById('1', mockUser as any);

  expect(service.get{Module}ById).toHaveBeenCalledWith('1');
  expect(result.data).toEqual(mock{Entity});
});

// Service test
it('should return a {module} by id', async () => {
  mock{Module}Repository.get{Module}ById.mockResolvedValue(mock{Entity});

  const result = await service.get{Module}ById('1');

  expect(repository.get{Module}ById).toHaveBeenCalledWith('1');
  expect(result).toEqual(mock{Entity});
});

// Error test
it('should throw NotFoundException when {module} not found', async () => {
  mock{Module}Repository.get{Module}ById.mockResolvedValue(null);

  await expect(service.get{Module}ById('1')).rejects.toThrow(NotFoundException);
});
```

### GET List of Entities

```typescript
// Controller test
it('should return paginated {module}s', async () => {
  const mockData = [mock{Entity}];
  const mockMeta = { total: 1, page: 1, limit: 10, total_pages: 1 };
  mock{Module}Service.get{Module}s.mockResolvedValue({ data: mockData, meta: mockMeta });

  const result = await controller.get{Module}s({ page: '1' } as any, mockUser as any);

  expect(service.get{Module}s).toHaveBeenCalledWith({ page: '1' }, mockUser);
  expect(result.data).toEqual(mockData);
  expect(result.meta).toEqual(mockMeta);
});

// Service test
it('should return paginated {module}s', async () => {
  const mockData = [mock{Entity}];
  const queryDto = { page: '1' };
  mock{Module}Repository.get{Module}s.mockResolvedValue({ data: mockData, meta: { total: 1, page: 1, limit: 10, total_pages: 1 } });

  const result = await service.get{Module}s(queryDto, mockUser);

  expect(repository.get{Module}s).toHaveBeenCalledWith(queryDto, mockUser);
  expect(result.data).toEqual(mockData);
});
```

### POST Create Entity

```typescript
// Controller test
it('should create a new {module}', async () => {
  const createDto = { name: 'New {Module}' };
  mock{Module}Service.create{Module}.mockResolvedValue(mock{Entity});

  const result = await controller.create{Module}(createDto as any, mockUser as any);

  expect(service.create{Module}).toHaveBeenCalledWith(createDto, mockUser);
  expect(result.data).toEqual(mock{Entity});
});

// Service test
it('should create a new {module}', async () => {
  const createDto: Create{Module}Dto = { name: 'New {Module}' };
  mock{Module}Repository.create{Module}.mockResolvedValue(mock{Entity});

  const result = await service.create{Module}(createDto, mockUser);

  expect(repository.create{Module}).toHaveBeenCalledWith(createDto, mockUser);
  expect(result).toEqual(mock{Entity});
});
```

### PATCH/PUT Update Entity

```typescript
// Controller test
it('should update a {module}', async () => {
  const updateDto = { name: 'Updated {Module}' };
  mock{Module}Service.update{Module}.mockResolvedValue(mock{Entity});

  const result = await controller.update{Module}('1', updateDto as any, mockUser as any);

  expect(service.update{Module}).toHaveBeenCalledWith('1', updateDto);
  expect(result).toEqual(mock{Entity});
});

// Service test
it('should update a {module}', async () => {
  const updateDto: Update{Module}Dto = { name: 'Updated {Module}' };
  mock{Module}Repository.update{Module}.mockResolvedValue(mock{Entity});

  const result = await service.update{Module}('1', updateDto);

  expect(repository.update{Module}).toHaveBeenCalledWith('1', updateDto);
  expect(result).toEqual(mock{Entity});
});
```

### DELETE Entity

```typescript
// Controller test
it('should delete a {module}', async () => {
  mock{Module}Service.delete{Module}.mockResolvedValue(mock{Entity});

  const result = await controller.delete{Module}('1', mockUser as any);

  expect(service.delete{Module}).toHaveBeenCalledWith('1');
  expect(result).toEqual(mock{Entity});
});

// Service test
it('should delete a {module}', async () => {
  mock{Module}Repository.delete{Module}.mockResolvedValue(mock{Entity});

  const result = await service.delete{Module}('1');

  expect(repository.delete{Module}).toHaveBeenCalledWith('1');
  expect(result).toEqual(mock{Entity});
});
```

---

## Mock Patterns

### Mock Database Connection

```typescript
const mockDatabase = {
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  offset: jest.fn().mockReturnThis(),
  execute: jest.fn().mockResolvedValue([{ count: 1 }]),
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  returning: jest.fn().mockResolvedValue([mock{Entity}]),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
} as unknown as NodePgDatabase;
```

### Mock Service with Return Values

```typescript
const mock{Module}Service = {
  get{Module}s: jest.fn().mockReturnValue({
    data: [mock{Entity}],
    meta: { total: 1, page: 1, limit: 10, total_pages: 1 },
  }),
  get{Module}ById: jest.fn().mockResolvedValue(mock{Entity}),
  create{Module}: jest.fn().mockResolvedValue(mock{Entity}),
  update{Module}: jest.fn().mockResolvedValue(mock{Entity}),
  delete{Module}: jest.fn().mockResolvedValue(mock{Entity}),
};
```

### Mock Repository with Database Operations

```typescript
const mock{Module}Repository = {
  get{Module}s: jest.fn().mockResolvedValue({
    data: [mock{Entity}],
    meta: { total: 1, page: 1, limit: 10, total_pages: 1 },
  }),
  get{Module}ById: jest.fn().mockResolvedValue(mock{Entity}),
  create{Module}: jest.fn().mockResolvedValue(mock{Entity}),
  update{Module}: jest.fn().mockResolvedValue(mock{Entity}),
  delete{Module}: jest.fn().mockResolvedValue(mock{Entity}),
};
```

---

## Test Utilities

### Common Test Setup

```typescript
// In your test file, create reusable setup
const createTestingModule = async (providers: any[] = []) => {
  return Test.createTestingModule({
    controllers: [{Module}Controller],
    providers: [
      {Module}Service,
      ...providers,
      {
        provide: I18nService,
        useValue: {
          t: jest.fn((key: string) => key),
        },
      },
    ],
  })
    .overrideGuard(JwtAuthGuard)
    .useValue({
      canActivate: jest.fn((context: ExecutionContext) => {
        const request = context.switchToHttp().getRequest<Request>();
        request.user = mockUser;
        return true;
      }),
    })
    .compile();
};
```

### Assertion Helpers

```typescript
// Helper to verify response structure
const expectValidResponse = (response: any, expectedData: any) => {
  expect(response).toHaveProperty('data');
  expect(response).toHaveProperty('code');
  expect(response.data).toEqual(expectedData);
};

// Helper to verify error response
const expectErrorResponse = (response: any, expectedStatus: number, expectedMessage: string) => {
  expect(response.status).toBe(expectedStatus);
  expect(response.message).toContain(expectedMessage);
};
```

---

## Reference Files

| Reference | File | Description |
|-----------|------|-------------|
| **Testing Strategy** | `.cursor/rules/testing-strategy.mdc` | Testing approach and patterns |
| **Movies Controller Tests** | `src/movies/movies.controller.spec.ts` | Controller test example |
| **Movies Service Tests** | `src/movies/movies.service.spec.ts` | Service test example |
| **Reviews Service Tests** | `src/reviews/reviews.service.spec.ts` | Service test example |
| **Auth Service Tests** | `src/auth/auth.service.spec.ts` | Auth-specific test patterns |
| **DTO Validation** | `src/movies/dto/create-movie.dto.ts` | DTO patterns to test |

---

## Common Test Scenarios per Module Type

### CRUD Module Tests (Movies, Articles, etc.)

```
✅ test_get_{module}s_success
✅ test_get_{module}s_empty
✅ test_get_{module}s_pagination
✅ test_get_{module}_by_id_success
✅ test_get_{module}_by_id_not_found
✅ test_create_{module}_success
✅ test_create_{module}_validation_error
✅ test_update_{module}_success
✅ test_update_{module}_not_found
✅ test_delete_{module}_success
✅ test_delete_{module}_not_found
```

### Auth Module Tests

```
✅ test_login_success
✅ test_login_invalid_credentials
✅ test_login_user_not_found
✅ test_register_success
✅ test_register_validation_error
✅ test_get_current_user_success
✅ test_get_current_user_unauthorized
✅ test_update_user_success
✅ test_change_password_success
✅ test_reset_password_success
```

---

## Checklist

Before marking tests complete:

### Controller Tests

- [ ] All HTTP methods have success tests
- [ ] Authentication and authorization tested
- [ ] Request/response DTOs tested
- [ ] Error cases tested (404, 401, 422, 400)
- [ ] Edge cases covered (empty list, pagination)
- [ ] Response wrappers tested
- [ ] Mock service with correct return values
- [ ] All controller tests pass

### Service Tests

- [ ] All service methods tested
- [ ] Business logic validated
- [ ] Error handling tested
- [ ] Repository calls verified
- [ ] Data transformations tested
- [ ] I18n integration tested
- [ ] Mock repository with correct return values
- [ ] All service tests pass

### Repository Tests (Optional)

- [ ] All database operations tested
- [ ] Queries verified
- [ ] Error handling tested
- [ ] Mock database with correct responses
- [ ] All repository tests pass

### General

- [ ] Test coverage is adequate
- [ ] Test names follow convention
- [ ] Tests are isolated (no shared state)
- [ ] All tests pass: `npm test`

---

## Troubleshooting

### Tests Fail with Import Errors

```bash
# Check module can be imported
node -e "require('./src/{module}/{module}.controller')"
```

### Mock Not Being Called

- Check service dependency injection in controller
- Verify mock is provided in testing module
- Check method signatures match

### Auth Tests Failing (401)

- Check JwtAuthGuard override is working
- Verify user is properly mocked in request
- Check authentication decorators in controller

### Database Mock Not Working

- Check DATABASE_CONNECTION token
- Verify mock methods return proper chainable objects
- Check Drizzle ORM query building

### Response Structure Doesn't Match

- Check ResponseWrapper usage
- Verify buildResponse function
- Check controller response format

### DTO Validation Tests

- Use `validateSync` from class-validator
- Test with both valid and invalid data
- Check validation error messages

---

## Example: Full Test File for Movies Controller

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from '@nestjs/passport';
import { I18nService } from 'nestjs-i18n';

import { MoviesController } from './movies.controller';
import MoviesService from './movies.service';
import { Movie } from './schema';
import { CreateMovieDto, GetMoviesDto, UpdateMovieDto } from './dto';

// Mock data
const mockMovie = {
  id: '1',
  title: 'Test Movie',
  category: 'action',
  user_id: '1',
} as Movie;

const mockUser = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
};

// Mock service
const mockMoviesService = {
  getMovies: jest.fn(),
  createMovie: jest.fn(),
  updateMovie: jest.fn(),
  deleteMovie: jest.fn(),
  getUserMovieIds: jest.fn(),
};

describe('MoviesController', () => {
  let controller: MoviesController;
  let service: MoviesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MoviesController],
      providers: [
        {
          provide: MoviesService,
          useValue: mockMoviesService,
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn((key: string) => key),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: jest.fn((context: ExecutionContext) => {
          const request = context.switchToHttp().getRequest();
          request.user = mockUser;
          return true;
        }),
      })
      .compile();

    controller = module.get<MoviesController>(MoviesController);
    service = module.get<MoviesService>(MoviesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMovies', () => {
    it('should return paginated movies', async () => {
      const mockData = [mockMovie];
      const mockMeta = { total: 1, page: 1, limit: 10, total_pages: 1 };
      const queryDto: GetMoviesDto = { page: '1', category: 'action' };
      
      mockMoviesService.getMovies.mockResolvedValue({ data: mockData, meta: mockMeta });

      const result = await controller.getMovies(queryDto, mockUser as any);

      expect(service.getMovies).toHaveBeenCalledWith(queryDto, mockUser);
      expect(result.data).toEqual(mockData);
      expect(result.meta).toEqual(mockMeta);
    });
  });

  describe('createMovie', () => {
    it('should create a new movie', async () => {
      const createDto: CreateMovieDto = { title: 'New Movie', category: 'action' };
      mockMoviesService.createMovie.mockResolvedValue(mockMovie);

      const result = await controller.createMovie(createDto, mockUser as any);

      expect(service.createMovie).toHaveBeenCalledWith(createDto, mockUser);
      expect(result.data).toEqual(mockMovie);
      expect(result.code).toBe('CREATED');
    });
  });

  describe('updateMovieById', () => {
    it('should update a movie', async () => {
      const updateDto: UpdateMovieDto = { category: 'comedy' };
      mockMoviesService.updateMovie.mockResolvedValue(mockMovie);

      const result = await controller.updateMovieById('1', updateDto, mockUser as any);

      expect(service.updateMovie).toHaveBeenCalledWith('1', updateDto);
      expect(result).toEqual(mockMovie);
    });
  });

  describe('deleteMovieById', () => {
    it('should delete a movie', async () => {
      mockMoviesService.deleteMovie.mockResolvedValue(mockMovie);

      const result = await controller.deleteMovieById('1', mockUser as any);

      expect(service.deleteMovie).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockMovie);
    });
  });

  describe('getUserMovieIds', () => {
    it('should return user movie IDs', async () => {
      const mockIds = [{ id: '1', idb_id: 'idb_1', category: 'action' }];
      mockMoviesService.getUserMovieIds.mockResolvedValue(mockIds);

      const result = await controller.getUserMovieIds(mockUser as any);

      expect(service.getUserMovieIds).toHaveBeenCalledWith(mockUser);
      expect(result.data).toEqual(mockIds);
    });
  });
});
```