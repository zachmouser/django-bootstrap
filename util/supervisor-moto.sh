#!/bin/bash
export LD_LIBRARY_PATH=/opt/instantclient_11_2/:/usr/local/lib/
set -e
SITE=moto
BASEDIR=/opt/web/$SITE
SITEDIR=$BASEDIR/site
LOGFILE=$BASEDIR/log/gunicorn-$SITE.log
NUM_WORKERS=10
TIMEOUT=240
# user/group to run as
USER=zachary
GROUP=zachary
ADDRESS=0.0.0.0:9002

cd $SITEDIR
source $BASEDIR/bin/activate
test -d $(dirname $LOGFILE) || mkdir -p $LOGDIR
nuhup python manage.py collectstatic --noinput &
exec gunicorn conf.moto_wsgi:application -w $NUM_WORKERS --bind=$ADDRESS \
  --user=$USER --group=$GROUP --timeout=$TIMEOUT \
  --log-file=$LOGFILE 2>>$LOGFILE --log-level=debug
