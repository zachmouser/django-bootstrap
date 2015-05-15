if (typeof $.base == 'undefined') $.base = {};

$( function () {
    $( '[data-toggle="tooltip"]' ).tooltip();
});

$.base.notify = noty;
$.noty.defaults.theme = 'bootstrapTheme';
$.noty.defaults.layout = 'bottomRight';

$.base.get_timestamp = function () {
    var dNow = new Date();
    return dNow.getFullYear() + '-' + ('0' + (dNow.getMonth() + 1)).slice( -2 ) + '-' + ('0' + dNow.getDate()).slice( -2 ) + ' ' + ('0' + dNow.getHours()).slice( -2 ) + ':' + ('0' + dNow.getMinutes()).slice( -2 ) + ':' + ('0' + dNow.getSeconds()).slice( -2 );
};

$.base.clear_modal = function( oModal ) {

    var oModal = (typeof oModal == 'undefined') ? $( '#modal-d' ) : oModal;

    oModal
        .find( '.modal-title' )
            .html( '' )
        .end()
        .find( '.modal-body' )
            .html( '' )
        .end()
        .find( '.modal-footer' )
            .html( '' )
    ;

};
