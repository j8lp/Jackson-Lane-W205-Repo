import sys, time, os
import httplib, urllib, hashlib, base64, hmac, urlparse, md5, subprocess
import xml.dom.minidom, xml.sax.saxutils
import logging
import tarfile, gzip

ENDPOINT_HOST_PORT = "s3.amazonaws.com"

# set up logging suitable for splunkd consumption
logging.root
logging.root.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(levelname)s %(message)s')
handler = logging.StreamHandler()
handler.setFormatter(formatter)
logging.root.addHandler(handler)

SCHEME = """<scheme>
    <title>Amazon S3</title>
    <description>Get data from Amazon S3.</description>
    <use_external_validation>true</use_external_validation>
    <streaming_mode>xml</streaming_mode>

    <endpoint>
        <args>
            <arg name="name">
                <title>Resource name</title>
                <description>An S3 resource name without the leading s3://.  
                   For example, for s3://bucket/file.txt specify bucket/file.txt.  
                   You can also monitor a whole bucket (for example by specifying 'bucket'),
                   or files within a sub-directory of a bucket
                   (for example 'bucket/some/directory/'; note the trailing slash).
                </description>
            </arg>

            <arg name="key_id">
                <title>Key ID</title>
                <description>Your Amazon key ID.</description>
            </arg>

            <arg name="secret_key">
                <title>Secret key</title>
                <description>Your Amazon secret key.</description>
            </arg>
        </args>
    </endpoint>
</scheme>
"""

def string_to_sign(method, http_date, resource):
    # "$method\n$contentMD5\n$contentType\n$httpDate\n$xamzHeadersToSign$resource"
    return "%s\n\n\n%s\n%s" % (method, http_date, resource)

# returns "Authorization" header string
def get_auth_header_value(method, key_id, secret_key, http_date, resource):
    to_sign = string_to_sign(method, http_date, resource)
    logging.debug("String to sign=%s" % repr(to_sign))

    signature = base64.encodestring(hmac.new(str(secret_key), to_sign, hashlib.sha1).digest()).strip()

    return "AWS %s:%s" % (key_id, signature)

def put_header(conn, k, v):
    logging.debug("Adding header %s: %s" % (k, v))
    conn.putheader(k, v)

def gen_date_string():
    st = time.localtime()
    tm = time.mktime(st)
    return time.strftime("%a, %d %b %Y %H:%M:%S +0000", time.gmtime(tm))

# query_string is expected to have been escaped by the caller
def get_http_connection(key_id, secret_key, bucket, obj, use_bucket_as_host = True, query_string = None):
    method = "GET"
    host = bucket + "." + ENDPOINT_HOST_PORT
    if not use_bucket_as_host:
        host = ENDPOINT_HOST_PORT

    conn = httplib.HTTPConnection(host)
    logging.info("Connecting to %s." % host)
    conn.connect()

    unescaped_path_to_sign = "/" + bucket + "/"
    unescaped_path_to_req = "/"
    if obj:
        unescaped_path_to_sign += obj
        unescaped_path_to_req += obj

    if not use_bucket_as_host:
        unescaped_path_to_req = unescaped_path_to_sign

    date_str = gen_date_string()

    path = urllib.quote(unescaped_path_to_req)
    if query_string:
        path += query_string
    logging.debug("%s %s" % (method, path))
    conn.putrequest(method, path)
    put_header(conn, "Authorization", get_auth_header_value(method, key_id, \
        secret_key, date_str, unescaped_path_to_sign))
    put_header(conn, "Date", date_str)
    conn.endheaders()

    return conn

def log_response(resp):
    status, reason = resp.status, resp.reason
    s = "status=%s reason=\"%s\"" % (str(status), str(reason))
    if status == 200:
        logging.debug(s)
    else:
        logging.error(s)

# parse the amazon error string and extract the message
def get_amazon_error(s):
    try:
        doc = xml.dom.minidom.parseString(s)
        root = doc.documentElement
        messages = root.getElementsByTagName("Message")
        if messages and messages[0].firstChild and \
           messages[0].firstChild.nodeType == messages[0].firstChild.TEXT_NODE:
            return messages[0].firstChild.data
        return ""
    except xml.parsers.expat.ExpatError, e:
        return s

# prints XML error data to be consumed by Splunk
def print_error_old(s):
    impl = xml.dom.minidom.getDOMImplementation()
    doc = impl.createDocument(None, "message", None)
    top_element = doc.documentElement
    text = doc.createTextNode(s)
    top_element.appendChild(text)
    sys.stdout.write(doc.toxml())

# prints XML error data to be consumed by Splunk
def print_error(s):
    print "<error><message>%s</message></error>" % xml.sax.saxutils.escape(s)

def validate_conf(config, key):
    if key not in config:
        raise Exception, "Invalid configuration received from Splunk: key '%s' is missing." % key

# read XML configuration passed from splunkd
def get_config():
    config = {}

    try:
        # read everything from stdin
        config_str = sys.stdin.read()

        # parse the config XML
        doc = xml.dom.minidom.parseString(config_str)
        root = doc.documentElement
        conf_node = root.getElementsByTagName("configuration")[0]
        if conf_node:
            logging.debug("XML: found configuration")
            stanza = conf_node.getElementsByTagName("stanza")[0]
            if stanza:
                stanza_name = stanza.getAttribute("name")
                if stanza_name:
                    logging.debug("XML: found stanza " + stanza_name)
                    config["name"] = stanza_name

                    params = stanza.getElementsByTagName("param")
                    for param in params:
                        param_name = param.getAttribute("name")
                        logging.debug("XML: found param '%s'" % param_name)
                        if param_name and param.firstChild and \
                           param.firstChild.nodeType == param.firstChild.TEXT_NODE:
                            data = param.firstChild.data
                            config[param_name] = data
                            logging.debug("XML: '%s' -> '%s'" % (param_name, data))

        checkpnt_node = root.getElementsByTagName("checkpoint_dir")[0]
        if checkpnt_node and checkpnt_node.firstChild and \
           checkpnt_node.firstChild.nodeType == checkpnt_node.firstChild.TEXT_NODE:
            config["checkpoint_dir"] = checkpnt_node.firstChild.data

        if not config:
            raise Exception, "Invalid configuration received from Splunk."

        # just some validation: make sure these keys are present (required)
        validate_conf(config, "name")
        validate_conf(config, "key_id")
        validate_conf(config, "secret_key")
        validate_conf(config, "checkpoint_dir")
    except Exception, e:
        raise Exception, "Error getting Splunk configuration via STDIN: %s" % str(e)

    return config

def read_from_s3_uri(url):
    u = urlparse.urlparse(str(url))
    bucket = u.netloc
    obj = None
    subdir = None
    if u.path:
        obj = u.path[1:]  # trim the leading slash
        subdir = "/".join(obj.split("/")[:-1])
        if subdir:
            subdir += "/"
    logging.debug("Extracted from url=%s bucket=%s subdir=%s object=%s" % (url, bucket, subdir, obj))
    if not subdir:
        subdir = None
    if not obj:
        obj = None
    return (bucket, subdir, obj)

class HTTPResponseWrapper:
    def __init__(self, resp):
        self.resp = resp

def init_stream():
    sys.stdout.write("<stream>")

def fini_stream():
    sys.stdout.write("</stream>")

def send_data(source, buf):
    sys.stdout.write("<event unbroken=\"1\"><data>")
    sys.stdout.write(xml.sax.saxutils.escape(buf))
    sys.stdout.write("</data>\n<source>")
    sys.stdout.write(xml.sax.saxutils.escape(source))
    sys.stdout.write("</source></event>\n")

def send_done_key(source):
    sys.stdout.write("<event unbroken=\"1\"><source>")
    sys.stdout.write(xml.sax.saxutils.escape(source))
    sys.stdout.write("</source><done/></event>\n")

# returns a list of all objects from a bucket
def get_objs_from_bucket(key_id, secret_key, bucket, subdir = None):
    query_string = None
    if subdir:
        query_string = "?prefix=%s&delimiter=/" % urllib.quote(subdir)
    conn = get_http_connection(key_id, secret_key, bucket, obj = None, query_string = query_string)
    resp = conn.getresponse()
    log_response(resp)
    if resp.status != 200:
        raise Exception, "AWS HTTP request return status code %d (%s): %s" % \
            (resp.status, resp.reason, get_amazon_error(resp.read()))
    bucket_listing = resp.read()
    conn.close()

    # parse AWS's bucket listing response
    objs = []
    doc = xml.dom.minidom.parseString(bucket_listing)
    root = doc.documentElement

    key_nodes = root.getElementsByTagName("Key")
    for key in key_nodes:
        if key.firstChild.nodeType == key.firstChild.TEXT_NODE:
            objs.append(key.firstChild.data)

    return objs

def get_encoded_file_path(config, url):
    # encode the URL (simply to make the file name recognizable)
    name = ""
    for i in range(len(url)):
        if url[i].isalnum():
            name += url[i]
        else:
            name += "_"

    # MD5 the URL
    m = md5.new()
    m.update(url)
    name += "_" + m.hexdigest()

    return os.path.join(config["checkpoint_dir"], name)

# returns true if the checkpoint file exists
def load_checkpoint(config, url):
    chk_file = get_encoded_file_path(config, url)
    # try to open this file
    try:
        open(chk_file, "r").close()
    except:
        # assume that this means the checkpoint it not there
        return False
    return True

# simply creates a checkpoint file indicating that the URL was checkpointed
def save_checkpoint(config, url):
    chk_file = get_encoded_file_path(config, url)
    # just create an empty file name
    logging.info("Checkpointing url=%s file=%s", url, chk_file)
    f = open(chk_file, "w")
    f.close()

def run():
    subprocess.call("spark-submit ../scripts/s3Spark.py", shell=True)

def request_one_object(url, key_id, secret_key, bucket, obj):
    assert bucket and obj

    conn = get_http_connection(key_id, secret_key, bucket, obj)
    resp = conn.getresponse()
    log_response(resp)
    if resp.status != 200:
        raise Exception, "Amazon HTTP request to '%s' returned status code %d (%s): %s" % \
            (url, resp.status, resp.reason, get_amazon_error(resp.read()))

    translator = get_data_translator(url, resp)

    cur_src = ""
    buf = translator.read()
    bytes_read = len(buf)
    while len(buf) > 0:
        if cur_src and translator.source() != cur_src:
            send_done_key(cur_src)
        cur_src = translator.source()
        send_data(translator.source(), buf)
        buf = translator.read()
        bytes_read += len(buf)

    if cur_src:
        send_done_key(cur_src)

    translator.close()
    conn.close()
    sys.stdout.flush()

    logging.info("Done reading. Read bytes=%d", bytes_read)

# Handles file reading from tar archives.  From the tarfile module:
# fileobj must support: read(), readline(), readlines(), seek() and tell().
class TarTranslator():
    def __init__(self, src, tar):
        self.tar = tar
        self.member = self.tar.next()
        self.member_f = self.tar.extractfile(self.member)
        self.translator = None
        self.base_source = src
        if self.member:
            self.src = self.base_source + ":" + self.member.name
            if self.member_f:
                self.translator = get_data_translator(self.src, self.member_f)

    def read(self, sz = 8192):
        while True:
            while self.member and self.member_f is None:
                self.member = self.tar.next()
                if self.member:
                    self.member_f = self.tar.extractfile(self.member)
                    self.src = self.base_source + ":" + self.member.name
                    self.translator = get_data_translator(self.src, self.member_f)

            if not self.member:
                return "" # done

            buf = self.translator.read(sz)
            if len(buf) > 0:
                return buf
            self.member_f = None
            self.translator = None

    def close(self):
        self.tar.close()

    def source(self):
        return self.src

class FileObjTranslator():
    def __init__(self, src, fileobj):
        self.src = src
        self.fileobj = fileobj

    def read(self, sz = 8192):
        return self.fileobj.read(sz)

    def close(self):
        return self.fileobj.close()

    def source(self):
        return self.src

class GzipFileTranslator():
    def __init__(self, src, fileobj):
        self.src = src
        self.fileobj = fileobj

    def read(self, sz = 8192):
        return self.fileobj.read(sz)

    def close(self):
        return self.fileobj.close()

    def source(self):
        return self.src

def get_data_translator(url, fileobj):
    if url.endswith(".tar"):
        return TarTranslator(url, tarfile.open(None, "r|", fileobj))
    elif url.endswith(".tar.gz") or url.endswith(".tgz"):
        return TarTranslator(url, tarfile.open(None, "r|gz", fileobj))
    elif url.endswith(".tar.bz2"):
        return TarTranslator(url, tarfile.open(None, "r|bz2", fileobj))
    elif url.endswith(".gz"):
        # it's lame that gzip.GzipFile requires tell() and seek(), and our
        # "fileobj" does not supply these; wrap this with the object that is
        # used by the tarfile module
        return GzipFileTranslator(url, tarfile._Stream("", "r", "gz", fileobj, tarfile.RECORDSIZE))
    else:
        return FileObjTranslator(url, fileobj)

def do_scheme():
    print SCHEME

def get_validation_data():
    val_data = {}

    # read everything from stdin
    val_str = sys.stdin.read()

    # parse the validation XML
    doc = xml.dom.minidom.parseString(val_str)
    root = doc.documentElement

    logging.debug("XML: found items")
    item_node = root.getElementsByTagName("item")[0]
    if item_node:
        logging.debug("XML: found item")

        name = item_node.getAttribute("name")
        val_data["stanza"] = name

        params_node = item_node.getElementsByTagName("param")
        for param in params_node:
            name = param.getAttribute("name")
            logging.debug("Found param %s" % name)
            if name and param.firstChild and \
               param.firstChild.nodeType == param.firstChild.TEXT_NODE:
                val_data[name] = param.firstChild.data

    return val_data

# make sure that the amazon credentials are good
def validate_arguments():
    val_data = get_validation_data()
    key_id = val_data["key_id"]
    secret_key = val_data["secret_key"]

    try:
        url = "s3://" + val_data["stanza"]
        bucket, subdir, obj = read_from_s3_uri(url)
        logging.debug("('%s', '%s', '%s')" % (str(bucket), str(subdir), str(obj)))
        if subdir and subdir == obj:
            # monitoring a "sub-directory" within a bucket
            obj = None

            # see if there are any objects that would match that subdir
            all_objs = get_objs_from_bucket(key_id, secret_key, bucket, subdir)
            matches = False
            for o in all_objs:
                if o.startswith(subdir):
                    matches = True
                    break
            if not matches:
                raise Exception, "No objects found inside s3://%s." % "/".join([bucket, subdir])
        else:
            # use_bucket_as_host = False allows for better error checking:
            # AWS tends to return more helpfull error messages
            conn = get_http_connection(key_id, secret_key, bucket, obj, use_bucket_as_host = False)
            resp = conn.getresponse()
            log_response(resp)
            if resp.status / 100 == 3:
                # AWS may send a sometimes when it requires that the bucket
                # is part of the host: retry
                conn = get_http_connection(key_id, secret_key, bucket, obj, use_bucket_as_host = True)
                resp = conn.getresponse()
                log_response(resp)
            if resp.status != 200:
                raise Exception, "Amazon returned HTTP status code %d (%s): %s" % (resp.status, resp.reason, get_amazon_error(resp.read()))

    except Exception, e:
        print_error("Invalid configuration specified: %s" % str(e))
        sys.exit(1)

def usage():
    print "usage: %s [--scheme|--validate-arguments]"
    sys.exit(2)

def test():
    init_stream()
    send_data("src1", "test 1")
    send_data("src2", "test 2")
    send_done_key("src2")
    send_data("src3", "test 3")

if __name__ == '__main__':
    if len(sys.argv) > 1:
        if sys.argv[1] == "--scheme":
            do_scheme()
        elif sys.argv[1] == "--validate-arguments":
            validate_arguments()
        elif sys.argv[1] == "--test":
            test()
        else:
            usage()
    else:
        # just request data from S3
        run()

    sys.exit(0)