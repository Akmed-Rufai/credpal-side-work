import { Controller, Get, Post, Patch, Body, Param, UseGuards, UsePipes, HttpCode } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { UpdateProgressSchema, UpdateProgressDto, UpdateEnrollmentStatusSchema, UpdateEnrollmentStatusDto } from './dto/enrollments.dto';

@Controller('enrollments')
@UseGuards(JwtAuthGuard)
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) { }

  @Get('my-enrollments')
  getUserEnrollments(@CurrentUser() user: { id: string }) {
    return this.enrollmentsService.getUserEnrollments(user.id);
  }

  @Post('cohorts/:cohortId')
  @HttpCode(201)
  enrollInCohort(
    @Param('cohortId') cohortId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.enrollmentsService.enrollInCohort(user.id, cohortId);
  }

  @Patch(':id/progress')
  @UsePipes(new ZodValidationPipe(UpdateProgressSchema))
  updateProgress(
    @Param('id') enrollmentId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateProgressDto,
  ) {
    return this.enrollmentsService.updateProgress(user.id, enrollmentId, dto.progress);
  }

  @Patch(':id/status')
  @UsePipes(new ZodValidationPipe(UpdateEnrollmentStatusSchema))
  updateStatus(
    @Param('id') enrollmentId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateEnrollmentStatusDto,
  ) {
    return this.enrollmentsService.updateStatus(user.id, enrollmentId, dto.status);
  }
}