import logging

from django.contrib.auth import views as auth_views
from django.views.generic.base import TemplateView
from django.conf import settings

logger = logging.getLogger('django')

class Auth(TemplateView):

    template_name = 'auth-index.html'

    def post(self, request, *args, **kwargs):

        response = auth_views.login(request, self.template_name)

        if request.POST.has_key('remember'):
            logger.debug('Login request: {request}'.format(request=request.__dict__))
            request.session.set_expiry(settings.REMEMBER_ME_DURATION)
