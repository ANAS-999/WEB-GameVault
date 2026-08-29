const clientId = 'lrh6dcf697l3kymiqcmtxxdlwnrs3d';
const token = 'szkydj6gnh2kq30cfwgynyo5dzsl6m';

function getSeriesBaseName(gameName) {
  if (gameName.toLowerCase().includes('grand theft auto') || gameName.toLowerCase().includes('gta')) {
    return 'Grand Theft Auto';
  }

  const knownFranchises = [
    'God of War', 'The Witcher', 'Baldur\'s Gate', 'Grand Theft Auto',
    'Red Dead', 'Portal', 'Cyberpunk', 'Elden Ring', 'Hollow Knight',
    'Zelda', 'Mario', 'Spider-Man', 'Call of Duty', 'Assassin\'s Creed',
    'Final Fantasy', 'Resident Evil', 'Halo', 'Mass Effect', 'Dark Souls',
    'Fallout', 'Elder Scrolls', 'Monster Hunter', 'Street Fighter', 'Tekken',
    'Uncharted', 'Tomb Raider', 'Far Cry', 'Batman', 'Bioshock', 'Persona'
  ];

  for (const franchise of knownFranchises) {
    if (gameName.toLowerCase().includes(franchise.toLowerCase())) {
      return franchise;
    }
  }

  let base = gameName.split(/[:\-]/)[0];
  base = base.replace(/\b(I|II|III|IV|V|VI|VII|VIII|IX|X|\d+)\b/gi, '').trim();
  return base.length >= 3 ? base : gameName;
}

async function fetchGtaTimeline(gameName) {
  const baseName = getSeriesBaseName(gameName);
  console.log(`Base name for "${gameName}" -> "${baseName}"`);

  const body = `fields name, first_release_date, cover.url, cover.image_id, total_rating_count; where name ~ *"${baseName}"* & cover != null & total_rating_count > 5; sort first_release_date asc; limit 50;`;
  
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
    const dlcKeywords = [
      'ballad of gay tony', 'lost and damned', 'dlc', 'expansion', 'episode',
      'soundtrack', 'pack', 'bundle', 'collection', 'trilogy', 'remastered',
      'edition', 'addon', 'online', 'pass', 'guide', 'vr', 'ifruit', 'london', 'complete'
    ];

    const seenMainKeys = new Set();
    const filtered = data.filter(g => {
      const lower = g.name.toLowerCase();

      // Exclude DLCs/expansions/modpacks
      if (dlcKeywords.some(kw => lower.includes(kw))) return false;

      // Extract core main title (e.g. "Grand Theft Auto V")
      const cleanKey = lower
        .replace(/^(the\s+)/i, '')
        .replace(/:\s*(story mode|enhanced|remastered|collector's edition|digital deluxe|premium edition|launch edition|jötnar edition|valhalla|definitive edition|special edition).*/i, '')
        .replace(/[^a-z0-9]/gi, '');

      if (seenMainKeys.has(cleanKey)) return false;
      seenMainKeys.add(cleanKey);
      return true;
    });

    console.log('\nMain Official Story Line Games:');
    filtered.forEach(g => {
      const year = g.first_release_date ? new Date(g.first_release_date * 1000).getFullYear() : 'N/A';
      console.log(`- [${year}] ${g.name}`);
    });
  }
}

fetchGtaTimeline('Grand Theft Auto V');
