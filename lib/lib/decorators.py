from django.contrib.auth.decorators import user_passes_test

import logging

logger = logging.getLogger('django')

def group_required(*group_names):
    """Requires user membership in at least one of the groups passed in."""
    def in_groups(u):
        if u.is_authenticated():
            if bool(u.groups.filter(name__in=[name[0] for name in group_names])) | u.is_superuser:
                return True
        return False
    return user_passes_test(in_groups, '/auth/permission_error/')
