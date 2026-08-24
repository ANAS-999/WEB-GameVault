const clientId = 'lrh6dcf697l3kymiqcmtxxdlwnrs3d';
const token = 'szkydj6gnh2kq30cfwgynyo5dzsl6m';

async function testSearch(term) {
  console.log(`Testing term: "${term}"`);
  
  // 1. Try search endpoint
  const body1 = `search "${term}"; fields name, total_rating_count, cover.url; limit 36;`;
  const res1 = await fetch('https://api.igdb.com/v4/games', {
    method: 'POST',
    headers: { 'Client-ID': clientId, 'Authorization': 'Bearer ' + token, 'Content-Type': 'text/plain' },
    body: body1
  });
  let results1 = await res1.json();

  if (Array.isArray(results1) && results1.length > 0) {
    console.log(`Search endpoint succeeded for "${term}":`, results1.slice(0, 5).map(g => g.name));
    return;
  }

  console.log(`Search endpoint returned 0 results for "${term}". Falling back to wildcard name matching...`);
  const body2 = `fields name, summary, rating, total_rating, total_rating_count, first_release_date, cover.url, cover.image_id, genres.name, platforms.name, screenshots.url, screenshots.image_id, websites.category, websites.url; where name ~ *"${term}"* & cover != null; sort total_rating_count desc; limit 36;`;
  const res2 = await fetch('https://api.igdb.com/v4/games', {
    method: 'POST',
    headers: { 'Client-ID': clientId, 'Authorization': 'Bearer ' + token, 'Content-Type': 'text/plain' },
    body: body2
  });
  let results2 = await res2.json();
  if (Array.isArray(results2)) {
    results2.sort((a, b) => (b.total_rating_count || 0) - (a.total_rating_count || 0));
    console.log(`Wildcard search succeeded for "${term}":`, results2.slice(0, 5).map(g => g.name));
  }
}

async function run() {
  await testSearch('Detroi');
  await testSearch('Detroit');
  await testSearch('Witch');
  await testSearch('Red De');
}

run();
