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

import { AuthCredentialsDto,AuthSocialDto } from "./dto/auth-credentials.dto";
import { User, users } from "./schema";

@Injectable()
export class UsersRepository {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly database: NodePgDatabase,
  ) {}

  async createUserByCredentials(authCredentialsDto: AuthCredentialsDto): Promise<User> {
    const { name, password, email } = authCredentialsDto;

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = {
      name,
      password: hashedPassword,
      email,
      picture: "",
    };
    try {
      return (await this.database.insert(users).values(user).returning())[0];
    } catch (error) {
      console.error("Database error during user creation:", error);
      throw new InternalServerErrorException("Failed to create user");
    }
  }

   async createUserBySocial(authSocialDto: AuthSocialDto): Promise<User> {
    const { name, email, picture } = authSocialDto;

    const user = {
      name,
      email,
      picture,
    };
    try {
      return (await this.database.insert(users).values(user).returning())[0];
    } catch (error) {
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
