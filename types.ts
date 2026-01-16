
export enum TraderName {
  Prapor = 'Prapor',
  Therapist = 'Therapist',
  Skier = 'Skier',
  Peacekeeper = 'Peacekeeper',
  Mechanic = 'Mechanic',
  Ragman = 'Ragman',
  Jaeger = 'Jaeger',
  Fence = 'Fence',
  Lightkeeper = 'Lightkeeper',
  Ref = 'Ref',
  BTRDriver = 'BTR Driver'
}

export interface QuestObjective {
  id: string;
  type: string;
  description: string;
  count?: number;
  foundInRaid?: boolean;
  maps?: { name: string }[];
}

export interface TaskRequirement {
  status: string[];
  task: {
    name: string;
  };
}

export interface Quest {
  id: string;
  name: string;
  trader: {
    name: string;
  };
  minPlayerLevel: number;
  kappaRequired: boolean;
  lightkeeperRequired: boolean;
  wikiLink?: string;
  experience?: number;
  taskRequirements: TaskRequirement[];
  objectives: QuestObjective[];
  finishRewards?: {
    items?: { count: number; item: { name: string } }[];
  };
}

export interface AppState {
  completedQuestIds: Set<string>;
  searchQuery: string;
  filterTrader: string | 'All';
  filterType: 'All' | 'Kappa' | 'Lightkeeper';
}
