export interface HouseTimelineItem {
  year: number;
  event: string;
}

export interface HouseMediaAsset {
  type: 'photo' | 'video';
  title: string;
  src: string;
  source: string;
}

export interface HouseStory {
  title: string;
  summary: string;
  media: HouseMediaAsset[];
}

export interface HouseActivity {
  id: string;
  title: string;
  date: string;
  slots: number;
  remaining: number;
  description: string;
}

export interface HouseValuation {
  collectionRating: number;
  preservationIndex: number;
  rentalYield: number;
  commentary: string;
}

export interface HouseModelMeta {
  color: string;
  height: number;
  footprint: {
    width: number;
    depth: number;
  };
  url?: string;
  scale?: number;
}

export interface HouseOwner {
  name: string;
  role: string;
  intention: string;
}

export interface HouseProfile {
  id: string;
  name: string;
  address: string;
  yearBuilt: number;
  style: string;
  floors: number;
  model: HouseModelMeta;
  timeline: HouseTimelineItem[];
  narratives: HouseStory[];
  owners: HouseOwner[];
  activities: HouseActivity[];
  valuation: HouseValuation;
}

export interface TranscriptEntry {
  id: string;
  speaker: 'guide' | 'user' | 'system';
  text: string;
  timestamp: number;
}

export type Stage = 'idle' | 'intro' | 'touring' | 'interior' | 'valuation' | 'community';

export interface ScriptStep {
  delay: number;
  action:
    | 'announce'
    | 'moveToHouse'
    | 'enterInterior'
    | 'showCommunity'
    | 'showValuation';
  payload?: {
    houseId?: string;
    text?: string;
  };
}

export interface HouseDataset {
  houses: HouseProfile[];
}
