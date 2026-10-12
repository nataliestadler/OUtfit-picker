// Wardrobe categories and display labels.
const cats = ['top', 'bottom', 'shoes', 'accessory'],
  icons = {
    top: '👚',
    bottom: '👖',
    shoes: '👟',
    accessory: '👜'
  },
  labels = {
    top: 'Tops',
    bottom: 'Bottoms',
    shoes: 'Shoes',
    accessory: 'Accessories'
  };
// Starter pieces for a new wardrobe.
const demo = [
  ['White baby tee', 'top', '🤍'],
  ['Pink cardigan', 'top', '👚'],
  ['Classic shirt', 'top', '👔'],
  ['Blue jeans', 'bottom', '👖'],
  ['Black mini skirt', 'bottom', '🖤'],
  ['Cream trousers', 'bottom', '🤎'],
  ['Everyday sneakers', 'shoes', '👟'],
  ['Going-out heels', 'shoes', '👠'],
  ['Comfy boots', 'shoes', '👢'],
  ['Little pink bag', 'accessory', '👜'],
  ['Gold earrings', 'accessory', '✨'],
  ['Favorite sunnies', 'accessory', '🕶️']
].map((x, i) => ({
  id: 'demo' + i,
  name: x[0],
  cat: x[1],
  emoji: x[2]
}));
// Keep the existing storage key so saved wardrobes remain compatible.
let data;
try {
  data = JSON.parse(localStorage.getItem('outfit-roulette-v1'))
} catch {}
let items = data?.items || demo,
  saved = data?.saved || [],
  look = data?.look || {},
  locks = {},
  filter = 'all',
  occasion = data?.occasion || 'all',
  editing = null;
let weather = data?.weather || 'all';
const occasions = {
  'university': 'University',
  'work': 'Work',
  'gym': 'Gym',
  'going-out': 'Going out'
};

// Untagged clothes are suitable for every occasion.
function matches(i) {
  return (occasion === 'all' || !i.occasions?.length || i.occasions.includes(occasion)) && (weather === 'all' || !i.weather?.length || i.weather.includes(weather));
}
const $ = id => document.getElementById(id);

// Save wardrobe photos, favorite looks, and the current outfit locally.
function persist() {
  try {
    localStorage.setItem('outfit-roulette-v1', JSON.stringify({
      items,
      saved,
      look,
      occasion,
      weather,
      forecastDay: Number($('forecast-day').value)
    }));
    return true
  } catch {
    $('status').textContent = 'Your browser storage is full. Remove a few photo pieces to save more.';
    return false
  }
}

// Display a clothing photo or its fallback icon.
function visual(item, parent) {
  if (item?.photo) {
    const img = document.createElement('img');
    img.src = item.photo;
    img.alt = item.name;
    parent.append(img)
  } else {
    const e = document.createElement('div');
    e.className = 'icon';
    e.textContent = item?.emoji || icons[item?.cat] || '✧';
    parent.append(e)
  }
}

// Refresh outfit slots, wardrobe cards, filters, and saved looks.
function render() {
  $('occasion').value = occasion;
  $('weather').value = weather;
  const slots = $('slots');
  slots.replaceChildren();
  cats.forEach(cat => {
    const item = items.find(i => i.id === look[cat]);
    const box = document.createElement('div');
    box.className = 'slot';
    const btn = document.createElement('button');
    btn.className = 'lock' + (locks[cat] ? ' active' : '');
    btn.textContent = locks[cat] ? '🔒' : '🔓';
    btn.setAttribute('aria-label', (locks[cat] ? 'Unlock ' : 'Lock ') + cat);
    btn.onclick = () => {
      locks[cat] = !locks[cat];
      render()
    };
    box.append(btn);
    visual(item || {
      cat
    }, box);
    const b = document.createElement('b');
    b.textContent = item?.name || 'Add a ' + cat;
    box.append(b);
    const small = document.createElement('small');
    small.textContent = cat;
    box.append(small);
    slots.append(box)
  });
  const w = $('wardrobe');
  w.replaceChildren();
  items.filter(i => (filter === 'all' || i.cat === filter) && matches(i)).forEach(item => {
    const box = document.createElement('div');
    box.className = 'item';
    visual(item, box);
    const b = document.createElement('b');
    b.textContent = item.name;
    box.append(b);
    const small = document.createElement('small');
    small.textContent = (item.color && item.color !== 'unknown' ? item.color + ' · ' : '') + (item.weather?.length ? item.weather.join(', ') + ' · ' : '') + labels[item.cat] + ' · ' + (item.occasions?.length ? item.occasions.map(o => occasions[o]).join(', ') : 'Any occasion');
    box.append(small);
    const del = document.createElement('button');
    del.className = 'delete';
    del.textContent = '×';
    del.setAttribute('aria-label', 'Remove ' + item.name);
    del.onclick = () => {
      items = items.filter(i => i.id !== item.id);
      if (look[item.cat] === item.id) {
        delete look[item.cat];
        locks[item.cat] = false
      }
      persist();
      render()
    };
    const edit = document.createElement('button');
    edit.textContent = 'Edit';
    edit.className = 'filter';
    edit.style.marginTop = '7px';
    edit.onclick = () => openPiece(item);
    box.append(del, edit);
    w.append(box)
  });
  if (!w.children.length) w.textContent = 'Your next favorite piece goes here. Add one above!';
  $('filters').replaceChildren();
  ['all', ...cats].forEach(cat => {
    const b = document.createElement('button');
    b.className = 'filter' + (filter === cat ? ' active' : '');
    b.textContent = cat === 'all' ? 'All pieces' : labels[cat];
    b.onclick = () => {
      filter = cat;
      render()
    };
    $('filters').append(b)
  });
  $('saved').replaceChildren();
  $('savedcount').textContent = saved.length + ' saved';
  saved.forEach((s, idx) => {
    const box = document.createElement('div');
    box.className = 'saved-card';
    const b = document.createElement('b');
    b.textContent = (s.plannedDay ? s.plannedDay + ' · ' : '') + 'Look ' + (idx + 1);
    box.append(b);
    const p = document.createElement('p');
    p.textContent = s.pieces.map(i => i.name).join(' + ');
    box.append(p);
    const load = document.createElement('button');
    load.textContent = 'Wear again';
    load.onclick = () => {
      look = {};
      s.pieces.forEach(i => {
        if (items.some(x => x.id === i.id)) look[i.cat] = i.id
      });
      locks = {};
      occasion = 'all';
      weather = 'all';
      persist();
      render();
      $('status').textContent = 'Look restored. Removed pieces need a new pick.'
    };
    const del = document.createElement('button');
    del.textContent = 'Remove';
    del.onclick = () => {
      saved = saved.filter(x => x.id !== s.id);
      persist();
      render()
    };
    box.append(load, del);
    $('saved').append(box)
  });
  if (!saved.length) {
    const p = document.createElement('p');
    p.textContent = 'Find a look you love, then tap ♡ Save look.';
    $('saved').append(p)
  }
}

// Pick matching clothes, respecting compatible locked pieces.
// Score simple color combinations. Unknown colors never exclude a piece.
const neutralColors = new Set(['black', 'white', 'gray', 'cream', 'brown', 'navy']);
const colorHues = {
  red: 0,
  orange: 30,
  yellow: 60,
  green: 120,
  blue: 220,
  purple: 280,
  pink: 330
};

function colorScore(a, b) {
  if (!a || !b || a === 'unknown' || b === 'unknown') return 0;
  if (a === b) return 2;
  if (neutralColors.has(a) || neutralColors.has(b)) return 3;
  let distance = Math.abs(colorHues[a] - colorHues[b]);
  distance = Math.min(distance, 360 - distance);
  if (distance <= 65) return 2;
  if (distance >= 150) return 1;
  return -1;
}

function outfitScore(candidate) {
  const pieces = cats.map(c => items.find(i => i.id === candidate[c])).filter(Boolean);
  let score = 0;
  for (let i = 0; i < pieces.length; i++) {
    for (let k = i + 1; k < pieces.length; k++) score += colorScore(pieces[i].color, pieces[k].color);
  }
  return score;
}

function shuffle() {
  const previous = {
    ...look
  };
  let best = {},
    bestScore = -Infinity;
  // Sample several matching outfits and prefer coordinated colors.
  for (let attempt = 0; attempt < 80; attempt++) {
    const candidate = {};
    cats.forEach(cat => {
      const locked = items.find(i => i.id === previous[cat] && i.cat === cat && matches(i));
      if (locks[cat] && locked) {
        candidate[cat] = locked.id;
        return;
      }
      const pool = items.filter(i => i.cat === cat && matches(i));
      if (pool.length) candidate[cat] = pool[Math.floor(Math.random() * pool.length)].id;
    });
    const unchanged = cats.every(c => candidate[c] === previous[c]);
    const score = outfitScore(candidate) + (unchanged ? -0.25 : 0) + Math.random() * 0.2;
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }
  look = best;
  cats.forEach(c => {
    if (!look[c]) locks[c] = false;
  });
  persist();
  render();
  $('status').textContent = cats.some(c => !look[c]) ?
    'Some categories have no matching clothes. Add pieces or adjust their occasion and weather tags.' :
    'A color-coordinated suggestion. Untagged pieces are included; you make the final call. ✨';
}
$('shuffle').onclick = shuffle;
$('save').onclick = () => {
  const pieces = cats.map(c => items.find(i => i.id === look[c])).filter(Boolean);
  if (!pieces.length) {
    $('status').textContent = 'Add some pieces and shuffle your outfit first.';
    return
  }
  saved.push({
    id: crypto.randomUUID(),
    plannedDay: Number($('forecast-day').value) === 1 ? 'Tomorrow' : 'Today',
    pieces: pieces.map(({
      id,
      name,
      cat
    }) => ({
      id,
      name,
      cat
    }))
  });
  persist();
  render();
  $('status').textContent = 'Saved to your repeat-worthy looks ♡'
};

// Use the same form to add a piece or edit an existing one.
function openPiece(item = null) {
  editing = item?.id || null;
  $('form').reset();
  $('name').value = item?.name || '';
  $('category').value = item?.cat || 'top';
  $('color').value = item?.color || 'unknown';
  document.querySelectorAll('input[name=weather-tag]').forEach(input => {
    input.checked = item?.weather?.includes(input.value) || false;
  });
  $('tags').replaceChildren();
  Object.entries(occasions).forEach(([value, title]) => {
    const label = document.createElement('label');
    label.style.cssText = 'display:flex;align-items:center;gap:5px';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.value = value;
    input.name = 'occasion-tag';
    input.style.width = 'auto';
    input.checked = item?.occasions?.includes(value) || false;
    label.append(input, document.createTextNode(title));
    $('tags').append(label)
  });
  $('form').querySelector('button[type=submit]').textContent = item ? 'Save piece' : 'Add to wardrobe';
  $('formstatus').textContent = '';
  $('modal').showModal()
}
$('add').onclick = () => openPiece();
$('occasion').onchange = () => {
  occasion = $('occasion').value;
  cats.forEach(c => {
    const i = items.find(x => x.id === look[c]);
    if (i && !matches(i)) locks[c] = false
  });
  shuffle()
};
$('weather').onchange = () => {
  weather = $('weather').value;
  shuffle();
};
$('cancel').onclick = () => $('modal').close();

// Resize uploaded photos to limit browser storage use.
function readPhoto(file) {
  return new Promise((resolve, reject) => {
    const img = new Image(),
      url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas'),
        scale = Math.min(1, 500 / Math.max(img.width, img.height));
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', .8))
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Please choose a supported photo, such as JPG or PNG.'))
    };
    img.src = url
  })
}
$('form').onsubmit = async e => {
  e.preventDefault();
  const name = $('name').value.trim();
  if (!name) return;
  try {
    const previous = items.map(i => ({
        ...i
      })),
      old = items.find(i => i.id === editing),
      file = $('photo').files[0],
      photo = file ? await readPhoto(file) : (old?.photo || null);
    const item = {
      ...old,
      id: editing || crypto.randomUUID(),
      name,
      cat: $('category').value,
      photo,
      color: $('color').value,
      weather: [...document.querySelectorAll('input[name=weather-tag]:checked')].map(i => i.value),
      occasions: [...document.querySelectorAll('input[name=occasion-tag]:checked')].map(i => i.value)
    };
    if (editing) items = items.map(i => i.id === editing ? item : i);
    else items.push(item);
    if (!persist()) {
      items = previous;
      $('formstatus').textContent = 'Storage is full. Remove a photo piece first.';
      return
    }
    if (!look[item.cat]) look[item.cat] = item.id;
    persist();
    render();
    $('modal').close();
    $('status').textContent = 'New piece added ♡'
  } catch (err) {
    $('formstatus').textContent = err.message
  }
};
if (!Object.keys(look).length) shuffle();
else render();

// Public Open-Meteo APIs: no secret or paid AI API is needed.
let cityResults = [],
  weatherRequest = 0;
let forecastDay = Number(data?.forecastDay) === 1 ? 1 : 0;
$('forecast-day').value = String(forecastDay);
$('forecast-day').onchange = () => {
  forecastDay = Number($('forecast-day').value);
  ++weatherRequest;
  persist();
  $('weather-status').textContent = 'Day changed. Click Use forecast & pick outfit to refresh weather for ' + (forecastDay ? 'tomorrow' : 'today') + '.';
};
async function fetchWeatherJson(url) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) throw new Error('Weather service unavailable. Please try again later.');
  return response.json();
}

// Tomorrow uses the daily feels-like range in the selected city's timezone.
function weatherFromForecast(current, daily, day = 0) {
  const low = daily?.apparent_temperature_min?.[day];
  const high = daily?.apparent_temperature_max?.[day];
  const temperature = day === 0 ? current.apparent_temperature : (low + high) / 2;
  if (!Number.isFinite(temperature) || (day === 1 && (!Number.isFinite(low) || !Number.isFinite(high)))) throw new Error('Forecast is incomplete.');
  const probability = daily?.precipitation_probability_max?.[day];
  const rainExpected = (day === 0 && (current.precipitation || 0) > 0) || (Number.isFinite(probability) && probability >= 50);
  return {
    tag: rainExpected ? 'rainy' : temperature >= 18 ? 'warm' : 'cold',
    temperature,
    probability,
    low,
    high,
    date: daily?.time?.[day]
  };
}
$('find-city').onclick = async () => {
  const name = $('weather-city').value.trim();
  if (name.length < 2) {
    $('weather-status').textContent = 'Enter at least two letters of your city.';
    return;
  }
  const request = ++weatherRequest;
  $('find-city').disabled = true;
  $('fetch-weather').hidden = true;
  $('city-choice-label').hidden = true;
  $('weather-status').textContent = 'Finding cities…';
  try {
    const query = new URLSearchParams({
      name,
      count: '8',
      language: 'en',
      format: 'json'
    });
    const result = await fetchWeatherJson('https://geocoding-api.open-meteo.com/v1/search?' + query);
    if (request !== weatherRequest) return;
    cityResults = result.results || [];
    $('city-choice').replaceChildren();
    cityResults.forEach((city, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = [city.name, city.admin1, city.country].filter(Boolean).join(', ');
      $('city-choice').append(option);
    });
    $('city-choice-label').hidden = !cityResults.length;
    $('fetch-weather').hidden = !cityResults.length;
    $('weather-status').textContent = cityResults.length ? 'Choose the correct city, then click Use forecast & pick outfit.' : 'No cities found. Try a nearby city or another spelling.';
  } catch (error) {
    if (request === weatherRequest) $('weather-status').textContent = 'Could not find cities. Check your connection and try again. Manual weather still works.';
  } finally {
    $('find-city').disabled = false;
  }
};
$('fetch-weather').onclick = async () => {
  const city = cityResults[Number($('city-choice').value)];
  if (!city) return;
  const request = ++weatherRequest;
  $('fetch-weather').disabled = true;
  $('weather-status').textContent = 'Checking ' + (forecastDay ? 'tomorrow’s forecast…' : 'today’s weather…');
  try {
    const query = new URLSearchParams({
      latitude: city.latitude,
      longitude: city.longitude,
      current: 'temperature_2m,apparent_temperature,precipitation',
      daily: 'precipitation_probability_max,apparent_temperature_min,apparent_temperature_max',
      timezone: 'auto',
      forecast_days: '2'
    });
    const result = await fetchWeatherJson('https://api.open-meteo.com/v1/forecast?' + query);
    if (request !== weatherRequest) return;
    const summary = weatherFromForecast(result.current || {}, result.daily, forecastDay);
    weather = summary.tag;
    shuffle();
    $('weather-status').textContent = city.name + ' · ' + (forecastDay ? 'Tomorrow' : 'Today') + (summary.date ? ' (' + summary.date + ')' : '') + ': ' + (forecastDay ? 'feels-like range ' + Math.round(summary.low) + '–' + Math.round(summary.high) + '°C' : 'feels like ' + Math.round(summary.temperature) + '°C') + (Number.isFinite(summary.probability) ? ', precipitation chance up to ' + summary.probability + '%' : '') + '. Applied ' + weather + ' filter. Checked ' + new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    }) + '. ' + (weather === 'rainy' && summary.temperature < 18 ? 'It’s also cool: consider warm layers.' : '');
  } catch (error) {
    if (request === weatherRequest) $('weather-status').textContent = 'Weather lookup failed. Your previous filter is unchanged; you can select weather manually.';
  } finally {
    $('fetch-weather').disabled = false;
  }
};
$('weather').onchange = () => {
  ++weatherRequest;
  weather = $('weather').value;
  shuffle();
  $('weather-status').textContent = 'Using your manual weather selection.';
};
