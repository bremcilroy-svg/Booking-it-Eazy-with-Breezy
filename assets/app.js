'use strict';
const cfg=window.BREEZY_CONFIG||{};
const configured=!!(cfg.supabaseUrl&&cfg.supabaseAnonKey&&!cfg.supabaseUrl.includes('YOUR-'));
const db=configured&&window.supabase?window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey):null;
const $=id=>document.getElementById(id);
const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n);
const safe=(s='')=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const msg=(id,message,error=false)=>{const el=$(id);if(el){el.innerHTML=`<div class="notice ${error?'error':''}">${safe(message)}</div>`;}};
const cruiseData=[
{brand:'msc',title:'MSC Caribbean & Ocean Cay',ship:'MSC Cruises',ports:'Caribbean and Bahamian destinations',img:'https://images.unsplash.com/photo-1548574505-5e239809ee19?auto=format&fit=crop&w=800&q=80'},
{brand:'msc',title:'MSC Yacht Club Luxury',ship:'MSC Cruises',ports:'Premium suites and private amenities on select ships',img:'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80'},
{brand:'royal',title:'Royal Caribbean Family Adventures',ship:'Royal Caribbean',ports:'Caribbean routes and Perfect Day at CocoCay options',img:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'},
{brand:'disney',title:'Disney Cruise Magic',ship:'Disney Cruise Line',ports:'Family voyages and island experiences',img:'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80'}];
const study=[{name:'MSC & Ocean Cay',text:'Ocean Cay MSC Marine Reserve is an MSC destination in the Bahamas.',q:'Which cruise line visits Ocean Cay?',answers:['Disney','MSC','Royal Caribbean'],correct:1},{name:'Royal Caribbean',text:'Perfect Day at CocoCay is a Royal Caribbean private destination.',q:'Which line offers Perfect Day at CocoCay?',answers:['MSC','Disney','Royal Caribbean'],correct:2},{name:'Disney Cruise Line',text:'Disney Cruise Line is known for rotational dining on many sailings.',q:'What is the dining system called?',answers:['Rotational dining','Fixed buffet','Cabin-only dining'],correct:0}];
let session=null,isAdmin=false,posts=[];
function go(page){if(!$('page-'+page))page='home';document.querySelectorAll('.page').forEach(e=>e.classList.toggle('hidden',e.id!=='page-'+page));document.querySelectorAll('[data-page]').forEach(e=>e.classList.toggle('active',e.dataset.page===page));if(location.hash!=='#'+page)history.replaceState(null,'','#'+page);window.scrollTo({top:0,behavior:'smooth'});if(page==='portal')refreshPortal();if(page==='office')refreshOffice();if(page==='blog')loadPosts();}
function quoteTrip(trip){$('q-trip').value=trip;go('contact');$('q-name').focus();}
function cruiseFilter(filter){$('cruise-grid').innerHTML=cruiseData.filter(c=>filter==='all'||c.brand===filter).map((c,i)=>`<article class="card"><img src="${c.img}" alt="${safe(c.title)}" loading="lazy"><span class="tag">${safe(c.ship)}</span><h3>${safe(c.title)}</h3><p>${safe(c.ports)}</p><p class="fine">Dates, ships, fares and availability confirmed by personalized quote.</p><button class="btn small" data-cruise="${safe(c.title)}">Request Quote →</button></article>`).join('');document.querySelectorAll('[data-cruise]').forEach(b=>b.addEventListener('click',()=>quoteTrip(b.dataset.cruise)));}
function estimate(){let line=$('calc-line').value,adults=Number($('calc-adults').value),kids=Number($('calc-kids').value),nights=Number($('calc-nights').value),cabin=$('calc-cabin').value;if(!Number.isInteger(adults)||adults<1||adults>8||!Number.isInteger(kids)||kids<0||kids>6){$('calc-total').textContent='Check guest counts';return;}let base={msc:95,royal:140,disney:250}[line],mult={interior:.8,balcony:1,suite:1.7}[cabin];$('calc-total').textContent=money(Math.round((adults+kids*.75)*base*mult*nights));}
async function sendQuote(e){e.preventDefault();if(!db){msg('contact-message','Website is not connected to Supabase yet. Please email Breezy directly using the address in the footer.',true);return;}let button=$('quote-submit');button.disabled=true;const record={name:$('q-name').value.trim(),email:$('q-email').value.trim(),phone:$('q-phone').value.trim(),trip:$('q-trip').value.trim(),adults:Number($('q-adults').value),kids:Number($('q-kids').value),travel_month:$('q-month').value.trim(),notes:$('q-notes').value.trim()};try{const {error}=await db.from('inquiries').insert(record);if(error)throw error;msg('contact-message','Your request was submitted successfully! Breezy can review it in the private dashboard.');$('quote-form').reset();}catch(err){msg('contact-message','Submission failed. Please email Breezy directly or try again.',true);console.error(err);}finally{button.disabled=false;}}
async function loadPosts(){if(!db){$('blog-grid').innerHTML='<p class="muted">Travel articles will appear after the website is connected to Supabase.</p>';return;}const {data,error}=await db.from('posts').select('id,title,body,image_url,created_at').eq('published',true).order('created_at',{ascending:false});if(error){$('blog-grid').textContent='Articles are temporarily unavailable.';return;}posts=data||[];$('blog-grid').innerHTML=posts.length?posts.map(p=>`<article class="card">${p.image_url&&validImage(p.image_url)?`<img src="${safe(p.image_url)}" alt="Travel article image" loading="lazy">`:''}<span class="tag">${new Date(p.created_at).toLocaleDateString()}</span><h3>${safe(p.title)}</h3><p>${safe(p.body.slice(0,170))}${p.body.length>170?'…':''}</p><button class="btn small" data-article="${p.id}">Read Article</button></article>`).join(''):'<p class="muted">New travel articles coming soon!</p>';document.querySelectorAll('[data-article]').forEach(b=>b.addEventListener('click',()=>{const p=posts.find(x=>x.id===b.dataset.article);$('article').classList.remove('hidden');$('article').innerHTML=`<h2>${safe(p.title)}</h2><p style="white-space:pre-wrap;line-height:1.7">${safe(p.body)}</p>`;$('article').scrollIntoView({behavior:'smooth'});}));}
function validImage(url){try{const u=new URL(url);return u.protocol==='https:';}catch{return false;}}
async function refreshAuth(){if(!db)return;const {data}=await db.auth.getSession();session=data.session;isAdmin=false;if(session){const {data:yes}=await db.rpc('is_admin');isAdmin=yes===true;}$('portal-auth').classList.toggle('hidden',!!session);$('portal-content').classList.toggle('hidden',!session);$('office-signout').classList.toggle('hidden',!session);$('signed-in-as').textContent=session?'Signed in as '+session.user.email:'';}
async function refreshPortal(){await refreshAuth();if(!session)return;const {data,error}=await db.from('bookings').select('destination,departure_date,status,amount').eq('client_id',session.user.id).order('departure_date',{ascending:true});$('client-bookings').innerHTML=error?'<p>Unable to load your trips.</p>':data.length?data.map(b=>`<div class="list-item"><strong>${safe(b.destination)}</strong><p>${safe(b.departure_date||'Date pending')} • ${safe(b.status)}</p></div>`).join(''):'<p class="muted">No trips linked to your account yet. Contact Breezy to have an existing booking linked.</p>';}
async function authAction(signup=false){if(!db){msg('auth-message','Connect Supabase before using accounts.',true);return;}const email=$('auth-email').value.trim(),password=$('auth-password').value;if(!email||password.length<8){msg('auth-message','Enter a valid email and a password of at least 8 characters.',true);return;}const {error}=signup?await db.auth.signUp({email,password}):await db.auth.signInWithPassword({email,password});if(error){msg('auth-message',error.message,true);return;}msg('auth-message',signup?'Account created. Check your email if confirmation is required.':'Signed in.');await refreshPortal();}
async function refreshOffice(){await refreshAuth();$('office-denied').classList.toggle('hidden',isAdmin);$('office-content').classList.toggle('hidden',!isAdmin);if(isAdmin){await Promise.all([loadInquiries(),loadBookings(),loadAdminPosts()]);commission();}}
async function loadInquiries(){const {data,error}=await db.from('inquiries').select('*').order('created_at',{ascending:false}).limit(200);$('inquiries-list').innerHTML=error?'Unable to load inquiries.':!data.length?'<p class="muted">No inquiries yet.</p>':data.map(q=>`<div class="list-item"><div class="row"><strong>${safe(q.name)}</strong><span class="pill">${safe(q.status)}</span></div><p><a href="mailto:${encodeURIComponent(q.email)}" style="color:var(--cyan)">${safe(q.email)}</a> • ${safe(q.phone||'No phone')} • ${new Date(q.created_at).toLocaleDateString()}</p><p>${safe(q.trip||'General inquiry')} • ${q.adults} adults, ${q.kids} kids • ${safe(q.travel_month||'Flexible')}</p><p>${safe(q.notes||'')}</p><label for="status-${q.id}">Update status</label><select id="status-${q.id}" data-inquiry-id="${q.id}">${['new','contacted','quoted','booked','closed'].map(s=>`<option value="${s}" ${s===q.status?'selected':''}>${s}</option>`).join('')}</select></div>`).join('');document.querySelectorAll('[data-inquiry-id]').forEach(el=>el.addEventListener('change',async()=>{const {error}=await db.from('inquiries').update({status:el.value}).eq('id',el.dataset.inquiryId);if(error)msg('office-message',error.message,true);else msg('office-message','Inquiry status updated.');}));}
async function loadBookings(){const {data,error}=await db.from('bookings').select('*').order('created_at',{ascending:false}).limit(200);$('bookings-list').innerHTML=error?'Unable to load bookings.':data.length?data.map(b=>`<div class="list-item"><strong>${safe(b.client_name)}</strong><p>${safe(b.destination)} • ${safe(b.departure_date||'Date pending')} • ${safe(b.status)}</p><p class="fine">${b.client_id?'Linked to customer account':'Not linked to customer account'}</p></div>`).join(''):'<p class="muted">No bookings yet.</p>';}
async function addBooking(e){e.preventDefault();const amount=$('b-amount').value,record={client_name:$('b-name').value.trim(),destination:$('b-destination').value.trim(),departure_date:$('b-date').value||null,amount:amount===''?null:Number(amount),client_id:$('b-client-id').value.trim()||null,status:$('b-status').value,notes:$('b-notes').value.trim()};const {error}=await db.from('bookings').insert(record);if(error){msg('office-message',error.message,true);return;}$('booking-form').reset();msg('office-message','Booking saved.');loadBookings();}
async function loadAdminPosts(){const {data,error}=await db.from('posts').select('id,title,published,created_at').order('created_at',{ascending:false});$('admin-posts-list').innerHTML=error?'Unable to load posts.':data.map(p=>`<div class="list-item row"><span>${safe(p.title)} • ${p.published?'Published':'Draft'}</span><button class="btn small alt" data-delete-post="${p.id}">Delete</button></div>`).join('');document.querySelectorAll('[data-delete-post]').forEach(b=>b.addEventListener('click',async()=>{if(!confirm('Delete this article?'))return;const {error}=await db.from('posts').delete().eq('id',b.dataset.deletePost);if(error)msg('office-message',error.message,true);else{loadAdminPosts();loadPosts();}}));}
async function savePost(e){e.preventDefault();let url=$('p-image').value.trim();if(url&&!validImage(url)){msg('office-message','Please use a valid HTTPS image URL.',true);return;}const {error}=await db.from('posts').insert({title:$('p-title').value.trim(),body:$('p-body').value.trim(),image_url:url||null,published:$('p-published').checked});if(error){msg('office-message',error.message,true);return;}$('post-form').reset();msg('office-message','Article saved.');loadAdminPosts();loadPosts();}
function commission(){const gross=Math.max(0,Number($('c-gross').value)||0),rate=Math.min(100,Math.max(0,Number($('c-rate').value)||0)),split=Math.min(100,Math.max(0,Number($('c-split').value)||0));$('commission-result').textContent=money(gross*rate/100*split/100);}
function showStudy(){ $('study-content').innerHTML=study.map((s,i)=>`<div class="list-item"><h3>${safe(s.name)}</h3><p>${safe(s.text)}</p><p><strong>${safe(s.q)}</strong></p>${s.answers.map((a,j)=>`<button class="btn small alt" style="margin:4px" data-study="${i}" data-answer="${j}">${safe(a)}</button>`).join('')}<p id="study-feedback-${i}" aria-live="polite"></p></div>`).join('');document.querySelectorAll('[data-study]').forEach(b=>b.addEventListener('click',()=>{$('study-feedback-'+b.dataset.study).textContent=Number(b.dataset.answer)===study[Number(b.dataset.study)].correct?'Correct! This is practice only.':'Not quite. Review the lesson and try again.';}));}
function pop(e){if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;const el=document.createElement('span');el.className='emoji';el.textContent=['🦜','🐬','🐢','🌺','🐠'][Math.floor(Math.random()*5)];el.style.left=(e.clientX||innerWidth/2)+'px';el.style.top=(e.clientY||innerHeight/2)+'px';document.body.appendChild(el);setTimeout(()=>el.remove(),950);}
function init(){document.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();go(b.dataset.page);if(b.classList.contains('btn'))pop(e);}));document.querySelectorAll('[data-trip]').forEach(b=>b.addEventListener('click',()=>quoteTrip(b.dataset.trip)));document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-filter]').forEach(x=>x.classList.toggle('active',x===b));cruiseFilter(b.dataset.filter);}));cruiseFilter('all');$('estimate-form').addEventListener('input',estimate);estimate();$('estimate-to-quote').addEventListener('click',()=>quoteTrip(`${$('calc-line').selectedOptions[0].text} • ${$('calc-nights').value} nights • ${$('calc-cabin').value} • illustrative ${$('calc-total').textContent}`));$('quote-form').addEventListener('submit',sendQuote);$('auth-form').addEventListener('submit',e=>{e.preventDefault();authAction(false);});$('signup').addEventListener('click',()=>authAction(true));for(const id of ['signout','office-signout'])$(id).addEventListener('click',async()=>{if(db)await db.auth.signOut();session=null;isAdmin=false;go('portal');});document.querySelectorAll('[data-office]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-office]').forEach(x=>x.classList.toggle('active',x===b));document.querySelectorAll('.office-panel').forEach(p=>p.classList.toggle('hidden',p.id!=='office-'+b.dataset.office));}));$('booking-form').addEventListener('submit',addBooking);$('post-form').addEventListener('submit',savePost);['c-gross','c-rate','c-split'].forEach(id=>$(id).addEventListener('input',commission));showStudy();if(db)db.auth.onAuthStateChange(()=>{setTimeout(refreshAuth,0);});go(location.hash.slice(1)||'home');if(!db)console.warn('Configure Supabase in config.js before publishing.');}
window.addEventListener('DOMContentLoaded',init);


/* Breezy's clickable wave menu */
function setupWaveMenu() {
  const waveButton = document.getElementById("wave-menu-toggle");
  const menu = document.getElementById("main-nav");

  if (!waveButton || !menu) return;

  
waveButton.addEventListener("click", function () {
  waveButton.classList.remove("is-animating");
  void waveButton.offsetWidth;
  waveButton.classList.add("is-animating");

  const isOpen = menu.classList.toggle("is-open");

    waveButton.setAttribute("aria-expanded", String(isOpen));
    waveButton.setAttribute(
      "aria-label",
      isOpen ? "Close navigation menu" : "Open navigation menu"
    );
  });

  menu.querySelectorAll("button[data-page]").forEach(function (button) {
    button.addEventListener("click", function () {
      menu.classList.remove("is-open");
      waveButton.setAttribute("aria-expanded", "false");
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupWaveMenu);
} else {
  setupWaveMenu();
}

/* Breezy's Travel Specialist Dropdown */
function setupSpecialistDropdown() {
  const button = document.getElementById("spin-palms");
  const details = document.getElementById("specialist-details");
  const palms = document.getElementById("palms");

  if (!button || !details) return;

  button.addEventListener("click", function () {
    const opening = details.hidden;

    details.hidden = !opening;
    button.setAttribute("aria-expanded", String(opening));

    if (palms) {
      palms.classList.toggle("spinning", opening);
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupSpecialistDropdown);
} else {
  setupSpecialistDropdown();
}

