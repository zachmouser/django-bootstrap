#!/usr/bin/python
import os, sys

if __name__ == '__main__':
    # Assume dev unless otherwise specified. If other, use django-admin.
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'conf.settings_dev')

    from django.core.management import execute_from_command_line

    execute_from_command_line(sys.argv)
