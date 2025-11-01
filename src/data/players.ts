export interface Player {
  id: string;
  name: string;
  bio: string;
  image: string;
  stats: {
    games: number;
    points: number;
    assists: number;
    rebounds: number;
    steals: number;
    blocks: number;
  };
}

export const players: Player[] = [
  {
    id: "1",
    name: "Max Müller",
    bio: "Erfahrener Point Guard mit hervorragender Spielübersicht und Führungsqualitäten auf dem Court.",
    image: "/placeholder.svg",
    stats: {
      games: 24,
      points: 456,
      assists: 128,
      rebounds: 89,
      steals: 45,
      blocks: 12
    }
  },
  {
    id: "2",
    name: "Jonas Schmidt",
    bio: "Athletischer Shooting Guard mit präzisem Distanzwurf und starker Verteidigung.",
    image: "/placeholder.svg",
    stats: {
      games: 22,
      points: 398,
      assists: 67,
      rebounds: 112,
      steals: 56,
      blocks: 8
    }
  },
  {
    id: "3",
    name: "Leon Weber",
    bio: "Vielseitiger Small Forward mit großer Reichweite und exzellenter Athletik.",
    image: "/placeholder.svg",
    stats: {
      games: 23,
      points: 421,
      assists: 89,
      rebounds: 145,
      steals: 38,
      blocks: 22
    }
  },
  {
    id: "4",
    name: "Paul Fischer",
    bio: "Dominanter Power Forward mit starker Präsenz unter dem Korb.",
    image: "/placeholder.svg",
    stats: {
      games: 20,
      points: 312,
      assists: 34,
      rebounds: 198,
      steals: 22,
      blocks: 45
    }
  },
  {
    id: "5",
    name: "Tim Becker",
    bio: "Großer Center mit hervorragender Verteidigung und Rebounding.",
    image: "/placeholder.svg",
    stats: {
      games: 21,
      points: 289,
      assists: 28,
      rebounds: 223,
      steals: 18,
      blocks: 67
    }
  },
  {
    id: "6",
    name: "Felix Hoffmann",
    bio: "Schneller Guard mit explosivem ersten Schritt und guter Court Vision.",
    image: "/placeholder.svg",
    stats: {
      games: 19,
      points: 267,
      assists: 98,
      rebounds: 56,
      steals: 41,
      blocks: 5
    }
  }
];
