import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateProfileSchema, CreateProfileDto } from './dto/users.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async getProfile(@CurrentUser() user: { id: string }) {
    return this.usersService.getProfile(user.id);
  }

  @Post('profile')
  @UsePipes(new ZodValidationPipe(CreateProfileSchema))
  async createProfile(
    @CurrentUser() user: { id: string },
    @Body() createProfileDto: CreateProfileDto,
  ) {
    return this.usersService.createProfile(user.id, {
      first_name: createProfileDto.firstName,
      last_name: createProfileDto.lastName,
      phone: createProfileDto.phone,
      avatar_url: createProfileDto.avatarUrl,
    });
  }
}
