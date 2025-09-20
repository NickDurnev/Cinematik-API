import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import EmailService from './email.service';
import UsersRepository from '@/auth/user.repository';

describe('EmailService', () => {
  let service: EmailService;
  let usersRepository: UsersRepository;

  const mockUsersRepository = {
    findByEmail: jest.fn(),
    createPasswordResetToken: jest.fn(),
    findValidPasswordResetToken: jest.fn(),
    markPasswordResetTokenAsUsed: jest.fn(),
    updateUserPassword: jest.fn(),
    deleteExpiredPasswordResetTokens: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: UsersRepository,
          useValue: mockUsersRepository,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    usersRepository = module.get<UsersRepository>(UsersRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendForgotPasswordEmail', () => {
    it('should send password reset email for existing user', async () => {
      const email = 'test@example.com';
      const mockUser = {
        id: 'user-id',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed-password',
        picture: '',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockUsersRepository.findByEmail.mockResolvedValue(mockUser);
      mockUsersRepository.createPasswordResetToken.mockResolvedValue({
        id: 'token-id',
        user_id: 'user-id',
        token: 'reset-token',
        expires_at: new Date(),
        used: 'false',
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Mock Resend
      const mockResend = {
        emails: {
          send: jest.fn().mockResolvedValue({ id: 'email-id' }),
        },
      };
      jest.doMock('resend', () => ({
        Resend: jest.fn().mockImplementation(() => mockResend),
      }));

      const result = await service.sendForgotPasswordEmail(email);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Password reset email sent successfully.');
      expect(mockUsersRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(mockUsersRepository.createPasswordResetToken).toHaveBeenCalled();
    });

    it('should return success message for non-existing user (security)', async () => {
      const email = 'nonexistent@example.com';

      mockUsersRepository.findByEmail.mockResolvedValue(null);

      const result = await service.sendForgotPasswordEmail(email);

      expect(result.success).toBe(true);
      expect(result.message).toBe('If an account with that email exists, a password reset link has been sent.');
      expect(mockUsersRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(mockUsersRepository.createPasswordResetToken).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      const token = 'valid-token';
      const newPassword = 'NewPassword123!';
      const mockResetToken = {
        id: 'token-id',
        user_id: 'user-id',
        token: 'valid-token',
        expires_at: new Date(Date.now() + 3600000), // 1 hour from now
        used: 'false',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockUsersRepository.findValidPasswordResetToken.mockResolvedValue(mockResetToken);
      mockUsersRepository.updateUserPassword.mockResolvedValue({
        id: 'user-id',
        name: 'Test User',
        email: 'test@example.com',
        password: 'new-hashed-password',
        picture: '',
        created_at: new Date(),
        updated_at: new Date(),
      });
      mockUsersRepository.markPasswordResetTokenAsUsed.mockResolvedValue(undefined);

      const result = await service.resetPassword(token, newPassword);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Password reset successfully.');
      expect(mockUsersRepository.findValidPasswordResetToken).toHaveBeenCalledWith(token);
      expect(mockUsersRepository.updateUserPassword).toHaveBeenCalledWith('user-id', newPassword);
      expect(mockUsersRepository.markPasswordResetTokenAsUsed).toHaveBeenCalledWith(token);
    });

    it('should throw NotFoundException for invalid token', async () => {
      const token = 'invalid-token';
      const newPassword = 'NewPassword123!';

      mockUsersRepository.findValidPasswordResetToken.mockResolvedValue(null);

      await expect(service.resetPassword(token, newPassword)).rejects.toThrow(NotFoundException);
      expect(mockUsersRepository.findValidPasswordResetToken).toHaveBeenCalledWith(token);
      expect(mockUsersRepository.updateUserPassword).not.toHaveBeenCalled();
      expect(mockUsersRepository.markPasswordResetTokenAsUsed).not.toHaveBeenCalled();
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should cleanup expired tokens', async () => {
      mockUsersRepository.deleteExpiredPasswordResetTokens.mockResolvedValue(undefined);

      await service.cleanupExpiredTokens();

      expect(mockUsersRepository.deleteExpiredPasswordResetTokens).toHaveBeenCalled();
    });
  });

  describe('generateResetToken', () => {
    it('should generate a random token', () => {
      const token1 = (service as any).generateResetToken();
      const token2 = (service as any).generateResetToken();

      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
      expect(token1).not.toBe(token2);
      expect(token1.length).toBe(64); // 32 bytes = 64 hex characters
      expect(token2.length).toBe(64);
    });
  });

  describe('createForgotPasswordEmailTemplate', () => {
    it('should create email template with user name and reset link', () => {
      const userName = 'John Doe';
      const resetLink = 'https://example.com/reset?token=abc123';

      const template = (service as any).createForgotPasswordEmailTemplate(userName, resetLink);

      expect(template).toContain(userName);
      expect(template).toContain(resetLink);
      expect(template).toContain('Reset Your Password - Cinematik');
      expect(template).toContain('🎬 Cinematik');
      expect(template).toContain('This link will expire in 1 hour');
    });
  });
}); 