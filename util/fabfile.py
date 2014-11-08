#!/usr/bin/python

from contextlib import contextmanager

from fabric.api import *
from fabric.contrib import files

class setup(object):

    def __init__(self):
        self._env = None
        self._project_name = prompt('Project name: ')

    def install_virtualenv(self):

        sudo('apt-get install python-pip')
        sudo('pip install virtualenv')

    @contextmanager
    def virtualenv(self):
        with prefix('source {env}/bin/activate'.format(env=self._env)):
            yield

    def start_virtualenv(self):

        location = prompt('Environment location: ', default='/opt/env')
        self._env = '{location}/{env}'.format(location=location, env=self._project_name)

        sudo('mkdir -p {env}'.format(env=self._env))
        sudo('virtualenv {env} --no-site-packages'.format(env=self._env))

        run('cd {env}'.format(env=self._env))

        with self.virtualenv():
            self.install_django()

    def install_django(self):

        version = prompt('Install Django version: ', default='1.7.1')
        sudo('pip install Django=={version}'.format(version=version))

    def install_django_project(self):

        git_repo = prompt('Repository location: ')

        with self.virtualenv():
            sudo('django-admin startproject --extension=py,conf --template={repo} {project} {env}/site'.format(repo=git_repo, project=self._project_name, env=self._env))

    def configure_django_project(self):

        with virtualenv():

            requirements = '{env}/conf/requirements.txt'.format(env=self._env)
            if files.exists(requirements):
                sudo('pip install -r {requirements}'.format(requirements=requirements))

    def configure_nginx(self):

        nginx = '{env}/conf/nginx.conf'.format(env=self._env)
        nginx_conf = None

        if files.exists(nginx):
            sudo('apt-get install nginx')
            files.sed(nginx, before='\{nginxr-port\}', after=prompt('Enter nginx listen port: ', default=9001))
            files.sed(supervisor, before='\{gunicorn-port\}', after=prompt('Enter gunicorn listen port: ', default=9002))

        sudo('mv {nginx} /etc/nginx/sites-enabled/nginx-{project}.conf'.format(nginx=nginx, project=self.project_name))

    def configure_supervisor(self):

        supervisor = '{env}/conf/supervisor.conf'

        if files.exists(supervisor):
            sudo('apt-get install supervisor')
            files.sed(supervisor, before='\{gunicorn-port\}', after=prompt('Enter gunicorn listen port: ', default=9002))
            files.sed(supervisor, before='\{env\}', after=prompt('Enter Django environment type: ', default='dev'))

        sudo('mv {supervisor} /etc/supervisor/conf.d/supervisor-{project}.conf'.format(supervisor=supervisor, project=self.project_name))

if __name__ == '__main__':

    s = setup()
    s.install_virtualenv()
    s.start_virtualenv()
    s.install_django_project()
    s.configure_nginx()
    s.configure_supervisor()
