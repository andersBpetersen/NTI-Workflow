import { z } from "zod";
import { vaultTestScenarioSchema } from "./scenarioSchema";

export const vaultTestPackSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  scenarios: z.array(vaultTestScenarioSchema).min(1),
});

export type VaultTestPackInput = z.infer<typeof vaultTestPackSchema>;
