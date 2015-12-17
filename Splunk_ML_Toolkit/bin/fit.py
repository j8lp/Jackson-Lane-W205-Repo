#!/usr/bin/env python

import exec_anaconda

try:
    exec_anaconda.exec_anaconda()
    import pandas as pd
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
    write_chunk(sys.stdout, {'type': 'reporting'}, '')

    options = {}

    # df is the Panda's DataFrame we will buffer results from Splunk
    # in. We will append to it as chunks arrive.
    # TODO: Buffer chunks to disk to support large result sets.
    df = None

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
                die(metadata, 'fit: Failed to load Splunk_SA_Scientific_Python (Python for Scientific Computing App)')

            if len(getinfo['searchinfo']['args']) == 0:
                die(metadata, 'fit: First argument must be an "algorithm"')

            df = pd.DataFrame()

            # Parse args.
            options = parse_args(getinfo['searchinfo']['args'][1:])

            # Load algo.
            # TODO: Config for plugins?
            try:
                algo_name = getinfo['searchinfo']['args'][0]
                assert is_valid_identifier(algo_name)
                algos = __import__("algos", fromlist=["*"])
                algo_module = getattr(algos, algo_name)
                algo_class = getattr(algo_module, algo_name)
            except Exception as e:
                die(metadata, 'fit: Failed to load algorithm "%s"' % algo_name)

            try:
                algo = algo_class(*options.get('args', []), **options.get('params', {}))
            except Exception as e:
                die(metadata, 'fit: Error while initializing algorithm "%s": %s' % (algo_name, str(e)))

            # Pre-validate whether or not this algo supports saved models.
            if 'model_name' in options and not hasattr(algo, 'predict'):
                die(metadata, 'fit: Algorithm "%s" does not support saved models; omit the "into" keyword' % algo_name)

            first = False

        # Collect results.
        sio = StringIO(body)

        if len(body) != 0:
            new_df = pd.read_csv(sio)

            if len(df) + len(new_df) > 50000:  # FIXME, parameterize
                # FIXME: don't error, just stop reading results from Splunk
                die(metadata, 'fit: Too many results (> 50000)')

            df = df.append(new_df)

        # Send a reply so Splunk moves on to the next chunk.
        metadata['finished'] = False
        write_chunk(sys.stdout, metadata, '')

        if metadata_in.get('finished', False):
            break

    # Run fit and predict.
    try:
        # FIXME: To support "by ...", iterate .fit() over split_by values.
        if hasattr(algo, 'fit_predict'):
            p = algo.fit_predict(df.copy())
        else:
            algo.fit(df.copy())
            p = algo.predict(df.copy())
    except Exception as e:
        die(metadata, 'fit: Error while fitting algorithm "%s": %s' % (algo_name, str(e)))

    if len(p.columns) == 1 and 'output_name' in options:
        p.columns = [options['output_name']]
    elif len(p.columns) > 1 and 'output_name' in options:
        p.columns = [options['output_name'] + '%d' % (i+1) for i in range(len(p.columns))]

    if 'model_name' in options:
        try:
            if not is_valid_identifier(options['model_name']):
                raise ValueError("Invalid model name")
            path = os.path.join(model_dir, "%s.csv" % options['model_name'])

            try: os.makedirs(model_dir)
            except OSError as e:
                if e.errno == errno.EEXIST and os.path.isdir(model_dir):
                    pass
                else: raise

            # Double check that path is not outside of model_dir.
            if os.path.relpath(path, model_dir)[0:2] == '..':
                raise ValueError('Illegal escape from parent directory "%s": %s' %
                                 (model_dir, path))

            opaque = pickle.dumps(algo)

            f = open(path, 'w')
            model_writer = csv.writer(f)
            # TODO: Version attribute
            model_writer.writerow(['algo','model','options'])
            model_writer.writerow([algo_name, opaque, json.dumps(options)])
            f.close()
        except Exception as e:
            die(metadata, 'fit: Error while saving model "%s": %s' % (options['model_name'], str(e)))

    # Merge prediction with original result set.
    df = pd.concat([df, p], axis=1, join_axes=[df.index])

    # Write output to Splunk.
    body = df.to_csv(index=False)
    metadata['finished'] = True
    write_chunk(sys.stdout, metadata, body)

    sys.exit(0)
