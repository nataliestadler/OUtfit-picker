import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';
env.allowLocalModels = false;
env.backends.onnx.wasm.numThreads = 1;
let classifier;
const pieces = [
  ['a t-shirt','top','T-shirt'], ['a blouse','top','Blouse'],
  ['a shirt','top','Shirt'], ['a sweater','top','Sweater'],
  ['a cardigan','top','Cardigan'], ['a jacket','top','Jacket'],
  ['jeans','bottom','Jeans'], ['trousers','bottom','Trousers'],
  ['a skirt','bottom','Skirt'], ['shorts','bottom','Shorts'],
  ['sneakers','shoes','Sneakers'], ['boots','shoes','Boots'],
  ['high heel shoes','shoes','Heels'], ['sandals','shoes','Sandals'],
  ['a handbag','accessory','Handbag'], ['a hat','accessory','Hat'],
  ['a scarf','accessory','Scarf'], ['jewelry','accessory','Jewelry'],
  ['a dress','unsupported','Dress'], ['a jumpsuit','unsupported','Jumpsuit'],
  ['an object that is not clothing','unsupported','Not a clothing piece']
];
self.onmessage = async ({data}) => {
  try {
    if (!classifier) classifier = await pipeline('zero-shot-image-classification', 'Xenova/clip-vit-base-patch32', {
      quantized: true,
      progress_callback: event => self.postMessage({id:data.id, type:'progress', text: event.status === 'progress' ? 'Downloading model: ' + Math.round(event.progress || 0) + '% of ' + (event.file || 'file') : 'Loading AI model…'})
    });
    self.postMessage({id:data.id,type:'progress',text:'Analyzing your photo…'});
    const labels = pieces.map(p => 'a photo of ' + p[0]);
    const results = await classifier(data.photo, labels);
    const suggestions = results.slice(0,3).map(r => {
      const piece = pieces[labels.indexOf(r.label)];
      return {category:piece[1],name:piece[2],score:r.score};
    });
    self.postMessage({id:data.id,type:'result',suggestions});
  } catch (error) {
    classifier = null;
    self.postMessage({id:data.id,type:'error',text:'AI could not load or analyze this photo. Check your connection, try Chrome, or select the category manually.'});
  }
};
