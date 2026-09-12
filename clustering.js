// Euclidean clustering on z-scored facility profiles [volume, mean TSH, max TSH].
const Clustering = (() => {
  const vector = v => Array.isArray(v) ? v : [v];
  const distance2 = (a,b) => vector(a).reduce((sum,v,i)=>sum+(v-vector(b)[i])**2,0);
  function validate(values) {
    if(!values.length || values.some(v=>vector(v).length!==vector(values[0]).length || vector(v).some(x=>!Number.isFinite(x)))) throw Error('Data numerik diperlukan');
  }
  function standardize(values) {
    validate(values);
    const mean=values[0].map((_,j)=>values.reduce((s,v)=>s+v[j],0)/values.length);
    const sd=mean.map((m,j)=>Math.sqrt(values.reduce((s,v)=>s+(v[j]-m)**2,0)/values.length));
    return {mean,sd,values:values.map(v=>v.map((x,j)=>sd[j] ? (x-mean[j])/sd[j] : 0))};
  }
  function kmeans(values,k=3) {
    validate(values);
    const scalar=!Array.isArray(values[0]), points=values.map(vector);
    const unique=[...new Map(points.map(v=>[JSON.stringify(v),v])).values()];
    if(!Number.isInteger(k)||k<1) throw Error('k harus positif');
    k=Math.min(k,unique.length);
    let best=null;
    // Reproducible k-means++, 20 restarts, choose minimum within-cluster SSE.
    for(let restart=0;restart<20;restart++) {
      let seed=42+restart; const random=()=>{seed=seed*16807%2147483647;return (seed-1)/2147483646;};
      let centers=[points[Math.floor(random()*points.length)].slice()];
      while(centers.length<k) {
        const weights=points.map(v=>Math.min(...centers.map(c=>distance2(v,c))));
        let target=random()*weights.reduce((a,b)=>a+b,0), chosen=weights.findLastIndex(w=>w>0);
        for(let i=0;i<weights.length;i++){target-=weights[i];if(target<0){chosen=i;break;}}
        centers.push(points[chosen].slice());
      }
      let labels=[],iterations=0;
      for(;iterations<300;iterations++) {
        const next=points.map(v=>centers.reduce((best,c,i)=>distance2(v,c)<distance2(v,centers[best]) ? i : best,0));
        const updated=centers.map((c,i)=>{const group=points.filter((_,j)=>next[j]===i);return group.length ? c.map((_,j)=>group.reduce((s,v)=>s+v[j],0)/group.length) : c;});
        const stable=next.every((v,i)=>v===labels[i]);labels=next;centers=updated;
        if(stable){iterations++;break;}
      }
      const inertia=points.reduce((s,v,i)=>s+distance2(v,centers[labels[i]]),0);
      if(!best || inertia<best.inertia)best={centers,labels,inertia,iterations};
    }
    // Operational ranking: equal-weight mean of the three standardized features.
    const score=c=>c.reduce((a,b)=>a+b,0)/c.length;
    const order=best.centers.map((_,i)=>i).sort((a,b)=>score(best.centers[a])-score(best.centers[b]));
    return {...best,centers:order.map(i=>scalar ? best.centers[i][0] : best.centers[i]),labels:best.labels.map(i=>order.indexOf(i))};
  }
  function dbscan(values,eps=0.8,minPts=3) {
    if(!(eps>0)||!Number.isInteger(minPts)||minPts<1)throw Error('Parameter DBSCAN tidak valid');
    if(!values.length)return [];
    validate(values);
    const labels=Array(values.length).fill(undefined);
    const neighbors=i=>values.flatMap((v,j)=>distance2(v,values[i])<=eps*eps ? [j] : []);
    let cluster=0;
    for(let i=0;i<values.length;i++) {
      if(labels[i]!==undefined)continue;
      const near=neighbors(i);
      if(near.length<minPts){labels[i]=-1;continue;}
      labels[i]=cluster;
      const queue=new Set(near);
      for(const j of queue) {
        if(labels[j]===-1)labels[j]=cluster;
        if(labels[j]!==undefined)continue;
        labels[j]=cluster;
        const expanded=neighbors(j);
        if(expanded.length>=minPts)expanded.forEach(n=>queue.add(n));
      }
      cluster++;
    }
    return labels;
  }
  function silhouette(values,labels) {
    const groups=[...new Set(labels)];
    if(groups.length<2 || groups.length>=values.length)return null;
    return values.reduce((sum,v,i)=>{
      const own=values.filter((_,j)=>labels[j]===labels[i] && j!==i);
      if(!own.length)return sum;
      const a=own.reduce((s,x)=>s+Math.sqrt(distance2(v,x)),0)/own.length;
      const b=Math.min(...groups.filter(g=>g!==labels[i]).map(g=>{const other=values.filter((_,j)=>labels[j]===g);return other.reduce((s,x)=>s+Math.sqrt(distance2(v,x)),0)/other.length;}));
      return sum+(Math.max(a,b) ? (b-a)/Math.max(a,b) : 0);
    },0)/values.length;
  }
  function analyze(rows) {
    if(!rows.length)return {centers:[],labels:[],silhouette:null,dbscanSilhouette:null};
    const scaled=standardize(rows.map(f=>[f.samples,f.mean,f.tsh]));
    const result=kmeans(scaled.values),patterns=dbscan(scaled.values);
    const names=result.centers.length===3 ? ['Rendah','Sedang','Tinggi'] : result.centers.length===2 ? ['Rendah','Tinggi'] : ['Sedang'];
    rows.forEach((f,i)=>{f.risk=names[result.labels[i]];f.cluster=result.labels[i];f.dbscanCluster=patterns[i];f.outlier=patterns[i]===-1;f.centroid=result.centers[result.labels[i]].map((v,j)=>v*scaled.sd[j]+scaled.mean[j]);});
    const normal=scaled.values.filter((_,i)=>patterns[i]!==-1),normalLabels=patterns.filter(v=>v!==-1);
    return {...result,normalization:{mean:scaled.mean,sd:scaled.sd},silhouette:silhouette(scaled.values,result.labels),dbscanSilhouette:silhouette(normal,normalLabels),dbscanClusters:new Set(normalLabels).size,outliers:patterns.filter(v=>v===-1).length};
  }
  return {kmeans,dbscan,silhouette,standardize,analyze};
})();
