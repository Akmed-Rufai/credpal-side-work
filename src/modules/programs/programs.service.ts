import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateProgramDto, UpdateProgramDto, CreateCohortDto, CreateSessionDto } from './dto/programs.dto';
import { ProgramStatus } from '@prisma/client';

@Injectable()
export class ProgramsService {
    constructor(private prisma: PrismaService) { }

    private async verifyOrgMembership(userId: string, orgId: string) {
        const membership = await this.prisma.orgMember.findUnique({
            where: { org_id_user_id: { org_id: orgId, user_id: userId } },
        });
        if (!membership) {
            throw new ForbiddenException('User is not a member of this organization');
        }
        return membership;
    }

    async createProgram(userId: string, orgId: string, data: CreateProgramDto) {
        await this.verifyOrgMembership(userId, orgId);

        return this.prisma.program.create({
            data: {
                org_id: orgId,
                title: data.title,
                description: data.description,
                price: data.price,
                currency: data.currency,
                cover_image: data.coverImage,
                status: ProgramStatus.DRAFT,
            },
        });
    }

    async updateProgram(userId: string, programId: string, data: UpdateProgramDto) {
        const program = await this.prisma.program.findUnique({
            where: { id: programId },
        });
        if (!program) throw new NotFoundException('Program not found');

        await this.verifyOrgMembership(userId, program.org_id);

        return this.prisma.program.update({
            where: { id: programId },
            data: {
                title: data.title,
                description: data.description,
                price: data.price,
                currency: data.currency,
                cover_image: data.coverImage,
                status: data.status as ProgramStatus | undefined,
            },
        });
    }

    async createCohort(userId: string, programId: string, data: CreateCohortDto) {
        const program = await this.prisma.program.findUnique({
            where: { id: programId },
        });
        if (!program) throw new NotFoundException('Program not found');

        await this.verifyOrgMembership(userId, program.org_id);

        return this.prisma.cohort.create({
            data: {
                program_id: programId,
                name: data.name,
                start_date: new Date(data.startDate),
                end_date: new Date(data.endDate),
            },
        });
    }

    async createSession(userId: string, cohortId: string, data: CreateSessionDto) {
        const cohort = await this.prisma.cohort.findUnique({
            where: { id: cohortId },
            include: { program: true },
        });
        if (!cohort) throw new NotFoundException('Cohort not found');

        await this.verifyOrgMembership(userId, cohort.program.org_id);

        return this.prisma.session.create({
            data: {
                cohort_id: cohortId,
                title: data.title,
                start_time: new Date(data.startTime),
                end_time: new Date(data.endTime),
                meeting_link: data.meetingLink,
            },
        });
    }

    async getOrgPrograms(orgId: string) {
        return this.prisma.program.findMany({
            where: { org_id: orgId },
            include: {
                _count: {
                    select: { cohorts: true },
                },
            },
        });
    }

    async getProgramById(programId: string) {
        const program = await this.prisma.program.findUnique({
            where: { id: programId },
            include: {
                cohorts: {
                    include: {
                        sessions: true,
                        _count: { select: { enrollments: true } },
                    },
                },
            },
        });

        if (!program) throw new NotFoundException('Program not found');
        return program;
    }

    async getPublicPrograms() {
        return this.prisma.program.findMany({
            where: { status: ProgramStatus.PUBLISHED },
            include: {
                org: { select: { name: true, logo_url: true } },
                _count: { select: { cohorts: true } },
            },
        });
    }
}