export interface VaultFileContext {
  name?: string;
  extension?: string;
  category?: string;
  lifecycleState?: string;
  revision?: string;
  properties?: Record<string, string>;
}

export interface VaultFolderContext {
  path?: string;
  name?: string;
  properties?: Record<string, string>;
}

export interface VaultItemContext {
  itemNumber?: string;
  title?: string;
  category?: string;
  lifecycleState?: string;
  properties?: Record<string, string>;
}

export interface ExecutionContext {
  trigger?: string;
  user?: string;
  vault?: string;
  customProperties?: Record<string, string>;
}

export interface VaultTestScenario {
  id: string;
  name: string;
  description?: string;
  file?: VaultFileContext;
  folder?: VaultFolderContext;
  item?: VaultItemContext;
  execution?: ExecutionContext;
}

export interface VaultTestPack {
  id: string;
  name: string;
  description?: string;
  scenarios: VaultTestScenario[];
}
