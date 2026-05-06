import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto, VerificationDto } from './dto/auth.dto';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
    private prisma: PrismaService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    const user = await this.usersService.create({
      ...registerDto,
      otp,
    } as any);

    await this.mailService.sendVerificationCode(user.email, otp.toString());

    return { message: 'Registration successful. Please check your email for the verification code.' };
  }

  async verify(verificationDto: VerificationDto) {
    const user = await this.usersService.findByEmail(verificationDto.email);
    if (!user || user.otp !== parseInt(verificationDto.code, 10)) {
      throw new BadRequestException('Invalid verification code');
    }

    await this.usersService.update(user.userId, {
      isVerified: true,
      otp: null,
    } as any);

    return { message: 'Email verified successfully' };
  }

  async login(loginDto: LoginDto) {
    let user: any = await this.usersService.findByEmail(loginDto.email);
    let role = 'USER';

    if (!user) {
      // Check Admin table
      user = await this.prisma.admin.findUnique({ where: { email: loginDto.email } });
      if (user) role = user.role;
    }

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // For regular users, check verification
    if (role === 'USER' && !user.isVerified) {
       throw new UnauthorizedException('Email not verified');
    }

    const isPasswordValid = await this.usersService.verifyPassword(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user.userId || user.adminId, user.email, role);
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get('jwt.refreshSecret'),
      });

      const user = await this.usersService.findOne(payload.sub);
      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedException();
      }

      return this.generateTokens(user.userId, user.email, user.role as any);
    } catch (e) {
      throw new UnauthorizedException();
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(forgotPasswordDto.email);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 10);

    await this.usersService.update(user.userId, {
      resetToken: code,
      resetTokenExpires: expiry,
    } as any);

    await this.mailService.sendPasswordReset(user.email, code);

    return { message: 'Password reset code sent to your email' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.usersService.findByEmail(resetPasswordDto.email);
    if (!user || user.resetToken !== resetPasswordDto.code || !user.resetTokenExpires || user.resetTokenExpires < new Date()) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    await this.usersService.update(user.userId, {
      password: resetPasswordDto.newPassword,
      resetToken: null,
      resetTokenExpires: null,
    } as any);

    return { message: 'Password reset successful' };
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email, role },
        {
          secret: this.configService.get('jwt.secret'),
          expiresIn: this.configService.get('jwt.expiresIn'),
        },
      ),
      this.jwtService.signAsync(
        { sub: userId },
        {
          secret: this.configService.get('jwt.refreshSecret'),
          expiresIn: this.configService.get('jwt.refreshExpiresIn'),
        },
      ),
    ]);

    await this.usersService.update(userId, { refreshToken } as any);

    return {
      accessToken,
      refreshToken,
    };
  }
}
