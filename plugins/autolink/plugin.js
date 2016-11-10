/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

/**
 * Modified by CA
 * - allow dashes in subdomains
 * - allow www URLs without protocol
 */

( function() {
	'use strict';

	// Regex by Imme Emosol.
	var validUrlRegex = /^(https?|ftp|www\.)(-\.)?([^\s\/?\.#]+\.?)+(\/[^\s]*)?[^\s\.,]$/ig;
	var doubleQuoteRegex = /"/g;
	var startsWithWwwRegex = /^www\./;

	CKEDITOR.plugins.add( 'autolink', {
		requires: 'clipboard',

		init: function( editor ) {
			editor.on( 'paste', function( evt ) {
				var data = evt.data.dataValue;

				if ( evt.data.dataTransfer.getTransferType( editor ) == CKEDITOR.DATA_TRANSFER_INTERNAL ) {
					return;
				}

				// If we found "<" it means that most likely there's some tag and we don't want to touch it.
				if ( data.indexOf( '<' ) > -1 ) {
					return;
				}

				// If URL starts with www, then prepend http:// protocol
				if ( startsWithWwwRegex.test(data) ) {
					data = 'http://' + data;
				}

				// #13419z
				data = data.replace( validUrlRegex , '<a href="' + data.replace( doubleQuoteRegex, '%22' ) + '">$&</a>' );

				// If link was discovered, change the type to 'html'. This is important e.g. when pasting plain text in Chrome
				// where real type is correctly recognized.
				if ( data != evt.data.dataValue ) {
					evt.data.type = 'html';
				}

				evt.data.dataValue = data;
			} );
		}
	} );
} )();
