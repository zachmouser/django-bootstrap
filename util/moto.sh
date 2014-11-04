#!/bin/bash
export LD_LIBRARY_PATH=/opt/instantclient_11_2/:/usr/local/lib/
set -e
LOGFILE=/opt/web/moto/log/guni.log
LOGDIR=$(dirname $LOGFILE)
NUM_WORKERS=10
TIMEOUT=240
# user/group to run as
USER=zachary
GROUP=zachary
ADDRESS=0.0.0.0:8089
cd /opt/web/moto
source ./bin/activate
test -d $LOGDIR || mkdir -p $LOGDIR
exec gunicorn_django -w $NUM_WORKERS --bind=$ADDRESS \
  --user=$USER --group=$GROUP --log-level=debug \
  --log-file=$LOGFILE 2>>$LOGFILE --timeout=$TIMEOUT
