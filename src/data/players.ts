export interface Player {
  id: string;
  name: string;
  team: string;
  bio: string;
  image: string;
  height: string;
  weight: number;
  age: number;
  rating: number;
  status: string;
  badge?: string;
  skills: string[];
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
    team: "Pitbulls Neuenstadt",
    bio: "Erfahrener Point Guard mit hervorragender Spielübersicht und Führungsqualitäten auf dem Court.",
    image: "/placeholder.svg",
    height: "6'2\"",
    weight: 185,
    age: 24,
    rating: 4.5,
    status: "Active",
    badge: "Captain",
    skills: ["Playmaker", "Court Vision", "Leadership", "Ball Handler"],
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
    team: "Pitbulls Neuenstadt",
    bio: "Athletischer Shooting Guard mit präzisem Distanzwurf und starker Verteidigung.",
    image: "/placeholder.svg",
    height: "6'4\"",
    weight: 198,
    age: 22,
    rating: 4.8,
    status: "Signed",
    badge: "Shooter",
    skills: ["Three Point Specialist", "Perimeter Defense", "Athletic", "Finisher"],
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
    team: "Pitbulls Neuenstadt",
    bio: "Vielseitiger Small Forward mit großer Reichweite und exzellenter Athletik.",
    image: "/placeholder.svg",
    height: "6'7\"",
    weight: 215,
    age: 25,
    rating: 5.0,
    status: "Signed",
    badge: "All-Around",
    skills: ["Versatile", "Athletic", "Defender", "Finisher"],
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
    team: "Pitbulls Neuenstadt",
    bio: "Dominanter Power Forward mit starker Präsenz unter dem Korb.",
    image: "/placeholder.svg",
    height: "6'9\"",
    weight: 235,
    age: 26,
    rating: 4.3,
    status: "Active",
    badge: "Big",
    skills: ["Shot Blocker", "Rebound Chaser", "Post Play", "Physical"],
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
    team: "Pitbulls Neuenstadt",
    bio: "Großer Center mit hervorragender Verteidigung und Rebounding.",
    image: "/placeholder.svg",
    height: "6'11\"",
    weight: 250,
    age: 27,
    rating: 4.6,
    status: "Signed",
    badge: "Anchor",
    skills: ["Rim Protector", "Rebound Chaser", "Shot Blocker", "Gritty"],
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
    team: "Pitbulls Neuenstadt",
    bio: "Schneller Guard mit explosivem ersten Schritt und guter Court Vision.",
    image: "/placeholder.svg",
    height: "6'1\"",
    weight: 180,
    age: 21,
    rating: 4.2,
    status: "Active",
    badge: "Speedster",
    skills: ["Fast Break", "Ball Handler", "Quick", "Finisher"],
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
