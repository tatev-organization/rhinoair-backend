import {
  Controller,
  Post,
  Body,
  Get,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  LoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  RegisterDto,
  VerifyDto,
} from './dto/auth.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new partner company' })
  @ApiResponse({ status: 201, description: 'Company registered. OTP sent.' })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('verify')
  @ApiOperation({ summary: 'Verify company email with OTP' })
  @ApiResponse({ status: 200, description: 'Email verified successfully.' })
  verify(@Body() verifyDto: VerifyDto) {
    return this.authService.verify(verifyDto);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login with company email and password' })
  @ApiResponse({
    status: 200,
    description: 'Returns access and refresh tokens.',
  })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    if (!refreshTokenDto.refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }
    return this.authService.refresh(refreshTokenDto.refreshToken);
  }

  @Public()
  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset code' })
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with code' })
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Get current logged-in partner profile' })
  @ApiResponse({ status: 200, description: 'Current partner company profile.' })
  getProfile(@CurrentUser() partner: { companyId: string }) {
    return this.authService.getProfile(partner.companyId);
  }
}
