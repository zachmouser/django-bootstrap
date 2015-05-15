from django.contrib import admin

from base.models import Message

class MessageAdmin(admin.ModelAdmin):
    list_display = ('code', 'message', 'is_error')
    list_filter = ('code', 'message')

admin.site.register(Message, MessageAdmin)
