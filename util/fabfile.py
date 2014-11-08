#!/usr/bin/python

from contextlib import contextmanager

from fabric.api import *
from fabric.colors import green
from fabric.contrib import files

class setup(object):

    def __init__(self):
        self._path = None
        self._project_name = prompt(green('Project name: '))

    def install_virtualenv(self):

        sudo('apt-get install python-pip')
        sudo('pip install virtualenv -q')

    @contextmanager
    def virtualenv(self):
        with prefix('source {env}/bin/activate'.format(env=self._path)):
            yield

    def start_virtualenv(self):

        location = prompt(green('Environment location: '), default='/opt/env')
        self._path = '{location}/{env}'.format(location=location, env=self._project_name)

        sudo('mkdir -p {env}'.format(env=self._path))
        sudo('virtualenv {env} --no-site-packages'.format(env=self._path))

        run('cd {env}'.format(env=self._path))

        with self.virtualenv():
            self.install_django()

    def install_django(self):

        version = prompt(green('Install Django version: '), default='1.7.1')
        sudo('pip install Django=={version} -q'.format(version=version))

    def install_django_project(self):

        git_repo = prompt(green('Repository location: '))

        sudo('mkdir -p {env}/site'.format(env=self._path))
        with self.virtualenv():
            sudo('django-admin startproject --extension=py,conf --template={repo} {project} {env}/site'.format(repo=git_repo, project=self._project_name, env=self._path))

    def configure_django_project(self):

        with virtualenv():

            requirements = '{env}/conf/requirements.txt'.format(env=self._path)
            if files.exists(requirements):
                sudo('pip install -r {requirements}'.format(requirements=requirements))

    def configure_nginx(self, guni_port):

        nginx = '{env}/site/conf/nginx.conf'.format(env=self._path)
        nginx_conf = None

        if files.exists(nginx):
            sudo('apt-get install nginx')
            files.sed(nginx, before='\{nginx-port\}', after=prompt(green('Enter nginx listen port: '), default=9001), use_sudo=True)
            files.sed(nginx, before='\{gunicorn-port\}', after=guni_port, use_sudo=True)
            files.sed(nginx, before='\{path\}', after=self._path, use_sudo=True)

            conf = '/etc/nginx/sites-enabled/nginx-{project}.conf'.format(project=self._project_name)
            sudo('mv {nginx} {conf}'.format(nginx=nginx, conf=conf))

            sudo('service nginx restart')

    def configure_supervisor(self):

        supervisor = '{env}/site/conf/supervisor.conf'.format(env=self._path)

        if files.exists(supervisor):
            sudo('apt-get install supervisor')
            port = prompt(green('Enter gunicorn listen port: '), default=9002)
            files.sed(supervisor, before='\{gunicorn-port\}', after=port, use_sudo=True)
            files.sed(supervisor, before='\{env\}', after=prompt(green('Enter Django environment type: '), default='dev'), use_sudo=True)
            files.sed(supervisor, before='\{path\}', after=self._path, use_sudo=True)

            sudo('chmod +x {env}/site/util/supervisor.sh'.format(env=self._path))

            sudo('mkdir -p {path}/log'.format(path=self._path))

            conf = '/etc/supervisor/conf.d/supervisor-{project}.conf'.format(project=self._project_name)
            sudo('mv {supervisor} {conf}'.format(supervisor=supervisor, conf=conf))

            sudo('supervisorctl reload')
            sudo('supervisorctl start {project}'.format(project=self._project_name))

            self.configure_nginx(port)

if __name__ == '__main__':

    s = setup()
    s.install_virtualenv()
    s.start_virtualenv()
    s.install_django_project()
    s.configure_supervisor()
