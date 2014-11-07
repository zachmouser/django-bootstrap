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
    def source_virtualenv(self):
        with prefix('source {env}/bin/activate'.format(env=self._env)):
            yield

    def start_virtualenv(self):

        location = prompt('Environment location: ', default='/opt/env')
        self._env = '{location}/{env}'.format(location=location, env=self._project_name)

        sudo('mkdir -p {env}'.format(env=self._env))
        sudo('virtualenv {env} --no-site-packages'.format(env=self._env))

        run('cd {env}'.format(env=self._env))

        with self.source_virtualenv():
            self.install_django()

    def install_django(self):

        version = prompt('Install Django version: ', default='1.7.1')
        sudo('pip install Django=={version}'.format(version=version))

    def install_django_project(self):

        git_repo = prompt('Repository location: ')

        with self.source_virtualenv():
            sudo('django-admin startproject --extension=py,conf --template={repo} {project} {env}'.format(repo=git_repo, project=self._project_name, env=self._env))

if __name__ == '__main__':

    s = setup()
    s.install_virtualenv()
    s.start_virtualenv()
    s.install_django_project()
