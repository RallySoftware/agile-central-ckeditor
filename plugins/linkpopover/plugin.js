'use strict';

( function() {
	var ESCAPE_KEYCODE = 27;
	var mentioningSymbol = 50; // @

	var POPOVER_ACTIVE_CLASS = "cke-link-popover-active";

	var newPopover = function(linkElem) {
		var html =
		'<div class="cke-link-popover">' +
			'<div style="text-overflow: ellipsis; overflow:hidden; white-space:nowrap;"">' +
				'Go&nbsp;to&nbsp;link:&nbsp;' +
				'<a target="_blank" href="' + linkElem.$.href + '">' + linkElem.$.href + '</a>' +
			'</div>' +
			'<div>' +
				'<a style="cursor:pointer;" class="cke-link-popover-changelink">Change</a>&nbsp;-&nbsp;' +
				'<a style="cursor:pointer;" class="cke-link-popover-removelink">Remove</a>' +
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
	function cleanupBlur(editorInstance) {
		if(editorInstance.document.findOne('.suggestion-list')) {
			editorInstance.document.findOne('.suggestion-list').remove();
		}
		if(editorInstance.document.findOne('.suggestion-container')){
			editorIntance.document.findOne('.suggestion-container').remove();
		}
		hidePopover(editorInstance);
	}
	var hidePopover = function(editor) {
		if (editor) {
			if(editor.suggestionList) {
				delete editor.suggestionList
				// editor.popover.link.removeClass(POPOVER_ACTIVE_CLASS);
				// editor.popover.remove();
				// editor.popover = undefined;
			}
			if(editor.suggestionContainer) {
				editor.suggestionContainer.remove();
				delete editor.suggestionContainer;
			}
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

		popover.removeStyle("right");

		popover.setStyle("left", link.$.offsetLeft + "px");
		popover.setStyle("top", (link.$.offsetTop + link.$.offsetHeight - editor.editable().$.scrollTop) + "px");

		// Will the popover overflow the area
		if (popover.$.offsetLeft + popover.$.offsetWidth > contentElement.$.offsetWidth) {
			popover.removeStyle("left");
			popover.setStyle("right", "5px");
		}
		if (popover.$.offsetTop + popover.$.offsetHeight > contentElement.$.offsetHeight) {
			popover.setStyle("top", (link.$.offsetTop - editor.editable().$.scrollTop - popover.$.offsetHeight - 5) + "px");
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
			hidePopover(editor); // removeSuggestionList
			return;
		}

		var link = CKEDITOR.plugins.link.getSelectedLink(editor);
		if (event.data.getKey() === mentioningSymbol) {
			// if (!link.hasClass(POPOVER_ACTIVE_CLASS)) {
			// 	hidePopover(editor);
			// }

			// if (!editor.popover) {
				// we found a link to work with. show a popover
				// if !containsChild popover
				// editor.popover = newPopover(link);
				// var changeLink = editor.popover.findOne(".cke-link-popover-changelink")
				// changeLink.on("click", function(event) {
				// 	editor.fire("doubleclick", {element: link}, editor);
				// });
				// var removeLink = editor.popover.findOne(".cke-link-popover-removelink")
				// removeLink.on("click", function(event) {
				// 	link.remove();
				// 	hidePopover(editor);
				// 	event.data.preventDefault();
				// 	editor.fire( 'change' );
				// 	return false;
				// });

				if (!editor.suggestionContainer) {
					var suggestionContainer = CKEDITOR.dom.element.createFromHtml('<div class="suggestion-container" contenteditable="false"><div class="suggestion-container-arrow"></div><div class="suggestion-header" contenteditable="false">SUGGESTED USERS</div></div>');
					suggestionContainer.setStyle("padding", "10px");
					suggestionContainer.setStyle("background-color", "white");
					suggestionContainer.setStyle("border-radius", "4px");
					suggestionContainer.setStyle("position", "absolute");
					suggestionContainer.setStyle("width", "160px");
					suggestionContainer.setStyle("overflow-y", "visible");
					suggestionContainer.setStyle("border", "1px solid #A9A9A9");
					suggestionContainer.setStyle("box-shadow", "0px 2px 4px #A9A9A9");

					editor.suggestionContainer = suggestionContainer;
					var dummyElement = editor.document.createElement( 'img',
            {
               attributes :
               {
                  src : 'null',
                  width : 0,
                  height : 0
               }
            });

            editor.insertElement( dummyElement );

            var x = 0;
            var y  = 0;

            var obj = dummyElement.$;

            while (obj.offsetParent){
               x += obj.offsetLeft;
               y  += obj.offsetTop;
               obj    = obj.offsetParent;
            }
            x += obj.offsetLeft;
            y  += obj.offsetTop;

            dummyElement.remove();

					getContentElement(editor).append(suggestionContainer);

					suggestionContainer.removeStyle("right");

					suggestionContainer.setStyle("left", x + "px");
					suggestionContainer.setStyle("top", (y + 5) + "px");
					// editor.mentioningElement.append(suggestionContainer);
				}
				if (!editor.suggestionList) {

					var suggestionList = editor.document.createElement('div', {
							attributes: {
								'class': "suggestion-list"
							}
					});

					editor.suggestionList = suggestionList;
					editor.suggestionContainer.append(suggestionList);
    		}
				// var suggestionData = [ { name: 'Julio', uuid: '12345'}, { name: 'Not Julio', uuid: '12456'}, { name: 'Tino', uuid: '64464564'}, { name: 'Lianne', uuid: '4684684'}];
				// var suggestionData2 = [ { name: 'Robert', uuid: '123464'}, { name: 'Amanda', uuid: '12456'}, { name: 'Rodrigo', uuid: '11111'}, { name: 'Gabriela', uuid: '469498'}];
				// if (editor.suggestionList && editor.activeSuggestions !== suggestionData) {
				// 	editor.activeSuggestions = suggestionData;
				// 	var suggestions = suggestionData.map(function(suggestion, index) {
				// 		var selectedClass = index === 0 ? 'selected' : '';
				// 		return '<div class="' + selectedClass + '" data-mention="' + suggestion.uuid + '"data-id="suggestion"' + ' contenteditable="false">' + suggestion.name + '</div>';
				// 	});

				// 	editor.suggestionList.setHtml(suggestions.join(''));
				// } else if (editor.suggestionList) {
				// 	editor.activeSuggestions = suggestionData2;
				// 	var suggestions = suggestionData2.map(function(suggestion, index) {
				// 		var selectedClass = index === 0 ? 'selected' : '';
				// 		return '<div class="' + selectedClass + '" data-mention="' + suggestion.uuid + '"data-id="suggestion"' + ' contenteditable="false">' + suggestion.name + '</div>';
				// 	});

				// 	editor.suggestionList.setHtml(suggestions.join(''));
				// }


				// getContentElement(editor).append(editor.popover);
			// }

			// repositionPopover(editor, link);
		} else {
			// hidePopover(editor);
		}
		var suggestionData = [ { name: 'Julio', uuid: '12345'}, { name: 'Not Julio', uuid: '12456'}, { name: 'Tino', uuid: '64464564'}, { name: 'Lianne', uuid: '4684684'}];
		var suggestionData2 = [ { name: 'Robert', uuid: '123464'}, { name: 'Amanda', uuid: '12456'}, { name: 'Rodrigo', uuid: '11111'}, { name: 'Gabriela', uuid: '469498'}];
		setTimeout(function() {
			if (editor.suggestionList && (editor.activeSuggestions && editor.activeSuggestions[0].name !== suggestionData[0].name)) {
			editor.activeSuggestions = suggestionData;
			var suggestions = suggestionData.map(function(suggestion, index) {
				var selectedClass = index === 0 ? 'selected' : '';
				return '<div class="' + selectedClass + '" data-mention="' + suggestion.uuid + '"data-id="suggestion"' + ' contenteditable="false">' + suggestion.name + '</div>';
			});

			editor.suggestionList.setHtml(suggestions.join(''));
		} else if (editor.suggestionList) {
			editor.activeSuggestions = suggestionData2;
			var suggestions = suggestionData2.map(function(suggestion, index) {
				var selectedClass = index === 0 ? 'selected' : '';
				return '<div class="' + selectedClass + '" data-mention="' + suggestion.uuid + '"data-id="suggestion"' + ' contenteditable="false">' + suggestion.name + '</div>';
			});
				editor.suggestionList.setHtml(suggestions.join(''));
			}
		}, 1000);

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
			editor.on('blur', function(event) {
				cleanupBlur(event.editor);
			});
			editor.on('change', function(event) {
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
