// Espace d'administration : annonces (table properties + stockage property-images) et demandes de contact.
// Les droits sont vérifiés côté base par les règles RLS ; cette page ne fait qu'afficher ce que le compte peut voir.
import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/+esm';
import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY} from '../config.js';
import {escapeHtml as esc,imageSrc} from '../catalogue.js';

const supabase=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
const BUCKET='property-images';
const STATUS={nouveau:'Nouvelle',en_cours:'En cours',traite:'Traitée'};
const FIELDS=['title','transaction','type','feature','region','city','district','area','visual','rooms','baths','sort_order','description','image'];
const $=(s,root=document)=>root.querySelector(s);
const $$=(s,root=document)=>[...root.querySelectorAll(s)];
const number=new Intl.NumberFormat('fr-SN');
const dateTime=new Intl.DateTimeFormat('fr-FR',{dateStyle:'medium',timeStyle:'short'});
let properties=[],requests=[],editing=null,routedUser,toastTimer;

function toast(text){$('#toast').textContent=text;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3500)}
function show(view){for(const id of ['admin-loading','login-view','denied-view','app-view'])$('#'+id).hidden=id!==view}
// Chemins absolus : la page fonctionne avec ou sans barre finale (/admin ou /admin/).
function preview(p){const src=imageSrc(p);return src.startsWith('assets/')?'/'+src:src}
// Chemin d'un fichier de notre bucket à partir de son URL publique, sinon null.
function storagePath(url){const marker=`/storage/v1/object/public/${BUCKET}/`,i=(url||'').indexOf(marker);return url&&url.startsWith(SUPABASE_URL)&&i>=0?decodeURIComponent(url.slice(i+marker.length)):null}
function readableError(error){
  if(error?.code==='23514')return 'Une valeur ne respecte pas les règles (longueurs, prix ou superficie).';
  if(error?.code==='23505')return 'Cette référence existe déjà.';
  if(error?.code==='42501')return 'Action non autorisée pour ce compte.';
  return error?.message||'Une erreur est survenue.';
}
// Prix interne (table property_prices, lisible par les seuls admins) : objet ou tableau selon la relation.
function priceOf(p){const x=p.property_prices;return (Array.isArray(x)?x[0]:x)?.price??null}
function newId(title){
  const base=title.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,48)||'bien';
  return `${base}-${crypto.getRandomValues(new Uint32Array(1))[0].toString(36)}`;
}

// Session : on ne réagit qu'aux changements d'utilisateur (pas aux simples rafraîchissements de jeton).
supabase.auth.onAuthStateChange((_event,session)=>{const id=session?.user?.id??null;if(id===routedUser)return;routedUser=id;setTimeout(()=>route(session),0)});
async function route(session){
  const user=session?.user??null;
  $('#admin-user').hidden=!user;$('#admin-email').textContent=user?.email??'';
  if(!user){show('login-view');return}
  const {data,error}=await supabase.from('admin_users').select('user_id').eq('user_id',user.id).maybeSingle();
  if(error||!data){show('denied-view');return}
  show('app-view');
  await Promise.all([loadProperties(),loadRequests()]);
}
$('#login-form').addEventListener('submit',async e=>{e.preventDefault();const f=e.target,submit=$('button[type=submit]',f);$('#login-error').textContent='';submit.disabled=true;
  const {error}=await supabase.auth.signInWithPassword({email:f.elements.email.value.trim(),password:f.elements.password.value});
  submit.disabled=false;
  if(error){$('#login-error').textContent=error.message==='Invalid login credentials'?'E-mail ou mot de passe incorrect.':`Connexion impossible : ${error.message}`;return}
  f.reset();
});
$('#sign-out').addEventListener('click',()=>supabase.auth.signOut());

// Onglets.
$$('[role=tab]').forEach(tab=>tab.addEventListener('click',()=>{$$('[role=tab]').forEach(t=>{const active=t===tab;t.setAttribute('aria-selected',active);$('#'+t.getAttribute('aria-controls')).hidden=!active})}));

// Annonces.
async function loadProperties(){
  const {data,error}=await supabase.from('properties').select('*,property_prices(price)').order('sort_order').order('created_at',{ascending:false});
  if(error){$('#property-list').innerHTML=`<p class="form-error">Chargement impossible : ${esc(readableError(error))}</p>`;return}
  properties=data;renderProperties();fillDatalists();
}
function renderProperties(){
  $('#count-properties').textContent=properties.length;
  $('#property-list').innerHTML=properties.length?properties.map(p=>`<article class="admin-row"><img src="${esc(preview(p))}" alt="" loading="lazy"><div class="admin-row-main"><strong>${esc(p.title)}</strong><span>${esc([p.district,p.city,p.region].filter(Boolean).join(' · '))}</span><span>${esc(p.type)} · ${esc(p.transaction)} · ${priceOf(p)?`${number.format(priceOf(p))} FCFA${p.transaction==='Location'?' / mois':''} (interne)`:'Prix non renseigné'} · ${number.format(p.area)} m²</span></div><div class="admin-badges"><span class="badge ${p.published?'badge-on':'badge-off'}">${p.published?'Publiée':'Masquée'}</span>${p.demo?'<span class="badge">Démo</span>':''}<small>Réf. ${esc(p.id)}</small></div><div class="admin-actions"><button class="button button-outline" data-edit="${esc(p.id)}">Modifier</button><button class="button button-outline danger" data-delete="${esc(p.id)}">Supprimer</button></div></article>`).join(''):'<p class="admin-note">Aucune annonce pour le moment.</p>';
}
function fillDatalists(){
  const fill=(id,key)=>$(id).replaceChildren(...[...new Set(properties.map(p=>p[key]).filter(Boolean))].sort().map(v=>new Option(v)));
  fill('#list-regions','region');fill('#list-cities','city');fill('#list-districts','district');
}
function openEditor(p=null){
  editing=p;const f=$('#property-form');f.reset();$('#editor-error').textContent='';
  $('#editor-title').textContent=p?'Modifier l’annonce':'Nouvelle annonce';
  if(p){for(const k of FIELDS)f.elements[k].value=p[k]??'';f.elements.price.value=priceOf(p)??'';f.elements.published.checked=p.published;f.elements.demo.checked=p.demo}
  updatePreview();$('#property-editor').showModal();
}
function updatePreview(){
  const f=$('#property-form'),file=f.elements.file.files[0],img=$('#image-preview');
  if(img.dataset.objectUrl){URL.revokeObjectURL(img.dataset.objectUrl);delete img.dataset.objectUrl}
  let src='';
  if(file){src=URL.createObjectURL(file);img.dataset.objectUrl=src}
  else if(f.elements.image.value.trim())src=preview({image:f.elements.image.value.trim()});
  img.hidden=!src;if(src)img.src=src;
}
$('#property-form').elements.file.addEventListener('change',updatePreview);
$('#property-form').elements.image.addEventListener('change',updatePreview);
$('#new-property').addEventListener('click',()=>openEditor());
$('#editor-cancel').addEventListener('click',()=>$('#property-editor').close());
$('.dialog-close',$('#property-editor')).addEventListener('click',()=>$('#property-editor').close());
$('#property-form').addEventListener('submit',async e=>{e.preventDefault();const f=e.target,submit=$('button[type=submit]',f),value=k=>f.elements[k].value.trim();
  $('#editor-error').textContent='';submit.disabled=true;
  try{
    const row={title:value('title'),transaction:value('transaction'),type:value('type'),feature:value('feature'),region:value('region'),city:value('city'),district:value('district'),area:Number(value('area')),visual:value('visual')||'Photo',rooms:Number(value('rooms')||0),baths:Number(value('baths')||0),sort_order:Number(value('sort_order')||100),description:value('description'),image:value('image'),published:f.elements.published.checked,demo:f.elements.demo.checked};
    const id=editing?.id??newId(row.title),file=f.elements.file.files[0],oldImage=editing?.image;
    if(file){
      const ext={'image/webp':'webp','image/jpeg':'jpg','image/png':'png'}[file.type];
      if(!ext)throw new Error('Formats acceptés : WebP, JPEG ou PNG.');
      if(file.size>5*1024*1024)throw new Error('La photo dépasse 5 Mo.');
      const path=`${id}/${Date.now()}.${ext}`;
      const {error}=await supabase.storage.from(BUCKET).upload(path,file,{contentType:file.type});
      if(error)throw error;
      row.image=supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    }
    const {data,error}=editing?await supabase.from('properties').update(row).eq('id',id).select('id'):await supabase.from('properties').insert({id,...row}).select('id');
    if(error)throw error;
    if(!data.length)throw new Error('Action non autorisée pour ce compte.');
    const price=Number(value('price'));
    const {error:priceError}=price>0?await supabase.from('property_prices').upsert({property_id:id,price}):await supabase.from('property_prices').delete().eq('property_id',id);
    if(priceError)throw priceError;
    // L'ancienne photo de notre stockage n'est plus utilisée.
    const oldPath=storagePath(oldImage);if(oldPath&&oldImage!==row.image)await supabase.storage.from(BUCKET).remove([oldPath]);
    $('#property-editor').close();toast(editing?'Annonce mise à jour.':'Annonce créée.');await loadProperties();
  }catch(error){$('#editor-error').textContent=readableError(error)}
  finally{submit.disabled=false}
});
async function deleteProperty(id){
  const p=properties.find(x=>x.id===id);
  if(!p||!confirm(`Supprimer définitivement l’annonce « ${p.title} » ?`))return;
  const {data,error}=await supabase.from('properties').delete().eq('id',id).select('id');
  if(error||!data.length){toast(error?readableError(error):'Suppression non autorisée.');return}
  const path=storagePath(p.image);if(path)await supabase.storage.from(BUCKET).remove([path]);
  toast('Annonce supprimée.');await loadProperties();
}

// Demandes de contact.
async function loadRequests(){
  const {data,error}=await supabase.from('contact_requests').select('*').order('created_at',{ascending:false});
  if(error){$('#request-list').innerHTML=`<p class="form-error">Chargement impossible : ${esc(readableError(error))}</p>`;return}
  requests=data;renderRequests();
}
function renderRequests(){
  const filter=$('#request-filter').value,list=filter?requests.filter(r=>r.status===filter):requests,fresh=requests.filter(r=>r.status==='nouveau').length;
  $('#count-requests').textContent=fresh?`${fresh} nouvelle${fresh>1?'s':''}`:'';
  $('#request-list').innerHTML=list.length?list.map(r=>`<article class="admin-request status-${esc(r.status)}"><header><div><strong>${esc(r.name)}</strong><small>${esc(dateTime.format(new Date(r.created_at)))} · ${esc(r.project)}</small></div><label>Statut <select data-status="${esc(r.id)}">${Object.entries(STATUS).map(([k,label])=>`<option value="${k}"${r.status===k?' selected':''}>${label}</option>`).join('')}</select></label></header><dl><div><dt>E-mail</dt><dd>${r.email?`<a href="mailto:${esc(r.email)}">${esc(r.email)}</a>`:'—'}</dd></div><div><dt>Téléphone</dt><dd>${r.phone?`<a href="tel:${esc(r.phone.replace(/[^\d+]/g,''))}">${esc(r.phone)}</a>`:'—'}</dd></div><div><dt>Localisation</dt><dd>${esc(r.location)}</dd></div><div><dt>Budget</dt><dd>${r.budget!=null?number.format(r.budget)+' FCFA':'—'}</dd></div>${r.property_id?`<div><dt>Annonce</dt><dd>Réf. ${esc(r.property_id)}</dd></div>`:''}</dl><p class="admin-message">${esc(r.message)}</p><button class="button button-outline danger" data-delete-request="${esc(r.id)}">Supprimer</button></article>`).join(''):'<p class="admin-note">Aucune demande.</p>';
}
$('#request-filter').addEventListener('change',renderRequests);
async function setStatus(id,status){
  const {data,error}=await supabase.from('contact_requests').update({status}).eq('id',id).select('id');
  if(error||!data.length){toast(error?readableError(error):'Modification non autorisée.');await loadRequests();return}
  const r=requests.find(x=>x.id===id);if(r)r.status=status;renderRequests();toast(`Demande marquée « ${STATUS[status]} ».`);
}
async function deleteRequest(id){
  const r=requests.find(x=>x.id===id);
  if(!r||!confirm(`Supprimer définitivement la demande de ${r.name} ?`))return;
  const {data,error}=await supabase.from('contact_requests').delete().eq('id',id).select('id');
  if(error||!data.length){toast(error?readableError(error):'Suppression non autorisée.');return}
  toast('Demande supprimée.');await loadRequests();
}

document.addEventListener('click',e=>{
  const edit=e.target.closest('[data-edit]');if(edit)openEditor(properties.find(p=>p.id===edit.dataset.edit));
  const del=e.target.closest('[data-delete]');if(del)deleteProperty(del.dataset.delete);
  const delRequest=e.target.closest('[data-delete-request]');if(delRequest)deleteRequest(delRequest.dataset.deleteRequest);
});
document.addEventListener('change',e=>{const select=e.target.closest('[data-status]');if(select)setStatus(select.dataset.status,select.value)});
