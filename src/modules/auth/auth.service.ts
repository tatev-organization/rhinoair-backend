import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import {
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  RegisterDto,
  VerifyDto,
  ChangePasswordDto,
} from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { MailService } from '../mail/mail.service';
import { ServiceTitanService } from '../service-titan/service-titan.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
    private stService: ServiceTitanService,
  ) {}

  // ── Register ─────────────────────────────────────────────────────────
  async register(registerDto: RegisterDto) {
    // Check if email already exists
    const existing = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });
    if (existing) {
      throw new BadRequestException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const fullAddress = `${registerDto.street}, ${registerDto.city}, ${registerDto.state} ${registerDto.zip}`;

    // Create Company first (business profile)
    const company = await this.prisma.company.create({
      data: {
        name: registerDto.name,
        address: fullAddress,
        contactName: registerDto.name,
      },
    });

    // Create User (authentication entity) linked to the Company
    await this.prisma.user.create({
      data: {
        email: registerDto.email,
        password: hashedPassword,
        name: registerDto.name,
        phone: registerDto.phone,
        role: 'PARTNER',
        companyId: company.companyId,
        otp,
        isVerified: true, // Bypass verification
      },
    });

    // await this.mailService.sendVerificationCode(registerDto.email, otp);

    return {
      message:
        'Registration successful. You can now login.',
    };
  }

  // ── Verify Email ─────────────────────────────────────────────────────
  async verify(verifyDto: VerifyDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: verifyDto.email },
    });

    if (!user) {
      throw new BadRequestException('Invalid request');
    }

    if (user.isVerified) {
      throw new BadRequestException('Email is already verified');
    }

    if (user.otp !== verifyDto.otp) {
      throw new BadRequestException('Invalid verification code');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, otp: null },
    });

    return { message: 'Email verified successfully. You can now login.' };
  }

  // ── Login ────────────────────────────────────────────────────────────
  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // if (!user.isVerified) {
    //   throw new UnauthorizedException('Please verify your email first.');
    // }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(
      user.id,
      user.role,
      user.companyId,
    );

    return {
      ...tokens,
      role: user.role,
      companyId: user.companyId,
    };
  }

  // ── Refresh Token ────────────────────────────────────────────────────
  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        role: string;
        companyId: string | null;
      }>(refreshToken, {
        secret: this.configService.get('jwt.refreshSecret'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedException();
      }

      return this.generateTokens(user.id, user.role, user.companyId);
    } catch {
      throw new UnauthorizedException();
    }
  }

  // ── Forgot Password ─────────────────────────────────────────────────
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: forgotPasswordDto.email },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return { message: 'If that email exists, a reset code has been sent.' };
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetToken: code, resetTokenExpires: expires },
    });

    // TODO: send email with code
    return { message: 'If that email exists, a reset code has been sent.' };
  }

  // ── Reset Password ──────────────────────────────────────────────────
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: resetPasswordDto.email },
    });

    if (
      !user ||
      user.resetToken !== resetPasswordDto.code ||
      !user.resetTokenExpires ||
      user.resetTokenExpires < new Date()
    ) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    const hashed = await bcrypt.hash(resetPasswordDto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, resetToken: null, resetTokenExpires: null },
    });

    return { message: 'Password reset successfully' };
  }

  // ── Get Profile ──────────────────────────────────────────────────────
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { company: { include: { stCustomers: true } } },
    });

    if (!user) throw new NotFoundException('User not found');

    // Strip sensitive fields
    const {
      password: _p,
      refreshToken: _rt,
      resetToken: _rst,
      resetTokenExpires: _rte,
      otp: _otp,
      ...safeUser
    } = user;

    return safeUser;
  }

  // ── Change Password ──────────────────────────────────────────────────
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Incorrect current password');
    }

    const hashedNewPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    return { message: 'Password changed successfully' };
  }

  // ── Generate Tokens ──────────────────────────────────────────────────
  private async generateTokens(
    userId: string,
    role: string,
    companyId: string | null,
  ) {
    const tokenPayload = { sub: userId, role, companyId };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(tokenPayload, {
        secret: this.configService.get('jwt.secret'),
        expiresIn: this.configService.get('jwt.expiresIn'),
      }),
      this.jwtService.signAsync(tokenPayload, {
        secret: this.configService.get('jwt.refreshSecret'),
        expiresIn: this.configService.get('jwt.refreshExpiresIn'),
      }),
    ]);

    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken },
    });

    return { accessToken, refreshToken };
  }
}
