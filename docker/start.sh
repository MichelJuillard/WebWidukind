#!/bin/bash

echo "--> start.sh script running..."

mkdir -p /data/db

exec /usr/local/bin/supervisord --nodaemon -c /etc/supervisor/supervisord.conf
