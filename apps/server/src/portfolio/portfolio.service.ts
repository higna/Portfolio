import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from './entities/profile.entity';
import { Experience } from './entities/experience.entity';
import { Education } from './entities/education.entity';
import { Skill } from './entities/skill.entity';
import { Project } from './entities/project.entity';
import { Certification } from './entities/certification.entity';
import {
  cvDataFileExists,
  readCvDataFile,
  writeCvDataFile,
} from '../chat/cv-data-file';

export type CvData = {
  profile: {
    fullName: string;
    phone: string | null;
    linkedinUrl: string | null;
    githubUrl: string | null;
    portfolioUrl: string | null;
    professionalSummary: string;
    languages: string[];
  };
  experiences: Array<{
    jobTitle: string;
    company: string;
    description: string[];
    startDate: string;
    endDate: string | null;
    isCurrent: boolean;
    order: number;
  }>;
  educations: Array<{
    degree: string;
    institution: string;
    startDate: string;
    endDate: string | null;
    grade: string | null;
    order: number;
  }>;
  skills: Array<{ name: string; category: string; proficiency: number }>;
  projects: Array<{
    title: string;
    slug: string;
    description: string;
    techStack: string[];
    liveUrl: string | null;
    githubUrl: string | null;
    imageUrl: string | null;
    isFeatured: boolean;
    order: number;
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    date: string;
    url: string | null;
    order: number;
  }>;
};

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown, label: string): JsonRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new BadRequestException(`${label} must be an object`);
  }
  return value as JsonRecord;
}

function assertKeys(record: JsonRecord, allowed: string[], label: string) {
  const unexpected = Object.keys(record).filter((key) => !allowed.includes(key));
  if (unexpected.length > 0) {
    throw new BadRequestException(
      `${label} contains unsupported field(s): ${unexpected.join(', ')}`,
    );
  }
}

function requiredText(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new BadRequestException(`${label} must be a non-empty string`);
  }
  return value.trim();
}

function optionalText(value: unknown, label: string): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') {
    throw new BadRequestException(`${label} must be a string or null`);
  }
  return value.trim() || null;
}

function stringList(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new BadRequestException(`${label} must be an array of strings`);
  }
  return value.map((item: string) => item.trim()).filter(Boolean);
}

function dateValue(
  value: unknown,
  label: string,
  nullable = false,
): string | null {
  if (nullable && (value === undefined || value === null || value === '')) {
    return null;
  }
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new BadRequestException(`${label} must use YYYY-MM-DD format`);
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new BadRequestException(`${label} must be a valid calendar date`);
  }
  return value;
}

function integerValue(value: unknown, label: string, fallback: number): number {
  if (value === undefined) return fallback;
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new BadRequestException(`${label} must be an integer`);
  }
  return value;
}

function booleanValue(value: unknown, label: string): boolean {
  if (typeof value !== 'boolean') {
    throw new BadRequestException(`${label} must be a boolean`);
  }
  return value;
}

function parseCvData(value: unknown): CvData {
  const data = asRecord(value, 'CV data');
  const rootKeys = [
    'profile',
    'experiences',
    'educations',
    'skills',
    'projects',
    'certifications',
  ];
  assertKeys(data, rootKeys, 'CV data');
  if (rootKeys.some((key) => !(key in data))) {
    throw new BadRequestException(
      `CV data must include: ${rootKeys.join(', ')}`,
    );
  }

  const profile = asRecord(data.profile, 'profile');
  assertKeys(
    profile,
    [
      'fullName',
      'phone',
      'linkedinUrl',
      'githubUrl',
      'portfolioUrl',
      'professionalSummary',
      'languages',
    ],
    'profile',
  );
  if (typeof profile.professionalSummary !== 'string') {
    throw new BadRequestException('profile.professionalSummary must be a string');
  }

  const parseRows = <T>(
    value: unknown,
    label: string,
    parse: (row: JsonRecord, index: number) => T,
  ): T[] => {
    if (!Array.isArray(value)) {
      throw new BadRequestException(`${label} must be an array`);
    }
    return value.map((item, index) =>
      parse(asRecord(item, `${label}[${index}]`), index),
    );
  };

  const experiences = parseRows(data.experiences, 'experiences', (row, index) => {
    assertKeys(
      row,
      ['jobTitle', 'company', 'description', 'startDate', 'endDate', 'isCurrent', 'order'],
      `experiences[${index}]`,
    );
    return {
      jobTitle: requiredText(row.jobTitle, `experiences[${index}].jobTitle`),
      company: requiredText(row.company, `experiences[${index}].company`),
      description: stringList(row.description, `experiences[${index}].description`),
      startDate: dateValue(row.startDate, `experiences[${index}].startDate`)!,
      endDate: dateValue(row.endDate, `experiences[${index}].endDate`, true),
      isCurrent: booleanValue(row.isCurrent, `experiences[${index}].isCurrent`),
      order: integerValue(row.order, `experiences[${index}].order`, index),
    };
  });

  const educations = parseRows(data.educations, 'educations', (row, index) => {
    assertKeys(
      row,
      ['degree', 'institution', 'startDate', 'endDate', 'grade', 'order'],
      `educations[${index}]`,
    );
    return {
      degree: requiredText(row.degree, `educations[${index}].degree`),
      institution: requiredText(row.institution, `educations[${index}].institution`),
      startDate: dateValue(row.startDate, `educations[${index}].startDate`)!,
      endDate: dateValue(row.endDate, `educations[${index}].endDate`, true),
      grade: optionalText(row.grade, `educations[${index}].grade`),
      order: integerValue(row.order, `educations[${index}].order`, index),
    };
  });

  const skills = parseRows(data.skills, 'skills', (row, index) => {
    assertKeys(row, ['name', 'category', 'proficiency'], `skills[${index}]`);
    const proficiency = integerValue(
      row.proficiency,
      `skills[${index}].proficiency`,
      1,
    );
    if (proficiency < 1 || proficiency > 5) {
      throw new BadRequestException(
        `skills[${index}].proficiency must be between 1 and 5`,
      );
    }
    return {
      name: requiredText(row.name, `skills[${index}].name`),
      category: requiredText(row.category, `skills[${index}].category`),
      proficiency,
    };
  });

  const projects = parseRows(data.projects, 'projects', (row, index) => {
    assertKeys(
      row,
      [
        'title',
        'slug',
        'description',
        'techStack',
        'liveUrl',
        'githubUrl',
        'imageUrl',
        'isFeatured',
        'order',
      ],
      `projects[${index}]`,
    );
    return {
      title: requiredText(row.title, `projects[${index}].title`),
      slug: requiredText(row.slug, `projects[${index}].slug`),
      description: requiredText(row.description, `projects[${index}].description`),
      techStack: stringList(row.techStack, `projects[${index}].techStack`),
      liveUrl: optionalText(row.liveUrl, `projects[${index}].liveUrl`),
      githubUrl: optionalText(row.githubUrl, `projects[${index}].githubUrl`),
      imageUrl: optionalText(row.imageUrl, `projects[${index}].imageUrl`),
      isFeatured: booleanValue(row.isFeatured, `projects[${index}].isFeatured`),
      order: integerValue(row.order, `projects[${index}].order`, index),
    };
  });

  const certifications = parseRows(
    data.certifications,
    'certifications',
    (row, index) => {
      assertKeys(
        row,
        ['name', 'issuer', 'date', 'url', 'order'],
        `certifications[${index}]`,
      );
      return {
        name: requiredText(row.name, `certifications[${index}].name`),
        issuer: requiredText(row.issuer, `certifications[${index}].issuer`),
        date: dateValue(row.date, `certifications[${index}].date`)!,
        url: optionalText(row.url, `certifications[${index}].url`),
        order: integerValue(row.order, `certifications[${index}].order`, index),
      };
    },
  );

  return {
    profile: {
      fullName: requiredText(profile.fullName, 'profile.fullName'),
      phone: optionalText(profile.phone, 'profile.phone'),
      linkedinUrl: optionalText(profile.linkedinUrl, 'profile.linkedinUrl'),
      githubUrl: optionalText(profile.githubUrl, 'profile.githubUrl'),
      portfolioUrl: optionalText(profile.portfolioUrl, 'profile.portfolioUrl'),
      professionalSummary: profile.professionalSummary.trim(),
      languages: stringList(profile.languages, 'profile.languages'),
    },
    experiences,
    educations,
    skills,
    projects,
    certifications,
  };
}

@Injectable()
export class PortfolioService {
  constructor(
    @InjectRepository(Profile) private profileRepo: Repository<Profile>,
    @InjectRepository(Experience) private expRepo: Repository<Experience>,
    @InjectRepository(Education) private eduRepo: Repository<Education>,
    @InjectRepository(Skill) private skillRepo: Repository<Skill>,
    @InjectRepository(Project) private projRepo: Repository<Project>,
    @InjectRepository(Certification) private certRepo: Repository<Certification>,
  ) { }

  async exportCvSeed(): Promise<string> {
    const profile = await this.profileRepo.findOne({ where: {} });
    const experiences = await this.expRepo.find({ order: { order: 'ASC' } });
    const educations = await this.eduRepo.find({ order: { order: 'ASC' } });
    const skills = await this.skillRepo.find();
    const projects = await this.projRepo.find({
      where: { isLocal: false },
      order: { order: 'ASC' },
    });
    const certifications = await this.certRepo.find({
      order: { date: 'DESC', order: 'ASC' },
    });

    // Build profile object
    const profileObj = {
      fullName: profile?.fullName || '',
      phone: profile?.phone || null,
      linkedinUrl: profile?.linkedinUrl || null,
      githubUrl: profile?.githubUrl || null,
      portfolioUrl: profile?.portfolioUrl || null,
      professionalSummary: profile?.professionalSummary || '',
      languages: profile?.languages || [],
    };

    // Build experiences
    const experiencesArr = experiences.map(e => ({
      jobTitle: e.jobTitle,
      company: e.company,
      description: e.description,
      startDate: e.startDate,
      endDate: e.endDate,
      isCurrent: e.isCurrent,
      order: e.order,
    }));

    // Build educations
    const educationsArr = educations.map(e => ({
      degree: e.degree,
      institution: e.institution,
      startDate: e.startDate,
      endDate: e.endDate,
      grade: e.grade,
      order: e.order,
    }));

    // Build skills
    const skillsArr = skills.map(s => ({
      name: s.name,
      category: s.category,
      proficiency: s.proficiency,
    }));

    // Build projects
    const projectsArr = projects.map(p => ({
      title: p.title,
      slug: p.slug,
      description: p.description,
      techStack: p.techStack,
      liveUrl: p.liveUrl,
      githubUrl: p.githubUrl,
      imageUrl: p.imageUrl,
      isFeatured: p.isFeatured,
      order: p.order,
    }));

    // Build certifications
    const certsArr = certifications.map((c, index) => ({
      name: c.name,
      issuer: c.issuer,
      date: c.date,
      url: c.url,
      order: index + 1,
    }));

    // Generate TypeScript content
    return `export const cvProfile = ${JSON.stringify(profileObj, null, 2)};\n\n` +
      `export const cvExperiences = ${JSON.stringify(experiencesArr, null, 2)};\n\n` +
      `export const cvEducations = ${JSON.stringify(educationsArr, null, 2)};\n\n` +
      `export const cvSkills = ${JSON.stringify(skillsArr, null, 2)};\n\n` +
      `export const cvProjects = ${JSON.stringify(projectsArr, null, 2)};\n\n` +
      `export const cvCertifications = ${JSON.stringify(certsArr, null, 2)};`;
  }

  async getCvDataObject(): Promise<CvData> {
    const profile = await this.profileRepo.findOne({ where: {} });
    const experiences = await this.expRepo.find({ order: { order: 'ASC' } });
    const educations = await this.eduRepo.find({ order: { order: 'ASC' } });
    const skills = await this.skillRepo.find();
    const projects = await this.projRepo.find({
      where: { isLocal: false },
      order: { order: 'ASC' },
    });
    const certifications = await this.certRepo.find({
      order: { date: 'DESC', order: 'ASC' },
    });

    return {
      profile: {
        fullName: profile?.fullName || '',
        phone: profile?.phone || null,
        linkedinUrl: profile?.linkedinUrl || null,
        githubUrl: profile?.githubUrl || null,
        portfolioUrl: profile?.portfolioUrl || null,
        professionalSummary: profile?.professionalSummary || '',
        languages: profile?.languages || [],
      },
      experiences: experiences.map((e) => ({
        jobTitle: e.jobTitle,
        company: e.company,
        description: e.description,
        startDate: e.startDate,
        endDate: e.endDate,
        isCurrent: e.isCurrent,
        order: e.order,
      })),
      educations: educations.map((e) => ({
        degree: e.degree,
        institution: e.institution,
        startDate: e.startDate,
        endDate: e.endDate,
        grade: e.grade,
        order: e.order,
      })),
      skills: skills.map((s) => ({
        name: s.name,
        category: s.category,
        proficiency: s.proficiency,
      })),
      projects: projects.map((p) => ({
        title: p.title,
        slug: p.slug,
        description: p.description,
        techStack: p.techStack,
        liveUrl: p.liveUrl,
        githubUrl: p.githubUrl,
        imageUrl: p.imageUrl,
        isFeatured: p.isFeatured,
        order: p.order,
      })),
      certifications: certifications.map((c, index) => ({
        name: c.name,
        issuer: c.issuer,
        date: c.date,
        url: c.url,
        order: index + 1,
      })),
    };
  }

  async getCvDataFileObject(): Promise<unknown> {
    if (!cvDataFileExists()) {
      await this.syncCvDataFile();
    }
    return readCvDataFile();
  }

  private async syncCvDataFile(): Promise<CvData> {
    const cvData = await this.getCvDataObject();
    writeCvDataFile(cvData);
    return cvData;
  }

  async replaceCvData(data: unknown): Promise<CvData> {
    const cvData = parseCvData(data);
    await this.profileRepo.manager.transaction(async (manager) => {
      const profileRepository = manager.getRepository(Profile);
      const profile = await profileRepository.findOne({ where: {} });
      if (!profile) {
        throw new NotFoundException(
          'A portfolio profile must exist before CV data can be imported',
        );
      }

      await profileRepository.save({
        ...profile,
        ...cvData.profile,
      });

      const replaceRows = async <T extends object>(
        entity: new () => T,
        rows: T[],
      ) => {
        const repository = manager.getRepository(entity);
        await repository.createQueryBuilder().delete().execute();
        if (rows.length > 0) {
          await repository.save(repository.create(rows));
        }
      };

      await replaceRows(Experience, cvData.experiences);
      await replaceRows(Education, cvData.educations);
      await replaceRows(Skill, cvData.skills);
      const projectRepository = manager.getRepository(Project);
      await projectRepository.delete({ isLocal: false });
      if (cvData.projects.length > 0) {
        await projectRepository.save(projectRepository.create(cvData.projects));
      }
      await replaceRows(Certification, cvData.certifications);
    });

    return this.syncCvDataFile();
  }

  async getProfile() {
    return this.profileRepo.findOne({ where: {} });
  }

  async updateProfile(data: any) {
    const existing = await this.profileRepo.findOne({ where: {} });
    if (existing) {
      Object.assign(existing, data);
      const saved = await this.profileRepo.save(existing);
      await this.syncCvDataFile();
      return saved;
    }
    const newProfile = this.profileRepo.create(data);
    const saved = await this.profileRepo.save(newProfile);
    await this.syncCvDataFile();
    return saved;
  }

  /* Education */
  async getEducations() {
    return this.eduRepo.find({ order: { order: 'ASC' } });
  }
  async addEducation(data: Partial<Education>) {
    const edu = this.eduRepo.create(data);
    const saved = await this.eduRepo.save(edu);
    await this.syncCvDataFile();
    return saved;
  }

  async updateEducation(id: string, data: Partial<Education>) {
    await this.eduRepo.update(id, data);
    const updated = await this.eduRepo.findOne({ where: { id } });
    await this.syncCvDataFile();
    return updated;
  }

  async deleteEducation(id: string) {
    await this.eduRepo.delete(id);
    await this.syncCvDataFile();
    return { success: true };
  }

  /* Experience */
  async getExperiences() {
    return this.expRepo.find({ order: { order: 'ASC' } });
  }

  async addExperience(data: Partial<Experience>) {
    if (data.endDate === '') (data as any).endDate = null;
    if (data.startDate === '') (data as any).startDate = null;
    const exp = this.expRepo.create(data);
    const saved = await this.expRepo.save(exp);
    await this.syncCvDataFile();
    return saved;
  }

  async updateExperience(id: string, data: Partial<Experience>) {
    if (data.endDate === '') (data as any).endDate = null;
    if (data.startDate === '') (data as any).startDate = null;
    await this.expRepo.update(id, data);
    const updated = await this.expRepo.findOne({ where: { id } });
    await this.syncCvDataFile();
    return updated;
  }

  async deleteExperience(id: string) {
    await this.expRepo.delete(id);
    await this.syncCvDataFile();
    return { success: true };
  }

  /* Skills */
  async getSkills() {
    return this.skillRepo.find();
  }
  async addSkill(data: Partial<Skill>) {
    const skill = this.skillRepo.create(data);
    const saved = await this.skillRepo.save(skill);
    await this.syncCvDataFile();
    return saved;
  }

  async updateSkill(id: string, data: Partial<Skill>) {
    await this.skillRepo.update(id, data);
    const updated = await this.skillRepo.findOne({ where: { id } });
    await this.syncCvDataFile();
    return updated;
  }

  async deleteSkill(id: string) {
    await this.skillRepo.delete(id);
    await this.syncCvDataFile();
    return { success: true };
  }

  /* Projects */
  async getProjects(featured?: boolean) {
    if (featured) {
      return this.projRepo.find({ where: { isFeatured: true }, order: { order: 'ASC' } });
    }
    return this.projRepo.find({ order: { order: 'ASC' } });
  }

  async addProject(data: Partial<Project>) {
    const project = this.projRepo.create(data);
    const saved = await this.projRepo.save(project);
    await this.syncCvDataFile();
    return saved;
  }

  async updateProject(id: string, data: Partial<Project>) {
    await this.projRepo.update(id, data);
    const updated = await this.projRepo.findOne({ where: { id } });
    await this.syncCvDataFile();
    return updated;
  }

  async deleteProject(id: string) {
    await this.projRepo.delete(id);
    await this.syncCvDataFile();
    return { success: true };
  }
  /* Certification */
  async getCertifications() {
    return this.certRepo.find({ order: { date: 'DESC', order: 'ASC' } });
  }

  async addCertification(data: Partial<Certification>) {
    const cert = this.certRepo.create(data);
    const saved = await this.certRepo.save(cert);
    await this.syncCvDataFile();
    return saved;
  }

  async updateCertification(id: string, data: Partial<Certification>) {
    await this.certRepo.update(id, data);
    const updated = await this.certRepo.findOne({ where: { id } });
    await this.syncCvDataFile();
    return updated;
  }

  async deleteCertification(id: string) {
    await this.certRepo.delete(id);
    await this.syncCvDataFile();
    return { success: true };
  }
}