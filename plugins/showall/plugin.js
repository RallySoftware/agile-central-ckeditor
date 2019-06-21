'use strict';

( function() {
  var showAllElement = function(idPrefix, buttonHtml) {
		var html =
		'<div id="' + idPrefix + '_showall" class="showall">' +
      (buttonHtml || '<button>Show All...</button>') +
		'</div>';

		return new CKEDITOR.dom.element.createFromHtml(html);
  };
  var getInnerContentHeight = function(editor){
    var doc = editor.container.findOne('#' + editor.id + '_contents iframe').$.contentDocument;
    var body = doc.body;
    var html = doc.documentElement;

    return Math.max(body.scrollHeight, body.offsetHeight,
                          html.clientHeight, html.scrollHeight, html.offsetHeight);
  };

  var onResize = function(event){
    var editor = event.editor;
    var maxHeight = getInnerContentHeight(editor);
    var currentHeight = editor.ui.space( 'contents' ).$.offsetHeight;
    var visible = currentHeight < maxHeight;
    var element = getElement(editor, 'showall');
    if (visible){
      element.removeClass('hidden');
    } else {
      element.addClass('hidden');
    }
  }

  var resizeToMax = function(editor){
    var newHeight = getInnerContentHeight(editor);
    editor.fire('showAllResize', newHeight);
    editor.resize(null, newHeight, true);
  }

  var onContentDom = function(event){
    var editor = event.editor;
    getElement(editor, 'contents').append(showAllElement(editor.id, editor.config.showAllButtonHtml));

    var button = editor.container.findOne('#' + editor.id + '_showall button');
    button.on('click', resizeToMax.bind(null, editor));
  };

  var getElement = function(editor, suffix) {
		var contentId = '#' + editor.id + '_' + suffix;
		return editor.container.findOne(contentId);
	}

	CKEDITOR.plugins.add( 'showall', {
		requires: 'resize',

		init: function( editor ) {
			CKEDITOR.on('instanceReady', function(event) {
				if (event.editor != editor) return;

				editor.on('contentDom', onContentDom);
        editor.on('resize', onResize);
        onContentDom(event);
        onResize(event);
      });

		}
	});
})();
