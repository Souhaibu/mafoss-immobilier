import {initShared,initModel,openContact} from './shared.js';
import {geography as baseGeography,filterProperties,validateFilters,escapeHtml as esc,mergeGeography,imageSrc} from './catalogue.js';
import {fetchProperties,sendContactRequest} from './api.js';
import {CONTACT} from './config.js';
import fr from './locales/fr.js';
const $=(s,root=document)=>root.querySelector(s);
const $$=(s,root=document)=>[...root.querySelectorAll(s)];
const number=new Intl.NumberFormat(fr.locale);
// Prix communiqués sur demande : liens WhatsApp, téléphone et e-mail construits depuis config.js.
const digits=n=>String(n||'').replace(/[^\d+]/g,'');
const channelNames=[CONTACT.whatsapp&&'WhatsApp',CONTACT.phone&&'téléphone',CONTACT.email&&'e-mail'].filter(Boolean);
const priceNote=channelNames.length?`Sur demande par ${channelNames.join(', ').replace(/, ([^,]*)$/,' ou $1')}`:'Sur demande auprès de notre équipe';
function contactLinks(message,subject){
  const links=[];
  if(CONTACT.whatsapp)links.push(`<a class="button button-gold" href="https://wa.me/${esc(digits(CONTACT.whatsapp).replace('+',''))}?text=${encodeURIComponent(message)}" target="_blank" rel="noopener">WhatsApp <span aria-hidden="true">↗</span></a>`);
  if(CONTACT.phone)links.push(`<a class="button button-outline" href="tel:${esc(digits(CONTACT.phone))}">Appeler le ${esc(CONTACT.phone)}</a>`);
  if(CONTACT.email)links.push(`<a class="button button-outline" href="mailto:${esc(CONTACT.email)}?subject=${encodeURIComponent(subject)}&amp;body=${encodeURIComponent(message)}">E-mail <span aria-hidden="true">↗</span></a>`);
  return links.join('');
}
// Catalogue chargé depuis Supabase : 'loading' puis 'ready' ou 'error'.
let properties=[],geography=baseGeography,catalogueState='loading';
let favorites=[];try{const saved=JSON.parse(localStorage.getItem('mafoss-selection')||'[]');if(Array.isArray(saved))favorites=saved.filter(id=>typeof id==='string');}catch{}
const fullCatalogue=document.body.dataset.page!=='index';
let transaction=fullCatalogue?'':'Vente',applied=fullCatalogue?{}:{transaction:'Vente'},showAll=fullCatalogue,onlyFavorites=document.body.dataset.page==='selection',toastTimer;
const form=$('#search-form');
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3000)}
function render(){
  if(!form)return;
  if(catalogueState!=='ready'){$('#property-grid').innerHTML='';$('#empty-state').hidden=true;$('#show-all').hidden=true;$('#favorite-count').textContent=favorites.length;$('#result-count').textContent=catalogueState==='loading'?'Chargement du catalogue…':'Le catalogue est momentanément indisponible. Rechargez la page pour réessayer.';return}
  let result=filterProperties(properties,{...applied,favorites:onlyFavorites},favorites);
  const sort=$('#sort').value;
  const query=($('#keyword')?.value||'').toLocaleLowerCase('fr');if(query)result=result.filter(p=>[p.title,p.description,p.city,p.district,p.type].join(' ').toLocaleLowerCase('fr').includes(query));
  if(sort==='area-desc')result.sort((a,b)=>b.area-a.area);
  if(sort==='area-asc')result.sort((a,b)=>a.area-b.area);
  const visible=showAll?result:result.slice(0,3);
  $('#property-grid').innerHTML=visible.map(p=>{const id=esc(p.id),title=esc(p.title),fav=favorites.includes(p.id);return `<article class="property-card"><div class="property-image"><a href="bien.html?id=${encodeURIComponent(p.id)}" aria-label="Découvrir ${title}"><img src="${esc(imageSrc(p))}" alt="${esc(p.visual)} — ${title}${p.demo?', bien fictif':''}" width="1536" height="1024" loading="lazy"></a><span class="tag">${p.transaction==='Vente'?'À VENDRE':'À LOUER'}${p.demo?' · FICTIF':''}</span><button class="favorite" data-favorite="${id}" aria-label="${fav?fr.unfavorite:fr.favorite} : ${title}" aria-pressed="${fav}">${fav?'♥':'♡'}</button><span class="image-caption">${esc(p.visual.toUpperCase())} · NON CONTRACTUELLE</span></div><div class="property-body"><p class="property-location">${esc(p.district||p.city)} · ${p.region==='Thiès'?'PETITE CÔTE':'SÉNÉGAL'}</p><h3><a href="bien.html?id=${encodeURIComponent(p.id)}">${title}</a></h3><div class="property-specs"><span>${number.format(p.area)} m²</span><span>${p.rooms?p.rooms+' '+(p.type==='Bureau'?'espaces':'chambres'):'Terrain'}</span>${p.feature?`<span>${esc(p.feature)}</span>`:''}</div><div class="property-price-row"><div><p class="property-price">Prix sur demande</p><small class="price-note">${esc(priceNote)}</small></div><button class="property-more" data-detail="${id}" aria-label="Ouvrir la fiche ${title}">↗</button></div></div></article>`}).join('');
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
form.addEventListener('reset',()=>{queueMicrotask(()=>{transaction=fullCatalogue?'':'Vente';applied=fullCatalogue?{}:{transaction:'Vente'};onlyFavorites=document.body.dataset.page==='selection';$('#favorites-toggle').setAttribute('aria-pressed',onlyFavorites);showAll=fullCatalogue;$('#sort').value='featured';$('#search-error').textContent='';syncTransactions();syncGeography();render()})});
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
function openProperty(id){const p=properties.find(p=>p.id===id);if(!p)return;const f=p.demo?' fictive':'',fs=p.demo?' fictives':'';$('#property-detail').innerHTML=`<img class="detail-photo" src="${esc(imageSrc(p))}" alt="${esc(p.visual)} — ${esc(p.title)}${p.demo?', bien fictif':''}"><p class="detail-caption">${esc(p.visual)}${p.demo?' · aucune propriété réelle représentée':''} · image non contractuelle</p><div class="detail-body"><p class="eyebrow">${esc(p.type.toUpperCase())} · ${esc(p.transaction.toUpperCase())} · ${p.demo?'FICHE FICTIVE':'RÉF.'} ${esc(p.id.toUpperCase())}</p><h2 id="property-title">${esc(p.title)}</h2><p class="property-location">${esc([p.district,p.city,p.region,'Sénégal'].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).join(' · '))}</p><p class="property-price">Prix sur demande</p><p class="detail-description">${esc(p.description)}</p><div class="detail-stats"><div><strong>${number.format(p.area)} m²</strong><small>Superficie${f}</small></div><div><strong>${p.rooms||'—'}</strong><small>${p.type==='Bureau'?'Espaces'+(p.demo?' fictifs':''):'Chambres'+fs}</small></div><div><strong>${p.baths||'—'}</strong><small>Salles d’eau${fs}</small></div></div>${p.demo?'<p class="demo-note">Données de démonstration uniquement. Aucune disponibilité, propriété, réalisation ou photographie de bien n’est attribuée à MAFOSS. Aucun document foncier n’a été vérifié.</p>':''}<div class="price-request"><p><strong>Prix et conditions sur demande.</strong> ${channelNames.length?'Contactez-nous directement :':'Laissez-nous votre demande, nous vous répondons rapidement.'}</p><div class="contact-channels">${contactLinks(`Bonjour, je souhaite connaître le prix et les conditions du bien « ${p.title} » (réf. ${p.id}).`,`Prix du bien ${p.id}`)}<button class="button button-navy" id="detail-project">${p.demo?'Préparer un projet similaire':'Ce bien m’intéresse'} <span aria-hidden="true">↗</span></button></div></div></div>`;$('#property-dialog').showModal();$('#detail-project').onclick=()=>{$('#property-dialog').close();openContact(p.id);const c=$('#contact-form').elements;c.location.value=[p.district,p.city].filter(Boolean).join(', ');c.project.value=p.transaction==='Vente'?'Acheter un bien':'Louer un bien';c.message.value=p.demo?`Je souhaite explorer un projet de ${p.type.toLowerCase()} d’environ ${p.area} m², inspiré de la fiche de démonstration ${p.id}.`:`Je suis intéressé(e) par le bien « ${p.title} » (réf. ${p.id}).`}}
$$('[data-place]').forEach(b=>b.addEventListener('click',()=>{form.reset();queueMicrotask(()=>{transaction='';syncTransactions();const place=b.dataset.place;if(['Saly','Diamniadio'].includes(place)){form.elements.region.value=place==='Saly'?'Thiès':'Dakar';syncGeography();form.elements.city.value=place;syncDistricts();applied={city:place}}else{form.elements.region.value='Dakar';syncGeography();form.elements.city.value='Dakar';syncDistricts();const districts=place==='Almadies'?['Almadies','Ngor']:place==='Mermoz'?['Mermoz','Sacré-Cœur']:['Plateau'];applied={districts};if(districts.length===1)form.elements.district.value=place;else toast(`Sélection : ${districts.join(' & ')}`)}showAll=true;render();goToResults()})}));
// Accueil animé : bouton pause / lecture (choix mémorisé) et arrêt des animations hors écran.
const hero=$('.hero'),heroMotion=$('.hero-motion');
let heroPaused=false;try{heroPaused=localStorage.getItem('mafoss-hero-motion')==='paused'}catch{}
function syncHeroMotion(){hero.classList.toggle('is-paused',heroPaused);heroMotion.setAttribute('aria-label',heroPaused?'Relancer l’animation':'Mettre l’animation en pause');heroMotion.querySelector('.hero-motion-label').textContent=heroPaused?'Animer':'Pause'}
if(hero&&heroMotion){heroMotion.addEventListener('click',()=>{heroPaused=!heroPaused;syncHeroMotion();try{localStorage.setItem('mafoss-hero-motion',heroPaused?'paused':'playing')}catch{}});
syncHeroMotion();
new IntersectionObserver(([entry])=>hero.classList.toggle('is-offscreen',!entry.isIntersecting)).observe(hero);
const syncVisibility=()=>hero.classList.toggle('is-background',document.hidden);
document.addEventListener('visibilitychange',syncVisibility);syncVisibility();}
initShared();
function syncRegions(){const old=form.elements.region.value,regions=Object.keys(geography);$('#region').replaceChildren(new Option('Toutes les régions',''),...regions.map(r=>new Option(r,r)));if(regions.includes(old))$('#region').value=old;syncGeography()}
render();
fetchProperties().then(items=>{properties=items;geography=mergeGeography(baseGeography,items);favorites=favorites.filter(id=>items.some(p=>p.id===id));catalogueState='ready';$('.properties .demo-note').hidden=!items.some(p=>p.demo);syncRegions();applyUrlFilters()}).catch(()=>{catalogueState='error'}).finally(render);
initModel();

function applyUrlFilters(){
  const params=new URLSearchParams(location.search);
  if(params.has('transaction')&&['Vente','Location'].includes(params.get('transaction')))transaction=params.get('transaction');
  for(const key of ['region','city','district','type']){const el=form.elements[key];const value=params.get(key);if(value&&[...el.options].some(o=>o.value===value)){el.value=value;if(key==='region')syncGeography();if(key==='city')syncDistricts()}}
  const place=params.get('place');
  if(place){transaction='';if(['Saly','Diamniadio'].includes(place)){form.elements.region.value=place==='Saly'?'Thiès':'Dakar';syncGeography();form.elements.city.value=place;syncDistricts();applied={city:place}}
    else{form.elements.region.value='Dakar';syncGeography();form.elements.city.value='Dakar';syncDistricts();applied={districts:place==='Almadies'?['Almadies','Ngor']:place==='Mermoz'?['Mermoz','Sacré-Cœur']:[place]}}}
  else applied={...Object.fromEntries(new FormData(form)),transaction};
  syncTransactions();$('#favorites-toggle').setAttribute('aria-pressed',onlyFavorites);render();
}
$('#keyword')?.addEventListener('input',render);
