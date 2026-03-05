import { Controller, Get, Post, Patch, Body, Param, UseGuards, UsePipes } from '@nestjs/common';
import { ProgramsService } from './programs.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  CreateProgramSchema, CreateProgramDto,
  UpdateProgramSchema, UpdateProgramDto,
  CreateCohortSchema, CreateCohortDto,
  CreateSessionSchema, CreateSessionDto
} from './dto/programs.dto';

@Controller('programs')
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) { }

  @Get('public')
  getPublicPrograms() {
    return this.programsService.getPublicPrograms();
  }

  @Post('orgs/:orgId')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ZodValidationPipe(CreateProgramSchema))
  createProgram(
    @Param('orgId') orgId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: CreateProgramDto,
  ) {
    return this.programsService.createProgram(user.id, orgId, dto);
  }

  @Patch(':programId')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ZodValidationPipe(UpdateProgramSchema))
  updateProgram(
    @Param('programId') programId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateProgramDto,
  ) {
    return this.programsService.updateProgram(user.id, programId, dto);
  }

  @Post(':programId/cohorts')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ZodValidationPipe(CreateCohortSchema))
  createCohort(
    @Param('programId') programId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: CreateCohortDto,
  ) {
    return this.programsService.createCohort(user.id, programId, dto);
  }

  @Post('cohorts/:cohortId/sessions')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ZodValidationPipe(CreateSessionSchema))
  createSession(
    @Param('cohortId') cohortId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: CreateSessionDto,
  ) {
    return this.programsService.createSession(user.id, cohortId, dto);
  }

  @Get('orgs/:orgId')
  @UseGuards(JwtAuthGuard)
  getOrgPrograms(@Param('orgId') orgId: string) {
    return this.programsService.getOrgPrograms(orgId);
  }

  @Get(':programId')
  @UseGuards(JwtAuthGuard)
  getProgramById(@Param('programId') programId: string) {
    return this.programsService.getProgramById(programId);
  }
}