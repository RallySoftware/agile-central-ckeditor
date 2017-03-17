(function() {

  var enterKey = 13;
  var escapeKey = 27;
  var upKey = 38;
  var downKey = 40
  var backSpaceKey = 8;
  var mentioningSymbol = CKEDITOR.SHIFT + 50; // @

  function cleanupBlur(editorInstance) {
    if (!editorInstance.isMentioning) {
      return;
    }

    if(editorInstance.document.findOne('.suggestion-list')) {
      editorInstance.document.findOne('.suggestion-list').remove();
    }
    if(editorInstance.document.findOne('.suggestion-header')) {
      editorInstance.document.findOne('.suggestion-header').remove();
    }
    if(editorInstance.document.findOne('.suggestion-container')) {
      editorInstance.document.findOne('.suggestion-container').remove();
    }
    if(editorInstance.document.findOne('.is-mentioning')) {
      editorInstance.document.findOne('.is-mentioning').remove(true);
    }
    cleanup(editorInstance);
  }

  function cleanup(editorInstance) {
    if (!editorInstance.isMentioning) {
      return;
    }
    if(editorInstance.suggestionList) {
      delete editorInstance.suggestionList;
    }
    if(editorInstance.suggestionHeader) {
      delete editorInstance.suggestionHeader;
    }
    if(editorInstance.suggestionContainer) {
      editorInstance.suggestionContainer.remove();
      delete editorInstance.suggestionContainer;
    }
    if(editorInstance.mentioningElement) {
      if(!editorInstance.mentioningElement.hasAttribute('data-mention')){
        editorInstance.mentioningElement.remove(true);
      }
      delete editorInstance.mentioningElement;
    }
    editorInstance.isMentioning = false;
    editorInstance.activeSuggestions = null;
    editorInstance.fire('mentionSearch', null);
    editorInstance.fire('change');
  }

  function keyboardInteraction(editorInstance, event) {
    var keyCode = event.data.keyCode;
    if (editorInstance.isMentioning && keyCode === escapeKey) {
      cleanup(editorInstance);
    }

    if (editorInstance.isMentioning && editorInstance.suggestionList) {
      if (keyCode === enterKey) {
        var selected = editorInstance.suggestionList.$.querySelector('.selected');
        var uuid = selected.getAttribute('data-mention');
        var name = selected.textContent;
        insertMention(event, uuid, name);
      } else if (keyCode === upKey) {
        moveSelectTo(event, 'previousSibling');
      } else if (keyCode === downKey) {
        moveSelectTo(event, 'nextSibling');
      }
    }

    if (editorInstance.isMentioning) {
      var cursorNode = editorInstance.getSelection().getStartElement();
      var parentNode = cursorNode.getParent();
      if (cursorNode.$.className !== 'is-mentioning' && parentNode.$.className !== 'is-mentioning') {
        cleanup(editorInstance);
      }
    }
  }

  function moveSelectTo(event, whichSibling) {
    event.cancel();
    var editorInstance = event.editor;
    var selected = editorInstance.suggestionList.$.querySelector('.selected');
    var nextSelected = selected[whichSibling];
    if (editorInstance.suggestionList && selected && nextSelected) {
      selected.className = '';
      nextSelected.className = 'selected';
      editorInstance.suggestionList.$.scrollTop = nextSelected.offsetTop;
    }
  }

  function startMentioningKeyEvent(editorInstance, event) {
    if (!editorInstance.isMentioning && event.data.keyCode === mentioningSymbol && validPrevChar(editorInstance)) {
      event.cancel();
      var mentioningElement = editorInstance.mentioningElement = editorInstance.document.createElement('div', {
        attributes: {
          'class': 'is-mentioning'
        }
      });
      mentioningElement.setText('@');
      editorInstance.insertElement(mentioningElement);

      var range = editorInstance.createRange();
      range.moveToElementEditablePosition(mentioningElement, true);
      editorInstance.getSelection().selectRanges([range]);
      editorInstance.isMentioning = true;
    }
  }

  function suggestionsReceived(event, editor) {
    if (event.data.activeSearch !== editor.activeSearch) {
      return;
    }

    var suggestionData = event.data && event.data.suggestions;
    if (!suggestionData || suggestionData.isEmpty()) {
      cleanup(editor);
      return;
    }

    if (!editor.suggestionContainer) {
      var suggestionContainer = CKEDITOR.dom.element.createFromHtml('<div class="suggestion-container" contenteditable="false"><div class="suggestion-container-arrow"></div><div class="suggestion-header" contenteditable="false">SUGGESTED USERS</div></div>');
      editor.suggestionContainer = suggestionContainer;
      editor.mentioningElement.append(suggestionContainer);
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

    if (editor.suggestionList && editor.activeSuggestions !== suggestionData) {
      editor.activeSuggestions = suggestionData;
      var suggestions = suggestionData.map(function(suggestion, index) {
        var selectedClass = index === 0 ? 'selected' : '';
        return '<div class="' + selectedClass + '" data-mention="' + suggestion.get('uuid') + '"data-id="suggestion"' + ' contenteditable="false">' + suggestion.get('name') + '</div>';
      });

      editor.suggestionList.setHtml(suggestions.join(''));
    }
  }

  function getActiveSearch(editor) {
    var content = editor.getData();
    var isMentioningRegex = '<div class="is-mentioning">@([\\s\\S]*?)(</div>|<div class="suggestion-container" contenteditable="false">)';
    var match = content.match(isMentioningRegex);

    if (!match) {
      return null;
    }

    var mentionText = match[1].trim(); // remove a trailing newline
    return CKEDITOR.tools.htmlDecode(mentionText);
  }

  function insertMention(event, uuid, name) {
    event.cancel();
    if (uuid) {
      var editorInstance = event.editor;
      var mentionedSpan = editorInstance.document.createElement('span', {
        attributes: {
          'class': 'mention',
          contenteditable: false,
          'data-mention': uuid
        }
      });
      mentionedSpan.setText('@' + name);

      var range = editorInstance.createRange();
      range.moveToPosition(editorInstance.mentioningElement, CKEDITOR.POSITION_BEFORE_START);
      editorInstance.getSelection().selectRanges([range]);

      editorInstance.insertElement(mentionedSpan);
      editorInstance.insertText(' ');
      editorInstance.mentioningElement.remove();
      cleanup(editorInstance);
    }
  }

  function validPrevChar(editorInstance) {
    var range = editorInstance.getSelection().getRanges()[0];
    var startNode = range.startContainer;
    if( startNode.type === CKEDITOR.NODE_TEXT ) {

      return range.startOffset ? startNode.getText()[ range.startOffset - 1 ] === ' ' ||
                                 startNode.getText()[ range.startOffset - 1 ] === '\xa0'
                               : true;
    } else {
      range.collapse(true);
      range.setStartAt(editorInstance.editable(), CKEDITOR.POSITION_AFTER_START);
      var walker = new CKEDITOR.dom.walker(range);
      var previousNode = walker.previous();
      return !previousNode ? true : previousNode.$.nodeName === 'BR' || range.startOffset === 0;
    }
  }

  CKEDITOR.plugins.add('mentions', {
    init: function(editor) {
      editor.addContentsCss(CKEDITOR.plugins.getPath('mentions') + 'mentions.css');

      editor.on('key', function(event) {
        var editorInstance = event.editor;
        startMentioningKeyEvent(editorInstance, event);
        keyboardInteraction(editorInstance, event);
      });

      editor.on('blur', function(event) {
        cleanupBlur(event.editor);
      });

      editor.on('contentDom', function(event) {
        var editable = editor.editable();
        editable.attachListener(editable, 'click', function(e) {
          var target = e.data.$.target;
          if (target.dataset.id === 'suggestion') {
            var uuid = target.dataset.mention;
            var name = target.innerText;
            insertMention(event, uuid, name);
          } else if (target.className === 'mention' || target.className === 'is-mentioning') {
            return;
          } else {
            cleanupBlur(event.editor);
          }
        });
      });

      editor.on('change', function(e) {
        var editorInstance = e.editor;

        if (editorInstance.isMentioning && !editorInstance.document.findOne('div.is-mentioning')) {
          cleanup(editorInstance);
        } else if (editorInstance.isMentioning) {
          editorInstance.activeSearch = getActiveSearch(editorInstance);

          editorInstance.fire('mentionSearch', editorInstance.activeSearch);
          if (editorInstance.activeSearch == null) {
            cleanup(editorInstance);
          }
        }
      });

      editor.on('mentionsSuggestions', function(e) {
        var editorInstance = e.editor;
        if (editorInstance.isMentioning) {
          suggestionsReceived(e, editorInstance);
        }
      });
    }
  });
})();
