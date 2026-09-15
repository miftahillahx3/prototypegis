// Local, explicit coordinate import. No patient address or external geocoding.
function parseCoordinateCSV(text) {
  const rows=[];let row=[],field='',quoted=false;
  text=text.replace(/^\uFEFF/,'');
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(c==='"'){if(quoted&&text[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}
    else if(c===','&&!quoted){row.push(field.trim());field='';}
    else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(field.trim());if(row.some(Boolean))rows.push(row);row=[];field='';}
    else field+=c;
  }
  if(quoted)throw Error('Tanda kutip CSV tidak lengkap.');
  row.push(field.trim());if(row.some(Boolean))rows.push(row);
  if(rows.shift()?.join(',')!=='nama_fasyankes,wilayah,latitude,longitude')throw Error('Gunakan header dari template koordinat.');
  const result=new Map();
  for(const [i,r] of rows.entries()){
    if(r.length!==4)throw Error(`Baris ${i+2}: perlu empat kolom.`);
    const [name,area,latitude,longitude]=r;
    if(!sourceNames.includes(name))throw Error(`Baris ${i+2}: nama tidak cocok dengan dataset. Gunakan nama dalam template.`);
    if(!latitude&&!longitude)continue;
    const lat=Number(latitude),lng=Number(longitude);
    if(!latitude||!longitude||!Number.isFinite(lat)||!Number.isFinite(lng)||Math.abs(lat)>90||Math.abs(lng)>180)throw Error(`Baris ${i+2}: koordinat tidak valid; gunakan angka desimal dengan titik.`);
    if(result.has(name))throw Error(`Baris ${i+2}: koordinat fasyankes duplikat.`);
    result.set(name,{lat,lng,area:area||'Kabupaten Cianjur',matchedName:name,sourceTitle:'CSV pengguna',sourceUrl:'',note:'Koordinat diimpor pengguna; berlaku selama sesi ini.'});
  }
  if(!result.size)throw Error('Belum ada koordinat yang diisi.');
  return result;
}
const coordinateTemplate=$('#coordinate-template');
if(coordinateTemplate)coordinateTemplate.onclick=()=>{
  const csv='\uFEFFnama_fasyankes,wilayah,latitude,longitude\r\n'+sourceNames.map(n=>'"'+n.replaceAll('"','""')+'",,,').join('\r\n');
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='template-koordinat-fasyankes.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
const coordinateFile=$('#coordinate-file');
if(coordinateFile)coordinateFile.onchange=async event=>{
  try{
    const file=event.target.files[0];if(!file)return;
    const imported=parseCoordinateCSV(await file.text());
    imported.forEach((v,k)=>facilityCoordinates.set(k,v));
    const regions=[...new Set(['Kabupaten Cianjur',...[...facilityCoordinates.values()].map(f=>f.area)])].sort();
    $('#region').innerHTML='<option value="all">Seluruh fasyankes</option>'+regions.map(r=>`<option>${escapeHTML(r)}</option>`).join('');$('#region').disabled=false;
    $('#map-status').hidden=true;lastMapRegion=null;legendFilter=null;render();
    $('.map-caption').textContent='KOORDINAT FASYANKES DARI CSV';
    if($('#coordinate-note'))$('#coordinate-note').textContent=`${facilityCoordinates.size}/${sourceNames.length} nama memiliki koordinat; ${imported.size} diperbarui dari CSV untuk sesi ini.`;
  }catch(error){if($('#coordinate-note'))$('#coordinate-note').textContent=error.message;}
  event.target.value='';
};

if($('#coordinate-note'))$('#coordinate-note').textContent=`${FacilityLocations.metadata.mapped}/${sourceNames.length} nama memiliki koordinat referensi di Kabupaten Cianjur (${new Set([...facilityCoordinates.values()].map(f=>`${f.lat},${f.lng}`)).size} lokasi). Sisanya belum dapat dipastikan.`;
