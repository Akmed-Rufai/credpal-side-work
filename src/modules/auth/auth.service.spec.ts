import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
    let service: AuthService;
    let usersService: UsersService;
    let jwtService: JwtService;

    const mockUsersService = {
        findByEmail: jest.fn(),
        createUser: jest.fn(),
    };

    const mockJwtService = {
        signAsync: jest.fn(),
    };

    const mockConfigService = {
        get: jest.fn((key) => {
            if (key === 'JWT_ACCESS_SECRET') return 'access_secret';
            if (key === 'JWT_REFRESH_SECRET') return 'refresh_secret';
            return null;
        }),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: UsersService, useValue: mockUsersService },
                { provide: JwtService, useValue: mockJwtService },
                { provide: ConfigService, useValue: mockConfigService },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        usersService = module.get<UsersService>(UsersService);
        jwtService = module.get<JwtService>(JwtService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('register', () => {
        it('should throw ConflictException if user already exists', async () => {
            mockUsersService.findByEmail.mockResolvedValue({ id: '1' });
            await expect(
                service.register({ email: 'test@test.com', password: 'password', firstName: 'Test', lastName: 'User' })
            ).rejects.toThrow(ConflictException);
        });

        it('should successfully register a new user and return tokens', async () => {
            mockUsersService.findByEmail.mockResolvedValue(null);
            mockUsersService.createUser.mockResolvedValue({ id: 'u-1', role: 'USER' });
            mockJwtService.signAsync.mockResolvedValueOnce('access-token').mockResolvedValueOnce('refresh-token');
            (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');

            const result = await service.register({
                email: 'new@user.com',
                password: 'password123',
                firstName: 'New',
                lastName: 'User',
            });

            expect(usersService.createUser).toHaveBeenCalledWith(
                expect.objectContaining({
                    email: 'new@user.com',
                    password_hash: 'hashed_password',
                })
            );
            expect(result).toEqual({
                accessToken: 'access-token',
                refreshToken: 'refresh-token',
                user: { id: 'u-1', role: 'USER' },
            });
        });
    });

    describe('login', () => {
        it('should throw UnauthorizedException for invalid email', async () => {
            mockUsersService.findByEmail.mockResolvedValue(null);
            await expect(service.login({ email: 'wrong@email.com', password: 'password' })).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException for invalid password', async () => {
            mockUsersService.findByEmail.mockResolvedValue({ id: 'u-1', email: 'test@email.com', password_hash: 'hash' });
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(service.login({ email: 'test@email.com', password: 'wrongpassword' })).rejects.toThrow(UnauthorizedException);
        });

        it('should return tokens on successful login', async () => {
            mockUsersService.findByEmail.mockResolvedValue({ id: 'u-1', email: 'test@email.com', password_hash: 'hash', role: 'USER' });
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            mockJwtService.signAsync.mockResolvedValueOnce('access-token').mockResolvedValueOnce('refresh-token');

            const result = await service.login({ email: 'test@email.com', password: 'password' });

            expect(result).toHaveProperty('accessToken', 'access-token');
            expect(result).toHaveProperty('refreshToken', 'refresh-token');
        });
    });
});
