const clientId = 'lrh6dcf697l3kymiqcmtxxdlwnrs3d';
const token = 'szkydj6gnh2kq30cfwgynyo5dzsl6m';

async function testTimeline() {
  const body = `fields name, first_release_date, cover.url, cover.image_id; where name ~ *"God of War"* & cover != null; sort first_release_date asc; limit 10;`;
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
  console.log(JSON.stringify(data, null, 2));
}

testTimeline();
