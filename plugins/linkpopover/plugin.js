'use strict';

( function() {
	var ESCAPE_KEYCODE = 27;
	var POPOVER_ACTIVE_CLASS = "cke-link-popover-active";

	var newPopover = function(linkElem) {
		var url = CKEDITOR.basePath + 'plugins/linkpopover/resources/'
		var html =
		'<div class="cke-link-popover">' +
			'<div style="text-overflow: ellipsis; overflow:hidden; white-space:nowrap;"">' +
				'<a target="_blank" href="' + linkElem.$.href + '" style="cursor:pointer;" class="cke-link-popover-gotoLink"><img style="height:14px; padding:0 4px 2px 0;" src="' + url + 'link.svg"/></a>' +
				'<a target="_blank" href="' + linkElem.$.href + '">' + linkElem.$.href + '</a>' +
			'</div>' +
		'</div>';
		var popover = new CKEDITOR.dom.element.createFromHtml(html);
		popover.setStyle("margin-top", "2px");
		popover.setStyle("position", "absolute");
		popover.setStyle("background-color", "#e0ecff");
		popover.setStyle("border", "1px solid #99c0ff");
		popover.setStyle("-webkit-border-radius", "2px");
		popover.setStyle("-moz-border-radius", "2px");
		popover.setStyle("padding", "2px 6px 2px 6px");
		popover.setStyle("white-space", "nowrap");
		popover.setStyle("font-family", "Arial,Helvetica,sans-serif");

		linkElem.addClass(POPOVER_ACTIVE_CLASS);
		popover.link = linkElem;

		return popover;
	};

	var hidePopover = function(editor) {
		if (editor && editor.popover) {
			editor.popover.link.removeClass(POPOVER_ACTIVE_CLASS);
			editor.popover.remove();
			editor.popover = undefined;
		}
	};

	var hidePopoverEventHandler = function(event) {
		hidePopover(event.listenerData);
	}

	// There are weird things you can do in CKEditor that will clone a link into two elements
	// (e.g., press return in the middle of a link).
	// Reset state if we've gotten into a state with two anchors with the popover class flag.
	var handleOrphanedPopoverClasses = function(editor) {
		var elemsWithClass = editor.editable().find("."+POPOVER_ACTIVE_CLASS);
		if (elemsWithClass.count() > 1) {
			for (var i = 0; i < elemsWithClass.count(); i++) {
				elemsWithClass.getItem(i).removeClass(POPOVER_ACTIVE_CLASS);
			}
			hidePopover(editor);
		}
	};

	var repositionPopover = function(editor, link) {
		var popover = editor.popover;
		var contentElement = getContentElement(editor);
		
		var adjustedOffsetTop = link.$.offsetTop - editor.window.$.pageYOffset;

		popover.removeStyle("right");

		popover.setStyle("left", link.$.offsetLeft + "px");
		popover.setStyle("top", (adjustedOffsetTop + link.$.offsetHeight - editor.editable().$.scrollTop) + "px");

		// Will the popover overflow the area
		if (popover.$.offsetLeft + popover.$.offsetWidth > contentElement.$.offsetWidth) {
			popover.removeStyle("left");
			popover.setStyle("right", "5px");
		}
		if (popover.$.offsetTop + popover.$.offsetHeight > contentElement.$.offsetHeight) {
			popover.setStyle("top", (adjustedOffsetTop - editor.editable().$.scrollTop - popover.$.offsetHeight - 5) + "px");
		}
		popover.setStyle("max-width", (contentElement.$.offsetWidth - 10) + "px");
	};

	var getContentElement = function(editor) {
		var contentId = '#' + editor.id + '_contents';
		return editor.container.findOne(contentId);
	}

	var popoverEventHandler = function(event) {
		var editor = event.listenerData;

		handleOrphanedPopoverClasses(editor);

		if (event && event.data && event.data.getKey() === ESCAPE_KEYCODE) {
			hidePopover(editor);
			return;
		}

		var link = CKEDITOR.plugins.link.getSelectedLink(editor);
		if (link) {
			if (!link.hasClass(POPOVER_ACTIVE_CLASS)) {
				hidePopover(editor);
			}

			if (!editor.popover) {
				// we found a link to work with. show a popover
				// if !containsChild popover
				editor.popover = newPopover(link);
				getContentElement(editor).append(editor.popover);
			}

			repositionPopover(editor, link);
		} else {
			hidePopover(editor);
		}
	};

	var onSetData = function(event) {
		hidePopover(event.editor);
	};

	var onContentDom = function(event) {
		var editor = event.editor;
		var editable = editor.editable();

		if (editable.isReadOnly()) {
			editable.attachListener( editable, 'click', function (evt) {
				var target = evt.data.getTarget();
				var clickedAnchor = (new CKEDITOR.dom.elementPath(target, editable)).contains( 'a' );
				var href = clickedAnchor && clickedAnchor.getAttribute( 'href' );
				if (href) {
					window.open( href, '_blank' );
				}
			});
		} else {
			// We need to absolutely position the popover, so set its parent to relative
			getContentElement(editor).setStyle('position', 'relative');
			editor.document.getBody().on("keyup", popoverEventHandler, null, editor);
			editor.document.getBody().on("click", popoverEventHandler, null, editor);
			editor.document.getBody().on("contextmenu", hidePopoverEventHandler, null, editor);
			editor.document.getBody().getWindow().on("scroll", hidePopoverEventHandler, null, editor);
		}
	};

	CKEDITOR.plugins.add( 'linkpopover', {
		requires: 'link',

		init: function( editor ) {
			// instanceCreated seems like a better place to do this, but that event
			// never gets fired, so use instanceReady instead.
			CKEDITOR.on('instanceReady', function(event) {
				if (event.editor != editor) return;

				editor.on('contentDom', onContentDom);
				editor.on("setData", onSetData);

				onContentDom(event);
			});

			CKEDITOR.on('dialogDefinition', function(e) {
				if ((e.editor != editor) || (e.data.name != 'link')) return;

				// Overrides definition.
				var definition = e.data.definition;
				definition.onOk = CKEDITOR.tools.override(definition.onOk, function(original) {
					return function() {
						hidePopover(editor);
						original.call(this);
						popoverEventHandler({listenerData: editor});
					};
				});
			});
		}
	});
})();
