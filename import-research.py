"""Read XLSX locally; export only facility/month aggregates, never patient fields."""
import argparse, collections, datetime, hashlib, json, re, zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

def convert(source, destination):
    ns = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    groups = {}
    statuses = collections.Counter()
    dates = []
    with zipfile.ZipFile(source) as archive:
        strings = []
        if 'xl/sharedStrings.xml' in archive.namelist():
            strings = [''.join(t.text or '' for t in x.findall('.//s:t', ns)) for x in ET.fromstring(archive.read('xl/sharedStrings.xml'))]
        rows = ET.fromstring(archive.read('xl/worksheets/sheet1.xml')).findall('.//s:sheetData/s:row', ns)
        def cells(row):
            result = {}
            for cell in row:
                key = re.sub(r'\d', '', cell.attrib['r'])
                if cell.attrib.get('t') == 's':
                    value = strings[int(cell.find('s:v', ns).text)]
                else:
                    value = ''.join(cell.itertext())
                result[key] = value.strip()
            return result
        header = cells(rows[0])
        for col, expected in {'H':'Fasyankes','I':'TGL_SAMPLING','K':'Hasil Pemeriksaan','L':'Status'}.items():
            if header.get(col) != expected: raise ValueError('Kolom sumber tidak sesuai: '+col)
        for number, row in enumerate(rows[1:], 2):
            data = cells(row)
            if not any(data.values()): continue
            match = re.fullmatch(r'(\d+(?:[.,]\d+)?)\s*[µμu]U/mL\s*\(<\s*20\)', data['K'])
            if not match or not data['H']: raise ValueError(f'Periksa format baris {number}')
            value = float(match[1].replace(',', '.'))
            date = datetime.datetime.fromisoformat(data['I']).date().isoformat()
            dates.append(date)
            status = data['L']
            if status not in ('Validated', 'Verified', 'Finished'): raise ValueError(f'Status tidak dikenal baris {number}')
            statuses[status] += 1
            key = (data['H'], date[:7])
            group = groups.setdefault(key, {'name':data['H'], 'month':date[:7], 'samples':0, 'sum':0, 'tsh':0, 'statuses':{}, 'bins':[0]*15})
            group['samples'] += 1
            group['sum'] += value
            group['tsh'] = max(group['tsh'], value)
            group['statuses'][status] = group['statuses'].get(status,0)+1
            group['bins'][min(14,int(value))] += 1
    output = {'metadata':{'source':Path(source).name, 'sha256':hashlib.sha256(Path(source).read_bytes()).hexdigest(), 'records':len(dates), 'facilities':len({key[0] for key in groups}), 'start':min(dates), 'end':max(dates), 'statuses':dict(statuses), 'coordinatesAvailable':False}, 'aggregates':list(groups.values())}
    payload = json.dumps(output, ensure_ascii=True, separators=(',', ':')).replace('<', '\\u003c')
    Path(destination).write_text('const ResearchData = '+payload+';\n', encoding='utf-8')
    print(json.dumps(output['metadata'],ensure_ascii=True))

if __name__ == '__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('source')
    parser.add_argument('--output',default='research-data.js')
    args=parser.parse_args()
    convert(args.source,args.output)
