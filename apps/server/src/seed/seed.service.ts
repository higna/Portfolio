import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { User, UserRole, AuthProvider } from '../users/entities/user.entity';
import { Profile } from '../portfolio/entities/profile.entity';
import { Experience } from '../portfolio/entities/experience.entity';
import { Education } from '../portfolio/entities/education.entity';
import { Skill } from '../portfolio/entities/skill.entity';
import { Project } from '../portfolio/entities/project.entity';
import { Certification } from '../portfolio/entities/certification.entity';
import {
    cvProfile,
    cvExperiences,
    cvEducations,
    cvSkills,
    cvProjects,
    cvCertifications,
} from './data/cv-data';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
    private readonly logger = new Logger(SeedService.name);

    constructor(
        private readonly configService: ConfigService,
        @InjectRepository(User) private readonly userRepo: Repository<User>,
        @InjectRepository(Profile) private readonly profileRepo: Repository<Profile>,
        @InjectRepository(Experience) private readonly expRepo: Repository<Experience>,
        @InjectRepository(Education) private readonly eduRepo: Repository<Education>,
        @InjectRepository(Skill) private readonly skillRepo: Repository<Skill>,
        @InjectRepository(Project) private readonly projRepo: Repository<Project>,
        @InjectRepository(Certification) private readonly certRepo: Repository<Certification>,
    ) { }

    async onApplicationBootstrap() {
        this.logger.log('Running seed...');
        await this.seedSuperadmin();
        await this.seedPortfolioData();
        this.logger.log('Seed complete');
    }

    private async seedSuperadmin() {
        const fullName = this.configService.get<string>('SUPERADMIN_FULLNAME') || 'Super Admin';
        const email = this.configService.get<string>('SUPERADMIN_EMAIL');
        const password = this.configService.get<string>('SUPERADMIN_PASSWORD');
        if (!email || !password) {
            this.logger.warn('SUPERADMIN_EMAIL or SUPERADMIN_PASSWORD not set. Skipping superadmin seed.');
            return;
        }
        let admin = await this.userRepo.findOne({ where: { email } });
        if (!admin) {
            const hashed = await bcrypt.hash(password, 10);
            admin = this.userRepo.create({
                fullName,
                email,
                password: hashed,
                role: UserRole.SUPERADMIN,
                isVerified: true,
                authProvider: AuthProvider.LOCAL,
            });
            admin = await this.userRepo.save(admin);
            this.logger.log(`Superadmin ${email} created`);
        } else {
            this.logger.log(`Superadmin ${email} already exists`);
            // Ensure password is set if missing (e.g., after schema changes)
            if (!admin.password && password) {
                admin.password = await bcrypt.hash(password, 10);
                await this.userRepo.save(admin);
            }
        }

        // Seed profile attached to superadmin
        const existingProfile = await this.profileRepo.findOne({ where: { user: { id: admin.id } } });
        if (!existingProfile) {
            const profile = this.profileRepo.create({
                user: admin,
                fullName: cvProfile.fullName,
                phone: cvProfile.phone,
                linkedinUrl: cvProfile.linkedinUrl,
                githubUrl: cvProfile.githubUrl,
                portfolioUrl: cvProfile.portfolioUrl,
                professionalSummary: cvProfile.professionalSummary,
                languages: cvProfile.languages,
            });
            await this.profileRepo.save(profile);
            this.logger.log(`Profile created for ${email}`);
        }
    }

    private async seedPortfolioData() {
        // ... (unchanged)
        const expCount = await this.expRepo.count();
        if (expCount === 0) {
            const exps = this.expRepo.create(cvExperiences);
            await this.expRepo.save(exps);
            this.logger.log(`Seeded ${exps.length} experiences`);
        }

        const eduCount = await this.eduRepo.count();
        if (eduCount === 0) {
            const edus = this.eduRepo.create(cvEducations);
            await this.eduRepo.save(edus);
            this.logger.log(`Seeded ${edus.length} educations`);
        }

        const skillCount = await this.skillRepo.count();
        if (skillCount === 0) {
            const skills = this.skillRepo.create(cvSkills);
            await this.skillRepo.save(skills);
            this.logger.log(`Seeded ${skills.length} skills`);
        }

        const projCount = await this.projRepo.count();
        if (projCount === 0) {
            const projs = this.projRepo.create(cvProjects);
            await this.projRepo.save(projs);
            this.logger.log(`Seeded ${projs.length} projects`);
        }

        const certCount = await this.certRepo.count();
        if (certCount === 0) {
            const certs = this.certRepo.create(cvCertifications);
            await this.certRepo.save(certs);
            this.logger.log(`Seeded ${certs.length} certifications`);
        }
    }
}