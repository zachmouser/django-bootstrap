from fabric.api import *
from fabric.contrib import files

def install_virtualenv():

    sudo('apt-get install virtualenv')

def start_virtualenv():

    env_name = prompt('Virtual environment name: ')
    location = prompt('Environment location: ', default='/opt/env')
    env = '{location}/{env}'.format(location=location, env=env_name)

    sudo('mkdir -p {env}'.format(env=env))
    sudo('virtualenv {env} --no-site-packages'.format(env=env))

    run('cd {env}'.format(env=env))
    run('source ./bin/activate')

def install_django():

    version = prompt('Install Django version: ', default='1.7.1')
    run('pip install Django=={version}'.format(version=version)

def install_django_project():

    install_django()

    project_name = prompt('Project name: ')
    git_repo = prompt('Repository location: ')

    sudo('django-admin startproject --extension=py,conf --template={repo} {project}'.format(repo=git_repo, project=project_name))

if __name__ == '__main__':

    install_virtualenv()
    start_virtualenv()
    install_django_project()
