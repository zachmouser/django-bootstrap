from django.conf.urls import patterns, url, include
from django.views.generic import TemplateView
from django.views.generic.base import RedirectView
from django.views.decorators.cache import cache_page

# Auth
from auth.views import Auth
from django.contrib.auth.decorators import login_required
from lib.decorators import group_required

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
    # Admin
    (r'^admin/doc/', include('django.contrib.admindocs.urls')),
    (r'^admin/', include(admin.site.urls)),

    # Auth
    url(r'^accounts/login/$', Auth.as_view(), name='auth'),
    (r'^logout/$', 'django.contrib.auth.views.logout', {'next_page': '/#logout-success'}),
    url(r'^', include('django.contrib.auth.urls')),

    # Base
    url(r'^$', login_required(TemplateView.as_view(template_name='base-index.html'))),
)
