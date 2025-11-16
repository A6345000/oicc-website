import { NextRequest, NextResponse } from 'next/server';
import { getResultSummary, getMatchDetail } from '@/lib/playcricket';
import { unstable_cache } from 'next/cache';
import { parse, format } from 'date-fns';

// Enable Next.js caching - revalidate every hour (3600 seconds)
export const revalidate = 3600;

interface BattingStats {
  [key: string]: {
    player_id: string;
    player_name: string;
    known_as?: string;
    runs: number;
    innings: number;
    not_outs: number;
    high_score: number;
    fifties: number;
    hundreds: number;
    matches: Set<string>;
    match_ids: string[];
  };
}

interface BowlingStats {
  [key: string]: {
    player_id: string;
    player_name: string;
    known_as?: string;
    wickets: number;
    runs_conceded: number;
    overs: number;
    maidens: number;
    five_wickets: number;
    matches: Set<string>;
    match_ids: string[];
  };
}

interface KeyPerformanceStats {
  match_id: string;
  player_id: string;
  player_name: string;
  known_as?: string;
  match_date: Date;
  opposition: string;
  key_stat?: number | string;
  performance_type: 'century' | 'five_wicket';
}

async function processMatchesForSeason(matchIds: string[], clubId: string, apiKey: string) {
  const battingStats: BattingStats = {};
  const bowlingStats: BowlingStats = {};
  const keyPerformanceStats: KeyPerformanceStats[] = [];

  for (const matchId of matchIds) {
    try {
      const matchDetail = await getMatchDetail(matchId.toString(), apiKey);

      if (!matchDetail?.match_details?.[0]?.innings) continue;

      const match = matchDetail.match_details[0];
      const matchIdStr = match.id.toString();

      // Strict validation: ensure this match actually involves our club
      const isOurClubInMatch =
        match.home_club_id === clubId || match.away_club_id === clubId;

      if (!isOurClubInMatch) {
        console.warn(`Match ${matchId} does not involve club ${clubId}, skipping...`);
        continue;
      }

      const oppositionClubName =
        match.home_club_id === clubId
          ? match.away_club_name || match.away_team_name || 'Gary Flanders CC'
          : match.home_club_name || match.home_team_name || 'Gary Flanders CC';   
          
      const matchDateParsed =
        parse( match.match_date, "dd/MM/yyyy", new Date() ) || 'Unknown'

      // Process each innings
      for (const innings of match.innings) {
        // Determine if this innings is our team batting or opposition batting
        const isOurTeamBatting =
          (innings.team_batting_id === match.away_team_id && match.away_club_id === clubId) ||
          (innings.team_batting_id === match.home_team_id && match.home_club_id === clubId);

        // When our team is batting, collect batting stats
        if (isOurTeamBatting && innings.bat) {
          for (const batsman of innings.bat) {
            const playerId = batsman.batsman_id || batsman.batsman_name;
            const playerName = batsman.batsman_name;

            if (!battingStats[playerId]) {
              battingStats[playerId] = {
                player_id: playerId,
                player_name: playerName,
                known_as: playerName,
                runs: 0,
                innings: 0,
                not_outs: 0,
                high_score: 0,
                fifties: 0,
                hundreds: 0,
                matches: new Set(),
                match_ids: [],
              };
            }

            const runs = parseInt(batsman.runs || '0');
            battingStats[playerId].runs += runs;
            battingStats[playerId].innings += 1;
            battingStats[playerId].matches.add(matchIdStr);
            if (!battingStats[playerId].match_ids.includes(matchIdStr)) {
              battingStats[playerId].match_ids.push(matchIdStr);
            }

            if (batsman.how_out?.toLowerCase().includes('not out') || batsman.how_out === '') {
              battingStats[playerId].not_outs += 1;
            }

            if (runs > battingStats[playerId].high_score) {
              battingStats[playerId].high_score = runs;
            }

            if (runs >= 50 && runs < 100) {
              battingStats[playerId].fifties += 1;
            }
            if (runs >= 100) {
              battingStats[playerId].hundreds += 1;
              keyPerformanceStats.push({
                match_id: matchIdStr,
                player_id: playerId,
                player_name: playerName,
                known_as: playerName,
                match_date: matchDateParsed,
                opposition: oppositionClubName,
                key_stat: runs,
                performance_type: 'century',
              });
            }
          }
        }

        // When opposition is batting, collect our bowling stats (from the bowl array in their innings)
        if (!isOurTeamBatting && innings.bowl) {
          for (const bowler of innings.bowl) {
            const playerId = bowler.bowler_id || bowler.bowler_name;
            const playerName = bowler.bowler_name;

            if (!bowlingStats[playerId]) {
              bowlingStats[playerId] = {
                player_id: playerId,
                player_name: playerName,
                known_as: playerName,
                wickets: 0,
                runs_conceded: 0,
                overs: 0,
                maidens: 0,
                five_wickets: 0,
                matches: new Set(),
                match_ids: [],
              };
            }

            const wickets = parseInt(bowler.wickets || '0');
            const runs = parseInt(bowler.runs || '0');
            const overs = parseFloat(bowler.overs || '0');
            const maidens = parseInt(bowler.maidens || '0');

            bowlingStats[playerId].wickets += wickets;
            bowlingStats[playerId].runs_conceded += runs;
            bowlingStats[playerId].overs += overs;
            bowlingStats[playerId].maidens += maidens;
            bowlingStats[playerId].matches.add(matchIdStr);
            if (!bowlingStats[playerId].match_ids.includes(matchIdStr)) {
              bowlingStats[playerId].match_ids.push(matchIdStr);
            }

            if (wickets >= 5) {
              bowlingStats[playerId].five_wickets += 1;
              keyPerformanceStats.push({
                match_id: matchIdStr,
                player_id: playerId,
                player_name: playerName,
                known_as: playerName,
                match_date: matchDateParsed,
                opposition: oppositionClubName,
                key_stat: `${wickets} - ${runs}`,
                performance_type: 'five_wicket',
              });
            }
          }
        }
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Error fetching match ${matchId}:`, error);
      // Continue with next match
    }
  }

  // Convert to arrays and calculate averages
  const batting = Object.values(battingStats).map(player => {
    const completedInnings = player.innings - player.not_outs;
    const average = completedInnings > 0
      ? (player.runs / completedInnings).toFixed(2)
      : player.runs.toFixed(2);
    return {
      ...player,
      average,
      matches: player.matches.size,
    };
  });

  const bowling = Object.values(bowlingStats).map(player => {
    const bowling_average = player.wickets > 0
      ? (player.runs_conceded / player.wickets).toFixed(2)
      : '-';
    const economy_rate = player.overs > 0
      ? (player.runs_conceded / player.overs).toFixed(2)
      : '-';
    return {
      ...player,
      bowling_average,
      economy_rate,
      matches: player.matches.size,
    };
  });

  // Sort key performances by date
  const key_performances = keyPerformanceStats
    .sort((a, b) => a.match_date.getTime() - b.match_date.getTime())
    .map(performance => ({
      ...performance,
      match_date: format(performance.match_date, 'dd MMMM yyyy'),
    }));

  return { batting, bowling, key_performances };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const clubId = searchParams.get('clubId');

  if (!clubId) {
    return NextResponse.json({ error: 'Club ID is required' }, { status: 400 });
  }

  const apiKey = process.env.PLAY_CRICKET_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  try {
    // Use cached function with club-specific cache key
    const getCachedStatsForClub = unstable_cache(
      async (clubId: string, apiKey: string) => {
        // Fetch result summary for last 10 years
        const currentYear = new Date().getFullYear();
        const seasons = [];
        for (let year = currentYear; year >= currentYear - 9; year--) {
          seasons.push(year.toString());
        }

        // Fetch all seasons in parallel
        const seasonSummaries = await Promise.all(
          seasons.map(async (season) => {
            try {
              const summary = await getResultSummary(clubId, apiKey, season);
              return { season, summary };
            } catch {
              return { season, summary: null };
            }
          })
        );

        // Filter out empty seasons and collect matches by season
        const seasonData: any[] = [];
        const allMatchIds: string[] = [];

        for (const { season, summary } of seasonSummaries) {
          if (summary?.result_summary && summary.result_summary.length > 0) {
            const matches = summary.result_summary;
            const matchIds = matches.slice(0, 20).map((m: any) => m.id); // Limit per season
            allMatchIds.push(...matchIds);
            seasonData.push({
              season,
              matchIds,
              matchCount: matches.length,
            });
          }
        }

        if (allMatchIds.length === 0) {
          return {
            club: {
              id: clubId,
              name: clubId === '27452' ? 'Old Imperials CC' : 'Imperial College Union CC',
              shortName: clubId === '27452' ? 'OICC' : 'ICUCC',
            },
            allTime: { batting: [], bowling: [], key_performances: [] },
            seasons: [],
          };
        }

        // Process all-time stats (use first 50 matches across all seasons)
        const allTimeStats = await processMatchesForSeason(
          allMatchIds.slice(0, 50),
          clubId,
          apiKey
        );

        // Process stats for each season
        const seasonsWithStats = [];
        for (const { season, matchIds } of seasonData) {
          const stats = await processMatchesForSeason(matchIds, clubId, apiKey);
          seasonsWithStats.push({
            season,
            stats,
          });
        }

        return {
          club: {
            id: clubId,
            name: clubId === '27452' ? 'Old Imperials CC' : 'Imperial College Union CC',
            shortName: clubId === '27452' ? 'OICC' : 'ICUCC',
          },
          allTime: allTimeStats,
          seasons: seasonsWithStats,
        };
      },
      [`cricket-stats-${clubId}`], // Club-specific cache key
      {
        revalidate: 3600, // Revalidate every hour
        tags: [`cricket-stats-${clubId}`], // Club-specific tags for cache invalidation
      }
    );

    const honoursData = await getCachedStatsForClub(clubId, apiKey);
    return NextResponse.json(honoursData);
  } catch (error) {
    console.error('Error fetching cricket data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cricket data', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
