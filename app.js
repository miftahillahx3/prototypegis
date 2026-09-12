const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const colors={Rendah:'#32b887',Sedang:'#efb449',Tinggi:'#ed6c70'}, backgrounds={Rendah:'#eef9f3',Sedang:'#fff8e9',Tinggi:'#fff0f0'};
const riskMeaning={Rendah:'Profil gabungan relatif lebih rendah',Sedang:'Profil gabungan di tengah',Tinggi:'Profil gabungan relatif lebih tinggi'};
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
let page='beranda',mode='kmeans',riskFilter='Semua',chartType='distribution',legendFilter=null;
const format=n=>new Intl.NumberFormat('id-ID').format(n);
function current(){const region=$('#region').value;return facilities.filter(f=>region==='all'||f.area===region);}
function badge(r){return `<span class="badge" style="--c:${colors[r]};--bg:${backgrounds[r]}">${r}</span>`}
const navItems=[['beranda','⌂','Beranda'],['peta','◫','Peta'],['data','▤','Data'],['laporan','▥','Analisis']];
function navigate(next){page=next;location.hash=next;renderPage();window.scrollTo({top:0,behavior:'smooth'})}
function renderPage(){const info={beranda:['Setiap awal kehidupan,<br><span>layak mendapat perhatian.</span>','Lihat kelompok dan perbedaan data pemeriksaan bayi baru lahir di Kabupaten Cianjur.','Ringkasan wilayah'],peta:['Analisis profil fasyankes<br><span>dalam satu pandangan.</span>','Lihat fasilitas kesehatan yang datanya mirip dan yang polanya berbeda.','Eksplorasi peta'],data:['Data yang terhubung.<br><span>Wawasan yang bermakna.</span>','Telusuri hasil skrining dan profil fasilitas kesehatan di wilayah pengamatan.','Direktori fasyankes'],laporan:['Dari data,<br><span>menjadi pemahaman.</span>','Pelajari distribusi TSH dan volume pemeriksaan dari data penelitian.','Statistik & analisis']}[page];$('#page-title').innerHTML=info[0];$('#page-desc').textContent=info[1];$('#crumb').textContent=info[2];for(const target of ['#side-nav','#mobile-nav']){$(target).innerHTML=navItems.map(([id,icon,label])=>`<a href="#${id}" class="nav-link ${page===id?'active':''}" ${page===id?'aria-current="page"':''}><span class="nav-icon">${icon}</span><span class="nav-label">${label}</span></a>`).join('');}$('#dashboard').hidden=page==='data';$('#data-page').hidden=page!=='data';$('.content-grid').hidden=page==='laporan';$('.bottom-grid').hidden=page==='peta';render()}
window.addEventListener('hashchange',()=>{const next=location.hash.slice(1);if(navItems.some(n=>n[0]===next)&&page!==next){page=next;renderPage()}});
function render(){
 const analysis=runAnalysis(),list=current(),count=list.reduce((n,f)=>n+f.samples,0);
 const validated=list.reduce((n,f)=>n+(f.statuses.Validated||0),0);
 $('#stats').innerHTML=[['▤',count,'Total sampel'],['♙',list.length,'Nama fasyankes di Excel'],['▦',validated,'Status Validated'],['✓',count-validated,'Verified / Finished']].map(([icon,value,label])=>`<article class="stat"><span class="stat-icon">${icon}</span><div><strong>${format(value)}</strong><p>${label}</p></div></article>`).join('');
 $('#priority-list').innerHTML=list.filter(f=>f.risk==='Tinggi').slice(0,4).map(f=>`<button class="facility-row" data-id="${f.id}"><span class="facility-symbol">♙</span><span><strong>${escapeHTML(f.name)}</strong><small>${f.samples} sampel · rerata TSH ${f.mean.toFixed(2).replace('.',',')}</small></span>${badge(f.risk)}<span class="chevron">›</span></button>`).join('')||'<p class="section-description">Tidak ada fasilitas dalam klaster tinggi pada periode ini.</p>';
 $('#period-note').textContent=$('#period').value==='all'?`${ResearchData.metadata.start} – ${ResearchData.metadata.end}`:$('#period').selectedOptions[0].text+' · tanggal sampling';
 renderMap();renderChart();renderTable();bindDetails();
 const score=v=>v===null?'Tidak terdefinisi':v.toFixed(4).replace('.',',');
 $('.chart-summary').innerHTML=`<span>Rerata TSH seluruh sampel<strong>${count?(list.reduce((n,f)=>n+f.sum,0)/count).toFixed(2).replace('.',','):'—'} <small>µU/mL</small></strong></span><span>TSH maksimum<strong>${list.length?Math.max(...list.map(f=>f.tsh)).toFixed(2).replace('.',','):'—'} <small>µU/mL</small></strong></span><span>Silhouette K-Means (seluruh fasyankes)<strong>${score(analysis.silhouette)}</strong></span><span>Silhouette DBSCAN tanpa noise<strong>${score(analysis.dbscanSilhouette)}</strong><small>${analysis.dbscanClusters||0} klaster non-noise; perlu ≥2 klaster</small></span>`;
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
  $('#zones').innerHTML=groups.map(g=>`<button class="zone-row" data-zone="${g.key}" style="--c:${g.color};--bg:${g.bg}"><span class="zone-indicator">${g.key==='Outlier'||g.key==='Tinggi'?'!':'⌖'}</span><span><strong>${g.label}</strong><small>${isDbscan?patternMeaning[g.key]:riskMeaning[g.key]}</small></span><b>${format(g.count)}</b></button>`).join('');
  $$('[data-zone]').forEach(b=>b.onclick=()=>{riskFilter=b.dataset.zone;$('#search').value='';navigate('data')});
  $('.zone-card .distribution-bar').innerHTML=groups.map(g=>`<i style="width:${list.length?g.count/list.length*100:0}%;background:${g.color}" title="${g.label}: ${format(g.count)}"></i>`).join('');
  $('.zone-card .insight-note p').innerHTML=isDbscan
    ? '<strong>Berbeda belum tentu berbahaya</strong>Outlier berarti pola data berbeda, bukan pasti berisiko tinggi. Normal berarti bukan outlier, bukan semua bayi sehat. Angka di atas dihitung dari data Excel pada periode terpilih.'
    : '<strong>Apa dasar kategori?</strong>Kategori mengikuti rerata tiga komponen centroid z-score: jumlah sampel, rerata TSH, dan TSH maksimum. Bobot sama adalah aturan operasional aplikasi, belum ditentukan dalam makalah; bukan batas risiko klinis.';
  $('#method-explanation').innerHTML=isDbscan
    ? '<strong>DBSCAN menandai pola pemeriksaan yang tidak biasa.</strong><p>DBSCAN: ε = 0,8; minPts = 3 pada tiga variabel z-score.</p>'
    : '<strong>K-Means mengelompokkan profil volume dan TSH fasyankes.</strong><p>K-Means: k = 3 pada tiga variabel z-score. Buka tabel untuk hasil per fasilitas.</p>';
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
  $('#legend').innerHTML=(mode==='kmeans'?Object.keys(colors).map(r=>[r,colors[r],list.filter(f=>f.risk===r).length]):[['Normal','#188ef1',normal],['Outlier','#ed666a',out]]).map(([r,c,n])=>`<button data-legend="${r}" class="${legendFilter&&legendFilter!==r?'dim':''}" aria-pressed="${legendFilter===r}"><i style="--c:${c}"></i>${r} <span>(${n})</span></button>`).join('');
  $$('[data-legend]').forEach(b=>b.onclick=()=>{legendFilter=legendFilter===b.dataset.legend?null:b.dataset.legend;renderMap()});
  $('#map-footnote').textContent=mode==='kmeans'?`${activeAnalysis.centers.length} klaster K-Means · data penelitian`:`${out} outlier DBSCAN · data penelitian`;
  if(!ensureMap())return;
  markerLayer.clearLayers();
  const points=list.filter(f=>Number.isFinite(f.lat)&&Number.isFinite(f.lng)&&(!legendFilter||(mode==='kmeans'?f.risk===legendFilter:(f.outlier?'Outlier':'Normal')===legendFilter)));
  $('#map-footnote').textContent+=` · ${points.length} titik ditampilkan`;
  const groups=new Map();
  for(const f of points){const key=`${f.lat},${f.lng}`;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(f);}
  $('#map-footnote').textContent=`${points.length} nama pada ${groups.size} lokasi · legenda mencakup seluruh data, termasuk yang belum terpetakan`;
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
 $('#chart').innerHTML=`<svg viewBox="0 0 520 180" role="img" aria-label="${$('#chart-desc').textContent}">${[0,1,2,3,4].map(i=>`<line x1="40" y1="${15+i*30}" x2="505" y2="${15+i*30}" stroke="#edf2f7"/><text x="30" y="${18+i*30}" text-anchor="end" font-size="8" fill="#91a0b2">${format(Math.round(max*(4-i)/4))}</text>`).join('')}${values.map((v,i)=>`<rect x="${45+i*step}" y="${135-v/max*120}" width="${step-8}" height="${v/max*120}" fill="#3894f5" rx="3"><title>${chartType==='distribution'?(i===14?'≥14':`${i}–${i+1}`)+' µU/mL':months[i]}: ${v} sampel</title></rect><text x="${45+i*step+(step-8)/2}" y="150" text-anchor="middle" font-size="8" fill="#8c9bad">${chartType==='distribution'?(i===14?'14+':i):months[i]}</text>`).join('')}<text x="270" y="174" text-anchor="middle" font-size="8" fill="#8c9bad">${chartType==='distribution'?'TSH (µU/mL)':'Bulan sampling'}</text></svg>`;
}

function renderTable(){const q=$('#search').value.toLowerCase(),list=current().filter(f=>(riskFilter==='Semua'||(riskFilter==='Outlier'?f.outlier:riskFilter==='Normal'?!f.outlier:f.risk===riskFilter))&&`${f.name} ${escapeHTML(f.area)}`.toLowerCase().includes(q));$('#result-count').textContent=`${list.length} FASYANKES`;$$('[data-risk]').forEach(b=>{b.classList.toggle('active',b.dataset.risk===riskFilter);b.setAttribute('aria-pressed',b.dataset.risk===riskFilter)});$('#facility-table').innerHTML=list.map(f=>`<tr data-id="${f.id}" tabindex="0"><td><strong>${escapeHTML(f.name)}</strong><small>${escapeHTML(f.area)}</small></td><td>${f.samples}</td><td>${f.mean.toFixed(2).replace('.',',')} µU/mL</td><td>${f.tsh.toFixed(1).replace('.',',')} µU/mL</td><td>${badge(f.risk)}</td><td style="color:${f.outlier?'#ed6c70':'#8ba0b2'}">${f.outlier?'↗ Outlier':'Normal'}</td><td><button class="text-button" aria-label="Detail ${escapeHTML(f.name)}">Detail ↗</button></td></tr>`).join('')||'<tr><td colspan="7">Tidak ada fasilitas yang sesuai. Coba kata kunci atau filter lain.</td></tr>';bindDetails()}
function bindDetails(){$$('[data-id]').forEach(b=>{b.onclick=()=>showDetail(Number(b.dataset.id));b.onkeydown=e=>{if(e.key==='Enter')b.click()}})}
function showDialog(html){$('#dialog-content').innerHTML=html;if(!$('#detail-dialog').open)$('#detail-dialog').showModal()}
function showDetail(id){
 const f=facilities.find(f=>f.id===id);if(!f)return;
 showDialog(`<span class="eyebrow">PROFIL FASYANKES · DATA PENELITIAN</span><h2>${escapeHTML(f.name)}</h2><p>${$('#period').selectedOptions[0].text}</p>${badge(f.risk)}<div class="detail-box"><strong>Ringkasan pemeriksaan</strong><div class="detail-line"><span>Total sampel</span><strong>${f.samples}</strong></div><div class="detail-line"><span>Rata-rata TSH</span><strong>${f.mean.toFixed(2).replace('.',',')} µU/mL</strong></div><div class="detail-line"><span>TSH maksimum</span><strong>${f.tsh.toFixed(2).replace('.',',')} µU/mL</strong></div><div class="detail-line"><span>Pola DBSCAN</span><strong>${f.outlier?'Outlier':'Bukan outlier'}</strong></div></div><div class="detail-box"><strong>Dasar pengelompokan</strong><p>K-Means memakai jumlah sampel, rata-rata TSH, dan TSH maksimum setelah normalisasi z-score. Pusat klaster ini: ${f.centroid[0].toFixed(2)} sampel, rata-rata TSH ${f.centroid[1].toFixed(2)} µU/mL, maksimum TSH ${f.centroid[2].toFixed(2)} µU/mL.</p><p>Rendah–tinggi adalah urutan rerata tiga komponen centroid z-score berbobot sama. Aturan penamaan ini merupakan pilihan implementasi, bukan ambang klinis dari makalah.</p><p>DBSCAN memakai ε = 0,8 dan minPts = 3, termasuk titik sendiri. ${f.outlier?'Profil fasilitas tidak terhubung ke kelompok padat.':'Profil fasilitas termasuk kelompok padat; klaster tinggi juga dapat berstatus bukan outlier.'}</p></div><p>Semua status Validated, Verified, dan Finished disertakan sesuai tabel penelitian. ${Number.isFinite(f.lat)?`Koordinat fasyankes: ${f.lat}, ${f.lng}.`:"Koordinat belum tersedia."} Identitas pasien tidak ditampilkan.</p><div class="detail-box"><strong>Lokasi fasilitas</strong><p>${escapeHTML(f.matchedName||f.name)} · ${escapeHTML(f.area)}</p><p>${escapeHTML(f.note||'Koordinat diimpor pengguna.')}</p>${/^https:\/\//.test(f.sourceUrl||'')?`<a href="${escapeHTML(f.sourceUrl)}" target="_blank" rel="noopener">${escapeHTML(f.sourceTitle)}</a>`:''}</div>`);
}

function methodology(){
  let dialog=$('#intro-dialog');
  if(!dialog){
    dialog=document.createElement('dialog');
    dialog.id='intro-dialog';
    dialog.setAttribute('aria-labelledby','intro-title');
    dialog.innerHTML=`<button class="dialog-close" id="intro-close" aria-label="Tutup pengantar">×</button>
      <div class="intro-heading"><span class="eyebrow">SELAMAT DATANG DI SBBL JAWA BARAT</span><h2 id="intro-title" tabindex="-1">Dari laporan data,<br><span>menjadi informasi yang mudah dipahami.</span></h2></div>
      <section class="intro-conclusion"><p>K-Means dan DBSCAN digunakan bersama untuk mengubah data pelaporan menjadi informasi yang lebih mudah dipahami.</p><p><strong>K-Means mengelompokkan volume dan TSH fasyankes</strong>, sedangkan <strong>DBSCAN menandai pola pemeriksaan yang tidak biasa</strong>.</p><p>Hasil keduanya tersedia pada tabel. Pemetaan memerlukan koordinat fasyankes terverifikasi.</p></section>
      <div class="intro-simulation">Sumber: ${ResearchData.metadata.records} pemeriksaan dari ${ResearchData.metadata.facilities} fasyankes, ${ResearchData.metadata.start}–${ResearchData.metadata.end}. Variabel: total sampel, rata-rata TSH, TSH maksimum. Normalisasi z-score memakai simpangan baku populasi; variabel konstan menjadi 0. K-Means k=3, k-means++ seed 42, 20 inisialisasi, maksimal 300 iterasi, hasil SSE terendah. DBSCAN ε=0,8 dan minPts=3 termasuk titik sendiri. Periode menyaring tanggal sampling lalu menghitung ulang agregat dan model. Penamaan rendah–tinggi berdasarkan rerata centroid z-score berbobot sama adalah aturan aplikasi yang belum ditentukan di makalah. Nilai silhouette dihitung ulang; DBSCAN tanpa noise tidak terdefinisi jika hanya satu klaster. Data Excel sesuai tabel 418/91 di Word, berbeda dari abstrak 12.940/812. Excel tidak memuat koordinat. Lokasi fasilitas ditambahkan dari sumber publik di Kabupaten Cianjur, dengan sumber dan tahun referensi pada detail. Nama yang belum pasti belum dipetakan. 91 adalah jumlah nama unik dalam Excel; beberapa nama merujuk kompleks fasilitas yang sama dan tetap dianalisis terpisah. Koordinat hanya untuk visualisasi; clustering tetap memakai tiga variabel pemeriksaan.</div>
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
$('#region').innerHTML='<option value="all">Seluruh fasyankes</option><option>Kabupaten Cianjur</option>';$('#region').disabled=false;
page=navItems.some(n=>n[0]===location.hash.slice(1))?location.hash.slice(1):'beranda';renderPage();


