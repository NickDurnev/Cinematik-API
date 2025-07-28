import { Injectable } from "@nestjs/common";

import FormatDataService from "@/common/services/format-data.service";
import { UserData } from "@/types";

import { UpdateProfileDto } from "./dto";
import ProfileRepository from "./profile.repository";

@Injectable()
class ProfileService {
  constructor(
    private profileRepository: ProfileRepository,
    private formatDataService: FormatDataService,
  ) {}

  async getProfile(userId: string): Promise<UserData> {
    const profile = await this.profileRepository.getProfile(userId);

    const userData = await this.formatDataService.formatUserData(profile);
    return userData;
  }

  async updateProfile(
    id: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<UserData> {
    const profile = await this.profileRepository.updateProfile(
      id,
      updateProfileDto,
    );

    const userData = await this.formatDataService.formatUserData(profile);
    return userData;
  }

  async deleteProfile(id: string): Promise<void> {
    await this.profileRepository.deleteProfile(id);
  }
}

export default ProfileService;
