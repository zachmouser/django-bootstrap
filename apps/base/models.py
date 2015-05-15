from django.db import models

class Message(models.Model):

    code = models.CharField(max_length=50)
    message = models.CharField(max_length=500)
    is_error = models.BooleanField(default=False)
    insert_date = models.DateField(auto_now_add=True)
    update_date = models.DateField(auto_now=True)

    class Meta:
        ordering = ['code']
