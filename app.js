const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const colors={Rendah:'#32b887',Sedang:'#efb449',Tinggi:'#ed6c70'}, backgrounds={Rendah:'#eef9f3',Sedang:'#fff8e9',Tinggi:'#fff0f0'};
const riskMeaning={Rendah:'Gabungan jumlah sampel dan nilai TSH lebih rendah',Sedang:'Gabungan jumlah sampel dan nilai TSH di tengah',Tinggi:'Gabungan jumlah sampel dan nilai TSH lebih tinggi'};
const patternMeaning={Normal:'Pola data mirip dengan fasilitas lain',Outlier:'Pola data berbeda dan perlu ditinjau'};
const escapeHTML=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sourceNames=[...new Set(ResearchData.aggregates.map(f=>f.name))].sort();
let facilities=[],activeAnalysis;
const facilityCoordinates=new Map(FacilityLocations.entries.filter(f=>Number.isFinite(f.lat)).map(f=>[f.name,{...f}]));
function selectedAggregates(){return ResearchData.aggregates.filter(f=>$('#period').value==='all'||f.month===$('#period').value);}
function runAnalysis(){
  const grouped=new Map();
  for(const row of selectedAggregates()){
    let f=grouped.get(row.name);
    if(!f){f={id:sourceNames.indexOf(row.name),name:row.name,area:'Kabupaten Cianjur',samples:0,sum:0,tsh:0,statuses:{},bins:Array(15).fill(0),lat:null,lng:null};grouped.set(row.name,f);}
    f.samples+=row.samples;f.sum+=row.sum;f.tsh=Math.max(f.tsh,row.tsh);
    row.bins.forEach((n,i)=>f.bins[i]+=n);
    Object.entries(row.statuses).forEach(([key,n])=>f.statuses[key]=(f.statuses[key]||0)+n);
  }
  facilities=[...grouped.values()].sort((a,b)=>a.name.localeCompare(b.name,'id'));
  facilities.forEach(f=>{f.mean=f.sum/f.samples;Object.assign(f,FacilityLocations.entries.find(x=>x.name===f.name)||{},facilityCoordinates.get(f.name)||{});});
  activeAnalysis=Clustering.analyze(facilities);return activeAnalysis;
}
let page='beranda',mode='kmeans',riskFilter='Semua',chartType='distribution',legendFilter=null,tablePage=1,chartSelection=null;
const format=n=>new Intl.NumberFormat('id-ID').format(n);
const coordinateTools=$('.coordinate-tools');
if(coordinateTools)coordinateTools.remove();
const dataUsed=document.createElement('section');
dataUsed.className='data-used';
dataUsed.innerHTML='<div><span class="eyebrow">DATA YANG DIGUNAKAN</span><h2>Ringkasan dataset penelitian</h2><p>Angka berikut menjadi dasar penerapan metode clustering dan profil fasyankes pada peta.</p></div><span class="data-used-mark">01 / 04</span>';
$('#stats').before(dataUsed);
const formatAnimated=(value,decimals=0)=>decimals?Number(value).toFixed(decimals).replace('.',','):format(Math.round(value));
function animateCounts(root=document){
  root.querySelectorAll('[data-count]').forEach(el=>{
    const target=Number(el.dataset.count),decimals=Number(el.dataset.decimals||0);
    if(!Number.isFinite(target))return;
    const started=performance.now(),duration=850;
    const tick=now=>{const progress=Math.min(1,(now-started)/duration),eased=1-Math.pow(1-progress,3);el.textContent=formatAnimated(target*eased,decimals);if(progress<1)requestAnimationFrame(tick)};
    requestAnimationFrame(tick);
  });
}
function customSelect(select){
  if(select.dataset.customized)return select.parentElement;
  select.dataset.customized='true';
  const wrapper=document.createElement('div');wrapper.className='custom-select';
  const trigger=document.createElement('button');trigger.type='button';trigger.className='custom-select-trigger';trigger.setAttribute('aria-haspopup','listbox');trigger.setAttribute('aria-expanded','false');
  const menu=document.createElement('div');menu.className='custom-select-menu';menu.setAttribute('role','listbox');
  select.parentElement.insertBefore(wrapper,select);wrapper.append(trigger,menu,select);
  const close=()=>{wrapper.classList.remove('open');trigger.setAttribute('aria-expanded','false')};
  trigger.onclick=()=>{const open=wrapper.classList.toggle('open');trigger.setAttribute('aria-expanded',open);};
  select.customRefresh=()=>{
    const selected=select.selectedOptions[0];trigger.innerHTML=`<span>${escapeHTML(selected?.textContent||'Pilih')}</span><b>⌄</b>`;
    menu.innerHTML=[...select.options].map(option=>`<button type="button" role="option" data-value="${escapeHTML(option.value)}" aria-selected="${option.selected}">${escapeHTML(option.textContent)}</button>`).join('');
    menu.querySelectorAll('[data-value]').forEach(option=>option.onclick=()=>{select.value=option.dataset.value;select.dispatchEvent(new Event('change'));close()});
  };
  document.addEventListener('click',event=>{if(!wrapper.contains(event.target))close()});
  select.customRefresh();return wrapper;
}
function refreshRegionOptions(){
  const select=$('#region'),previous=select.value;
  select.innerHTML='<option value="all">Seluruh fasyankes</option>'+facilities.map(f=>`<option value="facility:${f.id}">${escapeHTML(f.name)}</option>`).join('');
  select.value=[...select.options].some(option=>option.value===previous)?previous:'all';
  select.customRefresh?.();
}
function current(){const region=$('#region').value;return facilities.filter(f=>region==='all'||region===f.area||(region===`facility:${f.id}`));}
function badge(r){return `<span class="badge" style="--c:${colors[r]};--bg:${backgrounds[r]}">${r}</span>`}
const navItems=[['beranda','home','Beranda'],['peta','map','Peta'],['data','table','Data'],['laporan','chart','Analisis']];
const navIcon=icon=>({
  home:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 10 8-6 8 6v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><path d="M9 20v-6h6v6"/></svg>',
  map:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/></svg>',
  table:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 4v16M15 4v16"/></svg>',
  chart:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V5M4 19h17"/><path d="m7 15 4-4 3 2 5-6"/></svg>'
}[icon]);
function navigate(next){page=next;location.hash=next;renderPage();window.scrollTo({top:0,behavior:'smooth'})}
function renderPage(){const info={beranda:['Setiap awal kehidupan,<br><span>layak mendapat perhatian.</span>','Lihat kelompok dan perbedaan data pemeriksaan bayi baru lahir di Kabupaten Cianjur.','Ringkasan wilayah'],peta:['Analisis profil fasyankes<br><span>dalam satu pandangan.</span>','Lihat fasilitas kesehatan yang datanya mirip dan yang polanya berbeda.','Eksplorasi peta'],data:['Data yang terhubung.<br><span>Wawasan yang bermakna.</span>','Telusuri hasil skrining dan profil fasilitas kesehatan di wilayah pengamatan.','Direktori fasyankes'],laporan:['Dari data,<br><span>menjadi pemahaman.</span>','Pelajari distribusi TSH dan volume pemeriksaan dari data penelitian.','Statistik & analisis']}[page];$('#page-title').innerHTML=info[0];$('#page-desc').textContent=info[1];$('#crumb').textContent=info[2];for(const target of ['#side-nav','#mobile-nav']){$(target).innerHTML=navItems.map(([id,icon,label])=>`<a href="#${id}" class="nav-link ${page===id?'active':''}" ${page===id?'aria-current="page"':''}><span class="nav-icon" data-icon="${icon}">${navIcon(icon)}</span><span class="nav-label">${label}</span></a>`).join('');}$('#dashboard').hidden=page==='data';$('#data-page').hidden=page!=='data';$('.content-grid').hidden=page==='laporan';$('.bottom-grid').hidden=page==='peta';render()}
window.addEventListener('hashchange',()=>{const next=location.hash.slice(1);if(navItems.some(n=>n[0]===next)&&page!==next){page=next;renderPage()}});
function render(){
 const analysis=runAnalysis();refreshRegionOptions();const list=current(),count=list.reduce((n,f)=>n+f.samples,0);
 const validated=list.reduce((n,f)=>n+(f.statuses.Validated||0),0);
 $('#stats').innerHTML=[['samples','∑',count,'Total sampel'],['facilities','⌂',list.length,'Nama fasyankes di Excel'],['validated','✓',validated,'Status Validated'],['verified','↗',count-validated,'Verified / Finished']].map(([icon,glyph,value,label])=>`<article class="stat stat-${icon}"><span class="stat-icon">${glyph}</span><div><strong class="count-up" data-count="${value}">${format(value)}</strong><p>${label}</p></div></article>`).join('');
 $('#priority-list').innerHTML=list.filter(f=>f.risk==='Tinggi').slice(0,4).map(f=>`<button class="facility-row" data-id="${f.id}"><span class="facility-symbol">⌖</span><span><strong>${escapeHTML(f.name)}</strong><small>${f.samples} sampel · rerata TSH ${f.mean.toFixed(2).replace('.',',')}</small></span>${badge(f.risk)}<span class="chevron">›</span></button>`).join('')||'<p class="section-description">Tidak ada fasilitas dalam klaster tinggi pada periode ini.</p>';
 $('#period-note').textContent=$('#period').value==='all'?`${ResearchData.metadata.start} – ${ResearchData.metadata.end}`:$('#period').selectedOptions[0].text+' · tanggal sampling';
 renderMap();renderChart();renderTable();bindDetails();
 const score=v=>v===null?'Tidak terdefinisi':v.toFixed(4).replace('.',',');
 $('.chart-summary').innerHTML=`<span>Rerata TSH seluruh sampel<strong>${count?(list.reduce((n,f)=>n+f.sum,0)/count).toFixed(2).replace('.',','):'—'} <small>µU/mL</small></strong></span><span>TSH maksimum<strong>${list.length?Math.max(...list.map(f=>f.tsh)).toFixed(2).replace('.',','):'—'} <small>µU/mL</small></strong></span><span>Silhouette K-Means (seluruh fasyankes)<strong>${score(analysis.silhouette)}</strong></span><span>Silhouette DBSCAN tanpa noise<strong>${score(analysis.dbscanSilhouette)}</strong><small>${analysis.dbscanClusters||0} klaster non-noise; perlu ≥2 klaster</small></span>`;
 animateCounts();
}

function renderZoneSummary(){
  const list=current(), isDbscan=mode==='dbscan';
  const groups=isDbscan
    ? [{key:'Normal',label:'Normal',color:'#188ef1',bg:'#eef6ff',count:list.filter(f=>!f.outlier).length},
       {key:'Outlier',label:'Outlier',color:'#ed666a',bg:'#fff0f0',count:list.filter(f=>f.outlier).length}]
    : Object.keys(colors).map(key=>({key,label:`Klaster ${key.toLowerCase()}`,color:colors[key],bg:backgrounds[key],count:list.filter(f=>f.risk===key).length}));
  $('.zone-card h2').textContent=isDbscan?'Ringkasan anomali':'Ringkasan zonasi';
  $('.zone-card .subtle').textContent=isDbscan?'DBSCAN':'K-MEANS';
  $('.zone-card .section-description').textContent=isDbscan?'DBSCAN menentukan fasyankes yang pola datanya berbeda dari fasilitas lain.':'K-Means menentukan kelompok fasyankes yang data pemeriksaannya mirip.';
  $('#zones').innerHTML=groups.map(g=>`<button class="zone-row" data-zone="${g.key}" style="--c:${g.color};--bg:${g.bg}"><span class="zone-indicator">${g.key==='Outlier'||g.key==='Tinggi'?'!':'⌖'}</span><span><strong>${g.label}</strong><small>${isDbscan?patternMeaning[g.key]:riskMeaning[g.key]}</small></span><b class="count-up" data-count="${g.count}">${format(g.count)}</b></button>`).join('');
  animateCounts($('#zones'));
  $$('[data-zone]').forEach(b=>b.onclick=()=>{riskFilter=b.dataset.zone;$('#search').value='';navigate('data')});
  $('.zone-card .distribution-bar').innerHTML=groups.map(g=>`<i style="width:${list.length?g.count/list.length*100:0}%;background:${g.color}" title="${g.label}: ${format(g.count)}"></i>`).join('');
  $('.zone-card .insight-note p').innerHTML=isDbscan
    ? '<strong>Berbeda belum tentu berbahaya</strong>Outlier berarti pola data berbeda, bukan pasti berisiko tinggi. Normal berarti bukan outlier, bukan semua bayi sehat. Angka di atas dihitung dari data Excel pada periode terpilih.'
    : '<strong>Apa dasar kategori?</strong>Kategori mengikuti rerata tiga komponen centroid z-score: jumlah sampel, rerata TSH, dan TSH maksimum. Bobot sama adalah aturan operasional aplikasi, belum ditentukan dalam makalah; bukan batas risiko klinis.';
  $('#method-explanation').innerHTML=isDbscan
    ? '<strong>DBSCAN menandai pola pemeriksaan yang tidak biasa.</strong><p>Normal berarti pola data mirip; Outlier berarti berbeda dari kelompok umum.</p>'
    : '<strong>K-Means mengelompokkan profil volume dan TSH fasyankes.</strong><p>Kategori dibuat dari jumlah sampel dan nilai TSH secara bersama. Buka detail untuk penjelasannya.</p>';
}
// Only coordinates explicitly supplied for facilities may be mapped.
let geoMap, markerLayer, lastMapRegion=null;
const cianjurBounds=[[-7.52,106.78],[-6.65,107.47]];
function fitMapRegion(){
  if(!geoMap)return;
  geoMap.invalidateSize();
  const region=$('#region').value;
  const located=current().filter(f=>Number.isFinite(f.lat)&&Number.isFinite(f.lng));
  if(located.length)geoMap.fitBounds(L.latLngBounds(located.map(f=>[f.lat,f.lng])),{padding:[45,65],maxZoom:12,animate:false});
  else geoMap.fitBounds(cianjurBounds,{padding:[14,20],animate:false});
  lastMapRegion=region;
}
function ensureMap(){
  if(!facilityCoordinates.size){$('#map-status').hidden=false;$('#map-status').textContent='Koordinat fasyankes tidak tersedia dalam Excel. Titik peta belum dapat ditampilkan. Hasil clustering tersedia pada ringkasan dan tabel; tidak ada lokasi perkiraan.';return false;}
  if(geoMap)return true;
  if(!window.L){$('#map-status').hidden=false;$('#map-status').textContent='Komponen peta tidak tersedia. Muat ulang halaman.';return false;}
  // Wait until the map is visible, including direct #data / #laporan entry.
  if(!$('#map').getBoundingClientRect().height)return false;
  geoMap=L.map('map',{zoomControl:false,scrollWheelZoom:true,touchZoom:true,doubleClickZoom:true,minZoom:3,maxZoom:18});
  markerLayer=L.layerGroup().addTo(geoMap);
  if(location.protocol==='file:'){
    $('#map-status').hidden=false;
    $('#map-status').innerHTML='Peta online tersedia melalui server lokal. Jalankan start-server.ps1, lalu buka <a href="http://localhost:8080">localhost:8080</a>.';
  }else{
    const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>'});
    let tileFailed=false;
    tiles.on('loading',()=>{tileFailed=false});
    tiles.on('tileerror',()=>{tileFailed=true;$('#map-status').hidden=false;$('#map-status').textContent='Sebagian peta belum termuat. Periksa koneksi internet, lalu geser atau muat ulang peta.'});
    tiles.on('load',()=>{if(!tileFailed)$('#map-status').hidden=true});
    tiles.addTo(geoMap);
  }
  L.control.scale({imperial:false,position:'bottomleft'}).addTo(geoMap);
  new ResizeObserver(()=>{if($('#map').getBoundingClientRect().height){geoMap.invalidateSize();if(!lastMapRegion)fitMapRegion()}}).observe($('#map'));
  fitMapRegion();
  return true;
}
function renderMap(){
  renderZoneSummary();
  const list=current(),normal=list.filter(f=>!f.outlier).length,out=list.length-normal;
  const legendEntries=(mode==='kmeans'?Object.keys(colors).map(r=>[r,colors[r],list.filter(f=>f.risk===r).length]):[['Normal','#188ef1',normal],['Outlier','#ed666a',out]]);
  $('#legend').innerHTML=legendEntries.map(([r,c,total])=>`<button data-legend="${r}" class="${legendFilter&&legendFilter!==r?'dim':''}" aria-pressed="${legendFilter===r}"><i style="--c:${c}"></i>${r} <span>(${total})</span></button>`).join('');
  $$('[data-legend]').forEach(b=>b.onclick=()=>{legendFilter=legendFilter===b.dataset.legend?null:b.dataset.legend;renderMap()});
  if(!ensureMap())return;
  markerLayer.clearLayers();
  const points=list.filter(f=>Number.isFinite(f.lat)&&Number.isFinite(f.lng)&&(!legendFilter||(mode==='kmeans'?f.risk===legendFilter:(f.outlier?'Outlier':'Normal')===legendFilter)));
  const mappedTotal=points.length;
  const groups=new Map();
  for(const f of points){const key=`${f.lat},${f.lng}`;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(f);}
  const summaryText = mode==='kmeans'
    ? `${mappedTotal} titik tampil di peta · ${activeAnalysis.centers.length} klaster K-Means`
    : `${mappedTotal} titik tampil di peta · ${out} outlier DBSCAN`;
  $('#map-footnote').textContent = summaryText;
  if (mappedTotal < list.length) {
    $('#map-status').hidden = false;
    $('#map-status').textContent = `Ada ${list.length - mappedTotal} fasilitas belum punya koordinat valid, sehingga peta hanya menampilkan ${mappedTotal} titik.`;
  } else {
    $('#map-status').hidden = true;
  }
  for(const group of groups.values()){
    const f=group.reduce((a,b)=>Object.keys(colors).indexOf(a.risk)>Object.keys(colors).indexOf(b.risk)?a:b);
    const color=mode==='kmeans'?colors[f.risk]:group.some(x=>x.outlier)?'#ed666a':'#188ef1';
    const marker=L.circleMarker([f.lat,f.lng],{radius:6+Math.sqrt(Math.max(...group.map(x=>x.samples))),color:'#fff',weight:1.3,fillColor:color,fillOpacity:.85}).addTo(markerLayer);
    marker.bindTooltip(`${escapeHTML(f.matchedName||f.name)}<br>${group.length} nama dalam Excel<br><small>Klik untuk detail dan sumber lokasi</small>`,{direction:'top'});
    const open=()=>{
      if(group.length===1){showDetail(f.id);return;}
      showDialog(`<h2>Beberapa nama pada lokasi yang sama</h2><p>Nama asli tetap dianalisis terpisah. Warna titik mengikuti klaster tertinggi atau adanya outlier di lokasi ini.</p>${group.map(x=>`<button class="facility-row" data-id="${x.id}">${escapeHTML(x.name)} · ${x.samples} sampel · ${x.risk} · ${x.outlier?'Outlier':'Bukan outlier'}</button>`).join('')}`);bindDetails();
    };
    marker.on('click',open);
    const el=marker.getElement();if(el){el.setAttribute('tabindex','0');el.setAttribute('role','button');el.setAttribute('aria-label',`${f.matchedName||f.name}, ${group.length} nama, lihat detail`);el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});}
  }
  requestAnimationFrame(()=>{geoMap.invalidateSize();if(lastMapRegion!==$('#region').value)fitMapRegion()});
}
function renderChart(){
 const list=current(),bins=Array(15).fill(0);list.forEach(f=>f.bins.forEach((n,i)=>bins[i]+=n));
 const months=[...new Set(ResearchData.aggregates.map(f=>f.month))].sort();
 const trend=months.map(m=>selectedAggregates().filter(f=>f.month===m).reduce((s,f)=>s+f.samples,0));
 const values=chartType==='distribution'?bins:trend,max=Math.max(1,...values),step=450/values.length;
 $('#chart-desc').textContent=chartType==='distribution'?'Distribusi TSH seluruh sampel pemeriksaan':'Volume aktual menurut bulan sampling · sesuai periode terpilih';
 const labels=values.map((v,i)=>chartType==='distribution'?(i===14?'≥14':`${i}–${i+1} µU/mL`):months[i]);
 $('#chart').innerHTML=`<svg viewBox="0 0 520 180" role="img" aria-label="${$('#chart-desc').textContent}">${[0,1,2,3,4].map(i=>`<line x1="40" y1="${15+i*30}" x2="505" y2="${15+i*30}" stroke="#edf2f7"/><text x="30" y="${18+i*30}" text-anchor="end" font-size="8" fill="#91a0b2">${format(Math.round(max*(4-i)/4))}</text>`).join('')}${values.map((v,i)=>`<rect class="chart-bar ${chartSelection===i?'selected':''}" data-index="${i}" data-label="${escapeHTML(labels[i])}" data-value="${v}" tabindex="0" role="button" aria-label="${escapeHTML(labels[i])}: ${format(v)} sampel" x="${45+i*step}" y="${135-v/max*120}" width="${Math.max(4,step-8)}" height="${Math.max(1,v/max*120)}" fill="#3894f5" rx="3"><title>${escapeHTML(labels[i])}: ${v} sampel</title></rect><text x="${45+i*step+(step-8)/2}" y="150" text-anchor="middle" font-size="8" fill="#8c9bad">${chartType==='distribution'?(i===14?'14+':i):months[i]}</text>`).join('')}<text x="270" y="174" text-anchor="middle" font-size="8" fill="#8c9bad">${chartType==='distribution'?'TSH (µU/mL)':'Bulan sampling'}</text></svg><div id="chart-tooltip" role="status" aria-live="polite"></div>`;
 const tooltip=$('#chart-tooltip');
 const showBar=bar=>{tooltip.textContent=`${bar.dataset.label}: ${format(Number(bar.dataset.value))} sampel`;tooltip.classList.add('show');$$('.chart-bar').forEach(x=>x.classList.toggle('selected',x===bar||Number(x.dataset.index)===chartSelection));};
 const hideBar=()=>{if(chartSelection===null)tooltip.classList.remove('show')};
 $$('.chart-bar').forEach(bar=>{bar.onmouseenter=()=>showBar(bar);bar.onfocus=()=>showBar(bar);bar.onmouseleave=hideBar;bar.onblur=hideBar;bar.onclick=()=>{chartSelection=chartSelection===Number(bar.dataset.index)?null:Number(bar.dataset.index);showBar(bar);if(chartSelection===null)tooltip.classList.remove('show')};bar.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();bar.click()}}});
}

function paginationPages(total,current){if(total<=5)return Array.from({length:total},(_,i)=>i+1);if(current<=2)return [1,2,'dots-right',total];if(current>=total-1)return [1,'dots-left',total-1,total];return [1,'dots-left',current-1,current,current+1,'dots-right',total]}
function renderTable(){const q=$('#search').value.toLowerCase(),kmeans=$('#kmeans-filter')?.value||'Semua',dbscan=$('#dbscan-filter')?.value||'Semua',activeFilter=dbscan!=='Semua'?dbscan:kmeans,list=current().filter(f=>(activeFilter==='Semua'||(activeFilter==='Outlier'?f.outlier:activeFilter==='Normal'?!f.outlier:f.risk===activeFilter))&&`${f.name} ${escapeHTML(f.area)}`.toLowerCase().includes(q)),pageSize=10,totalPages=Math.max(1,Math.ceil(list.length/pageSize));riskFilter=activeFilter;tablePage=Math.min(tablePage,totalPages);const visible=list.slice((tablePage-1)*pageSize,tablePage*pageSize);$('#result-count').textContent=`${list.length} FASYANKES`;$('#facility-table').innerHTML=visible.map(f=>`<tr data-id="${f.id}" tabindex="0"><td><strong>${escapeHTML(f.name)}</strong><small>${escapeHTML(f.area)}</small></td><td>${f.samples}</td><td>${f.mean.toFixed(2).replace('.',',')} µU/mL</td><td>${f.tsh.toFixed(1).replace('.',',')} µU/mL</td><td>${badge(f.risk)}</td><td style="color:${f.outlier?'#ed6c70':'#8ba0b2'}">${f.outlier?'↗ Outlier':'Normal'}</td><td><button class="text-button" aria-label="Detail ${escapeHTML(f.name)}">Detail ↗</button></td></tr>`).join('')||'<tr><td colspan="7">Tidak ada fasilitas yang sesuai. Coba kata kunci atau filter lain.</td></tr>';$('#table-pagination').innerHTML=`<button class="page-arrow" data-page="prev" aria-label="Halaman sebelumnya" ${tablePage===1?'disabled':''}>‹</button>${paginationPages(totalPages,tablePage).map(page=>page.startsWith?.('dots')?'<span class="page-dots">…</span>':`<button class="page-number ${tablePage===page?'active':''}" data-page="${page}" aria-label="Halaman ${page}" aria-current="${tablePage===page?'page':'false'}">${page}</button>`).join('')}<button class="page-arrow" data-page="next" aria-label="Halaman berikutnya" ${tablePage===totalPages?'disabled':''}>›</button><span class="page-status">${tablePage} / ${totalPages}</span>`;$$('[data-page]').forEach(b=>b.onclick=()=>{if(b.disabled)return;tablePage=b.dataset.page==='prev'?tablePage-1:b.dataset.page==='next'?tablePage+1:Number(b.dataset.page);renderTable()});bindDetails()}
function bindDetails(){$$('[data-id]').forEach(b=>{b.onclick=()=>showDetail(Number(b.dataset.id));b.onkeydown=e=>{if(e.key==='Enter')b.click()}})}
function showDialog(html){$('#dialog-content').innerHTML=html;if(!$('#detail-dialog').open)$('#detail-dialog').showModal()}
function showDetail(id){
 const f=facilities.find(f=>f.id===id);if(!f)return;
 const meaning={Rendah:'lebih rendah',Sedang:'berada di tengah',Tinggi:'lebih tinggi'};
 const locationNote=Number.isFinite(f.lat)?(f.sourceTitle==='CSV pengguna'?'Lokasi ini berasal dari file yang Anda unggah dan hanya digunakan selama halaman ini dibuka.':'Titik peta menunjukkan lokasi fasilitas menurut sumber yang tercantum di bawah. Lokasinya belum diperiksa langsung dan mungkin sudah berubah.'):'Lokasi fasilitas ini belum dapat dipastikan, sehingga belum ditampilkan di peta.';
 showDialog(`<span class="eyebrow">INFORMASI FASILITAS KESEHATAN</span><h2>${escapeHTML(f.name)}</h2><p>Periode pemeriksaan: ${escapeHTML($('#period').selectedOptions[0].text)}</p>${badge(f.risk)}<div class="detail-box"><strong>Ringkasan pemeriksaan</strong><div class="detail-line"><span>Jumlah sampel yang diperiksa</span><strong>${f.samples}</strong></div><div class="detail-line"><span>Nilai TSH rata-rata</span><strong>${f.mean.toFixed(2).replace('.',',')} µU/mL</strong></div><div class="detail-line"><span>Nilai TSH paling tinggi</span><strong>${f.tsh.toFixed(2).replace('.',',')} µU/mL</strong></div><div class="detail-line"><span>Kemiripan data</span><strong>${f.outlier?'Berbeda dari kelompok umum':'Mirip dengan fasilitas lain'}</strong></div><p>TSH adalah nama nilai pemeriksaan yang tercatat dalam data penelitian. µU/mL adalah satuan nilainya. Jumlah sampel belum tentu sama dengan jumlah bayi.</p></div><div class="detail-box"><strong>Mengapa masuk kategori ${f.risk.toLowerCase()}?</strong><p>Aplikasi membandingkan tiga hal: jumlah sampel, nilai TSH rata-rata, dan nilai TSH paling tinggi. Ketiganya diperhitungkan bersama dan diberi bobot yang sama.</p><p>Fasilitas ini masuk kelompok yang hasil gabungannya ${meaning[f.risk]} dibanding kelompok lain pada periode yang dipilih. Jadi, kategori tidak ditentukan oleh satu nilai TSH saja.</p><p>Kategori rendah, sedang, dan tinggi menunjukkan perbandingan data antarfasilitas. Kategori ini bukan penilaian bahwa bayi sehat atau sakit.</p></div><div class="detail-box"><strong>Apa arti kemiripan data?</strong><p>${f.outlier?'Data fasilitas ini cukup berbeda dari kelompok fasilitas lain. Pada tabel, hasil ini disebut “Outlier”. Perbedaannya dapat ditinjau lebih lanjut melalui jumlah sampel dan nilai pemeriksaannya.':'Data fasilitas ini memiliki pola yang mirip dengan fasilitas lain. Pada tabel, hasil ini disebut “Normal”. Kata normal di sini berarti pola datanya mirip, bukan berarti semua hasil pemeriksaan bayi normal.'}</p><p>Kategori “Tinggi” dan pola “Normal” bisa muncul bersamaan: fasilitas berada dalam kelompok dengan hasil gabungan lebih tinggi, tetapi polanya masih mirip dengan fasilitas lain.</p></div><div class="detail-box"><strong>Lokasi fasilitas</strong><p>${escapeHTML(f.matchedName||f.name)} · ${escapeHTML(f.area)}</p><p>${locationNote}</p>${f.matchedName&&f.matchedName!==f.name?'<p>Nama pada data penelitian dicocokkan dengan nama fasilitas di atas. Titik menunjukkan lokasi fasilitas secara keseluruhan, bukan ruang pelayanan tertentu.</p>':''}${f.name==='PUSKESMAS NAGRAK'?'<p>Ada informasi rencana pindah lokasi pada Mei 2026. Titik saat ini masih mengikuti sumber tahun 2023.</p>':''}${/^https:\/\//.test(f.sourceUrl||'')?`<a href="${escapeHTML(f.sourceUrl)}" target="_blank" rel="noopener">Lihat sumber lokasi: ${escapeHTML(f.sourceTitle)}</a>`:''}</div><p>Seluruh catatan pemeriksaan pada periode ini disertakan. Nama dan identitas pasien tidak ditampilkan.</p><details class="detail-box"><summary>Penjelasan teknis untuk penelitian</summary><p>K-Means mengelompokkan tiga nilai pemeriksaan setelah penyetaraan skala (z-score). Urutan rendah–tinggi mengikuti rata-rata pusat kelompok dengan bobot sama; aturan penamaan ini ditetapkan di aplikasi. DBSCAN mencari kemiripan pola dengan ε = 0,8 dan minPts = 3, termasuk titik sendiri.</p><a href="RESEARCH.md" target="_blank" rel="noopener">Baca metode dan batasan penelitian</a></details>`);

}

function methodology(){
  let dialog=$('#intro-dialog');
  if(!dialog){
    dialog=document.createElement('dialog');
    dialog.id='intro-dialog';
    dialog.setAttribute('aria-labelledby','intro-title');
    dialog.innerHTML=`<button class="dialog-close" id="intro-close" aria-label="Tutup pengantar">×</button>
      <div class="intro-heading"><span class="eyebrow">SELAMAT DATANG DI SBBL JAWA BARAT</span><h2 id="intro-title" tabindex="-1">Dari laporan data,<br><span>menjadi informasi yang mudah dipahami.</span></h2></div>
      <section class="intro-conclusion"><p>Aplikasi membantu membandingkan data pemeriksaan antar fasilitas kesehatan di Kabupaten Cianjur.</p><p><strong>Kategori rendah, sedang, dan tinggi</strong> dibuat dari gabungan jumlah sampel, nilai TSH rata-rata, dan nilai TSH paling tinggi. Kategori ini merupakan perbandingan data, bukan penilaian kesehatan bayi.</p><p><strong>Pola “Normal”</strong> berarti data mirip dengan fasilitas lain. <strong>“Outlier”</strong> berarti polanya berbeda dari kelompok umum. Karena itu, kategori tinggi tetap bisa memiliki pola normal.</p></section>
      <div class="intro-simulation">Data berasal dari ${ResearchData.metadata.records} pemeriksaan dengan ${ResearchData.metadata.facilities} nama fasilitas dalam Excel. Beberapa nama merujuk pada fasilitas yang sama. Saat periode diganti, aplikasi menghitung kembali hasilnya. Titik peta memakai lokasi fasilitas dari sumber publik; nama yang lokasinya belum pasti belum ditampilkan. Buka detail fasilitas untuk melihat angka pemeriksaan, penjelasan kategori, dan sumber lokasi.</div>
      <details class="detail-box"><summary>Metode penelitian lebih lanjut</summary><p>Pengelompokan memakai K-Means, sedangkan pemeriksaan kemiripan memakai DBSCAN. Keduanya membandingkan data pemeriksaan, bukan jarak lokasi di peta.</p><a href="RESEARCH.md" target="_blank" rel="noopener">Baca pengaturan perhitungan dan batasan data</a></details>
      <div class="intro-actions"><button class="primary-button" id="intro-start">Mulai jelajahi dashboard <span>→</span></button><small>Bisa dibaca kembali melalui tombol ⓘ atau Pahami cara membaca peta.</small></div>`;
    document.body.appendChild(dialog);
    const close=()=>dialog.close();
    $('#intro-close').onclick=close;$('#intro-start').onclick=close;
    dialog.addEventListener('close',()=>{$('#info-button').focus({preventScroll:true})});
  }
  if(!dialog.open){dialog.showModal();dialog.scrollTop=0;$('#intro-title').focus({preventScroll:true})}
}
$$('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;legendFilter=null;$$('[data-mode]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',x===b)});renderMap()});$$('[data-chart]').forEach(b=>b.onclick=()=>{chartType=b.dataset.chart;$$('[data-chart]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',x===b)});renderChart()});$$('[data-risk]').forEach(b=>b.onclick=()=>{riskFilter=b.dataset.risk;renderTable()});$('#region').onchange=()=>{legendFilter=null;render()};$('#period').onchange=()=>{legendFilter=null;render()};$('#search').oninput=renderTable;$('#all-facilities').onclick=()=>{riskFilter='Semua';navigate('data')};$('#map-table').onclick=()=>{riskFilter=mode==='dbscan'?'Outlier':'Semua';navigate('data')};$('#zoom-in').onclick=()=>{if(ensureMap())geoMap.zoomIn(1,{animate:false})};$('#zoom-out').onclick=()=>{if(ensureMap())geoMap.zoomOut(1,{animate:false})};$('#reset-map').onclick=()=>{legendFilter=null;renderMap();fitMapRegion()};$('.dialog-close').onclick=()=>$('#detail-dialog').close();$('#detail-dialog').onclick=e=>{if(e.target===$('#detail-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close()}};$('#method').onclick=methodology;$('#info-button').onclick=methodology;
$('#export').onclick=()=>{const q=$('#search').value.toLowerCase();const data=current().filter(f=>page!=='data'||((riskFilter==='Semua'||(riskFilter==='Outlier'?f.outlier:riskFilter==='Normal'?!f.outlier:f.risk===riskFilter))&&`${f.name} ${escapeHTML(f.area)}`.toLowerCase().includes(q)));const rows=[['Nama fasyankes','Wilayah','Sampel','TSH rata-rata (uU/mL)','TSH maksimum (uU/mL)','Klaster profil','DBSCAN','Periode','Sumber'],...data.map(f=>[f.name,f.area,f.samples,f.mean,f.tsh,f.risk,f.outlier?'Outlier':'Normal',$('#period').selectedOptions[0].text,ResearchData.metadata.source])];const blob=new Blob(['\uFEFF'+rows.map(r=>r.map(v=>'"'+String(/^[=+@-]/.test(String(v)) ? "'"+v : v).replaceAll('"','""')+'"').join(',')).join('\r\n')],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`SBBL-penelitian-${$('#period').value}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('#toast').textContent=`${data.length} fasilitas diekspor sebagai CSV`;$('#toast').classList.add('show');setTimeout(()=>$('#toast').classList.remove('show'),3000)};
$('#period').innerHTML='<option value="all">Seluruh data (Jun–Agu 2026)</option>'+[...new Set(ResearchData.aggregates.map(f=>f.month))].sort().map(m=>`<option value="${m}">${m}</option>`).join('');
$('#region').innerHTML='<option value="all">Seluruh fasyankes</option>';$('#region').disabled=false;
customSelect($('#period'));customSelect($('#region'));customSelect($('#kmeans-filter'));customSelect($('#dbscan-filter'));
$('#kmeans-filter').onchange=()=>{tablePage=1;$('#dbscan-filter').value='Semua';renderTable()};$('#dbscan-filter').onchange=()=>{tablePage=1;$('#kmeans-filter').value='Semua';renderTable()};
page=navItems.some(n=>n[0]===location.hash.slice(1))?location.hash.slice(1):'beranda';renderPage();


