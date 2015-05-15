from lib.color import scale

class Bar(object):

    def __init__(self, querySet, label, labels, values, fillColor='rgba(151,187,205,0.5)', strokeColor='rgba(151,187,205,0.8)', highlightFill='rgba(151,187,205,0.75)', highlightStroke='rgba(151,187,205,1)'):

        self.datasets = []
        self.values = querySet
        self.labels = [item[labels] for item in self.values]
        self._labels = labels
        self._values = values

        self.add_dataset(querySet, label, fillColor, strokeColor, highlightFill, highlightStroke)

    def add_dataset(self, querySet, label, fillColor='rgba(151,187,205,0.5)', strokeColor='rgba(151,187,205,0.8)', highlightFill='rgba(151,187,205,0.75)', highlightStroke='rgba(151,187,205,1)'):

        self.datasets.append({
            'label': label,
            'fillColor': fillColor,
            'strokeColor': strokeColor,
            'highlightFill': highlightFill,
            'highlightStroke': highlightStroke,
            'data': [item[self._values] for item in self.values]
        })

    def get_chart(self):
        return {'labels': self.labels, 'datasets': self.datasets}

class Line(object):

    def __init__(self, querySet, label, labels, values, fillColor='rgba(220,220,220,0.2)', strokeColor='rgba(186,220,139,1)', pointColor='rgba(140,197,62,1)', pointStrokeColor='#fff', pointHighlightFill='#fff', pointHighlightStroke='rgba(220,220,220,1)'):

        self.datasets = []
        self.values = querySet
        self.labels = [item[labels] for item in self.values]
        self._labels = labels
        self._values = values

        self.add_dataset(querySet, label, fillColor, strokeColor, pointColor, pointStrokeColor, pointHighlightFill, pointHighlightStroke)

    def add_dataset(self, querySet, label, fillColor='rgba(220,220,220,0.2)', strokeColor='rgba(186,220,139,1)', pointColor='rgba(140,197,62,1)', pointStrokeColor='#fff', pointHighlightFill='#fff', pointHighlightStroke='rgba(220,220,220,1)'):

        self.datasets.append({
            'label': label,
            'fillColor': fillColor,
            'strokeColor': strokeColor,
            'pointColor': pointColor,
            'pointStrokeColor': pointStrokeColor,
            'pointHighlightFill': pointHighlightFill,
            'pointHighlighStroke': pointHighlightStroke,
            'data': [item[self._values] for item in self.values]
        })

    def get_chart(self):
        return {'labels': self.labels, 'datasets': self.datasets}

class Pie(object):

    def __init__(self, querySet, labels, values, base_color='#1B75BB', base_highlight='#828790', color_scale=30, hightlight_scale=20):

        self.datasets = []
        self.base_color = base_color
        self.base_highlight = base_highlight

        color = self.base_color
        highlight = self.base_highlight
        for item in querySet:
            self.datasets.append({
                'value': item[values],
                'label': item[labels],
                'color': color,
                'highlight': highlight
            })
            color = scale(color, 30)
            highlight = scale(highlight, 20)

    def get_chart(self):
        return self.datasets
