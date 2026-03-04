import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegistrationDto, LoginDto } from './dto/auth.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

    async register(registrationDto: RegistrationDto) {
        const existingUser = await this.usersService.findByEmail(registrationDto.email);
        if (existingUser) {
            throw new ConflictException('User with that email already exists');
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(registrationDto.password, salt);

        const userCreateData: Prisma.UserCreateInput = {
            email: registrationDto.email,
            password_hash,
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

        return this.generateTokens(user.id, user.role);
    }

    async login(loginDto: LoginDto) {
        const user = await this.usersService.findByEmail(loginDto.email);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
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

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
                expiresIn: '15m',
            }),
            this.jwtService.signAsync(payload, {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
                expiresIn: '7d',
            }),
        ]);

        return {
            accessToken,
            refreshToken,
            user: { id: userId, role },
        };
    }
}