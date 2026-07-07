import { z } from 'astro/zod';
import rawResume from './resume.yaml';

const roleSchema = z.object({
  title: z.string(),
  dates: z.string(),
  summary: z.string(),
  bullets: z.array(z.string()),
});

export const resumeSchema = z.object({
  contact: z.object({
    website: z.string(),
    phone: z.string(),
    email: z.string().email(),
  }),
  education: z.array(
    z.object({
      school: z.string(),
      degrees: z.array(z.string()).nonempty(),
      notes: z.string(),
    })
  ),
  experience: z.array(
    z.object({
      company: z.string(),
      roles: z.array(roleSchema).nonempty(),
    })
  ),
  rdProjects: z.array(z.object({ name: z.string(), blurb: z.string() })),
  skills: z.array(z.string()).nonempty(),
  credits: z.array(z.string()).nonempty(),
});

export type Resume = z.infer<typeof resumeSchema>;

export const resume: Resume = resumeSchema.parse(rawResume);
