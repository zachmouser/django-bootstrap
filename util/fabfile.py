#!/usr/bin/python

from contextlib import contextmanager

from fabric.api import *
from fabric.contrib import files

_env = None

def install_virtualenv():

    sudo('apt-get install python-pip')
    sudo('pip install virtualenv')

@contextmanager
def source_virtualenv():
    with prefix('source {env}/bin/activate'.format(env=_env)):
        yield

def start_virtualenv():

    env_name = prompt('Virtual environment name: ')
    location = prompt('Environment location: ', default='/opt/env')
    _env = '{location}/{env}'.format(location=location, env=env_name)

    sudo('mkdir -p {env}'.format(env=env))
    sudo('virtualenv {env} --no-site-packages'.format(env=_env))

    run('cd {env}'.format(env=_env))

    with source_virtualenv():
        install_django()

def install_django():

    version = prompt('Install Django version: ', default='1.7.1')
    sudo('pip install Django=={version}'.format(version=version))

def install_django_project():

    project_name = prompt('Project name: ')
    git_repo = prompt('Repository location: ')

    with source_environment(env=_env):
        sudo('django-admin startproject --extension=py,conf --template={repo} {project}'.format(repo=git_repo, project=project_name))

if __name__ == '__main__':

    install_virtualenv()
    start_virtualenv()
    install_django_project()
