#!/usr/bin/env python3
"""Package committed Docs static files only. Never reads working-tree sources."""
import argparse, hashlib, io, json, subprocess, tarfile, zipfile
from pathlib import Path, PurePosixPath

parser = argparse.ArgumentParser()
parser.add_argument('--ref', required=True)
parser.add_argument('--output', required=True)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
def git(*argv):
    return subprocess.check_output(['git', '-C', str(root), *argv])
commit = git('rev-parse', args.ref + '^{commit}').decode().strip()
version = '0.1.0-internal.1'
if args.ref != version:
    raise SystemExit('Use the approved annotated tag: ' + version)
if git('cat-file', '-t', args.ref).decode().strip() != 'tag':
    raise SystemExit('An annotated release tag is required')
output = Path(args.output).resolve()
if output.exists():
    raise SystemExit('Output already exists; preserve the previous artifact')
output.mkdir(parents=True)
files = {}
with tarfile.open(fileobj=io.BytesIO(git('archive', '--format=tar', commit))) as archive:
    for item in archive.getmembers():
        if not item.isfile():
            continue
        path = PurePosixPath(item.name)
        include = (len(path.parts) == 1 and path.suffix in ('.html', '.js'))
        include |= path.parts[0] in ('assets', 'vendor') and path.suffix not in ('.import', '.uid')
        include |= item.name in ('desktop/index.html', 'desktop/adapter.js', 'desktop/loader.js')
        include |= item.name == 'RELEASE_NOTES_0_1_0_INTERNAL_1.md'
        if include:
            files[item.name] = archive.extractfile(item).read()
files['VERSION.json'] = (json.dumps({'product': 'Heartspace Docs', 'version': version,
    'commit': commit, 'tag': args.ref, 'channel': 'internal-local'}, indent=2) + '\n').encode()
files['SHA256SUMS'] = ''.join(hashlib.sha256(data).hexdigest() + '  ' + name + '\n'
    for name, data in sorted(files.items())).encode()
folder = output / ('heartspace-docs-' + version)
folder.mkdir()
for name, data in files.items():
    path = folder / name
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
zip_path = output / (folder.name + '.zip')
with zipfile.ZipFile(zip_path, 'w', compression=zipfile.ZIP_DEFLATED) as z:
    for name, data in sorted(files.items()):
        info = zipfile.ZipInfo(folder.name + '/' + name, (2026, 11, 25, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o100644 << 16
        z.writestr(info, data)
(output / 'PACKAGE_SHA256SUMS').write_text(hashlib.sha256(zip_path.read_bytes()).hexdigest() + '  ' + zip_path.name + '\n')
print(json.dumps({'commit': commit, 'files': len(files), 'folder': str(folder), 'zip': str(zip_path)}, indent=2))
