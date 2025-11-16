'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';

interface PlayerStat {
  player_id?: string;
  player_name?: string;
  known_as?: string;
  runs?: number;
  wickets?: number;
  catches?: number;
  matches?: number;
  innings?: number;
  not_outs?: number;
  average?: string;
  strike_rate?: string;
  high_score?: number | string;
  fifties?: number;
  hundreds?: number;
  balls_bowled?: number;
  runs_conceded?: number;
  bowling_average?: string;
  economy_rate?: string;
  best_bowling?: string;
  five_wickets?: number;
  match_ids?: string[];
}

interface KeyPerformance {
  match_id: string;
  player_id: string;
  player_name: string;
  known_as?: string;
  match_date: string;
  opposition: string;
  key_stat: number;
  performance_type: 'century' | 'five_wicket';
}

interface SeasonStats {
  season: string;
  stats: {
    batting?: PlayerStat[];
    bowling?: PlayerStat[];
    key_performances?: KeyPerformance[];
  };
}

interface HonoursData {
  club: {
    name: string;
    shortName: string;
  };
  allTime: {
    batting?: PlayerStat[];
    bowling?: PlayerStat[];
    key_performances?: KeyPerformance[];
  };
  seasons: SeasonStats[];
}

interface HonoursBoardProps {
  clubId: string;
}

function EventsTable({
  title,
  events,
  keyStatLabel = "Stat",
  getPlayCricketUrl
}: {
  title: string;
  events: KeyPerformance[];
  keyStatLabel: string;
  getPlayCricketUrl: (matchId: string) => string;
}) {
  return (
    <section className="bg-white rounded-lg shadow-lg p-8 border-t-4 border-yellow-500">
      <h3 className="text-2xl font-bold mb-6 text-blue-800 border-b-2 border-blue-700 pb-2">
        {title}
      </h3>
      {events.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-blue-100">
                <th className="px-4 py-2 text-left text-blue-900">Player</th>
                <th className="px-4 py-2 text-left text-blue-900">Date</th>
                <th className="px-4 py-2 text-left text-blue-900">Achieved Against</th>
                <th className="px-4 py-2 text-right text-blue-900">{keyStatLabel}</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event, index) => (
                <tr key={event.match_id || index} className="border-b hover:bg-blue-50">
                  <td className="px-4 py-3">
                    {event.match_id ? (
                      <a
                      href={getPlayCricketUrl(event.match_id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-700 hover:text-blue-900 hover:underline font-medium"
                      >
                        {event.known_as || event.player_name}
                      </a>
                    ) : (
                      <span>{event.known_as || event.player_name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{event.match_date}</td>
                  <td className="px-4 py-3">{event.opposition}</td>
                  <td className="px-4 py-3 text-right font-semibold">{event.key_stat}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500 text-center py-4">None available (so far...?)</p>
      )}
    </section>
  );
}

function StatsTable({
  title,
  topBatsmen,
  topBowlers,
  getPlayCricketUrl
}: {
  title: string;
  topBatsmen: PlayerStat[];
  topBowlers: PlayerStat[];
  getPlayCricketUrl: (matchId: string) => string;
}) {
  return (
    <>
      {/* Top Run Scorers */}
      <section className="bg-white rounded-lg shadow-lg p-8 border-t-4 border-yellow-500">
        <h3 className="text-2xl font-bold mb-6 text-blue-800 border-b-2 border-blue-700 pb-2">
          {title} - Top Run Scorers
        </h3>
        {topBatsmen.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-blue-100">
                  <th className="px-4 py-2 text-left text-blue-900">Rank</th>
                  <th className="px-4 py-2 text-left text-blue-900">Player</th>
                  <th className="px-4 py-2 text-right text-blue-900">Runs</th>
                  <th className="px-4 py-2 text-right text-blue-900">Innings</th>
                  <th className="px-4 py-2 text-right text-blue-900">Average</th>
                  <th className="px-4 py-2 text-right text-blue-900">High Score</th>
                  <th className="px-4 py-2 text-right text-blue-900">50s</th>
                  <th className="px-4 py-2 text-right text-blue-900">100s</th>
                </tr>
              </thead>
              <tbody>
                {topBatsmen.map((player, index) => (
                  <tr key={player.player_id || index} className="border-b hover:bg-blue-50">
                    <td className="px-4 py-3 font-semibold">{index + 1}</td>
                    <td className="px-4 py-3">
                      {player.match_ids && player.match_ids.length > 0 ? (
                        <a
                          href={getPlayCricketUrl(player.match_ids[0])}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-700 hover:text-blue-900 hover:underline font-medium"
                        >
                          {player.known_as || player.player_name}
                        </a>
                      ) : (
                        <span>{player.known_as || player.player_name}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">{player.runs}</td>
                    <td className="px-4 py-3 text-right">{player.innings}</td>
                    <td className="px-4 py-3 text-right">{player.average || '-'}</td>
                    <td className="px-4 py-3 text-right">{player.high_score || '-'}</td>
                    <td className="px-4 py-3 text-right">{player.fifties || 0}</td>
                    <td className="px-4 py-3 text-right">{player.hundreds || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No batting statistics available</p>
        )}
      </section>

      {/* Top Wicket Takers */}
      <section className="bg-white rounded-lg shadow-lg p-8 border-t-4 border-yellow-500">
        <h3 className="text-2xl font-bold mb-6 text-blue-800 border-b-2 border-blue-700 pb-2">
          {title} - Top Wicket Takers
        </h3>
        {topBowlers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-blue-100">
                  <th className="px-4 py-2 text-left text-blue-900">Rank</th>
                  <th className="px-4 py-2 text-left text-blue-900">Player</th>
                  <th className="px-4 py-2 text-right text-blue-900">Wickets</th>
                  <th className="px-4 py-2 text-right text-blue-900">Runs</th>
                  <th className="px-4 py-2 text-right text-blue-900">Average</th>
                  <th className="px-4 py-2 text-right text-blue-900">Economy</th>
                </tr>
              </thead>
              <tbody>
                {topBowlers.map((player, index) => (
                  <tr key={player.player_id || index} className="border-b hover:bg-blue-50">
                    <td className="px-4 py-3 font-semibold">{index + 1}</td>
                    <td className="px-4 py-3">
                      {player.match_ids && player.match_ids.length > 0 ? (
                        <a
                          href={getPlayCricketUrl(player.match_ids[0])}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-700 hover:text-blue-900 hover:underline font-medium"
                        >
                          {player.known_as || player.player_name}
                        </a>
                      ) : (
                        <span>{player.known_as || player.player_name}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">{player.wickets}</td>
                    <td className="px-4 py-3 text-right">{player.runs_conceded}</td>
                    <td className="px-4 py-3 text-right">{player.bowling_average || '-'}</td>
                    <td className="px-4 py-3 text-right">{player.economy_rate || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No bowling statistics available</p>
        )}
      </section>
    </>
  );
}

export default function HonoursBoard({ clubId }: HonoursBoardProps) {
  const [data, setData] = useState<HonoursData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getPlayCricketUrl = (matchId: string) => {
    const baseUrl = clubId === '27452'
      ? 'https://oldimperials.play-cricket.com'
      : 'https://imperial.play-cricket.com';
    return `${baseUrl}/website/results/${matchId}`;
  };

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/stats?clubId=${clubId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [clubId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-xl text-gray-600">Loading honours board...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-xl text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const allTimeTopBatsmen = data.allTime.batting
    ?.filter(p => (p.runs || 0) > 0)
    ?.sort((a, b) => (b.runs || 0) - (a.runs || 0))
    ?.slice(0, 10) || [];

  const allTimeTopBowlers = data.allTime.bowling
    ?.filter(p => (p.wickets || 0) > 0)
    ?.sort((a, b) => (b.wickets || 0) - (a.wickets || 0))
    ?.slice(0, 10) || [];

  const allTimeCenturions = data.allTime.key_performances
    ?.filter(p => p.performance_type === 'century')

  const allTimeFiveWicketHauls = data.allTime.key_performances
    ?.filter(p => p.performance_type === 'five_wicket')

  return (
    <div className="space-y-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2 text-blue-900">
          {data.club.name}
        </h1>
        <h2 className="text-2xl text-gray-700">Roll of Honour</h2>
      </div>

      {/* All Time Stats */}
      <div className="space-y-8">
        <h2 className="text-3xl font-bold text-center text-blue-900 pt-8 border-t-4 border-yellow-500">
          All Time
        </h2>
        <EventsTable
          title="Centuries"
          events={allTimeCenturions || []}
          keyStatLabel='Runs'
          getPlayCricketUrl={getPlayCricketUrl}
        />
        <EventsTable
          title="Five Wicket Hauls"
          events={allTimeFiveWicketHauls || []}
          keyStatLabel='Figures'
          getPlayCricketUrl={getPlayCricketUrl}
        />
        <StatsTable
          title="All Time"
          topBatsmen={allTimeTopBatsmen}
          topBowlers={allTimeTopBowlers}
          getPlayCricketUrl={getPlayCricketUrl}
        />
      </div>

      {/* Season by Season Stats */}
      {data.seasons.map((seasonData) => {
        const topBatsmen = seasonData.stats.batting
          ?.filter(p => (p.runs || 0) > 0)
          ?.sort((a, b) => (b.runs || 0) - (a.runs || 0))
          ?.slice(0, 10) || [];

        const topBowlers = seasonData.stats.bowling
          ?.filter(p => (p.wickets || 0) > 0)
          ?.sort((a, b) => (b.wickets || 0) - (a.wickets || 0))
          ?.slice(0, 10) || [];

        return (
          <div key={seasonData.season} className="space-y-8">
            <h2 className="text-3xl font-bold text-center text-blue-900 pt-8 border-t-4 border-yellow-500">
              {seasonData.season} Season
            </h2>
            <StatsTable
              title={seasonData.season}
              topBatsmen={topBatsmen}
              topBowlers={topBowlers}
              getPlayCricketUrl={getPlayCricketUrl}
            />
          </div>
        );
      })}

      {/* Footer */}
      <footer className="text-center text-gray-500 text-sm pt-8 border-t">
        <p>Data provided by Play-Cricket API</p>
        <p className="mt-1">Last updated: {new Date().toLocaleDateString()}</p>
      </footer>
    </div>
  );
}
