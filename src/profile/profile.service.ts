import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import EmailService from "@/common/services/email.service";
import FormatDataService from "@/common/services/format-data.service";
import { TokenService } from "@/common/services/token.service";
import { UserData } from "@/types";
import UsersRepository from "@/auth/user.repository";

import { UpdateProfileDto } from "./dto";
import ProfileRepository from "./profile.repository";

@Injectable()
class ProfileService {
  constructor(
    private profileRepository: ProfileRepository,
    private formatDataService: FormatDataService,
    private usersRepository: UsersRepository,
    private emailService: EmailService,
    private tokenService: TokenService,
    private configService: ConfigService,
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
    const currentProfile = await this.profileRepository.getProfile(id);

    const isEmailChanged =
      updateProfileDto.email && updateProfileDto.email !== currentProfile.email;

    const profile = await this.profileRepository.updateProfile(
      id,
      isEmailChanged
        ? { ...updateProfileDto, email_confirmed: false }
        : updateProfileDto,
    );

    if (isEmailChanged) {
      // Generate confirmation token
      const { token: confirmationToken, expiresAt } =
        this.tokenService.generateToken(24);

      // Save confirmation token to database
      await this.usersRepository.createUserToken(
        profile.id,
        confirmationToken,
        "email_confirmation",
        expiresAt,
      );

      // Create confirmation link
      const confirmationLink = `${this.configService.get("CLIENT_APP_BASE_URL")}/confirm-email?token=${confirmationToken}`;

      // Send email
      await this.emailService.sendConfirmEmail(
        profile,
        confirmationLink,
        false,
      );
    }

    const userData = await this.formatDataService.formatUserData(profile);
    return userData;
  }

  async deleteProfile(id: string): Promise<void> {
    await this.profileRepository.deleteProfile(id);
  }

  async searchUsers(query: string): Promise<UserData[]> {
    const users = await this.profileRepository.searchUsers(query);
    const usersData = await Promise.all(
      users.map(user => this.formatDataService.formatUserData(user)),
    );
    return usersData;
  }
}

export default ProfileService;
