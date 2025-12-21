import { Test, TestingModule } from "@nestjs/testing";
import { I18nService } from "nestjs-i18n";

import { User } from "@/auth/schema";
import FormatDataService from "@/common/services/format-data.service";
import { UserData } from "@/types";

import { UpdateProfileDto } from "./dto";
import ProfileRepository from "./profile.repository";
import ProfileService from "./profile.service";

// Mock data
const mockUser: User = {
  id: "1",
  name: "Test User",
  email: "test@example.com",
  password: "hashed_password",
  picture: "https://example.com/avatar.jpg",
  created_at: new Date("2023-12-01T10:00:00Z"),
  updated_at: new Date("2023-12-01T10:00:00Z"),
};

const mockUserData: UserData = {
  id: "1",
  name: "Test User",
  email: "test@example.com",
  picture: "https://example.com/avatar.jpg",
  is_left_review: false,
};

// Mock repository
const mockProfileRepository = {
  getProfile: jest.fn(),
  updateProfile: jest.fn(),
  deleteProfile: jest.fn(),
};

// Mock format data service
const mockFormatDataService = {
  formatUserData: jest.fn(),
};

describe("ProfileService", () => {
  let service: ProfileService;
  let repository: ProfileRepository;
  let formatDataService: FormatDataService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        {
          provide: ProfileRepository,
          useValue: mockProfileRepository,
        },
        {
          provide: FormatDataService,
          useValue: mockFormatDataService,
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn((key: string) => key),
          },
        },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
    repository = module.get<ProfileRepository>(ProfileRepository);
    formatDataService = module.get<FormatDataService>(FormatDataService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getProfile", () => {
    it("should return formatted user data", async () => {
      const userId = "1";

      mockProfileRepository.getProfile.mockResolvedValue(mockUser);
      mockFormatDataService.formatUserData.mockResolvedValue(mockUserData);

      const result = await service.getProfile(userId);

      expect(repository.getProfile).toHaveBeenCalledWith(userId);
      expect(formatDataService.formatUserData).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUserData);
    });

    it("should handle profile not found", async () => {
      const userId = "999";

      mockProfileRepository.getProfile.mockRejectedValue(
        new Error("Profile not found"),
      );

      await expect(service.getProfile(userId)).rejects.toThrow(
        "Profile not found",
      );
    });
  });

  describe("updateProfile", () => {
    it("should update and return formatted user data", async () => {
      const userId = "1";
      const updateDto: UpdateProfileDto = {
        name: "Updated Name",
        email: "updated@example.com",
      };
      const updatedUser = { ...mockUser, name: updateDto.name };
      const updatedUserData = { ...mockUserData, name: updateDto.name };

      mockProfileRepository.updateProfile.mockResolvedValue(updatedUser);
      mockFormatDataService.formatUserData.mockResolvedValue(updatedUserData);

      const result = await service.updateProfile(userId, updateDto);

      expect(repository.updateProfile).toHaveBeenCalledWith(userId, updateDto);
      expect(formatDataService.formatUserData).toHaveBeenCalledWith(
        updatedUser,
      );
      expect(result).toEqual(updatedUserData);
    });

    it("should handle profile not found during update", async () => {
      const userId = "999";
      const updateDto: UpdateProfileDto = {
        name: "Updated Name",
        email: "updated@example.com",
      };

      mockProfileRepository.updateProfile.mockRejectedValue(
        new Error("Profile not found"),
      );

      await expect(service.updateProfile(userId, updateDto)).rejects.toThrow(
        "Profile not found",
      );
    });
  });

  describe("deleteProfile", () => {
    it("should delete profile", async () => {
      const userId = "1";

      mockProfileRepository.deleteProfile.mockResolvedValue(undefined);

      await service.deleteProfile(userId);

      expect(repository.deleteProfile).toHaveBeenCalledWith(userId);
    });

    it("should handle profile not found during deletion", async () => {
      const userId = "999";

      mockProfileRepository.deleteProfile.mockRejectedValue(
        new Error("Profile not found"),
      );

      await expect(service.deleteProfile(userId)).rejects.toThrow(
        "Profile not found",
      );
    });
  });
});
