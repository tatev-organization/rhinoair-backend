import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';

export interface AuthPartner {
  companyId: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto) {
    const company = await this.prisma.company.findUnique({
      where: { email: loginDto.email },
    });

    if (!company) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      company.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.company.update({
      where: { companyId: company.companyId },
      data: { lastLoginAt: new Date() },
    });

    return this.generateTokens(company.companyId);
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync<{ sub: string }>(
        refreshToken,
        { secret: this.configService.get('jwt.refreshSecret') },
      );

      const company = await this.prisma.company.findUnique({
        where: { companyId: payload.sub },
      });

      if (!company || company.refreshToken !== refreshToken) {
        throw new UnauthorizedException();
      }

      return this.generateTokens(company.companyId);
    } catch {
      throw new UnauthorizedException();
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const company = await this.prisma.company.findUnique({
      where: { email: forgotPasswordDto.email },
    });

    // Always return success to prevent email enumeration
    if (!company) {
      return { message: 'If that email exists, a reset code has been sent.' };
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.company.update({
      where: { companyId: company.companyId },
      data: { resetToken: code, resetTokenExpires: expires },
    });

    // TODO: send email with code
    return { message: 'If that email exists, a reset code has been sent.' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const company = await this.prisma.company.findUnique({
      where: { email: resetPasswordDto.email },
    });

    if (
      !company ||
      company.resetToken !== resetPasswordDto.code ||
      !company.resetTokenExpires ||
      company.resetTokenExpires < new Date()
    ) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    const hashed = await bcrypt.hash(resetPasswordDto.newPassword, 10);

    await this.prisma.company.update({
      where: { companyId: company.companyId },
      data: { password: hashed, resetToken: null, resetTokenExpires: null },
    });

    return { message: 'Password reset successfully' };
  }

  async getProfile(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { companyId },
    });

    if (!company) throw new NotFoundException('Company not found');

    const {
      password: _p,
      refreshToken: _rt,
      resetToken: _rst,
      resetTokenExpires: _rte,
      ...result
    } = company;
    return result;
  }

  private async generateTokens(companyId: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: companyId },
        {
          secret: this.configService.get('jwt.secret'),
          expiresIn: this.configService.get('jwt.expiresIn'),
        },
      ),
      this.jwtService.signAsync(
        { sub: companyId },
        {
          secret: this.configService.get('jwt.refreshSecret'),
          expiresIn: this.configService.get('jwt.refreshExpiresIn'),
        },
      ),
    ]);

    await this.prisma.company.update({
      where: { companyId },
      data: { refreshToken },
    });

    return { accessToken, refreshToken };
  }
}
