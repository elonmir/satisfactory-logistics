import type { LogisticType } from '@/recipes/logistics/LogisticTypes';

export interface Factory {
  id: string;
  name?: string | null;
  description?: string | null;
  inputs: FactoryInput[];
  outputs: FactoryOutput[];
  powerConsumption?: number | null;
}

export interface FactoryInput {
  factoryId?: string | null;
  resource?: string | null;
  amount?: number | null;
  note?: string | null;
  transport?: LogisticType | null;
  /** Force usage in calculator. Eventual surplus will be converted in byproduct */
  forceUsage?: boolean;
}

export interface FactoryOutput {
  resource: string | null;
  amount: number | null;
  somersloops?: number | null;
  objective?: FactoryOutputObjective;
}

export type FactoryOutputObjective = 'default' | 'max';

interface FactoriesSettings {
  noHighlight100PercentUsage?: boolean;
  highlight100PercentColor?: string;
}

export const WORLD_SOURCE_ID = 'WORLD';
