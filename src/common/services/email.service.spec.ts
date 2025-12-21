import { ConfigService } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";

import { User } from "@/auth/schema";

import { EmailService } from "./email.service";

// Mock Resend
jest.mock("resend", () => {
  return {
    Resend: jest.fn().mockImplementation(() => ({
      emails: {
        send: jest.fn().mockResolvedValue({ data: { id: "123" }, error: null }),
      },
    })),
  };
});

// Mock fs
jest.mock("fs", () => ({
  readFileSync: jest
    .fn()
    .mockReturnValue("<html>{{userName}} {{resetLink}}</html>"),
}));

describe("EmailService", () => {
  let service: EmailService;
  let configService: ConfigService;

  const mockUser = {
    id: "1",
    email: "test@example.com",
    name: "Test User",
  } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue("test-key"),
          },
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("sendForgotPasswordEmail", () => {
    it("should send a forgot password email", async () => {
      const resetLink = "http://localhost:3000/reset-password?token=token123";
      const result = await service.sendForgotPasswordEmail(mockUser, resetLink);

      expect(result).toEqual({ data: { id: "123" }, error: null });
      expect(configService.get).toHaveBeenCalledWith("RESEND_API_KEY");
    });
  });
});
