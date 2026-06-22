import { z } from "zod";

const contextRecordSchema = z.record(z.string()).optional();

export const vaultFileContextSchema = z
  .object({
    name: z.string().optional(),
    extension: z.string().optional(),
    category: z.string().optional(),
    lifecycleState: z.string().optional(),
    revision: z.string().optional(),
    properties: contextRecordSchema,
  })
  .optional();

export const vaultFolderContextSchema = z
  .object({
    path: z.string().optional(),
    name: z.string().optional(),
    properties: contextRecordSchema,
  })
  .optional();

export const vaultItemContextSchema = z
  .object({
    itemNumber: z.string().optional(),
    title: z.string().optional(),
    category: z.string().optional(),
    lifecycleState: z.string().optional(),
    properties: contextRecordSchema,
  })
  .optional();

export const executionContextSchema = z
  .object({
    trigger: z.string().optional(),
    user: z.string().optional(),
    vault: z.string().optional(),
    customProperties: contextRecordSchema,
  })
  .optional();

export const vaultTestScenarioSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  file: vaultFileContextSchema,
  folder: vaultFolderContextSchema,
  item: vaultItemContextSchema,
  execution: executionContextSchema,
});

export type VaultTestScenarioInput = z.infer<typeof vaultTestScenarioSchema>;
