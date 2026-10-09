"""Export the user-authorized journal and referenced photos for GitHub Pages."""
import argparse
import json
import shutil
from pathlib import Path
from journal import read, JOURNAL

def export_public():
    data=read()
    # Only the journal's known display fields; never copy the private directory,
    # GitHub credentials, temporary records or unrelated files.
    public={key:data[key] for key in ('version','updatedAt','goals','meals','measurements','reflections','activities') if key in data}
    root=Path(__file__).resolve().parents[1]/'site'
    for meal in public.get('meals',[]):
        for photo in meal.get('photos',[]):
            source=JOURNAL.parent/photo['path']
            if not source.is_file() or not source.resolve().is_relative_to((JOURNAL.parent/'photos').resolve()):
                raise ValueError(f'Missing or invalid journal photo: {photo["path"]}')
            destination=root/photo['path']
            destination.parent.mkdir(parents=True,exist_ok=True)
            shutil.copy2(source,destination)
    (root/'journal.json').write_text(json.dumps(public,indent=2,ensure_ascii=False)+'\n')
    print(f'Exported {len(public["meals"])} meals, {len(public.get("activities",[]))} exercise logs.')

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--publish',action='store_true',required=True,help='Explicitly export records intended for public sharing')
    parser.parse_args()
    export_public()
