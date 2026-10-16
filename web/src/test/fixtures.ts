import type { DriverIndexItem, ResultRow, SeasonResults } from '@/lib/types';

export const row = (driverId: string, constructorId: string, position: number, points = 0, positionText = String(position)): ResultRow => ({
  driverId, constructorId, grid: position, position, positionText, points, status: positionText === 'R' ? 'Accident' : 'Finished',
});

export const seasonResults: SeasonResults[] = [
  {
    year: 2016,
    races: [
      {
        round: 1, name: 'Australian Grand Prix', circuitId: 'albert_park', date: '2016-03-20',
        race: [row('rosberg', 'mercedes', 1, 25), row('hamilton', 'mercedes', 2, 18)],
        sprint: [],
        qualifying: [{ driverId: 'hamilton', constructorId: 'mercedes', position: 1 }, { driverId: 'rosberg', constructorId: 'mercedes', position: 2 }],
      },
      {
        round: 2, name: 'Spanish Grand Prix', circuitId: 'catalunya', date: '2016-05-15',
        race: [row('max_verstappen', 'red_bull', 1, 25), row('hamilton', 'mercedes', 21, 0, 'R'), row('rosberg', 'mercedes', 22, 0, 'R')],
        sprint: [],
        qualifying: [{ driverId: 'hamilton', constructorId: 'mercedes', position: 1 }, { driverId: 'rosberg', constructorId: 'mercedes', position: 2 }],
      },
      {
        round: 3, name: 'Monaco Grand Prix', circuitId: 'monaco', date: '2016-05-29',
        race: [row('hamilton', 'mercedes', 1, 25), row('rosberg', 'mercedes', 7, 6)],
        sprint: [],
        qualifying: [{ driverId: 'rosberg', constructorId: 'mercedes', position: 2 }, { driverId: 'hamilton', constructorId: 'mercedes', position: 3 }],
      },
    ],
  },
  {
    year: 2021,
    races: [
      {
        round: 10, name: 'British Grand Prix', circuitId: 'silverstone', date: '2021-07-18',
        race: [row('hamilton', 'mercedes', 1, 25), row('max_verstappen', 'red_bull', 20, 0, 'R')],
        sprint: [row('max_verstappen', 'red_bull', 1, 3), row('hamilton', 'mercedes', 2, 2)],
        qualifying: [{ driverId: 'hamilton', constructorId: 'mercedes', position: 1 }, { driverId: 'max_verstappen', constructorId: 'red_bull', position: 2 }],
      },
    ],
  },
];

const driver = (driverId: string, code: string, givenName: string, familyName: string, seasons: [number, string, number][]): DriverIndexItem => ({
  driverId, code, givenName, familyName, nationality: null, number: null,
  seasons: seasons.map(([season, constructorId, position]) => ({ season, constructorId, constructorName: constructorId, position, points: 0, wins: 0 })),
  starts: 0, wins: 0, podiums: 0, poles: 0, points: 100 - seasons[0][2], titles: 0,
});

export const drivers: DriverIndexItem[] = [
  driver('hamilton', 'HAM', 'Lewis', 'Hamilton', [[2016, 'mercedes', 2], [2021, 'mercedes', 2]]),
  driver('rosberg', 'ROS', 'Nico', 'Rosberg', [[2016, 'mercedes', 1]]),
  driver('max_verstappen', 'VER', 'Max', 'Verstappen', [[2016, 'red_bull', 5], [2021, 'red_bull', 1]]),
  driver('perez', 'PER', 'Sergio', 'Pérez', [[2021, 'red_bull', 4]]),
  driver('raikkonen', 'RAI', 'Kimi', 'Räikkönen', [[2016, 'ferrari', 6]]),
];
