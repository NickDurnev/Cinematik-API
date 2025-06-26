import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { AuthCredentialsDto } from "./dto/auth-credentials.dto";
import { JwtPayload } from "./jwt-payload.interface";
import { UsersRepository } from "./user.repository";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UsersRepository)
    private usersRepository: UsersRepository,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  SignUp(authCredentialsDto: AuthCredentialsDto): Promise<void> {
    return this.usersRepository.createUser(authCredentialsDto);
  }

  async SignIn(
    authCredentialsDto: AuthCredentialsDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { name, password } = authCredentialsDto;
    const user = await this.usersRepository.findByName(name);

    if (user && password && (await bcrypt.compare(password, user.password))) {
      const payload: JwtPayload = { name: user.name, email: user.email };
      const accessToken: string = await this.jwtService.sign(payload, {
        expiresIn: "15m",
      });
      const refreshToken: string = await this.jwtService.sign(payload, {
        expiresIn: "7d",
        secret: this.configService.get("JWT_SECRET"),
      });
      return { accessToken, refreshToken };
    } else {
      throw new UnauthorizedException("Please check your login credentials");
    }
  }

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get("JWT_SECRET"),
      });
      const accessToken: string = await this.jwtService.sign(
        { name: payload.name, email: payload.email },
        { expiresIn: "15m" },
      );
      return { accessToken };
    } catch (_) {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }
}
