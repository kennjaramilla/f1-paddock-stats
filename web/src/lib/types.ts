// Mirrors the .NET DTOs in api/Stats/Dtos.cs (camelCase JSON).
export interface DriverRef { driverId: string; code: string | null; name: string }
export interface TeamRef { constructorId: string; name: string }

export interface Meta { generatedAt: string; source: string; fromSeason: number; toSeason: number; races: number; drivers: number; circuits: number }

export interface Contender { driverId: string; code: string | null; name: string; constructorId: string; points: number; cumulative: number[] }
export interface SeasonIndexItem {
  year: number; rounds: number; inProgress: boolean;
  champion: DriverRef | null; championTeam: TeamRef | null; constructorsChampion: TeamRef | null;
  championMargin: number; contenders: Contender[];
}

export interface RaceSummary {
  round: number; name: string; circuitId: string; circuitName: string; country: string | null; date: string | null;
  hasSprint: boolean; winner: DriverRef | null; winnerTeam: TeamRef | null; pole: DriverRef | null;
}
export interface DriverSeason {
  driverId: string; code: string | null; name: string; nationality: string | null;
  constructorId: string; constructorName: string; constructorIds: string[];
  position: number; points: number; cumulative: number[];
  wins: number; podiums: number; poles: number; starts: number; bestFinish: number | null;
}
export interface ConstructorSeason { constructorId: string; name: string; position: number; points: number; cumulative: number[]; wins: number; driverIds: string[] }
export interface Reconciliation { matches: boolean; checked: number; officialRound: number; mismatches: string[] }
export interface SeasonDetail { year: number; inProgress: boolean; races: RaceSummary[]; drivers: DriverSeason[]; constructors: ConstructorSeason[]; reconciliation: Reconciliation }

export interface ResultRow { driverId: string; constructorId: string; grid: number; position: number; positionText: string; points: number; status: string | null }
export interface QualiRow { driverId: string; constructorId: string; position: number }
export interface RaceResults { round: number; name: string; circuitId: string; date: string | null; race: ResultRow[]; sprint: ResultRow[]; qualifying: QualiRow[] }
export interface SeasonResults { year: number; races: RaceResults[] }

export interface DriverSeasonTeam { season: number; constructorId: string; constructorName: string; position: number; points: number; wins: number }
export interface DriverIndexItem {
  driverId: string; code: string | null; givenName: string; familyName: string; nationality: string | null; number: string | null;
  seasons: DriverSeasonTeam[]; starts: number; wins: number; podiums: number; poles: number; points: number; titles: number;
}
export interface ConstructorIndexItem { constructorId: string; name: string; nationality: string | null; seasons: number[] }

export interface CircuitIndexItem {
  circuitId: string; name: string; locality: string | null; country: string | null; lat: number | null; long: number | null;
  races: number; firstSeason: number; lastSeason: number; lastWinner: DriverRef | null; poleToWinRate: number;
}
export interface CircuitRace { season: number; round: number; raceName: string; winner: DriverRef; winnerTeam: TeamRef; winnerGrid: number; pole: DriverRef | null; wonFromPole: boolean }
export interface WinCount { id: string; name: string; wins: number }
export interface CircuitDetail {
  circuitId: string; name: string; locality: string | null; country: string | null; lat: number | null; long: number | null;
  races: CircuitRace[]; poleWins: number; poleToWinRate: number; winsByConstructor: WinCount[]; winsByDriver: WinCount[];
}
