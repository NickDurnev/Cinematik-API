# Create NestJS Module Command

Create a new NestJS module following Cinematik-API patterns.

## Usage

```
/create-module <module_name>
```

Examples:

- `/create-module categories` - Category CRUD module
- `/create-module actors` - Actor management module
- `/create-module genres` - Genre management module

## Pre-Flight Checklist

Before starting, verify:

1. ✅ Check `.cursor/context/project-context.md` for module's requirements
2. ✅ Analyze existing implemented modules as examples (`src/auth/`, `src/movies/`, `src/reviews/`)
3. ✅ Verify module name doesn't conflict with existing modules
4. ✅ Plan database schema for module
5. ✅ Check test coverage requirements in `.cursor/context/test-coverage.md`

---

## Instructions

You are creating a new NestJS module for Cinematik-API project. This module will follow established patterns and integrate seamlessly with existing codebase.

### Step 0: Create TODO List

Create a TODO list to track progress:

```
1. Analyze module requirements and plan database schema
2. Create module directory structure
3. Create database schema
4. Create entities and DTOs
5. Create repository
6. Create service
7. Create controller
8. Create module definition
9. Register in app.module.ts
10. Create documentation
11. Create unit tests for controller
12. Create unit tests for service
13. Create unit tests for repository (optional)
14. Run tests and verify implementation
15. Update test coverage in .cursor/context/test-coverage.md
16. Update OpenAPI documentation
```

### Step 1: Analyze Module Requirements

#### Module Planning

Consider:

- **Purpose**: What business functionality will this module provide?
- **Entities**: What database tables are needed?
- **Relationships**: How does this module relate to existing modules?
- **API Endpoints**: What REST endpoints will be exposed?
- **Authentication**: Which endpoints require authentication?
- **Authorization**: What roles/permissions are needed?

#### Example Module Analysis

For a `categories` module:

- **Purpose**: Manage movie categories/genres
- **Entities**: `categories` table
- **Relationships**: Many-to-many with `movies`
- **Endpoints**: CRUD operations for categories
- **Authentication**: Admin-only for write operations, public read access

### Step 2: Create Module Directory Structure

Create following structure in `src/{module_name}/`:

```
src/{module_name}/
├── {module_name}.module.ts     # NestJS module definition
├── {module_name}.controller.ts # REST endpoints
├── {module_name}.service.ts    # Business logic
├── {module_name}.repository.ts # Database operations
├── {module_name}.controller.spec.ts # Controller tests
├── {module_name}.service.spec.ts    # Service tests
├── {module_name}.repository.spec.ts  # Repository tests (optional)
├── schema.ts                   # Drizzle schema definition
├── dto/                        # DTOs directory
│   ├── create.dto.ts           # Create DTOs
│   ├── update.dto.ts           # Update DTOs
│   ├── query.dto.ts            # Query DTOs
│   └── response.dto.ts         # Response DTOs
└── docs/                       # Swagger documentation
    └── {module_name}.docs.ts   # API documentation definitions
```

### Step 3: Create Database Schema

Reference: `.cursor/rules/nestjs-database-patterns.mdc`

Create `schema.ts`:

```typescript
import { 
  pgTable, 
  serial, 
  text, 
  timestamp, 
  boolean, 
  integer,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const {module_name}Table = pgTable(
  "{module_name}",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull().unique(),
    description: text("description"),
    isActive: boolean("is_active").default(true),
    createdBy: integer("created_by").notNull(),
    updatedBy: integer("updated_by"),
    deletedBy: integer("deleted_by"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    nameIdx: index("{module_name}_name_idx").on(table.name),
    createdByIdx: index("{module_name}_created_by_idx").on(table.createdBy),
  })
);

export const {module_name}Relations = relations({module_name}Table, ({ one, many }) => ({
  creator: one(userTable, {
    fields: [{module_name}Table.createdBy],
    references: [userTable.id],
  }),
  updater: one(userTable, {
    fields: [{module_name}Table.updatedBy],
    references: [userTable.id],
  }),
}));
```

### Step 4: Create DTOs

Reference: `.cursor/rules/nestjs-controllers.mdc`

#### Create DTO (`dto/create.dto.ts`)

```typescript
import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, MaxLength, MinLength } from "class-validator";

export class Create{Module_name}Dto {
  @ApiProperty({
    description: "Module name",
    example: "Action Movies",
  })
  @IsString()
  @MinLength(1, { message: "Name must be at least 1 character long" })
  @MaxLength(255, { message: "Name must not exceed 255 characters" })
  name: string;

  @ApiProperty({
    description: "Module description",
    example: "Action and adventure movies",
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: "Description must not exceed 1000 characters" })
  description?: string;

  @ApiProperty({
    description: "Whether module is active",
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
```

#### Update DTO (`dto/update.dto.ts`)

```typescript
import { PartialType } from "@nestjs/mapped-types";
import { Create{Module_name}Dto } from "./create.dto";

export class Update{Module_name}Dto extends PartialType(Create{Module_name}Dto) {}
```

#### Query DTO (`dto/query.dto.ts`)

```typescript
import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, IsBoolean, IsInt, Min, Max } from "class-validator";
import { Type } from "class-transformer";

export class Query{Module_name}Dto {
  @ApiProperty({
    description: "Search term",
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: "Filter by active status",
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiProperty({
    description: "Page number",
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: "Items per page",
    example: 10,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
```

#### Response DTO (`dto/response.dto.ts`)

```typescript
import { ApiProperty } from "@nestjs/swagger";

export class {Module_name}ResponseDto {
  @ApiProperty({
    description: "Module ID",
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: "Module name",
    example: "Action Movies",
  })
  name: string;

  @ApiProperty({
    description: "Module description",
    example: "Action and adventure movies",
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: "Whether module is active",
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: "Creation timestamp",
    example: "2023-12-01T10:00:00Z",
  })
  createdAt: Date;

  @ApiProperty({
    description: "Last update timestamp",
    example: "2023-12-01T10:00:00Z",
  })
  updatedAt: Date;
}
```

### Step 5: Create Repository

Reference: `.cursor/rules/nestjs-database-patterns.mdc`

Create `{module_name}.repository.ts`:

```typescript
import { Injectable } from "@nestjs/common";
import { eq, and, ilike, desc, isNull } from "drizzle-orm";
import { DatabaseService } from "@/database/database.service";
import { {module_name}Table } from "./schema";
import { Create{Module_name}Dto, Update{Module_name}Dto, Query{Module_name}Dto } from "./dto";

@Injectable()
export class {Module_name}Repository {
  constructor(private readonly db: DatabaseService) {}

  async create(data: Create{Module_name}Dto & { createdBy: number }) {
    const [result] = await this.db.db
      .insert({module_name}Table)
      .values(data)
      .returning();
    return result;
  }

  async findById(id: number) {
    const [result] = await this.db.db
      .select()
      .from({module_name}Table)
      .where(and(
        eq({module_name}Table.id, id),
        isNull({module_name}Table.deletedAt)
      ))
      .limit(1);
    return result || null;
  }

  async findAll(query?: Query{Module_name}Dto) {
    let dbQuery = this.db.db
      .select()
      .from({module_name}Table)
      .where(isNull({module_name}Table.deletedAt));

    if (query?.search) {
      dbQuery = dbQuery.where(
        and(
          isNull({module_name}Table.deletedAt),
          ilike({module_name}Table.name, `%${query.search}%`)
        )
      );
    }

    if (query?.isActive !== undefined) {
      dbQuery = dbQuery.where(
        and(
          isNull({module_name}Table.deletedAt),
          eq({module_name}Table.isActive, query.isActive)
        )
      );
    }

    return dbQuery.orderBy(desc({module_name}Table.createdAt));
  }

  async findWithPagination(query: Query{Module_name}Dto) {
    const { page = 1, limit = 10, ...filters } = query;
    
    // Get total count
    const [{ count }] = await this.db.db
      .select({ count: count() })
      .from({module_name}Table)
      .where(isNull({module_name}Table.deletedAt));

    // Get paginated results
    const items = await this.db.db
      .select()
      .from({module_name}Table)
      .where(isNull({module_name}Table.deletedAt))
      .limit(limit)
      .offset((page - 1) * limit)
      .order(desc({module_name}Table.createdAt));

    return {
      items,
      total: Number(count),
      page,
      limit,
      totalPages: Math.ceil(Number(count) / limit),
    };
  }

  async findByName(name: string) {
    const [result] = await this.db.db
      .select()
      .from({module_name}Table)
      .where(and(
        eq({module_name}Table.name, name),
        isNull({module_name}Table.deletedAt)
      ))
      .limit(1);
    return result || null;
  }

  async update(id: number, data: Update{Module_name}Dto & { updatedBy?: number }) {
    const [result] = await this.db.db
      .update({module_name}Table)
      .set({ ...data, updatedAt: new Date() })
      .where(and(
        eq({module_name}Table.id, id),
        isNull({module_name}Table.deletedAt)
      ))
      .returning();
    return result;
  }

  async softDelete(id: number, userId: number) {
    await this.db.db
      .update({module_name}Table)
      .set({ 
        deletedAt: new Date(), 
        deletedBy: userId,
        updatedAt: new Date() 
      })
      .where(eq({module_name}Table.id, id));
  }
}
```

### Step 6: Create Service

Reference: `.cursor/rules/nestjs-services.mdc`

Create `{module_name}.service.ts`:

```typescript
import { Injectable, Logger, NotFoundException, ConflictException } from "@nestjs/common";
import { I18nService } from "nestjs-i18n";

import { {Module_name}Repository } from "./{module_name}.repository";
import { Create{Module_name}Dto, Update{Module_name}Dto, Query{Module_name}Dto } from "./dto";
import { {Module_name}ResponseDto } from "./dto/response.dto";

@Injectable()
export class {Module_name}Service {
  private readonly logger = new Logger({Module_name}Service.name);

  constructor(
    private readonly {module_name}Repository: {Module_name}Repository,
    private readonly i18n: I18nService,
  ) {}

  async create(createDto: Create{Module_name}Dto, userId: number): Promise<{Module_name}ResponseDto> {
    this.logger.log(`Creating new {module_name}: ${createDto.name}`);

    // Check for duplicates
    const existing = await this.{module_name}Repository.findByName(createDto.name);
    if (existing) {
      throw new ConflictException(this.i18n.t("{module_name}.alreadyExists", {
        lang: I18nContext.current().lang,
      }));
    }

    try {
      const {module_name} = await this.{module_name}Repository.create({
        ...createDto,
        createdBy: userId,
      });

      this.logger.log(`{Module_name} created successfully with ID: ${${module_name}.id}`);
      return this.mapToResponseDto({module_name});
    } catch (error) {
      this.logger.error(`Failed to create {module_name}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll(query?: Query{Module_name}Dto): Promise<{Module_name}ResponseDto[]> {
    this.logger.log("Retrieving all {module_name}");

    try {
      const {module_name}List = await this.{module_name}Repository.findAll(query);
      
      this.logger.log(`Retrieved ${${module_name}List.length} {module_name}`);
      return {module_name}List.map({module_name} => this.mapToResponseDto({module_name}));
    } catch (error) {
      this.logger.error(`Failed to retrieve {module_name}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findWithPagination(query: Query{Module_name}Dto) {
    this.logger.log(`Retrieving paginated {module_name}: page=${query.page}, limit=${query.limit}`);

    try {
      const result = await this.{module_name}Repository.findWithPagination(query);
      
      return {
        items: result.items.map({module_name} => this.mapToResponseDto({module_name})),
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to retrieve paginated {module_name}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findOne(id: number): Promise<{Module_name}ResponseDto> {
    this.logger.log(`Retrieving {module_name} with ID: ${id}`);

    const {module_name} = await this.{module_name}Repository.findById(id);
    if (!{module_name}) {
      throw new NotFoundException(this.i18n.t("{module_name}.notFound", {
        lang: I18nContext.current().lang,
        args: { id },
      }));
    }

    return this.mapToResponseDto({module_name});
  }

  async update(
    id: number, 
    updateDto: Update{Module_name}Dto, 
    userId: number
  ): Promise<{Module_name}ResponseDto> {
    this.logger.log(`Updating {module_name} ${id}`);

    // Check if {module_name} exists
    await this.findOne(id);

    // Check for name conflicts if name is being updated
    if (updateDto.name) {
      const duplicate = await this.{module_name}Repository.findByName(updateDto.name);
      if (duplicate && duplicate.id !== id) {
        throw new ConflictException(this.i18n.t("{module_name}.nameConflict", {
          lang: I18nContext.current().lang,
        }));
      }
    }

    try {
      const updated = await this.{module_name}Repository.update(id, {
        ...updateDto,
        updatedBy: userId,
      });

      this.logger.log(`{Module_name} ${id} updated successfully`);
      return this.mapToResponseDto(updated);
    } catch (error) {
      this.logger.error(`Failed to update {module_name} ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async remove(id: number, userId: number): Promise<void> {
    this.logger.log(`Deleting {module_name} with ID: ${id}`);

    // Check if {module_name} exists
    await this.findOne(id);

    try {
      await this.{module_name}Repository.softDelete(id, userId);
      this.logger.log(`{Module_name} ${id} deleted successfully`);
    } catch (error) {
      this.logger.error(`Failed to delete {module_name} ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  private mapToResponseDto({module_name}: any): {Module_name}ResponseDto {
    return {
      id: {module_name}.id,
      name: {module_name}.name,
      description: {module_name}.description,
      isActive: {module_name}.isActive,
      createdAt: {module_name}.createdAt,
      updatedAt: {module_name}.updatedAt,
    };
  }
}
```

### Step 7: Create Controller

Reference: `.cursor/rules/nestjs-controllers.mdc`

Create `{module_name}.controller.ts`:

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from "@nestjs/swagger";
import { I18n, I18nContext, I18nService } from "nestjs-i18n";

import { ResponseWrapper, buildResponse, ResponseCode } from "@/types";
import { JwtAuthGuard } from "@/auth/guards/jwt-auth.guard";
import { RolesGuard } from "@/auth/guards/roles.guard";
import { Roles } from "@/auth/decorators/roles.decorator";
import { CurrentUser } from "@/auth/decorators/current-user.decorator";
import { UserEntity } from "@/auth/entities/user.entity";
import { Role } from "@/auth/enums/role.enum";

import { {Module_name}Service } from "./{module_name}.service";
import {
  Create{Module_name}Dto,
  Update{Module_name}Dto,
  Query{Module_name}Dto,
  {Module_name}ResponseDto,
} from "./dto";
import {
  Create{Module_name}ApiBody,
  Create{Module_name}ApiResponse,
  Update{Module_name}ApiResponse,
  Delete{Module_name}ApiResponse,
} from "./docs/{module_name}.docs";

@ApiTags("{Module_name}s")
@Controller("{module_name}")
@ApiBearerAuth()
export class {Module_name}Controller {
  constructor(
    private readonly {module_name}Service: {Module_name}Service,
    private readonly i18n: I18nService,
  ) {}

  @Get()
  @ApiOperation({ summary: "List all {module_name}" })
  @ApiResponse({ 
    status: 200, 
    description: "{Module_name}s retrieved successfully",
    type: [{Module_name}ResponseDto]
  })
  async findAll(
    @Query() query: Query{Module_name}Dto,
  ): Promise<ResponseWrapper<{Module_name}ResponseDto[]>> {
    const data = await this.{module_name}Service.findAll(query);
    return buildResponse({
      data,
      code: ResponseCode.OK,
      message: this.i18n.t("{module_name}.listRetrieved", {
        lang: I18nContext.current().lang,
      }),
    });
  }

  @Get("paginated")
  @ApiOperation({ summary: "List {module_name} with pagination" })
  @ApiResponse({ 
    status: 200, 
    description: "Paginated {module_name} retrieved successfully",
  })
  async findWithPagination(
    @Query() query: Query{Module_name}Dto,
  ): Promise<ResponseWrapper<any>> {
    const data = await this.{module_name}Service.findWithPagination(query);
    return buildResponse({
      data,
      code: ResponseCode.OK,
      message: this.i18n.t("{module_name}.paginatedListRetrieved", {
        lang: I18nContext.current().lang,
      }),
    });
  }

  @Get(":id")
  @ApiParam({ name: "id", type: Number, description: "{Module_name} ID" })
  @ApiOperation({ summary: "Get {module_name} by ID" })
  @ApiResponse({ 
    status: 200, 
    description: "{Module_name} retrieved successfully",
    type: {Module_name}ResponseDto
  })
  @ApiResponse({ status: 404, description: "{Module_name} not found" })
  async findOne(
    @Param("id", ParseIntPipe) id: number,
  ): Promise<ResponseWrapper<{Module_name}ResponseDto>> {
    const data = await this.{module_name}Service.findOne(id);
    return buildResponse({
      data,
      code: ResponseCode.OK,
      message: this.i18n.t("{module_name}.found", {
        lang: I18nContext.current().lang,
      }),
    });
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: "Create new {module_name}" })
  @ApiBody(Create{Module_name}ApiBody)
  @ApiResponse(Create{Module_name}ApiResponse)
  @ApiResponse({ status: 400, description: "Bad request - invalid data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden - insufficient permissions" })
  @ApiResponse({ status: 409, description: "Conflict - {module_name} already exists" })
  async create(
    @Body() createDto: Create{Module_name}Dto,
    @CurrentUser() user: UserEntity,
  ): Promise<ResponseWrapper<{Module_name}ResponseDto>> {
    const data = await this.{module_name}Service.create(createDto, user.id);
    return buildResponse({
      data,
      code: ResponseCode.CREATED,
      message: this.i18n.t("{module_name}.created", {
        lang: I18nContext.current().lang,
      }),
    });
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiParam({ name: "id", type: Number, description: "{Module_name} ID" })
  @ApiOperation({ summary: "Update {module_name}" })
  @ApiBody({ type: Update{Module_name}Dto })
  @ApiResponse(Update{Module_name}ApiResponse)
  @ApiResponse({ status: 400, description: "Bad request - invalid data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden - insufficient permissions" })
  @ApiResponse({ status: 404, description: "{Module_name} not found" })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: Update{Module_name}Dto,
    @CurrentUser() user: UserEntity,
  ): Promise<ResponseWrapper<{Module_name}ResponseDto>> {
    const data = await this.{module_name}Service.update(id, updateDto, user.id);
    return buildResponse({
      data,
      code: ResponseCode.OK,
      message: this.i18n.t("{module_name}.updated", {
        lang: I18nContext.current().lang,
      }),
    });
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiParam({ name: "id", type: Number, description: "{Module_name} ID" })
  @ApiOperation({ summary: "Delete {module_name}" })
  @ApiResponse(Delete{Module_name}ApiResponse)
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden - insufficient permissions" })
  @ApiResponse({ status: 404, description: "{Module_name} not found" })
  async remove(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
  ): Promise<ResponseWrapper<null>> {
    await this.{module_name}Service.remove(id, user.id);
    return buildResponse({
      data: null,
      code: ResponseCode.OK,
      message: this.i18n.t("{module_name}.deleted", {
        lang: I18nContext.current().lang,
      }),
    });
  }
}
```

### Step 8: Create Module Definition

Create `{module_name}.module.ts`:

```typescript
import { Module } from "@nestjs/common";

import AuthModule from "@/auth/auth.module";
import DatabaseModule from "@/database/database.module";

import { {Module_name}Controller } from "./{module_name}.controller";
import { {Module_name}Service } from "./{module_name}.service";
import { {Module_name}Repository } from "./{module_name}.repository";

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [{Module_name}Controller],
  providers: [{Module_name}Service, {Module_name}Repository],
  exports: [{Module_name}Repository],
})
export default class {Module_name}Module {}
```

### Step 9: Register in App Module

Update `src/app.module.ts`:

```typescript
import { Module } from "@nestjs/common";

import {Module_name}Module from "./{module_name}/{module_name}.module";

@Module({
  imports: [
    // ... existing imports
    {Module_name}Module,
  ],
})
export class AppModule {}
```

### Step 10: Create Documentation

Create `docs/{module_name}.docs.ts`:

```typescript
import { ApiProperty } from "@nestjs/swagger";
import { Create{Module_name}Dto } from "../dto/create.dto";
import { {Module_name}ResponseDto } from "../dto/response.dto";

export const Create{Module_name}ApiBody = {
  type: Create{Module_name}Dto,
  description: "{Module_name} creation data",
};

export const Create{Module_name}ApiResponse = {
  status: 201,
  description: "{Module_name} created successfully",
  schema: {
    type: "object",
    properties: {
      data: { $ref: "#/components/schemas/{Module_name}ResponseDto" },
      code: { type: "string", example: "CREATED" },
      message: { type: "string", example: "{Module_name} created successfully" },
      timestamp: { type: "string", example: "2023-12-01T10:00:00Z" },
    },
  },
};

export const Update{Module_name}ApiResponse = {
  status: 200,
  description: "{Module_name} updated successfully",
  schema: {
    type: "object",
    properties: {
      data: { $ref: "#/components/schemas/{Module_name}ResponseDto" },
      code: { type: "string", example: "OK" },
      message: { type: "string", example: "{Module_name} updated successfully" },
      timestamp: { type: "string", example: "2023-12-01T10:00:00Z" },
    },
  },
};

export const Delete{Module_name}ApiResponse = {
  status: 200,
  description: "{Module_name} deleted successfully",
  schema: {
    type: "object",
    properties: {
      data: { type: "null" },
      code: { type: "string", example: "OK" },
      message: { type: "string", example: "{Module_name} deleted successfully" },
      timestamp: { type: "string", example: "2023-12-01T10:00:00Z" },
    },
  },
};
```

### Step 11-13: Create Unit Tests

Follow the testing patterns outlined in `.cursor/commands/create-tests.md`:

#### Controller Tests (`{module_name}.controller.spec.ts`)

```typescript
import { Test, TestingModule, ExecutionContext } from '@nestjs/testing';
import { JwtAuthGuard } from '@nestjs/passport';
import { I18nService } from 'nestjs-i18n';
import { Request } from 'express';

import { {Module_name}Controller } from './{module_name}.controller';
import { {Module_name}Service } from './{module_name}.service';
import { {Entity} } from './schema';
import { {Module_name}Dto } from './dto';

// Mock data and service
// ...

describe('{Module_name}Controller', () => {
  let controller: {Module_name}Controller;
  let service: {Module_name}Service;

  beforeEach(async () => {
    // Set up testing module with mocks
    // ...
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated {module_name}', async () => {
      // Test implementation
    });
  });

  // Add other controller tests
});
```

#### Service Tests (`{module_name}.service.spec.ts`)

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { I18nService, I18nContext } from 'nestjs-i18n';

import { {Module_name}Service } from './{module_name}.service';
import { {Module_name}Repository } from './{module_name}.repository';
import { {Entity} } from './schema';
import { Create{Module_name}Dto, Update{Module_name}Dto } from './dto';

// Mock data and repository
// ...

describe('{Module_name}Service', () => {
  let service: {Module_name}Service;
  let repository: {Module_name}Repository;

  beforeEach(async () => {
    // Set up testing module with mocks
    // ...
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new {module_name}', async () => {
      // Test implementation
    });
  });

  // Add other service tests
});
```

#### Repository Tests (`{module_name}.repository.spec.ts`) - Optional

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { {Module_name}Repository } from './{module_name}.repository';
import { {Entity}, {module_name}s } from './schema';
import { Create{Module_name}Dto } from './dto';

// Mock data and database
// ...

describe('{Module_name}Repository', () => {
  let repository: {Module_name}Repository;
  let database: NodePgDatabase;

  beforeEach(async () => {
    // Set up testing module with mocks
    // ...
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new {module_name}', async () => {
      // Test implementation
    });
  });

  // Add other repository tests
});
```

### Step 14: Update Test Coverage

After creating all tests, update the test coverage tracking:

1. Open `.cursor/context/test-coverage.md`
2. Update the status for your module:
   - Mark Controller tests as ✅ Implemented
   - Mark Service tests as ✅ Implemented
   - Mark Repository tests as ✅ Implemented (if created)
   - Update Overall Status to ✅ Implemented

### Step 15: Run Tests

Run these commands to verify:

```bash
# 1. Build application
npm run build

# 2. Run linting
npm run lint:fix

# 3. Run tests
npm test

# 4. Run tests with coverage
npm run test:cov

# 5. Test imports
npx ts-node -e "import('./src/{module_name}/{module_name}.module.ts').then(() => console.log('Import OK'))"
```

### Step 16: Update OpenAPI Documentation

After creating the module, regenerate OpenAPI documentation:

```bash
# Start the development server
npm run start:dev

# Access Swagger documentation
open http://localhost:3000/api
```

---

## Reference Files

| Reference | File |
| --------- | ---- |
| Module setup | `.cursor/rules/module-setup.mdc` |
| NestJS controllers | `.cursor/rules/nestjs-controllers.mdc` |
| NestJS services | `.cursor/rules/nestjs-services.mdc` |
| Database patterns | `.cursor/rules/nestjs-database-patterns.mdc` |
| Project context | `.cursor/context/project-context.md` |
| Test patterns | `.cursor/commands/create-tests.md` |
| Test coverage | `.cursor/context/test-coverage.md` |
| Exception handling | `.cursor/rules/exceptions-pattern.mdc` |
| Testing strategy | `.cursor/rules/testing-strategy.mdc` |

---

## Module Templates

### Quick Start Templates

#### Simple CRUD Module
```bash
/create-module categories
```

#### Module with Relationships
```bash
/create-module actors
# Then add relationships to movies in schema
```

#### Module with Complex Business Logic
```bash
/create-module recommendations
# Add advanced business logic in service
```

---

## Common Patterns

### Authentication & Authorization

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Post()
async create() {
  // Admin only endpoint
}

@UseGuards(JwtAuthGuard)
@Get("profile")
async getProfile(@CurrentUser() user: UserEntity) {
  // Authenticated users only
}

@Get("public")
async getPublic() {
  // Public endpoint
}
```

### Response Format

```typescript
return buildResponse({
  data: result,
  code: ResponseCode.OK,
  message: this.i18n.t("module.success", {
    lang: I18nContext.current().lang,
  }),
});
```

### Error Handling

```typescript
if (!entity) {
  throw new NotFoundException(this.i18n.t("module.notFound", {
    lang: I18nContext.current().lang,
    args: { id },
  }));
}
```

### Pagination

```typescript
@Get()
async findAll(@Query() query: QueryDto) {
  const { items, pagination } = await this.service.findWithPagination(query);
  return buildResponse({
    data: { items, pagination },
    code: ResponseCode.OK,
  });
}
```

---

## Checklist

Before marking module complete:

**Implementation:**
- [ ] All CRUD operations implemented
- [ ] Proper authentication/authorization
- [ ] Input validation with DTOs
- [ ] Error handling with internationalization
- [ ] Database operations with repository pattern
- [ ] API documentation with Swagger
- [ ] Soft delete implementation

**Testing:**
- [ ] Unit tests for controller layer
- [ ] Unit tests for service layer
- [ ] Repository tests with mocked database
- [ ] Integration tests for complete flows
- [ ] Test coverage updated in test-coverage.md

**Documentation:**
- [ ] OpenAPI/Swagger documentation
- [ ] Code comments for complex logic
- [ ] README updates if needed

**Quality:**
- [ ] Linting passes: `npm run lint:fix`
- [ ] TypeScript compilation succeeds
- [ ] All tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] App starts successfully
- [ ] Test coverage meets requirements

---

## Troubleshooting

### Import Errors
```bash
# Check TypeScript path mapping
cat tsconfig.json | grep paths

# Test import
npx ts-node -e "import('./src/{module_name}/{module_name}.module.ts')"
```

### Database Issues
```bash
# Check database connection
npx drizzle-kit studio

# Run migrations
npm run db:migrate
```

### Module Registration
```bash
# Check if module is imported in app.module.ts
grep -r "{Module_name}Module" src/app.module.ts
```

### Test Coverage Issues
```bash
# Check test coverage report
npm run test:cov

# Verify test files exist
ls src/{module_name}/*.spec.ts
```