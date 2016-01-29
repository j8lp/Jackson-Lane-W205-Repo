#!bin/sh

yum install cyrus-sasl-plain sendmail sendmail-cf -y
 
echo 'AuthInfo:smtp.sendgrid.net "U:jelane@berkeley.edu" "P:SL869875" "M:PLAIN"' >> /etc/mail/access 
makemap hash /etc/mail/access.db < /etc/mail/access
 
cat <<'EOF'>> /etc/mail/sendmail.mc
define(`SMART_HOST', `smtp.sendgrid.net')dnl
 
FEATURE(`access_db')dnl
 
define(`RELAY_MAILER_ARGS', `TCP $h 587')dnl
 
define(`ESMTP_MAILER_ARGS', `TCP $h 587')dnl
EOF
service sendmail restart
 
echo "sfs" | sendmail -s "setup log files" jelane@berkeley.edu
ssh-keygen -f ~/.ssh/id_rsa -b 2048 -t rsa -C 'meaningful comment'
slcli sshkey add -f ~/.ssh/id_rsa.pub --note 'added during HW 2' identifier
exec >setup.log 2>&1

curl -o /tmp/install_salt.sh -L https://bootstrap.saltstack.com && sh /tmp/install_salt.sh -Z -M git 2015.5
ip="$(hostname -i)"
yum install -y python-pip && pip install SoftLayer apache-libcloud
yum install -y jq
mkdir -p /etc/salt/{cloud.providers.d,cloud.profiles.d}

cat <<EOF> /etc/salt/cloud.providers.d/softlayer.conf
sl:
  minion:
  master: $ip
  user: SL869875
  apikey: 280cba2a251df11b349d616ea1b3dbf2ef9e88ef9fe3b91ce7e0f68983b2d8f5
  provider: softlayer
  script: bootstrap-salt
  script_args: -Z git 2015.5
  delete_sshkeys: True
  display_ssh_output: False
  wait_for_ip_timeout: 1800
  ssh_connect_timeout: 1200
  wait_for_fun_timeout: 1200
EOF

cat <<'EOF'> /etc/salt/cloud.profiles.d/softlayer.conf
sl_centos7_small:
  provider: sl
  image: CENTOS_7_64
  cpu_number: 1
  ram: 1024
  disk_size: 25
  local_disk: True
  hourly_billing: True
  domain: domain.net
  location: dal06
EOF

salt-cloud -p sl_centos7_small mytestvs
salt-key -L
salt 'mytestvs' network.interface_ip eth1
salt-cloud -dy mytestvs
exec &>/dev/tty
cat setup.log | mail -s "setup log files" jelane@berkeley.edu
