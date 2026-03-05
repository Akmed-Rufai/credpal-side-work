import {
  Controller,
  Post,
  Body,
  UsePipes,
  HttpCode,
  HttpStatus,
  Res,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  RegistrationSchema,
  RegistrationDto,
  LoginSchema,
  LoginDto,
} from './dto/auth.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UsePipes(new ZodValidationPipe(RegistrationSchema))
  async register(
    @Body() registrationDto: RegistrationDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, user } =
      await this.authService.register(registrationDto);
    this.setCookies(res, accessToken, refreshToken);
    return user;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(LoginSchema))
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, user } =
      await this.authService.login(loginDto);
    this.setCookies(res, accessToken, refreshToken);
    return user;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt-refresh'))
  async refresh(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken, user } =
      await this.authService.refreshTokens(req.user.sub, req.user.role);
    this.setCookies(res, accessToken, refreshToken);
    return user;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    res.cookie('Authentication', '', { maxAge: 0, httpOnly: true });
    res.cookie('Refresh', '', { maxAge: 0, httpOnly: true });
    return { success: true };
  }

  private setCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie('Authentication', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('Refresh', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
}
