/* Setup a new slickgrid with all the bells and whistles.*/
if ( typeof $.pi == 'undefined' ) $.pi = {};
if ( typeof $.pi.slick == 'undefined' ) $.pi.slick = {};

/** A library wrapping SlickGrid.
 *  @param  sGridSelector   A selector for the element where the grid will load.
 *  @param  aoColumns       The column definitions.
 *  @param  oOptions        SlickGrid and SlickView options.
 *  @param  sDataBind       OPTIONAL: The ID of the parent element for SlickView data-binding.
 *  @param  fFilterGrid     OPTIONAL: The filter definition so that the view can be filtered.
 *  @param  sSelectionModel OPTIONAL: The selection model that the view should use. (row or cell).
 */
$.pi.slickView = function ( sGridSelector, aoColumns, oOptions, sDataBind, fFilterGrid, sSelectionModel ) {

    var self = this;
    self.options = oOptions;
    self.columns = aoColumns;
    self.args = '';
    self.dataView = new Slick.Data.DataView();
    self.totals = [];
    self.sortCol = '';
    self.activeCssStyles = [];
    self.$grid = $( sGridSelector );
    self.$spinner = undefined;
    self.selectionEnabled = ( typeof sSelectionModel == 'undefined' ) ? false : true;

    self.filter = fFilterGrid;

    // For undo.
    self.aoCommands = [];

    self.getOption = function ( sOptionName ) {
        var sOptionValue = self.options[sOptionName];
        return ( typeof sOptionValue == 'undefined' ) ? false : sOptionValue;
    };
    /*  Log and execute changes.
     *  The paramters are weird:
     *      Default behavior is the update command, which passes in an item, column and command.
     *      If you pass in a row number as an item and nothing else, it assumes a delete.
     *      If you pass in a row number as item and a new position as a column, it assumes a reorder.
     */
    self.fQueueAndExecute = function ( item, column, editCommand ) {
        var oCommand = new Object(), oItem = new Object();
        self.grid.invalidateAllRows();
        self.dataView.beginUpdate();
        // Delete.
        if ( typeof item == 'number' && column == undefined ) {
            oItem = self.dataView.getItem( item );
            if ( self.dataView.getLength() == 1 ) return false;
            oItem['slick_edit_type'] = 'delete';
            oItem['slick_row'] = item;

            oCommand = self.fCreateCommand( oItem );
            oCommand.execute();
            oCommand['item'] = oItem;
        // Reorder.
        } else if ( typeof item == 'number' && typeof column == 'number' ) {
            // Using insertBefore, which will show -1 and length+1 for items at beginning and end of the list. This is the fix:
            var iLen = self.dataView.getLength();
            if ( item < 0 ) {
                item = 0;
            } else if ( item > iLen ) {
                item = iLen;
            }
            if ( column < 0 ) {
                column = 0;
            } else if ( column > iLen ) {
                column = iLen
            }
            if ( column < item ) column += 1;
            oItem = self.dataView.getItem( item );
            oItem['slick_edit_type'] = 'reorder';
            oItem['slick_prev_row'] = item;
            oItem['slick_new_row'] = column;

            oCommand = self.fCreateCommand( oItem );
            oCommand.execute();
            oCommand['item'] = oItem;
        // Copy.
        } else if ( typeof item == 'number' && typeof column == 'object' ) {
            oItem = self.dataView.getItem( item );
            oCopy = self.fCloneObject( oItem );
            oCopy['slick_new_id'] = fGetRowId();
            oCopy['slick_edit_type'] = 'copy';
            oCopy['slick_prev_row'] = item;
            // Clear columns not to be copied.
            for ( var i = 0, iLen = editCommand.length; i < iLen; i++ ) {
                oCopy[editCommand[i]] = null;
            }

            oCommand = self.fCreateCommand( oCopy );
            oCommand.execute();
            oCommand['item'] = oCopy;
        // Update.
        } else {
            oCommand = editCommand;
            oCommand.execute();
            oItem = self.fCloneObject( item );
            oItem['slick_edit_type'] = 'update';
            oCommand['item'] = oItem;
        }
        self.dataView.endUpdate();
        self.aoCommands.push( oCommand );
        if ( typeof self.koDataBind != 'undefined' ) self.koDataBind.edits.push( oCommand.item );

        self.grid.updateRowCount();
        self.grid.render();
    };

    oOptions['editCommandHandler'] = self.fQueueAndExecute;

    if ( self.getOption( 'enableMoveRows' ) == true ) {
        self.columns.unshift({
            id: '#',
            name: '',
            width: 10,
            behavior: 'selectAndMove',
            selectable: false,
            resizeable: false,
            cssClass: 'cell-reorder dnd',
            editable: false
        });
    }

    // Setup a new grid using an empty (selector) div.
    self.grid = new Slick.Grid( sGridSelector, self.dataView, aoColumns, oOptions );
    // Set selection model.
    if ( typeof sSelectionModel != 'undefined' ) {
        if ( sSelectionModel == 'row' ) self.grid.setSelectionModel( new Slick.RowSelectionModel() );
        if ( sSelectionModel == 'cell' ) self.grid.setSelectionModel( new Slick.CellSelectionModel() );
    }

    self.getSelectedRows = function () {

        var aoSelected = [];
        var aSelectedRows = self.grid.getSelectedRows();
        for ( var i = 0, iLen = aSelectedRows.length; i < iLen; i++ ) {
            var oSelected = self.dataView.getItem( aSelectedRows[i] );
            aoSelected.push( oSelected );
        }
        return aoSelected;
    };

    // KnockoutJS DataBindings.
    if ( typeof sDataBind != 'undefined' ) {
        // Bind grid data to knockout for easy html manipulation.
        function fDataBind( aoData ) {
            var knock = this;
            this.knockout = ko.observableArray( self.dataView.getItems() );
            this.filter = ko.observable( self.dataView.getLength() );
            if ( self.selectionEnabled ) this.selected = ko.observableArray( self.getSelectedRows() );

            knock.edits = ko.observableArray( [] );
            this.hasEdits = ko.computed( function () {
                if ( knock.edits().length > 0 ) return true;
                return false;
            });

            this.setKnockout = function () {
                this.knockout( self.dataView.getItems() );
                this.filter( self.dataView.getLength() );
                if ( self.selectionEnabled ) this.selected( self.getSelectedRows() );
            };

            if ( self.selectionEnabled ) {
                /** Sum a particular column in a list of rows.
                 *  @param  sColumn     The column to do math on.
                 *  @param  sFormat     The format for output (only 'money' right now).
                 *  @param  bSelected   Sum only the rows that are selected.
                 */
                this.sum = function ( sColumn, sFormat, bSelected ) {
                    var total = 0.00;
                    bSelected = ( typeof bSelected == 'undefined' ) ? false : bSelected;
                    if ( bSelected ) {
                        var oSelected = self.grid.getActiveCell();
                        if ( oSelected != null ) {
                            sColumn = self.grid.getColumns()[oSelected.cell].field;
                            $( '.slick-header-columns' )
                                .children()
                                    .css( 'border-bottom', 'solid 1px #d4d4d4' )
                                    .end()
                                .children( '[id$="' + sColumn + '"]' )
                                    .css( 'border-bottom', 'solid 1px green' )
                            ;
                        }
                        var aoItems = this.selected();
                    } else {
                        var aoItems = this.knockout();
                    }
                    ko.utils.arrayForEach( aoItems, function ( oRow ) {
                        try { total += ( +oRow[sColumn] ); } catch ( e ) { return false; }
                    });
                    total = parseFloat( total.toFixed( 2 ) );
                    // allow formatting as money (commas included). This is the default.
                    if ( typeof sFormat == 'undefined' || sFormat == 'money' ) total = total.formatMoney( 2, '.', ',' );

                    return total;
                };
            }
        }

        var oDataBind = document.getElementById( sDataBind );
        self.koDataBind = new fDataBind( self.dataView.getItems() );
        ko.applyBindings( self.koDataBind, oDataBind );
    }

    // Private functions.
    // Generate a unique ID for a new row, which is required for the dataView.
    var fGetRowId = function () {

        var dNow = new Date();

        // Concat and slice to lpad single-digit numbers.
        return 'new_'
            + dNow.getFullYear()
            + ('0' + (dNow.getMonth() + 1)).slice( -2 )
            + ('0' + dNow.getDate()).slice( -2 )
            + ('0' + dNow.getHours()).slice( -2 )
            + ('0' + dNow.getMinutes()).slice( -2 )
            + ('0' + dNow.getSeconds()).slice( -2 )
        ;

    };

    // Create a clone of an object as opposed to a pointer to an object (object = object).
    self.fCloneObject = function ( oObject ) {

        if ( oObject == null || typeof oObject != 'object' ) return oObject;

        var oNew = oObject.constructor();
        for ( var key in oObject ) {
            if ( oObject.hasOwnProperty( key ) ) oNew[key] = oObject[key];
        }

        return oNew;

    };

    // Setup listeners.
    self.dataView.onRowCountChanged.subscribe( function ( e, args ) {
        if ( typeof self.koDataBind != 'undefined' ) self.koDataBind.setKnockout();
        self.grid.updateRowCount();
        self.grid.render();
        self.grid.resizeCanvas();
    });

    self.dataView.onRowsChanged.subscribe( function ( e, args ) {
        if ( typeof self.koDataBind != 'undefined' ) self.koDataBind.setKnockout();
        self.grid.invalidateRows( args.rows );
        self.grid.render();
    });

    self.grid.onCellChange.subscribe( function ( e, args ) {
        if ( typeof self.koDataBind != 'undefined' ) self.koDataBind.setKnockout();
    });

    self.grid.onSelectedRowsChanged.subscribe( function ( e, args ) {
        if ( typeof self.koDataBind != 'undefined' ) self.koDataBind.setKnockout();
    });

    // Filtering.
    self.fUpdateFilter = function ( sSearchString ) {
        self.dataView.setFilterArgs({
            sSearchString: sSearchString
        });

        self.dataView.refresh();
        if ( typeof self.koDataBind != 'undefined' ) self.koDataBind.setKnockout();
    };

    /* BEGIN Slick Commands */
    self.fDeleteExecute = function () {

        var aoData = self.dataView.getItems();

        aoData.splice( this.row, 1 );

        self.dataView.setItems( aoData );
        self.grid.setSelectedRows( [] );

    };

    self.fDeleteUndo = function() {

        var aoData = self.dataView.getItems();

        aoData.splice( this.row, 0, this.item );

        self.dataView.setItems( aoData );

    };

    self.fReorderExecute = function () {

        var aoData = self.dataView.getItems();

        aoData.move( this.prevRow, this.newRow );

        self.grid.resetActiveCell();
        self.dataView.setItems( aoData );

    };

    self.fReorderUndo = function () {

        var aoData = self.dataView.getItems();

        aoData.move( this.newRow, this.prevRow );

        self.dataView.setItems( aoData );

    };

    self.fCopyExecute = function () {

        var aoData = self.dataView.getItems();

        this.item.id = this.item.slick_new_id;
        aoData.splice( this.prevRow + 1, 0, this.item );

        self.dataView.setItems( aoData );

    };

    self.fCopyUndo = function () {

        var aoData = self.dataView.getItems();

        var iRow = self.dataView.getIdxById( this.item.id );
        aoData.splice( iRow, 1 );

        self.dataView.setItems( aoData );

    };
    /* END Slick Commands */

    // Create a non-update command for queuing (i.e. delete, reorder, add).
    self.fCreateCommand = function ( oItem, fExecute, fUndo ) {

        // Set defaults
        if ( typeof fExecute == 'undefined' ) {
            if ( oItem.slick_edit_type == 'delete' ) fExecute = self.fDeleteExecute;
            if ( oItem.slick_edit_type == 'reorder' ) fExecute = self.fReorderExecute;
            if ( oItem.slick_edit_type == 'copy' ) fExecute = self.fCopyExecute;
        }
        if ( typeof fUndo == 'undefined' ) {
            if ( oItem.slick_edit_type == 'delete' ) fUndo = self.fDeleteUndo;
            if ( oItem.slick_edit_type == 'reorder' ) fUndo = self.fReorderUndo;
            if ( oItem.slick_edit_type == 'copy' ) fUndo = self.fCopyUndo;
        }
        var oEditCommand = new Object();
        oEditCommand = {
            row: oItem.slick_row,
            prevRow: oItem.slick_prev_row,
            newRow: oItem.slick_new_row,
            cell: 0,
            execute: fExecute,
            undo: fUndo,
            type: oItem.slick_edit_type,
            item: oItem
        };

        return oEditCommand;

    };

    // Undo command action.
    self.fUndoCommand = function () {
        if ( self.aoCommands.length == 0 ) {
            $.phyins.setMessage( 'alert-warning', 'Warning: ', 'There are no modifications to undo.' );
            return false;
        }

        var oCommand = self.aoCommands.pop();
        if ( self.koDataBind != 'undefined' ) self.koDataBind.edits.pop();
        if ( oCommand && Slick.GlobalEditorLock.cancelCurrentEdit() ) {
            oCommand.undo();
            self.grid.gotoCell( oCommand.row, oCommand.cell, false );
        }

        return false;
    };

    /* BEGIN Sort Comparers */
    self.fDateCompare = function ( oA, oB ) {
        var sA = oA[self.sortCol];
        var sB = oB[self.sortCol];
        // For JSON dates.
        if ( sA.match( /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/ ) != null ) {
            sA = sA.replace( /(T|Z)/g, ' ' ).split( ' ' );
            sB = sB.replace( /(T|Z)/g, ' ' ).split( ' ' );
            var sDateA = sA[0].split( '-' ), sDateB = sB[0].split( '-' );
            var sTimeA = sA[1].split( ':' ), sTimeB = sA[1].split( ':' );
            var dA = new Date( sDateA[0], sDateA[1] - 1, sDateA[2], sTimeA[0], sTimeA[1], sTimeA[2] );
            var dB = new Date( sDateB[0], sDateB[1] - 1, sDateB[2], sTimeB[0], sTimeB[1], sTimeB[2] );
        // For yyyy-mm-dd dates.
        } else if ( sA.match( /\d{4}-\d{2}-\d{2}/ ) != null ) {
            var sDateA = sA.split( '-' ), sDateB = sB.split( '-' );
            var dA = new Date( sDateA[0], sDateA[1] - 1, sDateA[2] );
            var dB = new Date( sDateB[0], sDateB[1] - 1, sDateB[2] );
        }

        return (dA == dB) ? 0 : ((dA > dB ) ? 1 : -1 );
    };

    self.fSortCompare = function ( oA, oB ) {
        oA = oA[self.sortCol], oB = oB[self.sortCol];
        return ( oA == oB ? 0 : ( oA > oB ? 1 : -1 ) );
    };
    /* END Sort Comparers */

    self.sort = function ( sColumn, bAscending ) {

        self.sortCol = sColumn;

        if ( sColumn.indexOf( 'date' ) != -1 ) {
            fSortCompare = self.fDateCompare;
        } else {
            fSortCompare = self.fSortCompare;
        }

        self.dataView.sort( fSortCompare, bAscending );

    };

    self.grid.onSort.subscribe( function ( e, args ) {
        self.sort( args.sortCol.field, args.sortAsc );
    });

    // Enabling re-ordering of rows.
    if ( self.getOption( 'enableMoveRows' ) ) {
        // Reorder rows.
        self.moveRowsPlugin = new Slick.RowMoveManager({
            cancelEditOnDrag: true
        });

        self.moveRowsPlugin.onBeforeMoveRows.subscribe( function ( e, data ) {
            for ( var i = 0, iLen = data.rows.length; i < iLen; i++ ) {
                if ( data.rows[i] == data.insertBefore || data.rows[i] == data.insertBefore - 1 ) {
                    e.stopPropagation();
                    return false;
                }
            }
        });

        self.moveRowsPlugin.onMoveRows.subscribe( function ( e, args ) {
            for ( var i = 0, iLen = args.rows.length; i < iLen; i++ ) {
                self.fQueueAndExecute( args.rows[i], args.insertBefore - 1 );
            }
        });
        self.grid.registerPlugin( self.moveRowsPlugin );
    }

    if ( self.getOption( 'enableExternalCopy' ) ) self.grid.registerPlugin( new Slick.CellExternalCopyManager() );

    // Load grid AJAX data.
    self.load = function ( sUrl, $spinner, fCallback ) {
        self.fLoadGrid( sUrl, self.$grid, $spinner, fCallback );
    };
    self.fLoadGrid = function ( sUrl, $gridDiv, $spinner, fCallback, fFilterGrid ) {

        fCallback = ( typeof fCallback == 'function' ) ? fCallback : false;
        if ( self.aoCommands.length > 0 ) {
            if ( !confirm( 'You have unsaved changes. Reloading will cause these changes to be lost. Continue?' ) ) return false;
        }
        if ( typeof $spinner != 'undefined' ) {
            self.$spinner = $spinner;
            self.$spinner.show( 'fade' );
        }

        $.ajax({
            type: 'get',
            url: sUrl,
            cache: false,
            success: function( oJson, textStatus, jqXHR ) {
                Slick.GlobalEditorLock.cancelCurrentEdit()
                self.aoCommands = [];
                self.grid.invalidateAllRows();
                if ( oJson.data_length == 0 ) {
                    $gridDiv.find( '.grid-canvas' ).html( '<div class="text-center">No records found.</div>' );
                } else {
                    self.dataView.beginUpdate();
                    self.dataView.setItems( oJson.data );
                    if ( typeof self.filter != 'undefined' ) self.dataView.setFilter( self.filter );
                    self.removeActiveCssStyles();
                    self.dataView.endUpdate();
                    self.grid.resizeCanvas();
                    if ( typeof self.koDataBind != 'undefined' ) self.koDataBind.setKnockout();

                    // Set default sort, if provided.
                    var oSort = self.getOption( 'defaultSort' );
                    if ( typeof oSort == 'object' ) self.sort( oSort.column, oSort.sortAsc );
                }
                self.grid.render();
                if ( typeof $gridDiv != 'undefined' ) {
                    $gridDiv.animate( {opacity: 1}, {complete: function() { self.$spinner.hide( 'fade' ); }, duration: 500} );
                }

                if ( fCallback != false ) fCallback();
            }
        });

    };

    self.setCellCssStyles = function ( sKey, sMap ) {

        self.grid.setCellCssStyles( sKey, sMap );
        self.activeCssStyles.push( sKey );

    };

    self.findOne = function ( oKeyValues, bOr ) {

        bOr = ( typeof bOr == 'undefined' ) ? false : bOr;
        bMatch = false;

        var aoItems = self.dataView.getItems();
        for ( var i = 0, iLen = aoItems.length; i < iLen; i++ ) {
            var oItem = aoItems[i];
            for ( var sKey in oKeyValues ) {
                if ( oItem[sKey] == oKeyValues[sKey] ) {
                    bMatch = true;
                } else { bMatch = false; }
                if ( bOr && bMatch ) return oItem.id;
            }
            if ( bMatch ) return oItem;
        }

    };

    self.findAll = function ( sKey, sValue ) {

        var aoItems = self.dataView.getItems();
        var aIds = [];
        for ( var i = 0, iLen = aoItems.length; i < iLen; i++ ) {
            var oItem = aoItems[i];
            if ( oItem[sKey] == sValue ) aIds.push( oItem.id );
        }
        return aIds;
    };

    self.removeActiveCssStyles = function () {
        for ( var i = 0, iLen = self.activeCssStyles.length; i < iLen; i++ ) {
            self.grid.removeCellCssStyles( self.activeCssStyles[i] );
        }
    };

    self.clearSelectedRows = function () {
        self.grid.resetActiveCell();
        $( '.slick-header-columns' )
            .children()
                .css( 'border-bottom', 'solid 1px #d4d4d4' )
        ;
        self.grid.setSelectedRows( [] );
    };

    self.removeItem = function ( sId ) {
        self.dataView.deleteItem( sId );
    };

    self.removeItems = function ( aIds ) {
        for ( var i = 0, iLen = aIds.length; i < iLen; i++ ) {
            self.removeItem( aIds[i] );
            self.grid.invalidate();
            self.grid.updateRowCount();
            self.grid.render();
        }
    };

    self.removeSelectedRows = function () {
        var selectedRows = self.grid.getSelectedRows();
        if ( !selectedRows.length ) return false;

        var aRows = selectedRows.sort().reverse();
        var iLen = selectedRows.length;

        var aRowIds = [];
        for ( var i = 0; i < iLen; i++ ) {
            var oItem = self.dataView.getItem( aRows[i] );
            aRowIds.push( oItem.id );
        }

        for ( var i = 0; i < iLen; i++ ) {
            self.fQueueAndExecute( self.dataView.getIdxById( aRowIds[i] ) );
        }

        return true;
    };

    self.copySelectedRow = function ( aExcludeColumns ) {

        var selectedRows = self.grid.getSelectedRows();
        if ( selectedRows.length != 1 ) return false;
        var iRow = selectedRows[0];
        var oItem = self.dataView.getItem( iRow );
        self.fQueueAndExecute( iRow, oItem, aExcludeColumns );

        return true;

    };

    self.save = function ( sUrl, sType, fCallback ) {

        if ( typeof self.koDataBind != 'undefined' ) var koEdits = self.koDataBind.edits();
        var aoItems = self.dataView.getItems();
        var aOrder = [];

        for ( var i = 0, iLen = aoItems.length; i < iLen; i++ ) {
            aOrder.push( aoItems[i].id );
        }

        if ( typeof self.$spinner != 'undefined' ) self.$spinner.show( 'fade' );

        if ( koEdits.length == 0 ) {
            $.phyins.setMessage( 'alert-warning', 'Warning: ', 'There are no modifications to save.' );
            return false;
        }

        sType = ( typeof sType == 'undefined' ) ? 'post' : sType;

        $.ajax({
            url: sUrl,
            type: sType,
            cache: false,
            data: {data: JSON.stringify( {edits: koEdits, order: aOrder} )},
            success: function ( oJson, sStatus, jqXHR ) {
                if ( typeof self.$spinner != 'undefined' ) self.$spinner.hide( 'fade' );
                if ( oJson.result == 'success' ) {
                    self.aoCommands = [];
                    if ( typeof self.koDataBind != 'undefined' ) self.koDataBind.edits( [] );
                }

                $.pi.fSetJsonMessage( oJson );

                if ( typeof fCallback != 'undefined' ) fCallback();
            }
        });

    };

};

/* BEGIN UI Display Formatters */
// Is expanded checkmarks.
$.pi.slick.formatters = {
    fCheckFormatter: function ( row, cell, value, columnDef, dataContext ) {

        var sChecked = '<i class="icon-check" style="color: gray;"></i>';
        var sUnchecked = '<i class="icon-unchecked" style="color: gray;"></i>';
        if ( value == true ) {
            return sChecked;
        } else if ( value == false ) {
            return sUnchecked;
        } else if ( value != true && value != false ) {
            if ( value.length == 0 ) {
                return sUnchecked;
            } else {
                return sChecked;
            }
        }

    },

    // Row numbering.
    fRowNumberFormatter: function ( row, cell, value, columnDef, dataContext ) {
        return row + 1;
    },

    // JSON Date (yyyy-mm-ddThh:mi:ssZ) formatter.
    fJsonDateFormatter: function ( row, cell, value, columnDef, dateContext ) {
        return value.replace( /(T|Z)/g, ' ' )
    },

    // Change a decimal money.
    fMoneyFormatter: function ( row, cell, value, columnDef, dataContext ) {
        if ( typeof value == 'string' ) return ( +value ).formatMoney( 2, '.', ',' );
        if ( typeof value == 'number' ) return value.formatMoney( 2, '.', ',' );
    },
    // Format a string as a float.
    fFloatFormatter: function ( row, cell, value, columnDef, dataContext ) {
        if ( typeof value == 'string' ) return +value;
        return value;
    },
    fDeleteButtonFormatter: function ( row, cell, value, columnDef, dataContext ) {
        return '<a href="#" class="delete-row" data-id="' + dataContext.id + '"><i class="icon-remove-sign text-error"></i></a>';
    }
};

$.pi.slick.validators = {
    /* BEGIN Validators */
    fValidateFloat: function ( value ) {
        if ( (!value.match( /^(\d*)?\.\d{1,2}$/ ) && !value.match( /^\d+$/ )) || value.length == 0 ) {
            $.phyins.setMessage( 'alert-warning', 'Warning: ', 'Must be a number (i.e. 100.00 or 100).' );
            return {valid: false, message: null};
        }
        $.phyins.setMessage( 'alert-success', '', '' );
        return {valid: true, message: null};
    }
    /* END Validators */
};

$( document ).ready( function () {

    // Set the pointer mouse on sortable rows.
    $( 'span.slick-sort-indicator' )
        .parent()
        .addClass( 'pointer' )
    ;

});
