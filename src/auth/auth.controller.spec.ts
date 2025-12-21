import { Test, TestingModule } from "@nestjs/testing";
import { I18nService } from "nestjs-i18n";

import { AuthData, ResponseCode, TokensData } from "@/types";
import { buildResponse } from "@/utils/response/response-wrapper";

import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import {
  AuthCredentialsDto,
  AuthSignInDto,
  AuthSocialDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from "./dto/auth-credentials.dto";

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
const mockUserData = {
  id: "1",
  name: "Test User",
  email: "test@example.com",
  picture: "https://example.com/avatar.jpg",
  is_left_review: false,
};

const mockTokensData: TokensData = {
  access_token: "access_token",
  refresh_token: "refresh_token",
  access_token_expires: 3600,
  refresh_token_expires: 604800,
};

const mockAuthData: AuthData = {
  user: mockUserData,
  tokens: mockTokensData,
};

// Mock service
const mockAuthService = {
  SignUp: jest.fn(),
  SignIn: jest.fn(),
  socialLogin: jest.fn(),
  refreshAccessToken: jest.fn(),
  forgotPassword: jest.fn(),
  resetPassword: jest.fn(),
};

describe("AuthController", () => {
  let controller: AuthController;
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn((key: string) => key),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("signUp", () => {
    it("should register a new user successfully", async () => {
      const signUpDto: AuthCredentialsDto = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      };

      mockAuthService.SignUp.mockResolvedValue(mockAuthData);

      const result = await controller.signUp(signUpDto);

      expect(service.SignUp).toHaveBeenCalledWith(signUpDto);
      expect(result).toEqual(
        buildResponse({
          data: mockAuthData,
          code: ResponseCode.OK,
          message: "auth.signUpSuccessMessage",
        }),
      );
    });
  });

  describe("signIn", () => {
    it("should sign in a user successfully", async () => {
      const signInDto: AuthSignInDto = {
        email: "test@example.com",
        password: "password123",
      };

      const mockI18nService = {
        t: jest.fn((key: string) => key),
      } as any;

      mockAuthService.SignIn.mockResolvedValue(mockAuthData);

      const result = await controller.signIn(signInDto, mockI18nService);

      expect(service.SignIn).toHaveBeenCalledWith(signInDto, mockI18nService);
      expect(result).toEqual(
        buildResponse({
          data: mockAuthData,
          code: ResponseCode.OK,
          message: "auth.signInSuccessMessage",
        }),
      );
    });
  });

  describe("socialLogin", () => {
    it("should handle social login successfully", async () => {
      const socialDto: AuthSocialDto = {
        name: "Google User",
        email: "googleuser@example.com",
        picture: "https://google.com/picture.jpg",
      };

      mockAuthService.socialLogin.mockResolvedValue(mockAuthData);

      const result = await controller.socialLogin(socialDto);

      expect(service.socialLogin).toHaveBeenCalledWith(socialDto);
      expect(result).toEqual(
        buildResponse({
          data: mockAuthData,
          code: ResponseCode.OK,
          message: "auth.socialLoginSuccessMessage",
        }),
      );
    });
  });

  describe("refresh", () => {
    it("should refresh access token successfully", async () => {
      const refreshToken = "valid_refresh_token";
      const refreshData = {
        access_token: "new_access_token",
        access_token_expires: 3600,
      };

      mockAuthService.refreshAccessToken.mockResolvedValue(refreshData);

      const result = await controller.refresh(refreshToken);

      expect(service.refreshAccessToken).toHaveBeenCalledWith(refreshToken);
      expect(result).toEqual(
        buildResponse({
          data: refreshData,
          code: ResponseCode.OK,
          message: "auth.accessTokenRefreshed",
        }),
      );
    });
  });

  describe("forgotPassword", () => {
    it("should send password reset email successfully", async () => {
      const forgotDto: ForgotPasswordDto = {
        email: "test@example.com",
      };
      const resetResponse = {
        success: true,
        message: "auth.passwordResetSuccessMessage",
      };

      mockAuthService.forgotPassword.mockResolvedValue(resetResponse);

      const result = await controller.forgotPassword(forgotDto);

      expect(service.forgotPassword).toHaveBeenCalledWith(forgotDto.email);
      expect(result).toEqual(
        buildResponse({
          data: resetResponse,
          code: ResponseCode.OK,
          message: "auth.passwordResetSuccessMessage",
        }),
      );
    });
  });

  describe("resetPassword", () => {
    it("should reset password successfully", async () => {
      const resetDto: ResetPasswordDto = {
        token: "valid_reset_token",
        newPassword: "newpassword123",
      };
      const resetResponse = {
        success: true,
        message: "auth.resetPasswordSuccessMessage",
      };

      mockAuthService.resetPassword.mockResolvedValue(resetResponse);

      const result = await controller.resetPassword(resetDto);

      expect(service.resetPassword).toHaveBeenCalledWith(
        resetDto.token,
        resetDto.newPassword,
      );
      expect(result).toEqual(
        buildResponse({
          data: resetResponse,
          code: ResponseCode.OK,
          message: "auth.resetPasswordSuccessMessage",
        }),
      );
    });
  });
});
