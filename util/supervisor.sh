#!/bin/bash

# Site and environment set by supervisor.
BASE=$1
SITE=$2
ENV=$3
PORT=$4

export LD_LIBRARY_PATH=/opt/instantclient_11_2/:/usr/local/lib/
set -e

SITEDIR=$BASE/site
LOGFILE=$BASE/log/gunicorn-$SITE.log
NUM_WORKERS=10
TIMEOUT=240
# user/group to run as
USER=zachary
GROUP=zachary
ADDRESS=0.0.0.0:$PORT

cd $SITEDIR
source $BASE/bin/activate
test -d $(dirname $LOGFILE) || mkdir -p $LOGDIR
nohup python manage.py collectstatic --noinput -iless &
exec gunicorn "conf.wsgi:application" -w $NUM_WORKERS --bind=$ADDRESS \
  --user=$USER --group=$GROUP --timeout=$TIMEOUT --settings=conf.settings_$ENV \
  --log-file=$LOGFILE 2>>$LOGFILE --log-level=debug
