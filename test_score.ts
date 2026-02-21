import { fetchAllStatsData } from './src/services/supabaseStatsService';
async function test() {
    const data = await fetchAllStatsData();
    const g = data.games.find(g => g.videoData && g.videoData.length > 0 && g.videoData[0].events && g.videoData[0].events.length > 0);
    console.log(JSON.stringify(g));
}
test();
