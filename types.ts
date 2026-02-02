
export interface EcosystemReport {
  species: string;
  scientificName: string;
  health: 'Healthy' | 'Stressed' | 'Critical';
  description: string;
  funFact: string;
}

export interface ForestState {
  timeOfDay: number; // 0 to 24
  fogDensity: number;
  windIntensity: number;
}
