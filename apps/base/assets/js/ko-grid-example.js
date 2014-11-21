var aoColumns = [
    {name: 'Example Name', column: 'example_column', width: 50, height: 30},
    {name: 'Example 2', column: 'test_column', width: 50, height: 30}
];

var aoData = [
    {id: 1, example_column: 'Testing', test_column: 'test 2'},
    {id: 2, example_column: 'Testing 2', test_column: 'test 3'}
];

var koGrid = function ( aoColumns, aoData ) {

    var self = this;

    self.items = ko.observableArray( aoData );

    self.
