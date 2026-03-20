#!/usr/bin/env python3
import json
from collections import Counter
from pathlib import Path
from statistics import mean, pvariance

ROOT = Path(__file__).resolve().parent
RAW = ROOT / 'raw-exports'
ANNOTATIONS = ROOT / 'annotations'
MERGED = ROOT / 'merged'
REVIEW = ROOT / 'review'

RATING_FIELDS = [
    'overall',
    'jawline',
    'eyes',
    'skin',
    'symmetry',
    'hairFraming',
    'facialHarmony',
]

HIGH_DISAGREEMENT_THRESHOLD = 18
MIN_RATERS = 3

MERGED.mkdir(parents=True, exist_ok=True)
REVIEW.mkdir(parents=True, exist_ok=True)


def load_json(path: Path):
    return json.loads(path.read_text())


def safe_stats(values):
    vals = [float(v) for v in values]
    if not vals:
        return {'mean': None, 'variance': None, 'min': None, 'max': None}
    return {
        'mean': round(mean(vals), 4),
        'variance': round(pvariance(vals), 4) if len(vals) > 1 else 0.0,
        'min': min(vals),
        'max': max(vals),
    }


def majority_vote(values):
    filtered = [v for v in values if v not in (None, '')]
    if not filtered:
        return None, False
    counts = Counter(filtered).most_common()
    top_value, top_count = counts[0]
    tied = len(counts) > 1 and counts[1][1] == top_count
    return top_value, tied


merged_count = 0
review_count = 0

for raw_file in sorted(RAW.glob('*.json')):
    sample_id = raw_file.stem
    annotation_files = sorted(ANNOTATIONS.glob(f'{sample_id}__*.json'))
    if not annotation_files:
        continue

    raw_sample = load_json(raw_file)
    annotations = [load_json(path) for path in annotation_files]

    field_stats = {}
    for field in RATING_FIELDS:
        values = [ann.get('ratings', {}).get(field) for ann in annotations if ann.get('ratings', {}).get(field) is not None]
        field_stats[field] = safe_stats(values)

    archetype_values = [ann.get('archetypeLabel') for ann in annotations]
    archetype_label, archetype_tied = majority_vote(archetype_values)

    image_quality_values = [ann.get('imageQuality') for ann in annotations]
    image_quality, image_quality_tied = majority_vote(image_quality_values)

    invalid_votes = sum(1 for ann in annotations if ann.get('flags', {}).get('invalidSample'))
    multiple_faces_votes = sum(1 for ann in annotations if ann.get('flags', {}).get('multipleFaces'))
    occluded_votes = sum(1 for ann in annotations if ann.get('flags', {}).get('occluded'))
    extreme_angle_votes = sum(1 for ann in annotations if ann.get('flags', {}).get('extremeAngle'))
    blurry_votes = sum(1 for ann in annotations if ann.get('flags', {}).get('tooBlurry'))
    filtered_votes = sum(1 for ann in annotations if ann.get('flags', {}).get('filteredOrEdited'))

    overall_variance = field_stats['overall']['variance'] or 0.0
    review_required = False
    review_reasons = []

    if len(annotations) < MIN_RATERS:
        review_required = True
        review_reasons.append('fewer-than-3-raters')
    if overall_variance >= HIGH_DISAGREEMENT_THRESHOLD:
        review_required = True
        review_reasons.append('high-overall-disagreement')
    if archetype_tied:
        review_required = True
        review_reasons.append('archetype-no-majority')
    if image_quality_tied:
        review_required = True
        review_reasons.append('image-quality-no-majority')
    if invalid_votes >= 1:
        review_required = True
        review_reasons.append('invalid-sample-flagged')
    if multiple_faces_votes >= 2:
        review_required = True
        review_reasons.append('multiple-faces-flagged')
    if occluded_votes >= 2:
        review_required = True
        review_reasons.append('occlusion-flagged')
    if extreme_angle_votes >= 2:
        review_required = True
        review_reasons.append('extreme-angle-flagged')
    if blurry_votes >= 2:
        review_required = True
        review_reasons.append('blur-flagged')

    merged_payload = {
        'version': 'v1',
        'sampleId': sample_id,
        'sourceSample': raw_sample,
        'aggregate': {
            'raterCount': len(annotations),
            'ratings': field_stats,
            'archetypeLabel': archetype_label,
            'imageQuality': image_quality,
            'ratingVariance': overall_variance,
            'flagCounts': {
                'invalidSample': invalid_votes,
                'multipleFaces': multiple_faces_votes,
                'occluded': occluded_votes,
                'extremeAngle': extreme_angle_votes,
                'tooBlurry': blurry_votes,
                'filteredOrEdited': filtered_votes,
            },
        },
        'reviewRequired': review_required,
        'reviewReasons': review_reasons,
        'annotationFiles': [str(path.relative_to(ROOT.parent.parent)) for path in annotation_files],
    }

    out_path = MERGED / f'{sample_id}.json'
    out_path.write_text(json.dumps(merged_payload, indent=2) + '\n')
    merged_count += 1

    if review_required:
        review_path = REVIEW / f'{sample_id}.json'
        review_path.write_text(json.dumps(merged_payload, indent=2) + '\n')
        review_count += 1

print(f'Merged {merged_count} samples; {review_count} require review')
