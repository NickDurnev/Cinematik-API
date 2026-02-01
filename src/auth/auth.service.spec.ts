import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Test, TestingModule } from "@nestjs/testing";
import * as bcrypt from "bcrypt";
import { I18nService } from "nestjs-i18n";

import EmailService from "@/common/services/email.service";
import FormatDataService from "@/common/services/format-data.service";
import { TokenService } from "@/common/services/token.service";
import { AuthData, TokensData, UserData } from "@/types";

import { AuthService } from "./auth.service";
import {
  AuthCredentialsDto,
  AuthSignInDto,
  AuthSocialDto,
} from "./dto/auth-credentials.dto";
import UsersRepository from "./user.repository";

// Mock I18nContext
jest.mock("nestjs-i18n", () => ({
  I18nContext: {
    current: jest.fn().mockReturnValue({ lang: "en" }),
  },
  I18nService: jest.fn().mockImplementation(() => ({
    t: jest.fn((key: string) => key),
  })),
  I18n: () => jest.fn(),
}));

// Mock data
const mockUser = {
  id: "1",
  name: "Test User",
  email: "test@example.com",
  password: "hashedPassword",
  email_confirmed: true,
  picture: "https://example.com/avatar.jpg",
};

const mockUserData: UserData = {
  id: "1",
  name: "Test User",
  email: "test@example.com",
  email_confirmed: true,
  picture: "https://example.com/avatar.jpg",
  is_left_review: false,
};

const mockTokensData: TokensData = {
  access_token: "access_token",
  refresh_token: "refresh_token",
  access_token_expires: 3600,
  refresh_token_expires: 604800,
};

// Mock repository
const mockUsersRepository = {
  findByEmail: jest.fn(),
  createUserByCredentials: jest.fn(),
  createUserBySocial: jest.fn(),
  updateUserPassword: jest.fn(),
  findValidTokenByUserId: jest.fn(),
  createUserToken: jest.fn(),
  findValidToken: jest.fn(),
  markTokenAsUsed: jest.fn(),
  deleteExpiredTokens: jest.fn(),
};

// Mock dependencies
const mockJwtService = {
  sign: jest.fn().mockReturnValue("token"),
  verify: jest
    .fn()
    .mockReturnValue({ name: "Test User", email: "test@example.com" }),
};

const mockConfigService = {
  get: jest.fn((key: string) => {
    if (key === "JWT_SECRET") return "secret";
    if (key === "CLIENT_APP_BASE_URL") return "http://localhost:3000";
    return null;
  }),
};

const mockEmailService = {
  sendForgotPasswordEmail: jest
    .fn()
    .mockResolvedValue({ data: { id: "123" }, error: null }),
  sendConfirmEmail: jest
    .fn()
    .mockResolvedValue({ data: { id: "123" }, error: null }),
};

const mockFormatDataService = {
  formatUserData: jest.fn().mockResolvedValue(mockUserData),
};

const mockTokenService = {
  generateToken: jest.fn().mockReturnValue({
    token: "token",
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  }),
  cleanupExpiredTokens: jest.fn(),
};

describe("AuthService", () => {
  let service: AuthService;
  let repository: UsersRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersRepository,
          useValue: mockUsersRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: FormatDataService,
          useValue: mockFormatDataService,
        },
        {
          provide: TokenService,
          useValue: mockTokenService,
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn((key: string) => key),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    repository = module.get<UsersRepository>(UsersRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("SignUp", () => {
    it("should create a new user successfully", async () => {
      const signUpDto: AuthCredentialsDto = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      };

      mockUsersRepository.findByEmail.mockResolvedValue(null);
      mockUsersRepository.createUserByCredentials.mockResolvedValue(mockUser);

      const result = await service.SignUp(signUpDto);

      expect(repository.findByEmail).toHaveBeenCalledWith(signUpDto.email);
      expect(repository.createUserByCredentials).toHaveBeenCalledWith(
        signUpDto,
      );
      expect(result.user).toEqual(mockUserData);
      expect(result.tokens).toBeDefined();
    });

    it("should throw ConflictException if user already exists", async () => {
      const signUpDto: AuthCredentialsDto = {
        name: "Test User",
        email: "existing@example.com",
        password: "password123",
      };

      mockUsersRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(service.SignUp(signUpDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe("SignIn", () => {
    it("should sign in a user successfully", async () => {
      const signInDto: AuthSignInDto = {
        email: "test@example.com",
        password: "password123",
      };

      mockUsersRepository.findByEmail.mockResolvedValue(mockUser);
      jest
        .spyOn(bcrypt, "compare")
        .mockImplementation(() => Promise.resolve(true));

      const result = await service.SignIn(signInDto, { t: jest.fn() } as any);

      expect(repository.findByEmail).toHaveBeenCalledWith(signInDto.email);
      expect(result.user.email).toBe(mockUser.email);
      expect(result.tokens).toBeDefined();
    });

    it("should throw UnauthorizedException if password is incorrect", async () => {
      const signInDto: AuthSignInDto = {
        email: "test@example.com",
        password: "wrongpassword",
      };

      mockUsersRepository.findByEmail.mockResolvedValue(mockUser);
      jest
        .spyOn(bcrypt, "compare")
        .mockImplementation(() => Promise.resolve(false));

      await expect(
        service.SignIn(signInDto, { t: jest.fn() } as any),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("forgotPassword", () => {
    it("should send password reset email successfully", async () => {
      const email = "test@example.com";

      mockUsersRepository.findByEmail.mockResolvedValue(mockUser);
      mockUsersRepository.findValidTokenByUserId.mockResolvedValue(null);

      const result = await service.forgotPassword(email);

      expect(repository.findByEmail).toHaveBeenCalledWith(email);
      expect(repository.createUserToken).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it("should throw NotFoundException if user not found", async () => {
      const email = "nonexistent@example.com";
      mockUsersRepository.findByEmail.mockResolvedValue(null);

      await expect(service.forgotPassword(email)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("resetPassword", () => {
    it("should reset password successfully", async () => {
      const token = "valid_token";
      const newPassword = "newPassword123";
      const mockResetToken = { user_id: "1", token: "valid_token" };

      mockUsersRepository.findValidToken.mockResolvedValue(mockResetToken);

      const result = await service.resetPassword(token, newPassword);

      expect(repository.findValidToken).toHaveBeenCalledWith(
        token,
        "reset_password",
      );
      expect(repository.updateUserPassword).toHaveBeenCalledWith(
        "1",
        newPassword,
      );
      expect(repository.markTokenAsUsed).toHaveBeenCalledWith(token);
      expect(result.success).toBe(true);
    });

    it("should throw NotFoundException if token is invalid", async () => {
      mockUsersRepository.findValidToken.mockResolvedValue(null);

      await expect(service.resetPassword("invalid", "pass")).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
