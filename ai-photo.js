const button = document.getElementById('analyze-photo');
const status = document.getElementById('ai-status');
const suggestions = document.getElementById('ai-suggestions');
const photoInput = document.getElementById('photo');
let worker, request = 0, chosenFile, formSession = 0, analysisSession = 0;
function resetResult() { formSession++; suggestions.replaceChildren(); status.textContent = ''; }
photoInput.addEventListener('change', resetResult);
document.getElementById('modal').addEventListener('close', resetResult);
function finish() { button.disabled = false; }
button.onclick = async () => {
  const file = photoInput.files[0];
  if (!file) { status.textContent = 'Choose a clothing photo using the Photo field first.'; return; }
  const session = formSession;
  chosenFile = file;
  analysisSession = session;
  button.disabled = true;
  suggestions.replaceChildren();
  status.textContent = 'Preparing photo…';
  try {
    const image = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, 512 / Math.max(image.width,image.height));
    canvas.width = Math.round(image.width*scale); canvas.height = Math.round(image.height*scale);
    canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height); image.close();
    if (session !== formSession) { finish(); return; }
    if (!worker) {
      worker = new Worker(new URL('./ai-worker.js', import.meta.url), {type:'module'});
      worker.onmessage = ({data}) => {
        if (data.id !== request) return;
        if (chosenFile !== photoInput.files[0] || analysisSession !== formSession || !document.getElementById('modal').open) { if(data.type!=='progress')finish(); return; }
        if (data.type === 'progress') { status.textContent = data.text; return; }
        finish();
        if (data.type === 'error') { status.textContent = data.text; return; }
        status.textContent = 'AI suggestions — choose one or keep your own category. These are guesses, not certainty percentages.';
        data.suggestions.forEach(suggestion => {
          const choice = document.createElement('button'); choice.type='button'; choice.className='filter';
          choice.textContent = suggestion.name + (suggestion.category==='unsupported' ? ' (not supported yet)' : '');
          choice.onclick = () => {
            if(suggestion.category==='unsupported'){status.textContent='This app currently combines separate tops and bottoms. Dresses and jumpsuits need a separate outfit mode.';return;}
            document.getElementById('category').value=suggestion.category;
            if(!document.getElementById('name').value.trim())document.getElementById('name').value=suggestion.name;
            status.textContent='Applied '+suggestion.name+'. Review the color, weather, and occasion tags before saving.';
          };
          suggestions.append(choice);
        });
      };
      worker.onerror = () => { status.textContent='Could not start AI. Manual categories still work.';finish();worker.terminate();worker=null; };
    }
    // Install a fresh handler session for each request by recreating the worker when the form changed.
    worker.postMessage({id:++request,photo:canvas.toDataURL('image/jpeg',.85)});
  } catch(error) { status.textContent='Could not read this photo. Try a JPG or PNG.';finish(); }
};
