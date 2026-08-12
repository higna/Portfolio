import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { UsersService } from '../users/users.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { MailService } from '../mail/mail.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { User, AuthProvider } from '../users/entities/user.entity';
import { verifyRecaptcha } from './recaptcha';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly mailService: MailService,
  ) { }

  async signup(dto: SignupDto, file?: any) {
    const recaptchaSecret = this.configService.get<string>('RECAPTCHA_SECRET_KEY');
    if (recaptchaSecret) {
      const isHuman = await verifyRecaptcha(dto.captchaToken, recaptchaSecret);
      this.logger.log(`Captcha verification result: ${isHuman}`);
      if (!isHuman) {
        throw new BadRequestException('Captcha verification failed');
      }
    }

    let uploadedImage: { url: string; public_id: string } | undefined;
    if (file) {
      try {
        uploadedImage = await this.cloudinaryService.uploadAvatar(
          file.buffer,
          file.originalname.split('.')[0],
        );
      } catch (error) {
        throw new BadRequestException('Image upload failed');
      }
    }

    try {
      const existing = await this.usersService.findByEmail(dto.email);
      if (existing) {
        if (uploadedImage) {
          await this.cloudinaryService.deleteImage(uploadedImage.public_id);
        }
        throw new BadRequestException('Email already registered');
      }

      const hashedPassword = await bcrypt.hash(dto.password, 10);
      const verificationToken = randomBytes(32).toString('hex');

      const user = await this.usersService.create({
        email: dto.email,
        password: hashedPassword,
        fullName: dto.fullName,
        picture: uploadedImage?.url || dto.picture,
        authProvider: AuthProvider.LOCAL,
      });
      user.verificationToken = verificationToken;
      await this.usersService.update(user.id, { verificationToken });

      const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:2000');
      await this.mailService.sendVerificationEmail(dto.email, verificationToken, frontendUrl);

      this.logger.log(`Verification email sent to ${dto.email}`);
      return { message: 'Registration successful. Please check your email to verify your account.' };
    } catch (error) {
      if (uploadedImage) {
        await this.cloudinaryService.deleteImage(uploadedImage.public_id);
      }
      throw error;
    }
  }

  async verifyEmail(token: string) {
    const user = await this.usersService.findByVerificationToken(token);
    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }
    await this.usersService.update(user.id, {
      isVerified: true,
      verificationToken: null,
    });
    return { message: 'Email verified successfully. You can now log in.' };
  }

  async resendVerification(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('No account with that email');
    }
    if (user.isVerified) {
      throw new BadRequestException('Email already verified');
    }
    const verificationToken = randomBytes(32).toString('hex');
    await this.usersService.update(user.id, { verificationToken });

    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:2000');
    await this.mailService.sendVerificationEmail(email, verificationToken, frontendUrl);

    this.logger.log(`Resent verification email to ${email}`);
    return { message: 'Verification email resent.' };
  }

  async login(dto: LoginDto) {
    const recaptchaSecret = this.configService.get<string>('RECAPTCHA_SECRET_KEY');
    if (recaptchaSecret && dto.captchaToken) {
      const isHuman = await verifyRecaptcha(dto.captchaToken, recaptchaSecret);
      if (!isHuman) {
        throw new UnauthorizedException('Captcha verification failed');
      }
    }
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.isVerified) {
      throw new UnauthorizedException('Please verify your email before logging in');
    }
    if (!user.password) {
      throw new UnauthorizedException('This account uses Google sign-in. Please log in with Google.');
    }
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = { sub: user.id, email: user.email, role: user.role };
    const access_token = this.jwtService.sign(payload);
    return { access_token };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return { message: 'If that email exists, a password reset link has been sent.' };
    }
    const resetToken = randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600 * 1000);
    await this.usersService.update(user.id, {
      passwordResetToken: resetToken,
      passwordResetExpires: resetExpires,
    });

    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:2000');
    await this.mailService.sendPasswordResetEmail(email, resetToken, frontendUrl);

    this.logger.log(`Password reset email sent to ${email}`);
    return { message: 'If that email exists, a password reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.usersService.findByResetToken(token);
    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersService.update(user.id, {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
    });
    return { message: 'Password reset successful. You can now log in.' };
  }

  async googleLogin(profile: {
    googleId: string;
    email: string;
    fullName: string;
    picture?: string;
  }) {
    let user = await this.usersService.findByGoogleId(profile.googleId);

    if (!user) {
      // ---- New Google user: create account + upload picture once ----
      let pictureUrl: string | null = null;
      if (profile.picture) {
        const uploaded = await this.cloudinaryService.uploadAvatarFromUrl(profile.picture);
        if (uploaded) pictureUrl = uploaded;
      }
      user = await this.usersService.create({
        email: profile.email,
        fullName: profile.fullName,
        googleId: profile.googleId,
        picture: pictureUrl,
        authProvider: AuthProvider.GOOGLE,
        isVerified: true,
      });
    } else {
      // ---- Existing user: do NOT re‑upload picture on every login ----
      const updates: Partial<User> = {};
      if (!user.fullName) {
        updates.fullName = profile.fullName;
      }
      // Only upload if the user somehow has no picture yet (very rare)
      if (!user.picture && profile.picture) {
        const uploaded = await this.cloudinaryService.uploadAvatarFromUrl(profile.picture);
        if (uploaded) updates.picture = uploaded;
      }
      if (Object.keys(updates).length > 0) {
        await this.usersService.update(user.id, updates);
      }
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const access_token = this.jwtService.sign(payload);
    return { access_token };
  }

  /*
   * Cron job: runs every hour, deletes unverified users older than 2 days.
   * Also deletes their Cloudinary avatar if present.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupUnverifiedUsers() {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const staleUsers = await this.usersService.findUnverifiedBefore(twoDaysAgo);

    for (const user of staleUsers) {
      if (user.picture) {
        const publicId = this.extractCloudinaryPublicId(user.picture);
        if (publicId) {
          await this.cloudinaryService.deleteImage(publicId);
        }
      }
      await this.usersService.remove(user.id);
      this.logger.log(`Deleted unverified user ${user.email}`);
    }
  }

  private extractCloudinaryPublicId(url: string): string | null {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.\w+$/);
    return match ? match[1] : null;
  }
}