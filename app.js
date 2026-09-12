const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const colors={Rendah:'#32b887',Sedang:'#efb449',Tinggi:'#ed6c70'}, backgrounds={Rendah:'#eef9f3',Sedang:'#fff8e9',Tinggi:'#fff0f0'};
const areas=['Bandung Raya','Bogor','Cirebon','Tasikmalaya','Sukabumi','Karawang','Purwakarta'];
const centers=[[-6.9175,107.6191],[-6.5971,106.8060],[-6.7320,108.5523],[-7.3274,108.2207],[-6.9277,106.9300],[-6.3054,107.3000],[-6.5569,107.4433]];
const names=['Puskesmas Cibeureum','RSUD Cibabat','Puskesmas Sukaraja','Puskesmas Karawang','Puskesmas Purwakarta','RS Hermina Bandung','Puskesmas Dago','RSUD Al-Ihsan','Puskesmas Ciawi','RSUD Gunung Jati','Puskesmas Cihideung','Puskesmas Cisaat'];
let seed=37;function random(){seed=(seed*16807)%2147483647;return(seed-1)/2147483646}
const facilities=Array.from({length:812},(_,i)=>{const area=i<12?[0,0,4,5,6,0,0,0,1,2,3,4][i]:i%7;const risk=i<40?'Tinggi':i<286?'Sedang':'Rendah';const c=centers[area];return{id:i,name:names[i]||`${i%4===0?'Klinik':'Puskesmas'} ${['Mekarwangi','Sukamaju','Cipaganti','Cibadak','Ciparay','Cisarua','Cikalong'][area]} ${Math.floor(i/7)+1}`,area:areas[area],risk,outlier:i<21,samples:i===0?48:8+Math.floor(random()*17),tsh:i===0?12.6:i===1?114:Number((risk==='Tinggi'?9+random()*7:risk==='Sedang'?4+random()*5:random()*4).toFixed(1)),lat:c[0]+(random()-.5)*.12,lng:c[1]+(random()-.5)*.12}});
let page='beranda',mode='kmeans',riskFilter='Semua',chartType='distribution',legendFilter=null;
const format=n=>new Intl.NumberFormat('id-ID').format(n);
function current(){const region=$('#region').value;const p=Number($('#period').value);return facilities.filter(f=>(region==='Seluruh Jawa Barat'||f.area===region)&&(p===8||f.id%10<(p===7?9:8)))}
function badge(r){return `<span class="badge" style="--c:${colors[r]};--bg:${backgrounds[r]}">${r}</span>`}
const navItems=[['beranda','⌂','Beranda'],['peta','◫','Peta'],['data','▤','Data'],['laporan','▥','Analisis']];
function navigate(next){page=next;location.hash=next;renderPage();window.scrollTo({top:0,behavior:'smooth'})}
function renderPage(){const info={beranda:['Setiap awal kehidupan,<br><span>layak mendapat perhatian.</span>','Eksplorasi kerentanan neonatal di Jawa Barat melalui hybrid spatial clustering.','Ringkasan wilayah'],peta:['Pemetaan kerentanan<br><span>dalam satu pandangan.</span>','Jelajahi zonasi risiko dan pola anomali fasilitas kesehatan.','Eksplorasi peta'],data:['Data yang terhubung.<br><span>Wawasan yang bermakna.</span>','Telusuri hasil skrining dan profil fasilitas kesehatan di wilayah pengamatan.','Direktori fasyankes'],laporan:['Dari data,<br><span>menjadi pemahaman.</span>','Pelajari distribusi TSH dan volume pemeriksaan dari data simulasi.','Statistik & analisis']}[page];$('#page-title').innerHTML=info[0];$('#page-desc').textContent=info[1];$('#crumb').textContent=info[2];for(const target of ['#side-nav','#mobile-nav']){$(target).innerHTML=navItems.map(([id,icon,label])=>`<a href="#${id}" class="nav-link ${page===id?'active':''}" ${page===id?'aria-current="page"':''}><span class="nav-icon">${icon}</span><span class="nav-label">${label}</span></a>`).join('');}$('#dashboard').hidden=page==='data';$('#data-page').hidden=page!=='data';$('.content-grid').hidden=page==='laporan';$('.bottom-grid').hidden=page==='peta';render()}
window.addEventListener('hashchange',()=>{const next=location.hash.slice(1);if(navItems.some(n=>n[0]===next)&&page!==next){page=next;renderPage()}});
function render(){const list=current();$('#stats').innerHTML=[['▤',list.reduce((n,f)=>n+f.samples,0),'Total sampel'],['♙',list.length,'Fasilitas kesehatan'],['▦',list.filter(f=>f.id%2===0).length,'Rekam pemeriksaan'],['⌖',new Set(list.map(f=>f.area)).size,'Wilayah jejaring']].map(([icon,value,label])=>`<article class="stat"><span class="stat-icon">${icon}</span><div><strong>${format(value)}</strong><p>${label}</p></div></article>`).join('');$('#priority-list').innerHTML=list.filter(f=>f.risk==='Tinggi').slice(0,4).map(f=>`<button class="facility-row" data-id="${f.id}"><span class="facility-symbol">♙</span><span><strong>${f.name}</strong><small>${f.area} · ${f.samples} sampel</small></span>${badge(f.risk)}<span class="chevron">›</span></button>`).join('')||'<p class="section-description">Tidak ada fasilitas berisiko tinggi pada pilihan ini.</p>';$('#period-note').textContent=`${$('#period').value==='8'?'31 Agu':$('#period').value==='7'?'31 Jul':'30 Jun'} 2026`;renderMap();renderChart();renderTable();bindDetails();const mean=list.reduce((n,f)=>n+f.tsh,0)/list.length;$('.chart-summary').innerHTML=`<span>Rerata TSH maksimum<strong>${mean.toFixed(2).replace('.',',')} <small>µIU/mL</small></strong></span><span>Nilai maksimum<strong>${Math.max(...list.map(f=>f.tsh)).toFixed(1).replace('.',',')} <small>µIU/mL</small></strong></span><span>Silhouette referensi<strong>0,5006</strong></span>`}
function renderZoneSummary(){
  const list=current(), isDbscan=mode==='dbscan';
  const groups=isDbscan
    ? [{key:'Normal',label:'Normal',color:'#188ef1',bg:'#eef6ff',count:list.filter(f=>!f.outlier).length},
       {key:'Outlier',label:'Outlier',color:'#ed666a',bg:'#fff0f0',count:list.filter(f=>f.outlier).length}]
    : Object.keys(colors).map(key=>({key,label:`Risiko ${key.toLowerCase()}`,color:colors[key],bg:backgrounds[key],count:list.filter(f=>f.risk===key).length}));
  $('.zone-card h2').textContent=isDbscan?'Ringkasan anomali':'Ringkasan zonasi';
  $('.zone-card .subtle').textContent=isDbscan?'DBSCAN':'K-MEANS';
  $('.zone-card .section-description').textContent=isDbscan?'Sebaran fasilitas normal dan outlier di wilayah pengamatan.':'Kenali sebaran tingkat kerentanan di wilayah pengamatan.';
  $('#zones').innerHTML=groups.map(g=>`<button class="zone-row" data-zone="${g.key}" style="--c:${g.color};--bg:${g.bg}"><span class="zone-indicator">${g.key==='Outlier'||g.key==='Tinggi'?'!':'⌖'}</span><span><strong>${g.label}</strong><small>Fasilitas kesehatan</small></span><b>${format(g.count)}</b></button>`).join('');
  $$('[data-zone]').forEach(b=>b.onclick=()=>{riskFilter=b.dataset.zone;$('#search').value='';navigate('data')});
  $('.zone-card .distribution-bar').innerHTML=groups.map(g=>`<i style="width:${list.length?g.count/list.length*100:0}%;background:${g.color}" title="${g.label}: ${format(g.count)}"></i>`).join('');
  $('.zone-card .insight-note p').innerHTML=isDbscan
    ? '<strong>Perhatian pada pola anomali</strong>Tinjau data fasilitas outlier dan konteks pemeriksaannya. Outlier tidak selalu berarti risiko tinggi.'
    : '<strong>Perhatian pada zona tinggi</strong>Prioritaskan peninjauan data dan penguatan surveilans laboratorium.';
}
// City-centered coordinates are synthetic, never actual facility locations.
let geoMap, markerLayer, lastMapRegion=null;
const westJavaBounds=[[-7.85,106.35],[-5.85,108.85]];
function fitMapRegion(){
  if(!geoMap)return;
  geoMap.invalidateSize();
  const region=$('#region').value;
  if(region==='Seluruh Jawa Barat')geoMap.fitBounds(westJavaBounds,{padding:[14,20],animate:false});
  else geoMap.fitBounds(L.latLngBounds(current().map(f=>[f.lat,f.lng])),{padding:[45,65],maxZoom:12,animate:false});
  lastMapRegion=region;
}
function ensureMap(){
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
  $('#map-footnote').textContent=mode==='kmeans'?'3 klaster simulasi · K-Means':`${out} outlier simulasi · DBSCAN`;
  if(!ensureMap())return;
  markerLayer.clearLayers();
  const points=list.filter(f=>!legendFilter||(mode==='kmeans'?f.risk===legendFilter:(f.outlier?'Outlier':'Normal')===legendFilter));
  // Draw higher priority facilities last so they remain selectable.
  points.sort((a,b)=>(a.risk==='Tinggi')-(b.risk==='Tinggi')).forEach(f=>{
    const color=mode==='kmeans'?colors[f.risk]:f.outlier?'#ed666a':'#188ef1';
    const marker=L.circleMarker([f.lat,f.lng],{radius:mode==='dbscan'&&f.outlier?7:f.risk==='Tinggi'?6:4,color:'#fff',weight:1.3,fillColor:color,fillOpacity:.85}).addTo(markerLayer);
    marker.bindTooltip(`${f.name}<br>${f.area} · ${mode==='kmeans'?f.risk:f.outlier?'Outlier':'Normal'}<br><small>Lokasi simulasi</small>`,{direction:'top'});
    marker.on('click',()=>showDetail(f.id));
    const el=marker.getElement();
    if(el){el.setAttribute('tabindex','0');el.setAttribute('role','button');el.setAttribute('aria-label',`${f.name}, lokasi simulasi, lihat detail`);el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();showDetail(f.id)}});}
  });
  requestAnimationFrame(()=>{geoMap.invalidateSize();if(lastMapRegion!==$('#region').value)fitMapRegion()});
}
function renderChart(){const list=current(), bins=Array(15).fill(0);list.forEach(f=>bins[Math.min(14,Math.floor(f.tsh))]++);const trend=[.58,.66,.62,.8,.87,1].map(n=>Math.round(list.reduce((s,f)=>s+f.samples,0)*n));let values=chartType==='distribution'?bins:trend;const max=Math.max(...values), W=520,H=145,step=450/values.length;$('#chart-desc').textContent=chartType==='distribution'?'Distribusi TSH maksimum per fasilitas (simulasi)':'Skenario volume relatif, bukan riwayat aktual';$('#chart').innerHTML=`<svg viewBox="0 0 520 180" role="img" aria-label="${$('#chart-desc').textContent}">${[0,1,2,3,4].map(i=>`<line x1="40" y1="${15+i*30}" x2="505" y2="${15+i*30}" stroke="#edf2f7"/><text x="30" y="${18+i*30}" text-anchor="end" font-size="8" fill="#91a0b2">${format(Math.round(max*(4-i)/4))}</text>`).join('')}${values.map((v,i)=>`<rect x="${45+i*step}" y="${135-v/max*120}" width="${step-8}" height="${v/max*120}" fill="${chartType==='trend'?'#65acf8':i>7?'#a7d0fc':'#3894f5'}" rx="3"><title>${chartType==='distribution'?i===14?'≥14 µIU/mL':`${i}–${i+1} µIU/mL`:['Maret','April','Mei','Juni','Juli','Agustus'][i]}: ${format(v)} ${chartType==='distribution'?'fasilitas':'sampel'}</title></rect><text x="${45+i*step+(step-8)/2}" y="150" text-anchor="middle" font-size="8" fill="#8c9bad">${chartType==='distribution'?i===14?'14+':i:['Mar','Apr','Mei','Jun','Jul','Agu'][i]}</text>`).join('')}<text x="270" y="174" text-anchor="middle" font-size="8" fill="#8c9bad">${chartType==='distribution'?'TSH maksimum (µIU/mL)':'Bulan · skenario ilustratif'}</text></svg>`}
function renderTable(){const q=$('#search').value.toLowerCase(),list=current().filter(f=>(riskFilter==='Semua'||(riskFilter==='Outlier'?f.outlier:riskFilter==='Normal'?!f.outlier:f.risk===riskFilter))&&`${f.name} ${f.area}`.toLowerCase().includes(q));$('#result-count').textContent=`${list.length} FASYANKES`;$$('[data-risk]').forEach(b=>{b.classList.toggle('active',b.dataset.risk===riskFilter);b.setAttribute('aria-pressed',b.dataset.risk===riskFilter)});$('#facility-table').innerHTML=list.map(f=>`<tr data-id="${f.id}" tabindex="0"><td><strong>${f.name}</strong><small>${f.area}</small></td><td>${f.samples}</td><td>${f.tsh.toFixed(1).replace('.',',')} µIU/mL</td><td>${badge(f.risk)}</td><td style="color:${f.outlier?'#ed6c70':'#8ba0b2'}">${f.outlier?'↗ Outlier':'Normal'}</td><td><button class="text-button" aria-label="Detail ${f.name}">Detail ↗</button></td></tr>`).join('')||'<tr><td colspan="6">Tidak ada fasilitas yang sesuai. Coba kata kunci atau filter lain.</td></tr>';bindDetails()}
function bindDetails(){$$('[data-id]').forEach(b=>{b.onclick=()=>showDetail(Number(b.dataset.id));b.onkeydown=e=>{if(e.key==='Enter')b.click()}})}
function showDialog(html){$('#dialog-content').innerHTML=html;if(!$('#detail-dialog').open)$('#detail-dialog').showModal()}
function showDetail(id){const f=facilities[id];showDialog(`<span class="eyebrow">PROFIL FASYANKES · SIMULASI</span><h2>${f.name}</h2><p>${f.area}, Jawa Barat</p>${badge(f.risk)}<div class="detail-box"><strong>Ringkasan pemeriksaan</strong><div class="detail-line"><span>Total sampel</span><strong>${f.samples}</strong></div><div class="detail-line"><span>TSH maksimum</span><strong>${f.tsh.toFixed(1).replace('.',',')} µIU/mL</strong></div><div class="detail-line"><span>Klasifikasi DBSCAN</span><strong>${f.outlier?'Outlier':'Normal'}</strong></div></div><div class="detail-box"><strong>Catatan penelitian</strong><p>${f.risk==='Tinggi'?'Fasilitas masuk klaster kerentanan tinggi. Tinjau kualitas data, pola pemeriksaan, dan konteks wilayah sebelum menyusun tindak lanjut.':'Lakukan pemantauan berkala dan tinjau perubahan pola pemeriksaan.'} ${f.outlier?'Pola fasilitas ditandai sebagai outlier pada skenario DBSCAN.':''}</p></div><p>Seluruh nilai dan koordinat bersifat sintetis. Klasifikasi ini bukan diagnosis atau rekomendasi klinis.</p><button class="primary-button" id="show-on-map">Lihat wilayah pada peta ↗</button>`);$('#show-on-map').onclick=()=>{$('#detail-dialog').close();$('#region').value=f.area;legendFilter=null;navigate('peta')}}
const INTRO_KEY='sbbl-methodology-intro-v1';
function methodology(){
  let dialog=$('#intro-dialog');
  if(!dialog){
    dialog=document.createElement('dialog');
    dialog.id='intro-dialog';
    dialog.setAttribute('aria-labelledby','intro-title');
    dialog.innerHTML=`<button class="dialog-close" id="intro-close" aria-label="Tutup pengantar">×</button>
      <div class="intro-heading"><span class="eyebrow">SELAMAT DATANG DI SBBL JAWA BARAT</span><h2 id="intro-title" tabindex="-1">Memahami pola.<br><span>Mengenali yang berbeda.</span></h2><p>Kenali dua algoritma di balik rancangan penelitian pemetaan kerentanan neonatal sebelum menjelajahi dashboard.</p></div>
      <div class="intro-algorithms">
        <article class="intro-algorithm"><span class="intro-number">01 · PENGELOMPOKAN</span><h3>K-Means</h3><p>Membagi data menjadi <strong>K kelompok</strong> berdasarkan kemiripan karakteristik. Setiap data ditempatkan pada pusat kelompok terdekat, lalu pusatnya diperbarui berulang kali.</p><div class="intro-chips"><span>Rendah</span><span>Sedang</span><span>Tinggi</span></div><p class="intro-role">Dalam rancangan ini, tiga kelompok membantu merangkum perbedaan profil fasyankes. Nama tingkat risiko merupakan interpretasi peneliti setelah menilai karakteristik klaster, bukan label otomatis algoritma.</p></article>
        <article class="intro-algorithm"><span class="intro-number">02 · DETEKSI POLA ANOMALI</span><h3>DBSCAN</h3><p><em>Density-Based Spatial Clustering of Applications with Noise</em> membentuk kelompok dari data yang berdekatan dan cukup padat. Titik yang tidak tergabung ditandai sebagai <strong>noise atau outlier</strong>.</p><div class="intro-chips dbscan-chips"><span>Normal</span><span>Outlier</span></div><p class="intro-role">Membantu menandai fasilitas dengan pola berbeda untuk ditinjau lebih lanjut. Jumlah klaster tidak ditentukan di awal; hasil bergantung pada radius tetangga dan jumlah minimum titik. “Normal” di dashboard berarti bukan outlier.</p></article>
      </div>
      <section class="intro-why"><h3>Mengapa dipakai bersama?</h3><p>Penelitian ini dirancang untuk melihat <strong>gambaran kelompok kerentanan sekaligus pola yang menyimpang</strong>. K-Means menyediakan ringkasan kelompok, sementara DBSCAN melengkapi peninjauan dengan menandai outlier yang dapat tersamarkan dalam ringkasan tersebut.</p><p>Contohnya, sebuah fasyankes dapat berada di kelompok risiko sedang, tetapi memiliki pola pemeriksaan yang berbeda dari tetangganya. Karena itu, <strong>outlier tidak otomatis berarti risiko tinggi</strong>. Gabungan ini mendukung eksplorasi data, bukan membuktikan penyebab atau meningkatkan akurasi secara otomatis.</p></section>
      <details class="intro-details"><summary>Catatan metode dan sumber</summary><p>Untuk data penelitian nyata, pemilihan variabel, standardisasi skala, jumlah K, parameter DBSCAN, serta validasi hasil perlu ditetapkan. Jika memakai koordinat geografis, gunakan proyeksi atau metrik jarak yang sesuai. K-Means sensitif terhadap skala dan pencilan; DBSCAN dapat kesulitan ketika kepadatan data bervariasi.</p><p>Rujukan: <a href="https://scikit-learn.org/stable/modules/clustering.html#k-means" target="_blank" rel="noopener">K-Means</a> · <a href="https://scikit-learn.org/stable/modules/clustering.html#dbscan" target="_blank" rel="noopener">DBSCAN — dokumentasi scikit-learn</a>.</p><p>Peta dasar berasal dari OpenStreetMap. Koordinat fasilitas dan data pemeriksaan adalah simulasi. Nilai silhouette 0,5006 merupakan referensi mockup; tren volume merupakan skenario ilustratif.</p></details>
      <div class="intro-simulation"><strong>Anda sedang melihat prototipe penelitian.</strong> Data 812 fasilitas dan label klaster adalah simulasi; aplikasi belum menjalankan algoritma pada data penelitian nyata. Hasil bukan diagnosis klinis.</div>
      <div class="intro-actions"><button class="primary-button" id="intro-start">Mulai jelajahi dashboard <span>→</span></button><small>Bisa dibaca kembali melalui tombol ⓘ atau Pelajari metodologi.</small></div>`;
    document.body.appendChild(dialog);
    const remember=()=>{try{localStorage.setItem(INTRO_KEY,'seen')}catch{}}; const close=()=>{remember();dialog.close()};
    $('#intro-close').onclick=close;$('#intro-start').onclick=close;
    dialog.addEventListener('close',()=>{remember();$('#info-button').focus({preventScroll:true})});
  }
  if(!dialog.open){dialog.showModal();dialog.scrollTop=0;$('#intro-title').focus({preventScroll:true})}
}
function showFirstVisitIntroduction(){
  let seen=false;
  try{seen=localStorage.getItem(INTRO_KEY)==='seen'}catch{}
  if(!seen)methodology();
}
$$('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;legendFilter=null;$$('[data-mode]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',x===b)});renderMap()});$$('[data-chart]').forEach(b=>b.onclick=()=>{chartType=b.dataset.chart;$$('[data-chart]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',x===b)});renderChart()});$$('[data-risk]').forEach(b=>b.onclick=()=>{riskFilter=b.dataset.risk;renderTable()});$('#region').onchange=()=>{legendFilter=null;render()};$('#period').onchange=render;$('#search').oninput=renderTable;$('#all-facilities').onclick=()=>{riskFilter='Semua';navigate('data')};$('#map-table').onclick=()=>{riskFilter=mode==='dbscan'?'Outlier':'Semua';navigate('data')};$('#zoom-in').onclick=()=>{if(ensureMap())geoMap.zoomIn(1,{animate:false})};$('#zoom-out').onclick=()=>{if(ensureMap())geoMap.zoomOut(1,{animate:false})};$('#reset-map').onclick=()=>{legendFilter=null;renderMap();fitMapRegion()};$('.dialog-close').onclick=()=>$('#detail-dialog').close();$('#detail-dialog').onclick=e=>{if(e.target===$('#detail-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close()}};$('#method').onclick=methodology;$('#info-button').onclick=methodology;
$('#export').onclick=()=>{const q=$('#search').value.toLowerCase();const data=current().filter(f=>page!=='data'||((riskFilter==='Semua'||(riskFilter==='Outlier'?f.outlier:riskFilter==='Normal'?!f.outlier:f.risk===riskFilter))&&`${f.name} ${f.area}`.toLowerCase().includes(q)));const rows=[['Nama fasyankes','Wilayah','Sampel','TSH maksimum (uIU/mL)','Risiko','DBSCAN','Periode','Sumber'],...data.map(f=>[f.name,f.area,f.samples,f.tsh,f.risk,f.outlier?'Outlier':'Normal',$('#period').selectedOptions[0].text,'DATA SINTETIS'])];const blob=new Blob(['\uFEFF'+rows.map(r=>r.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n')],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`SBBL-simulasi-2026-${$('#period').value}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('#toast').textContent=`${data.length} fasilitas diekspor sebagai CSV`;$('#toast').classList.add('show');setTimeout(()=>$('#toast').classList.remove('show'),3000)};
page=navItems.some(n=>n[0]===location.hash.slice(1))?location.hash.slice(1):'beranda';renderPage();

showFirstVisitIntroduction();
