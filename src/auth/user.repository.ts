import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { DATABASE_CONNECTION } from "@/database/database.connection";
import { AuthCredentialsDto } from "./dto/auth-credentials.dto";
import * as schema from "./schema";

@Injectable() // here
export class UsersRepository {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly database: NodePgDatabase<typeof schema>,
  ) {}

  async createUser(authCredentialsDto: AuthCredentialsDto): Promise<void> {
    const { name, password, email, picture } = authCredentialsDto;

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = {
      name,
      password: hashedPassword,
      email,
      picture,
    };
    try {
      await this.database.insert(schema.users).values(user);
    } catch (error) {
      if (error.code === "23505") {
        //duplicated username
        throw new ConflictException("Username already exists");
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async findByName(name: string) {
    const users = await this.database
      .select()
      .from(schema.users)
      .where(eq(schema.users.name, name));
    return users[0] || null;
  }
}
