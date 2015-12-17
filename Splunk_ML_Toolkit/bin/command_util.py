#!/usr/bin/env python

import re

def parse_args(argv):
    options = {}

    params_re = re.compile("([_a-zA-Z][_a-zA-Z0-9]*)\s*=\s*(.*)")
    while argv:
        arg = argv.pop(0)
        if arg == 'into':
            try: options['model_name'] = argv.pop(0)
            except:
                raise ValueError('Syntax error: "into" keyword requires argument')
        elif arg == 'by':
            try: options['split_by'] = argv.pop(0)
            except:
                raise ValueError('Syntax error: "by" keyword requires argument')
        elif arg == 'as':
            try: options['output_name'] = argv.pop(0)
            except:
                raise ValueError('Syntax error: "as" keyword requires argument')
        else:
            m = params_re.match(arg)
            if m:
                params = options.setdefault('params', {})
                params[m.group(1)] = m.group(2)
            else:
                args = options.setdefault('args', [])
                args.append(arg)

    return options

def is_valid_identifier(name):
    """Returns True iff 'name' is a valid Python identifier. Such
    identifiers don't allow '.' or '/', so may also be used to ensure
    that name can be used as a filename without risk of directory
    traversal.
    """
    return re.match('^[a-zA-Z_][a-zA-Z0-9_]*$', name) is not None
