#!/usr/bin/env python

# import exec_anaconda
# exec_anaconda.exec_anaconda()

# import cPickle as pickle
import json
import errno
import os
import sys
import traceback
from cStringIO import StringIO

from chunk_util import *
from command_util import *

model_dir = os.path.join("..", "models")

if __name__ == "__main__":
    # Set our cwd to the location of this script.
    if sys.path[0] != '':
        os.chdir(sys.path[0])

    # Handle initial getinfo exchange. Note, it's bad to throw an
    # exception here. Wait for first chunk to do any argument parsing.
    getinfo, body = read_chunk(sys.stdin)
    metadata = {}
    write_chunk(sys.stdout, {'type': 'reporting', 'generating': True}, '')

    options = {}

    # We'll send our output in next chunk.

    metadata_in, body = read_chunk(sys.stdin)
    metadata = {}

    # Don't run in preview.
    if getinfo.get('preview', False):
        write_chunk(sys.stdout, {'finished': True}, '')
        sys.exit(0)

    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(['name', 'type', 'options'])

    if not os.path.isdir(model_dir):
        metadata['finished'] = True
        write_chunk(sys.stdout, metadata, '')
        sys.exit(0)

    files = [f for f in os.listdir(model_dir) if f.endswith('.csv')]
    for _f in files:
        model_name = _f[:-4]
        try:
            path = os.path.join(model_dir, _f)
            with open(path) as f:
                model_reader = csv.DictReader(f)
                csv.field_size_limit(2**30)
                model_data = model_reader.next()
                writer.writerow([
                        model_name,
                        model_data['algo'],
                        model_data['options']
                ])
        except Exception as e:
            traceback.print_exc(sys.stderr)
            add_message(metadata, 'WARN', 'listmodels: Failed to load model "%s": %s' % (model_name, str(e)))

    metadata['finished'] = True
    write_chunk(sys.stdout, metadata, output.getvalue())

    sys.exit(0)
