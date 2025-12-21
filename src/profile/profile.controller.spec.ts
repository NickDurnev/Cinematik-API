import { ExecutionContext } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Test, TestingModule } from "@nestjs/testing";
import { I18nService } from "nestjs-i18n";

import { User } from "@/auth/schema";
import { UserData } from "@/types";

import { UpdateProfileDto } from "./dto";
import ProfileController from "./profile.controller";
import ProfilesService from "./profile.service";

// Mock data
const mockUserData: UserData = {
  id: "1",
  name: "Test User",
  email: "test@example.com",
  picture: "https://example.com/avatar.jpg",
  is_left_review: false,
};

const mockUser: User = {
  id: "1",
  name: "Test User",
  email: "test@example.com",
  password: "hashed_password",
  picture: "https://example.com/avatar.jpg",
  created_at: new Date("2023-12-01T10:00:00Z"),
  updated_at: new Date("2023-12-01T10:00:00Z"),
};

// Mock service
const mockProfilesService = {
  getProfile: jest.fn(),
  updateProfile: jest.fn(),
  deleteProfile: jest.fn(),
};

describe("ProfileController", () => {
  let controller: ProfileController;
  let service: ProfilesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [
        {
          provide: ProfilesService,
          useValue: mockProfilesService,
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn((key: string) => key),
          },
        },
      ],
    })
      .overrideGuard(AuthGuard())
      .useValue({
        canActivate: jest.fn((context: ExecutionContext) => {
          const request = context.switchToHttp().getRequest();
          request.user = mockUser;
          return true;
        }),
      })
      .compile();

    controller = module.get<ProfileController>(ProfileController);
    service = module.get<ProfilesService>(ProfilesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getReviews", () => {
    it("should return user profile", async () => {
      mockProfilesService.getProfile.mockResolvedValue(mockUserData);

      const result = await controller.getReviews(mockUser);

      expect(service.getProfile).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(mockUserData);
    });

    it("should handle profile not found", async () => {
      const error = new Error("Profile not found");
      mockProfilesService.getProfile.mockRejectedValue(error);

      await expect(controller.getReviews(mockUser)).rejects.toThrow(
        "Profile not found",
      );
    });
  });

  describe("updateReviewById", () => {
    it("should update user profile", async () => {
      const updateDto: UpdateProfileDto = {
        name: "Updated Name",
        email: "updated@example.com",
      };
      const updatedProfile = { ...mockUserData, ...updateDto };
      mockProfilesService.updateProfile.mockResolvedValue(updatedProfile);

      const result = await controller.updateReviewById(updateDto, mockUser);

      expect(service.updateProfile).toHaveBeenCalledWith(
        mockUser.id,
        updateDto,
      );
      expect(result).toEqual(updatedProfile);
    });

    it("should handle profile not found during update", async () => {
      const updateDto: UpdateProfileDto = {
        name: "Updated Name",
        email: "updated@example.com",
      };
      const error = new Error("Profile not found");
      mockProfilesService.updateProfile.mockRejectedValue(error);

      await expect(
        controller.updateReviewById(updateDto, mockUser),
      ).rejects.toThrow("Profile not found");
    });

    it("should handle validation errors", async () => {
      const updateDto = {
        name: "", // Invalid empty name
      };
      const error = new Error("Validation failed");
      mockProfilesService.updateProfile.mockRejectedValue(error);

      await expect(
        controller.updateReviewById(updateDto as any, mockUser),
      ).rejects.toThrow("Validation failed");
    });
  });

  describe("deleteReviewById", () => {
    it("should delete user profile", async () => {
      mockProfilesService.deleteProfile.mockResolvedValue(undefined);

      await controller.deleteReviewById(mockUser);

      expect(service.deleteProfile).toHaveBeenCalledWith(mockUser.id);
    });

    it("should handle profile not found during deletion", async () => {
      const error = new Error("Profile not found");
      mockProfilesService.deleteProfile.mockRejectedValue(error);

      await expect(controller.deleteReviewById(mockUser)).rejects.toThrow(
        "Profile not found",
      );
    });
  });
});
