#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
RAW = ROOT / 'raw-exports'
ANNOTATIONS = ROOT / 'annotations'
OUT = ROOT / 'manifest.generated.json'

samples = []
for raw_file in sorted(RAW.glob('*.json')):
    sample_id = raw_file.stem
    annotation_count = len(list(ANNOTATIONS.glob(f'{sample_id}__*.json')))
    status = 'unlabeled'
    if annotation_count >= 3:
        status = 'ready-to-merge'
    elif annotation_count > 0:
        status = 'in-progress'
    samples.append({
        'sampleId': sample_id,
        'rawExportPath': str(raw_file.relative_to(ROOT.parent.parent)),
        'annotationCount': annotation_count,
        'status': status,
        'notes': None,
    })

payload = {
    'version': 'v1',
    'description': 'Generated LooksMaxxing labeling manifest.',
    'samples': samples,
}

OUT.write_text(json.dumps(payload, indent=2) + '\n')
print(f'Wrote {OUT} with {len(samples)} samples')
