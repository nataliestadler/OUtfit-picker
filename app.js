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
const occasions = {
  'university': 'University',
  'work': 'Work',
  'gym': 'Gym',
  'going-out': 'Going out'
};

// Untagged clothes are suitable for every occasion.
function matches(i) {
  return occasion === 'all' || !i.occasions?.length || i.occasions.includes(occasion)
}
const $ = id => document.getElementById(id);

// Save wardrobe photos, favorite looks, and the current outfit locally.
function persist() {
  try {
    localStorage.setItem('outfit-roulette-v1', JSON.stringify({
      items,
      saved,
      look,
      occasion
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
    small.textContent = labels[item.cat] + ' · ' + (item.occasions?.length ? item.occasions.map(o => occasions[o]).join(', ') : 'Any occasion');
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
    b.textContent = 'Look ' + (idx + 1);
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
function shuffle() {
  cats.forEach(cat => {
    if (locks[cat] && items.some(i => i.id === look[cat] && matches(i))) return;
    let pool = items.filter(i => i.cat === cat && matches(i));
    const other = pool.filter(i => i.id !== look[cat]);
    if (other.length) pool = other;
    if (pool.length) look[cat] = pool[Math.floor(Math.random() * pool.length)].id;
    else {
      delete look[cat];
      locks[cat] = false
    }
  });
  persist();
  render();
  $('status').textContent = cats.some(c => !look[c]) ? 'No matching pieces in some categories. Add or tag clothes for this occasion.' : 'A fresh little look' + (occasion === 'all' ? '' : ' for ' + occasions[occasion].toLowerCase()) + '. ✨'
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
