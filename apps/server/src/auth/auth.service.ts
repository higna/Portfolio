import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { UsersService } from '../users/users.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { AuthProvider, UserRole } from '../users/entities/user.entity';
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
    private readonly notificationsService: NotificationsService,
  ) {}

  async signup(dto: SignupDto, file?: any) {
    const recaptchaSecret = this.configService.get<string>('RECAPTCHA_SECRET_KEY');
    if (recaptchaSecret) {
      const isHuman = await verifyRecaptcha(dto.captchaToken, recaptchaSecret);
      if (!isHuman) throw new BadRequestException('Captcha verification failed');
    }

    let uploadedImage: { url: string; public_id: string } | undefined;
    if (file) {
      try {
        uploadedImage = await this.cloudinaryService.uploadAvatar(
          file.buffer,
          file.originalname.split('.')[0],
        );
      } catch {
        throw new BadRequestException('Image upload failed');
      }
    }

    try {
      const existing = await this.usersService.findByEmail(dto.email);
      if (existing) {
        if (uploadedImage) await this.cloudinaryService.deleteImage(uploadedImage.public_id);
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

      // Notify superadmin of new signup
      this.notificationsService.createNotification({
        role: UserRole.SUPERADMIN,
        type: NotificationType.INFO,
        title: 'New user registered',
        message: `${dto.email} just signed up`,
      }).catch(err => this.logger.error(`Notification failed: ${err.message}`));

      this.logger.log(`Verification email sent to ${dto.email}`);
      return { message: 'Registration successful. Please check your email to verify your account.' };
    } catch (error) {
      if (uploadedImage) await this.cloudinaryService.deleteImage(uploadedImage.public_id);
      throw error;
    }
  }

  // ... rest methods unchanged (verifyEmail, resendVerification, login, etc.)
  // For brevity I will include a stubs where necessary.
  async verifyEmail(token: string) {
    const user = await this.usersService.findByVerificationToken(token);
    if (!user) throw new BadRequestException('Invalid or expired verification token');
    await this.usersService.update(user.id, { isVerified: true, verificationToken: null });
    return { message: 'Email verified successfully. You can now log in.' };
  }

  async resendVerification(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new BadRequestException('No account with that email');
    if (user.isVerified) throw new BadRequestException('Email already verified');
    const verificationToken = randomBytes(32).toString('hex');
    await this.usersService.update(user.id, { verificationToken });
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:2000');
    await this.mailService.sendVerificationEmail(email, verificationToken, frontendUrl);
    return { message: 'Verification email resent.' };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.isVerified) throw new UnauthorizedException('Please verify your email before logging in');
    if (!user.password) throw new UnauthorizedException('This account uses Google sign-in. Please log in with Google.');
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');
    const payload = { sub: user.id, email: user.email, role: user.role };
    const access_token = this.jwtService.sign(payload);
    return { access_token };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) return { message: 'If that email exists, a password reset link has been sent.' };
    const resetToken = randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600 * 1000);
    await this.usersService.update(user.id, { passwordResetToken: resetToken, passwordResetExpires: resetExpires });
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:2000');
    await this.mailService.sendPasswordResetEmail(email, resetToken, frontendUrl);
    return { message: 'If that email exists, a password reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.usersService.findByResetToken(token);
    if (!user) throw new BadRequestException('Invalid or expired reset token');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersService.update(user.id, { password: hashedPassword, passwordResetToken: null, passwordResetExpires: null });
    return { message: 'Password reset successful. You can now log in.' };
  }

  async googleLogin(profile: { googleId: string; email: string; fullName: string; picture?: string }) {
    let user = await this.usersService.findByGoogleId(profile.googleId);
    if (!user) {
      user = await this.usersService.findByEmail(profile.email);
      if (user) {
        user.googleId = profile.googleId;
        if (!user.picture && profile.picture) {
          const uploaded = await this.cloudinaryService.uploadAvatarFromUrl(profile.picture);
          if (uploaded) user.picture = uploaded;
        }
        if (!user.fullName) user.fullName = profile.fullName;
        await this.usersService.update(user.id, user);
      } else {
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
      }
    } else {
      if (profile.picture) {
        const uploaded = await this.cloudinaryService.uploadAvatarFromUrl(profile.picture);
        if (uploaded) user.picture = uploaded;
        await this.usersService.update(user.id, { picture: user.picture });
      }
    }
    const payload = { sub: user.id, email: user.email, role: user.role };
    const access_token = this.jwtService.sign(payload);
    return { access_token };
  }
}