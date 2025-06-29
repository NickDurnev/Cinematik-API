import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { DATABASE_CONNECTION } from "@/database/database.connection";

import { AuthCredentialsDto } from "./dto/auth-credentials.dto";
import { User, users } from "./schema";

@Injectable()
export class UsersRepository {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly database: NodePgDatabase,
  ) {}

  async createUser(authCredentialsDto: AuthCredentialsDto): Promise<User> {
    const { name, password, email } = authCredentialsDto;

    // Check if user already exists
    const existingUser = await this.findByName(name);
    if (existingUser) {
      throw new ConflictException("Username already exists");
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = {
      name,
      password: hashedPassword,
      email,
    };
    try {
      return (await this.database.insert(users).values(user).returning())[0];
    } catch (error) {
      console.log(' error_code', error.code);
      console.log(' error detail', error.detail);
      
      if (error.code === "23505") {
        // Check if it's a name or email constraint violation
        if (error.detail && error.detail.includes("name")) {
          throw new ConflictException("Username already exists");
        } else if (error.detail && error.detail.includes("email")) {
          throw new ConflictException("Email already exists");
        } else {
          throw new ConflictException("User already exists");
        }
      }
      // Log other errors and re-throw them
      console.error("Database error during user creation:", error);
      throw new InternalServerErrorException("Failed to create user");
    }
  }

  async findByName(name: string) {
    const usersData = await this.database
      .select()
      .from(users)
      .where(eq(users.name, name));
    return usersData[0] || null;
  }

  async findByEmail(email: string) {
    const usersData = await this.database
      .select()
      .from(users)
      .where(eq(users.email, email));
    return usersData[0] || null;
  }
}
