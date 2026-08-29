const clientId = 'lrh6dcf697l3kymiqcmtxxdlwnrs3d';
const token = 'szkydj6gnh2kq30cfwgynyo5dzsl6m';

function getSeriesBaseName(gameName) {
  // Extract base series name before colons, numbers, or subtitles
  let base = gameName.split(/[:\-\d]/)[0].trim();
  // If base name is too short (e.g. < 3 chars), fallback to full name
  if (base.length < 3) base = gameName;
  return base;
}

async function fetchTimeline(gameName) {
  const baseName = getSeriesBaseName(gameName);
  console.log(`\nBase name for "${gameName}" -> "${baseName}"`);

  const body = `fields name, first_release_date, cover.url, cover.image_id, total_rating_count; where name ~ *"${baseName}"* & cover != null; sort first_release_date asc; limit 12;`;
  
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
    // Filter out minor DLCs or low-rating duplicate entries
    const seenNames = new Set();
    const filtered = data.filter(g => {
      const cleanName = g.name.replace(/(Remastered|Remake|Collector's Edition|Digital Deluxe|Premium Edition)/gi, '').trim();
      if (seenNames.has(cleanName)) return false;
      seenNames.add(cleanName);
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
