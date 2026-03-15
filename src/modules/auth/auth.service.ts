import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegistrationDto, LoginDto } from './dto/auth.dto';
import { MailService } from '../mail/mail.service';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/database/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
    private prismaService:PrismaService
  ) {}

  async register(registrationDto: RegistrationDto) {
    const existingUser = await this.usersService.findByEmail(
      registrationDto.email,
    );
    if (existingUser) {
      throw new ConflictException('User with that email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(registrationDto.password, salt);
    const token = randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(token, salt);

    const userCreateData: Prisma.UserCreateInput = {
      email: registrationDto.email,
      password_hash,
      emailVerificationToken: tokenHash,
      emailVerificationExpires: new Date(Date.now() + 900000),
      role: 'USER',
      profile: {
        create: {
          first_name: registrationDto.firstName,
          last_name: registrationDto.lastName,
          phone: registrationDto.phone,
        },
      },
    };

    const user = await this.usersService.createUser(userCreateData);

     const verificationLink =
    `http://localhost:3000/auth/verify-email?token=${token}`;

    this.mailService.sendWelcomeEmail(user.email, verificationLink);

    const tokens = await this.generateTokens(user.id, user.role);
    console.log(tokens);
    return tokens
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isEmailVerified) {
        throw new UnauthorizedException('Please verify your email first');
     }

    const isMatch = await bcrypt.compare(loginDto.password, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user.id, user.role);
  }

  async refreshTokens(userId: string, role: string) {
    return this.generateTokens(userId, role);
  }

private async generateTokens(userId: string, role: string) {
  const payload = { sub: userId, role };

  const accessSecret = this.configService.get<string>('JWT_ACCESS_SECRET');
  const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');

  if (!accessSecret || !refreshSecret) {
    throw new Error('JWT secrets are not defined in environment variables');
  }

  const [accessToken, refreshToken] = await Promise.all([
    this.jwtService.signAsync(payload, {
      secret: accessSecret,
      expiresIn: '15m',
    }),
    this.jwtService.signAsync(payload, {
      secret: refreshSecret,
      expiresIn: '7d',
    }),
  ]);

  return {
    accessToken,
    refreshToken,
    user: { id: userId, role },
  };
}

async verifyEmail(token: string) {

    const user = await this.prismaService.user.findFirst({
        where: {
        emailVerificationToken: token,
        emailVerificationExpires: { gt: new Date() },
        },
    });

    if (!user) throw new BadRequestException('Invalid token');

    if (!user.emailVerificationExpires ||
         user.emailVerificationExpires < new Date()) {
        throw new BadRequestException('Invalid or expired token');
    }

    await this.prismaService.user.update({
        where: { id: user.id },
        data: {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
        },
    });

    return { message: 'Email verified successfully' };
    }

 async forgotPassword(email: string) {

    const user = await this.usersService.findByEmail(email);

    if (!user) {
        return { message: 'If this email exists, a reset link was sent' };
    }
    const salt = await bcrypt.genSalt(10);
    const token = randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(token, salt)

    await this.prismaService.user.update({
        where: { email },
        data: {
        resetPasswordToken: tokenHash,
        resetPasswordExpires: new Date(Date.now() + 1000 * 60 * 30)
        },
    });

    const resetLink =
        `http://localhost:5173/reset-password?token=${token}`;

       this.mailService.forgetPasswordEmail(email, resetLink);

    return { message: 'Password reset email sent'};
    }


  async resetPassword(
    token: string,
    password: string,
    confirmPassword: string
    ) {

    if (password !== confirmPassword) {
        throw new BadRequestException('Passwords do not match');
    }

    const user = await this.prismaService.user.findFirst({
        where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
            gt: new Date(),
        },
        },
    });

    if (!user) {
        throw new BadRequestException('Invalid or expired token');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await this.prismaService.user.update({
        where: { id: user.id },
        data: {
        password_hash: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        },
    });

    return {
        message: 'Password reset successful',
    };
    }
}
