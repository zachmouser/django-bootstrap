from json import loads

def slick_save_data(request, data, model, ordered=False):

    # Keeping session history of all the new records added. This prevents requiring a client reload.
    if not request.session.get('new_records', False): request.session['new_records'] = {}

    try:
        data = loads(data)
        if data.get('order', False) and ordered:
            order = data.get('order')
        data = data.get('edits')
        update_order = False

        for item in data:
            id = item.get('id')
            edit_type = item.get('slick_edit_type')

            # Remove the slick metadata keys.
            item = slick_remove_meta_keys(item)

            if edit_type == 'update':
                # Cannot .update a record, cannot .save a QuerySet...
                if 'new_' in str(id): id = request.session['new_records'][id]
                record = model.objects.filter(id=id)
                record.update(**item)
                record[0].save()
            elif edit_type == 'delete':
                # If this is a new, unsaved record to be deleted, skip it.
                if 'new_' not in str(id):
                    update_order = True
                    record = model.objects.get(id=id)
                    record.is_deleted = 'Y'
                    record.save()
            elif edit_type == 'copy':
                update_order = True
                record = model(**item)
                record.id = None
                record.save()
                request.session['new_records'][id] = record.id
            elif edit_type == 'reorder': update_order = True

        if ordered and update_order:
            counter = 1
            for id in order:
                update_id = id
                if 'new_' in str(update_id):
                    update_id = request.session['new_records'][update_id]
                record = model.objects.get(id=update_id)
                record.row_number = counter
                record.save()
                counter = counter + 1

    except Exception, e:
        return False

    return True

def slick_remove_meta_keys(item):

    for key in item.keys():
        if key.startswith('slick_'): item.pop(key)

    try:
        item.pop('id')
    except: pass

    return item
