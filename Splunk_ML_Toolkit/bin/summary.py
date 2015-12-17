#!/usr/bin/env python

import exec_anaconda

try:
    exec_anaconda.exec_anaconda()
except:
    exec_anaconda_fail = True

import cPickle as pickle
import json
import errno
import os
import sys
import traceback

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

    first = True
    while True:
        metadata_in, body = read_chunk(sys.stdin)
        metadata = {}

        # Don't run in preview.
        if getinfo.get('preview', False):
            write_chunk(sys.stdout, {'finished': True}, '')
            sys.exit(0)

        if first:  # Do initial setup.
            if 'exec_anaconda_fail' in globals():
                die(metadata, 'summary: Failed to load Splunk_SA_Scientific_Python (Python for Scientific Computing App)')

            if len(getinfo['searchinfo']['args']) == 0:
                die(metadata, 'summary: First argument must be a saved model')

            # Parse args.
            options = parse_args(getinfo['searchinfo']['args'][1:])

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

                model_reader = csv.DictReader(open(path))
                csv.field_size_limit(2**30)
                model_data = model_reader.next()
                algo_name = model_data['algo']
                algo = pickle.loads(model_data['model'])

                model_options = json.loads(model_data['options'])
                model_options.update(options)
                options = model_options
            except Exception as e:
                traceback.print_exc(sys.stderr)
                die(metadata, 'summary: Failed to load model "%s": %s' % (model_name, str(e)))

            # Pre-validate whether or not this model supports summary.
            if not hasattr(algo, 'summary'):
                die(metadata, 'summary: Algorithm "%s" does not support summary' % algo_name)

            first = False

        metadata['finished'] = True

        df = algo.summary()
        body = df.to_csv(index=False)
        write_chunk(sys.stdout, metadata, body)

        sys.exit(0)