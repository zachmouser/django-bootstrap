import json

from django.http import HttpResponse
from django.db.models.query import QuerySet
from django.core.serializers.json import DjangoJSONEncoder

from base.models import Message

error_message = lambda code: Message.objects.filter(code=code)[0]

def format_json_response(result='success', message_code_list=['WEB-00000'], data=None, add_data=None, custom_message=None):

    messages = []
    data_length = 0

    if custom_message:
        messages.append({'message': custom_message, 'message_code': 'WEB-99999'})
    else:
        for code in message_code_list:
            messages.append({'message': error_message(code).message, 'message_code': code})

        if len(messages) < 1:
            messages.append({'message': error_message('WEB-00000').message, 'message_code': 'WEB-00000'})

        if data:
            if isinstance(data, QuerySet):
                data = list(data.values())

        if data:
            data_length = len(data)

    if not data:
        data = None
        data_length = 0

    response = {'data': data, 'messages': messages, 'result': result, 'data_length': data_length}
    if add_data: response['add_data'] = add_data
    response = json.dumps(response, cls=DjangoJSONEncoder)

    return HttpResponse(response, content_type='application/json')
