import {properties,geography,filterProperties,validateFilters} from './catalogue.js';
import fr from './locales/fr.js';
const $=(s,root=document)=>root.querySelector(s);
const $$=(s,root=document)=>[...root.querySelectorAll(s)];
const number=new Intl.NumberFormat(fr.locale);
const money=p=>`${number.format(p.price)} <small>FCFA${p.transaction==='Location'?' / mois':''}</small>`;
let favorites=[];try{const saved=JSON.parse(localStorage.getItem('mafoss-selection')||'[]');if(Array.isArray(saved))favorites=saved.filter(id=>properties.some(p=>p.id===id));}catch{}
let transaction='Vente',applied={transaction:'Vente'},showAll=false,onlyFavorites=false,toastTimer;
const form=$('#search-form');
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3000)}
function render(){
  let result=filterProperties(properties,{...applied,favorites:onlyFavorites},favorites);
  const sort=$('#sort').value;
  if(sort==='price-asc')result.sort((a,b)=>a.price-b.price);
  if(sort==='price-desc')result.sort((a,b)=>b.price-a.price);
  if(sort==='area-desc')result.sort((a,b)=>b.area-a.area);
  const visible=showAll?result:result.slice(0,3);
  $('#property-grid').innerHTML=visible.map(p=>`<article class="property-card"><div class="property-image"><a href="#bien-${p.id}" data-detail="${p.id}" aria-label="Découvrir ${p.title}"><img src="assets/${p.image}" alt="${p.visual} — ${p.title}, bien fictif" width="1536" height="1024" loading="lazy"></a><span class="tag">${p.transaction==='Vente'?'À VENDRE':'À LOUER'} · FICTIF</span><button class="favorite" data-favorite="${p.id}" aria-label="${favorites.includes(p.id)?fr.unfavorite:fr.favorite} : ${p.title}" aria-pressed="${favorites.includes(p.id)}">${favorites.includes(p.id)?'♥':'♡'}</button><span class="image-caption">${p.visual.toUpperCase()} · NON CONTRACTUELLE</span></div><div class="property-body"><p class="property-location">${p.district||p.city} · ${p.region==='Thiès'?'PETITE CÔTE':'SÉNÉGAL'}</p><h3><a href="#bien-${p.id}" data-detail="${p.id}">${p.title}</a></h3><div class="property-specs"><span>${number.format(p.area)} m²</span><span>${p.rooms?p.rooms+' '+(p.type==='Bureau'?'espaces':'chambres'):'Terrain'}</span><span>${p.feature}</span></div><div class="property-price-row"><div><p class="property-price">${money(p)}</p><small class="price-note">Prix fictif · démonstration</small></div><button class="property-more" data-detail="${p.id}" aria-label="Ouvrir la fiche ${p.title}">↗</button></div></div></article>`).join('');
  $('#result-count').textContent=fr.results(result.length)+(result.length>visible.length?` · ${visible.length} affichés`:'');
  $('#empty-state').hidden=result.length>0;
  $('#show-all').hidden=result.length<=3;
  $('#show-all').innerHTML=showAll?'Réduire la sélection <span aria-hidden="true">↑</span>':'Voir tout le catalogue <span aria-hidden="true">↗</span>';
  $('#favorite-count').textContent=favorites.length;
  $$('.property-tabs button').forEach(b=>{const active=b.dataset.category===(applied.type||'');b.classList.toggle('active',active);b.setAttribute('aria-pressed',active)});
}
function syncTransactions(){ $$('[data-transaction]').forEach(b=>{const active=b.dataset.transaction===transaction;b.classList.toggle('active',active);b.setAttribute('aria-pressed',active)}) }
function syncGeography(){
  const region=form.elements.region.value,oldCity=form.elements.city.value;
  const cities=region?Object.keys(geography[region]):Object.values(geography).flatMap(Object.keys);
  $('#city').replaceChildren(new Option(fr.allCities,''),...cities.map(c=>new Option(c,c)));
  if(cities.includes(oldCity))$('#city').value=oldCity;
  syncDistricts();
}
function syncDistricts(){const city=form.elements.city.value,region=form.elements.region.value,old=form.elements.district.value;
  const regions=region?[geography[region]]:Object.values(geography);
  const districts=[...new Set(regions.flatMap(r=>city?(r[city]||[]):Object.values(r).flat()))];
  $('#district').replaceChildren(new Option(fr.allDistricts,''),...districts.map(d=>new Option(d,d)));
  if(districts.includes(old))$('#district').value=old;
  $('#district').disabled=districts.length===0;
}
function goToResults(){$('#biens').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}
function applyForm(scroll=true){const next={...Object.fromEntries(new FormData(form)),transaction};const error=validateFilters(next);$('#search-error').textContent=error;if(error)return false;applied=next;showAll=true;render();if(scroll)goToResults();return true}
form.addEventListener('submit',e=>{e.preventDefault();applyForm()});
form.addEventListener('reset',()=>{queueMicrotask(()=>{transaction='Vente';applied={transaction:'Vente'};onlyFavorites=false;$('#favorites-toggle').setAttribute('aria-pressed','false');showAll=false;$('#sort').value='featured';$('#search-error').textContent='';syncTransactions();syncGeography();render()})});
$('#clear-filters').addEventListener('click',()=>form.reset());
$('#region').addEventListener('change',syncGeography);$('#city').addEventListener('change',syncDistricts);
$$('[data-transaction]').forEach(b=>b.addEventListener('click',()=>{transaction=b.dataset.transaction;syncTransactions();applyForm(false)}));
$('#advanced-toggle').addEventListener('click',()=>{const open=$('#advanced-filters').hidden;$('#advanced-filters').hidden=!open;$('#advanced-toggle').setAttribute('aria-expanded',open)});
$$('[data-category]').forEach(b=>b.addEventListener('click',()=>{form.elements.type.value=b.dataset.category;applyForm(false)}));
$('#sort').addEventListener('change',render);
$('#show-all').addEventListener('click',()=>{showAll=!showAll;render()});
$('#favorites-toggle').addEventListener('click',()=>{onlyFavorites=!onlyFavorites;$('#favorites-toggle').setAttribute('aria-pressed',onlyFavorites);if(onlyFavorites){transaction='';syncTransactions();for(const el of form.elements)if(el.name)el.value='';syncGeography();applied={};showAll=true;}else{applyForm(false)}render()});
document.addEventListener('click',e=>{
  const fav=e.target.closest('[data-favorite]');if(fav){const id=fav.dataset.favorite,exists=favorites.includes(id);favorites=exists?favorites.filter(x=>x!==id):[...favorites,id];let message=exists?fr.removed:fr.saved;try{localStorage.setItem('mafoss-selection',JSON.stringify(favorites))}catch{message+=' '+fr.noStorage}render();const replacement=$(`[data-favorite="${id}"]`);if(replacement)replacement.focus({preventScroll:true});else $('#favorites-toggle').focus({preventScroll:true});toast(message)}
  const detail=e.target.closest('[data-detail]');if(detail){e.preventDefault();openProperty(detail.dataset.detail)}
});
function openProperty(id){const p=properties.find(p=>p.id===id);if(!p)return;$('#property-detail').innerHTML=`<img class="detail-photo" src="assets/${p.image}" alt="${p.visual} d’un bien fictif"><p class="detail-caption">${p.visual} · aucune propriété réelle représentée · image non contractuelle</p><div class="detail-body"><p class="eyebrow">${p.type.toUpperCase()} · ${p.transaction.toUpperCase()} · FICHE FICTIVE ${p.id.toUpperCase()}</p><h2 id="property-title">${p.title}</h2><p class="property-location">${[p.district,p.city,p.region,'Sénégal'].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).join(' · ')}</p><p class="property-price">${money(p)}</p><p class="detail-description">${p.description}</p><div class="detail-stats"><div><strong>${number.format(p.area)} m²</strong><small>Superficie fictive</small></div><div><strong>${p.rooms||'—'}</strong><small>${p.type==='Bureau'?'Espaces fictifs':'Chambres fictives'}</small></div><div><strong>${p.baths||'—'}</strong><small>Salles d’eau fictives</small></div></div><p class="demo-note">Données de démonstration uniquement. Aucune disponibilité, propriété, réalisation ou photographie de bien n’est attribuée à MAFOSS. Aucun document foncier n’a été vérifié.</p><button class="button button-navy" id="detail-project">Préparer un projet similaire <span aria-hidden="true">↗</span></button></div>`;$('#property-dialog').showModal();$('#detail-project').onclick=()=>{$('#property-dialog').close();openContact();$('#contact-form').elements.location.value=[p.district,p.city].filter(Boolean).join(', ');$('#contact-form').elements.project.value=p.transaction==='Vente'?'Acheter un bien':'Louer un bien';$('#contact-form').elements.message.value=`Je souhaite explorer un projet de ${p.type.toLowerCase()} d’environ ${p.area} m², inspiré de la fiche de démonstration ${p.id}.`}}
function openContact(){$('#contact-status').textContent='';$('#contact-dialog').showModal()}
$$('.contact-trigger').forEach(b=>b.addEventListener('click',openContact));
$$('.credits-trigger').forEach(b=>b.addEventListener('click',()=>$('#credits-dialog').showModal()));
$$('dialog').forEach(d=>{ $('.dialog-close',d).addEventListener('click',()=>d.close());d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close()}})});
$('#contact-form').addEventListener('submit',e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.target));const text=`PROJET IMMOBILIER — RÉSUMÉ PERSONNEL\nMAFOSS Immobilier — Prototype\n\nCe document n’a pas été envoyé. Il ne constitue ni une offre, ni un engagement de MAFOSS.\n\nProjet : ${data.project}\nLocalisation : ${data.location}\nBudget indicatif : ${data.budget?number.format(Number(data.budget))+' FCFA (XOF)':'Non précisé'}\n\n${data.message}\n`;const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='mon-projet-immobilier.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('#contact-status').textContent='Résumé préparé pour téléchargement. Aucune demande n’a été envoyée.'});
$$('[data-place]').forEach(b=>b.addEventListener('click',()=>{form.reset();queueMicrotask(()=>{transaction='';syncTransactions();const place=b.dataset.place;if(['Saly','Diamniadio'].includes(place)){form.elements.region.value=place==='Saly'?'Thiès':'Dakar';syncGeography();form.elements.city.value=place;syncDistricts();applied={city:place}}else{form.elements.region.value='Dakar';syncGeography();form.elements.city.value='Dakar';syncDistricts();const districts=place==='Almadies'?['Almadies','Ngor']:place==='Mermoz'?['Mermoz','Sacré-Cœur']:['Plateau'];applied={districts};if(districts.length===1)form.elements.district.value=place;else toast(`Sélection : ${districts.join(' & ')}`)}showAll=true;render();goToResults()})}));
const menu=$('.menu-toggle');menu.addEventListener('click',()=>{const expanded=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',expanded);menu.setAttribute('aria-label',expanded?'Fermer le menu':'Ouvrir le menu');$('#navigation').classList.toggle('open',expanded)});
$$('#navigation a').forEach(a=>a.addEventListener('click',()=>{menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Ouvrir le menu');$('#navigation').classList.remove('open')}));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.getAttribute('aria-expanded')==='true'){menu.click();menu.focus()}});
render();
// La scène et son moteur sont chargés uniquement à proximité de la section 3D.
const modelObserver=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){modelObserver.disconnect();import('./residence.js').then(m=>m.initResidence($('#residence'))).catch(()=>{$('#model-instructions').textContent='La maquette n’a pas pu être chargée. Rechargez la page pour réessayer.';$$('.model-controls button,.model-options button').forEach(b=>b.disabled=true)})}},{rootMargin:'250px'});modelObserver.observe($('#experience'));
