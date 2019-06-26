'use strict';

( function() {
  var lastHeight = null;
  var DEFAULT_SHOW_ALL_BUTTON_HTML = '<button>Show All...</button>';
  var DEFAULT_SHOW_LESS_BUTTON_HTML = '<button>Show Less...</button>';
  var DEFAULT_SHOW_ALL_HEIGHT_BUFFER = 25;
  var createButton = function(idPrefix, idSuffix, buttonHtml) {
    var wrapperId = idPrefix + '_' + idSuffix;
		var html =
		'<div id="' + wrapperId + '" class="' + idSuffix + '">' +
      buttonHtml +
		'</div>';

		return new CKEDITOR.dom.element.createFromHtml(html);
  };
  var getActualContentHeight = function(editor){
    var doc = editor.container.findOne('#' + editor.id + '_contents iframe').$.contentDocument;
    var body = doc.body;
    var html = doc.documentElement;

    return Math.max(body.scrollHeight, body.offsetHeight,
                          html.clientHeight, html.scrollHeight, html.offsetHeight);
  };

  var setVisibility = function(element, visible){
    if (visible) {
      element.removeClass('hidden');
    } else {
      element.addClass('hidden');
    }
  }

  var getIdealHeightForContent = function(editor){
    var buffer = DEFAULT_SHOW_ALL_HEIGHT_BUFFER || editor.config.showAllHeightBuffer;
    return Math.min(getActualContentHeight(editor) + buffer, editor.config.resize_maxHeight);
  }

  var onResize = function(event){
    var editor = event.editor;
    var showAllButton = getElement(editor, 'showall');
    var showLessButton = getElement(editor, 'showless');


    var maxContentHeight = getActualContentHeight(editor);
    var currentHeight = editor.ui.space( 'contents' ).$.offsetHeight;
    var shouldDisplayShowAllButton = currentHeight < maxContentHeight;
    var shouldDisplayShowLessButton = !shouldDisplayShowAllButton && lastHeight && showLessButton.hasClass('hidden');

    setVisibility(showAllButton, shouldDisplayShowAllButton);
    setVisibility(showLessButton, shouldDisplayShowLessButton);
    if (!shouldDisplayShowLessButton) {
      lastHeight = null;
    }
  }

  var resizeToMax = function(editor){
    //add some buffer so our button does not overlap any content
    var newHeight = getIdealHeightForContent(editor);
    lastHeight = editor.ui.space( 'contents' ).$.offsetHeight;
    editor.fire('showAllResize', { height: newHeight, expanding: true });
    editor.resize(null, newHeight, true);
  }

  var resizeToLess = function(editor){
    if (lastHeight){
      var newHeight = lastHeight;
      lastHeight = null;
      editor.fire('showAllResize', { height: newHeight, expanding: false });
      editor.resize(null, newHeight, true);
    }
  }

  var getOrCreateButton = function(editor, idSuffix, buttonHtml){
    var buttonSelector = '#' + editor.id + '_' + idSuffix + ' button';
    var button = editor.container.findOne(buttonSelector);
    if (!button){
      getElement(editor, 'contents').append(createButton(editor.id, idSuffix, buttonHtml));
      button = editor.container.findOne(buttonSelector);
    }
    return button;
  }

  var onContentDom = function(event){
    var editor = event.editor;
    var showAllButton = getOrCreateButton(editor, 'showall', editor.config.showAllButtonHtml || DEFAULT_SHOW_ALL_BUTTON_HTML);
    showAllButton.on('click', resizeToMax.bind(null, editor));
    var showLessButton = getOrCreateButton(editor, 'showless', editor.config.showLessButtonHtml || DEFAULT_SHOW_LESS_BUTTON_HTML);
    showLessButton.on('click', resizeToLess.bind(null, editor));
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
        editor.on('contentDomInvalidated', onContentDom);
        editor.on('change', onResize);
        editor.on('resize', onResize);
        onContentDom(event);
        onResize(event);
      });

		}
	});
})();
