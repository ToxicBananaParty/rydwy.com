import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      anchor: z.string().regex(/^[a-z0-9-]+$/),
      order: z.number(),
      tools: z.array(z.string()).nonempty(),
      images: z
        .array(z.object({ src: image(), alt: z.string() }))
        .default([]),
      video: z
        .object({
          src: z.string(),
          caption: z.string().optional(),
        })
        .optional(),
      link: z
        .object({ label: z.string(), href: z.string().url() })
        .optional(),
    }),
});

const about = defineCollection({
  loader: glob({ pattern: 'about.md', base: './src/content' }),
  schema: z.object({}),
});

export const collections = { projects, about };
