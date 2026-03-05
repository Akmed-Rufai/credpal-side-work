import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  CreateOrganizationSchema,
  type CreateOrganizationDto,
  UpdateOrganizationSchema,
  type UpdateOrganizationDto,
  AddMemberSchema,
  type AddMemberDto,
} from './dto/organizations.dto';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) { }

  @Post()
  @UsePipes(new ZodValidationPipe(CreateOrganizationSchema))
  create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateOrganizationDto,
  ) {
    return this.organizationsService.createOrganization(user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: { id: string }) {
    return this.organizationsService.getUserOrganizations(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.organizationsService.getOrganizationById(id, user.id);
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(UpdateOrganizationSchema))
  update(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.updateOrganization(id, user.id, dto);
  }

  @Post(':id/members')
  @UsePipes(new ZodValidationPipe(AddMemberSchema))
  addMember(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: AddMemberDto,
  ) {
    return this.organizationsService.addMember(id, user.id, dto);
  }

  @Delete(':id/members/:memberId')
  removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.organizationsService.removeMember(id, user.id, memberId);
  }
}
