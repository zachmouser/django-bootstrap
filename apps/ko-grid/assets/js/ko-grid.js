(function () {

    var templateEngine = new ko.nativeTemplateEngine();

    /*  Data Example:
     *    {name: 'Example Name', column: 'example_column', width: 50, height: 30}
     */
    $.koGrid = {
        viewModel: function ( config ) {
            var self = this;

            self.uri = config.uri || undefined;

            self.data = ko.observableArray([]);
            self.pageNumber = ko.observable( 0 );
            self.pageSize = config.pageSize || 5;

            self.columns = config.columns;

            self.pageItems = ko.computed( function () {
                var index = self.pageSize * self.pageNumber();
                return ko.unwrap( self.data ).slice( index, index + self.pageSize );
            }, self);

            self.maxPage = ko.computed( function () {
                return Math.ceil( ko.unwrap( self.data ).length / self.pageSize ) - 1;
            }, self);
        }
    };

    templateEngine.addTemplate( 'ko_grid', [
        '<table class="ko-grid">',
        '   <thead class="ko-head">',
        '       <tr class="ko-head-tr" data-bind="foreach: columns">',
        '           <th class="ko-head-th" data-bind="text: name"></th>',
        '       </tr>',
        '   </thead>',
        '   <tbody class="ko-body" data-bind="foreach: pageItems">',
        '       <tr class="ko-body-tr" data-bind="foreach: $parent.columns">',
        '           <td class="ko-body-td" data-bind="text: typeof rowText == \'function\' ? rowText( $parent ): $parent[rowText]"></td>',
        '       </tr>',
        '   </tbody>',
        '</table>'
    ].join( ' ' ));

})();
