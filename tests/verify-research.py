"""Independent stdlib audit of aggregates, z-scores, neighborhoods and silhouette."""
import html,json,math,re
from pathlib import Path
root=Path(__file__).resolve().parents[1]
data=json.loads((root/'research-data.js').read_text().removeprefix('const ResearchData = ').strip().removesuffix(';'))
assert set(data)=={'metadata','aggregates'}
allowed={'name','month','samples','sum','tsh','statuses','bins'}
assert all(set(r)==allowed for r in data['aggregates']), 'Unexpected fields in browser data'
assert sum(r['samples'] for r in data['aggregates'])==418
assert sum(sum(r['bins']) for r in data['aggregates'])==418
assert max(r['tsh'] for r in data['aggregates'])==14
assert len(set(r['name'] for r in data['aggregates']))==91
raw=(root/'tests/research-result.html').read_text(encoding='utf-8-sig')
assert 'FAIL ' not in raw.split('</pre>')[0]
metrics=json.loads(html.unescape(re.search(r'METRICS (\{.*?\})</pre>',raw,re.S)[1]))
groups={}
for row in data['aggregates']:
 g=groups.setdefault(row['name'],[0,0,0]);g[0]+=row['samples'];g[1]+=row['sum'];g[2]=max(g[2],row['tsh'])
x=[[n,total/n,maximum] for n,total,maximum in groups.values()]
mean=[sum(v[j] for v in x)/len(x) for j in range(3)]
sd=[math.sqrt(sum((v[j]-mean[j])**2 for v in x)/len(x)) for j in range(3)]
assert all(abs(a-b)<1e-10 for a,b in zip(mean,metrics['normalization']['mean']))
assert all(abs(a-b)<1e-10 for a,b in zip(sd,metrics['normalization']['sd']))
z=[[(v[j]-mean[j])/sd[j] for j in range(3)] for v in x]
dist=lambda a,b: math.sqrt(sum((u-v)**2 for u,v in zip(a,b)))
labels=[min(range(3),key=lambda k:dist(v,metrics['centers'][k])) for v in z]
counts=[labels.count(k) for k in range(3)]
assert counts==metrics['counts']==[65,21,5]
inertia=sum(dist(v,metrics['centers'][labels[i]])**2 for i,v in enumerate(z))
assert abs(inertia-metrics['inertia'])<1e-9
scores=[]
for i,v in enumerate(z):
 own=[dist(v,w) for j,w in enumerate(z) if i!=j and labels[j]==labels[i]]
 if not own:scores.append(0);continue
 a=sum(own)/len(own)
 b=min(sum(dist(v,w) for j,w in enumerate(z) if labels[j]==k)/counts[k] for k in range(3) if k!=labels[i])
 scores.append((b-a)/max(a,b))
assert abs(sum(scores)/len(scores)-metrics['silhouette'])<1e-10
# DBSCAN noise = non-core points not neighboring any core point.
neighbors=[[j for j,w in enumerate(z) if dist(v,w)<=.8] for v in z]
core={i for i,near in enumerate(neighbors) if len(near)>=3}
noise={i for i,near in enumerate(neighbors) if i not in core and not core.intersection(near)}
assert len(noise)==metrics['outliers']==10
assert metrics['dbscanClusters']==1 and metrics['dbscanSilhouette'] is None
print('PASS: field allowlist, counts, histogram, population z-score, K-Means assignment/SSE, silhouette, DBSCAN noise')
print('K-Means: 65/21/5; silhouette 0.5503314615. DBSCAN: 81 clustered, 10 noise.')
