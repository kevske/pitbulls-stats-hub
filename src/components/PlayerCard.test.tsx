import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PlayerCard from './PlayerCard';
import { PlayerStats, PlayerGameLog } from '@/types/stats';

// Setup hoisted mocks
const mocks = vi.hoisted(() => {
  return {
    useNavigate: vi.fn(),
  };
});

// Mock external dependencies
vi.mock('react-router-dom', () => ({
  useNavigate: mocks.useNavigate,
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    div: ({ children, onClick, onKeyDown, role, tabIndex, className, 'aria-label': ariaLabel }: any) => (
      <div
        onClick={onClick}
        onKeyDown={onKeyDown}
        role={role}
        tabIndex={tabIndex}
        className={className}
        aria-label={ariaLabel}
        data-testid="motion-div"
      >
        {children}
      </div>
    ),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    img: ({ src, alt, className, onError, layoutId }: any) => (
      <img
        src={src}
        alt={alt}
        className={className}
        onError={onError}
        data-layout-id={layoutId}
      />
    ),
  },
}));

// Mock child components
vi.mock('./PlayerTrendIndicator', () => ({
  PlayerTrendIndicator: () => <div data-testid="trend-indicator" />,
}));

// Mock calculateAge to ensure deterministic results
vi.mock('@/utils/dateUtils', () => ({
  calculateAge: () => 25,
}));

// Sample Data
const mockPlayer: PlayerStats = {
  id: 'player-1',
  firstName: 'John',
  lastName: 'Doe',
  imageUrl: 'http://example.com/john.jpg',
  jerseyNumber: 23,
  position: 'Guard',
  age: 25,
  height: '190',
  weight: 90,
  birthDate: '1998-01-01',
  bio: 'A great player with amazing skills that spans multiple lines to test the expand functionality. '.repeat(5),
  gamesPlayed: 10,
  minutesPerGame: 30,
  pointsPerGame: 20.5,
  threePointersPerGame: 2.5,
  foulsPerGame: 1.5,
  freeThrowsMadePerGame: 3,
  freeThrowAttemptsPerGame: 4,
  freeThrowPercentage: '75%',
  pointsPer40: 26.6,
  threePointersPer40: 3.3,
  foulsPer40: 2
};

const mockGameLogs: PlayerGameLog[] = [
  {
    playerId: 'player-1',
    gameNumber: 1,
    minutesPlayed: 30,
    points: 20,
    twoPointers: 5,
    threePointers: 2,
    freeThrowsMade: 4,
    freeThrowAttempts: 5,
    freeThrowPercentage: '80%',
    fouls: 2,
    pointsPer40: 26.6,
    freeThrowAttemptsPer40: 6.6,
    foulsPer40: 2.6,
    threePointersPer40: 2.6,
    gameType: 'Heim'
  }
];

describe('PlayerCard', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useNavigate.mockReturnValue(mockNavigate);
  });

  it('renders player basic info correctly (Editorial card)', () => {
    render(<PlayerCard player={mockPlayer} gameLogs={mockGameLogs} />);

    // Name ist im Editorial-Design auf Vor-/Nachname aufgeteilt
    expect(screen.getByRole('button', { name: /Details ansehen/i })).toHaveTextContent('John');
    expect(screen.getByText('Doe')).toBeInTheDocument();
    expect(screen.getByText('#23')).toBeInTheDocument();
    expect(screen.getByText('Guard')).toBeInTheDocument();
    expect(screen.getByText('190 cm')).toBeInTheDocument();
    expect(screen.getByText('90 kg')).toBeInTheDocument();

    // Check stats are rendered (rounded to 1 decimal)
    expect(screen.getByText('20.5')).toBeInTheDocument(); // PTS
    expect(screen.getByText('2.5')).toBeInTheDocument(); // 3P
    expect(screen.getByText('3.0')).toBeInTheDocument(); // FTM
    expect(screen.getByText('1.5')).toBeInTheDocument(); // FLS
  });

  it('navigates to player details on click', () => {
    render(<PlayerCard player={mockPlayer} gameLogs={mockGameLogs} />);

    const card = screen.getByRole('button', { name: /Details ansehen/i });
    fireEvent.click(card);

    expect(mockNavigate).toHaveBeenCalledWith('/players/player-1');
  });

  it('navigates on Enter key', () => {
    render(<PlayerCard player={mockPlayer} gameLogs={mockGameLogs} />);

    const card = screen.getByRole('button', { name: /Details ansehen/i });
    fireEvent.keyDown(card, { key: 'Enter' });

    expect(mockNavigate).toHaveBeenCalledWith('/players/player-1');
  });

  it('does not navigate on random key', () => {
    render(<PlayerCard player={mockPlayer} gameLogs={mockGameLogs} />);

    const card = screen.getByRole('button', { name: /Details ansehen/i });
    fireEvent.keyDown(card, { key: 'a' });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('calculates filtered stats correctly (Home Games)', () => {
    // We need to pass a specific filter
    render(<PlayerCard player={mockPlayer} gameLogs={mockGameLogs} gameFilter="home" />);

    // In mockGameLogs, the game is 'Heim' (Home).
    // So stats should match the log: 20 points
    expect(screen.getByText('20.0')).toBeInTheDocument();
  });

  it('calculates filtered stats correctly (Away Games - No data)', () => {
    render(<PlayerCard player={mockPlayer} gameLogs={mockGameLogs} gameFilter="away" />);

    // No away games in mockGameLogs. Should return 0.
    // We expect multiple '0.0' for PTS, 3P, FTM, FLS
    const zeros = screen.getAllByText('0.0');
    expect(zeros).toHaveLength(4);
  });
});
