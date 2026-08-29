const clientId = 'lrh6dcf697l3kymiqcmtxxdlwnrs3d';
const token = 'szkydj6gnh2kq30cfwgynyo5dzsl6m';

function getSeriesBaseName(gameName) {
  const knownFranchises = [
    'God of War', 'The Witcher', 'Baldur\'s Gate', 'Grand Theft Auto',
    'Red Dead', 'Portal', 'Cyberpunk', 'Elden Ring', 'Hollow Knight',
    'Zelda', 'Mario', 'Spider-Man', 'Call of Duty', 'Assassin\'s Creed',
    'Final Fantasy', 'Resident Evil', 'Halo', 'Mass Effect', 'Dark Souls',
    'Fallout', 'Elder Scrolls', 'Monster Hunter', 'Street Fighter', 'Tekken'
  ];

  for (const franchise of knownFranchises) {
    if (gameName.toLowerCase().includes(franchise.toLowerCase())) {
      return franchise;
    }
  }

  // Fallback: strip subtitles, colons, roman numerals, numbers
  let base = gameName.split(/[:\-]/)[0];
  base = base.replace(/\b(I|II|III|IV|V|VI|VII|VIII|IX|X|\d+)\b/gi, '').trim();
  return base.length >= 3 ? base : gameName;
}

async function fetchTimeline(gameName) {
  const baseName = getSeriesBaseName(gameName);
  console.log(`\nBase series for "${gameName}" -> "${baseName}"`);

  const body = `fields name, first_release_date, cover.url, cover.image_id, total_rating_count; where name ~ *"${baseName}"* & cover != null; sort first_release_date asc; limit 20;`;
  
  const res = await fetch('https://api.igdb.com/v4/games', {
    method: 'POST',
    headers: {
      'Client-ID': clientId,
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'text/plain'
    },
    body: body
  });

  const data = await res.json();
  if (Array.isArray(data)) {
    // Filter out minor DLCs, soundtracks, or duplicate Remakes/Remasters
    const seenBase = new Set();
    const filtered = data.filter(g => {
      const lower = g.name.toLowerCase();
      if (lower.includes('soundtrack') || lower.includes('dlc') || lower.includes('edition')) return false;
      const cleanKey = lower.replace(/^(the\s+)/, '').replace(/[^a-z0-9]/g, '');
      if (seenBase.has(cleanKey)) return false;
      seenBase.add(cleanKey);
      return true;
    });

    console.log('Story Timeline Games:');
    filtered.forEach(g => {
      const year = g.first_release_date ? new Date(g.first_release_date * 1000).getFullYear() : 'N/A';
      console.log(`- [${year}] ${g.name}`);
    });
  }
}

async function run() {
  await fetchTimeline('God of War Ragnarök');
  await fetchTimeline('The Witcher 3: Wild Hunt');
  await fetchTimeline('Baldur\'s Gate 3');
  await fetchTimeline('Portal 2');
}

run();
