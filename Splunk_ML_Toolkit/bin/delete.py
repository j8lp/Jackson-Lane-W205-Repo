#!/usr/bin/env python

# import exec_anaconda
# exec_anaconda.exec_anaconda()

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

    if len(getinfo['searchinfo']['args']) == 0:
        die(metadata, 'deletemodel: First argument must be a saved model')

    # Load model.
    try:
        model_name = getinfo['searchinfo']['args'][0]
        if not is_valid_identifier(model_name):
            raise ValueError("Invalid model name")
        path = os.path.join(model_dir, "%s.csv" % model_name)

        # Double check that path is not outside of model_dir.
        if os.path.relpath(path, model_dir)[0:2] == '..':
            raise ValueError('Illegal escape from parent directory "%s": %s' %
                             (model_dir, path))

        os.unlink(path)
    except ValueError as e:
        traceback.print_exc(sys.stderr)
        die(metadata, 'deletemodel: Failed to delete model "%s": %s' % (model_name, str(e)))
    except Exception as e:
        traceback.print_exc(sys.stderr)
        die(metadata, 'deletemodel: Failed to delete model "%s"' % (model_name))

    write_chunk(sys.stdout, {'finished': True}, '')

    sys.exit(0)
