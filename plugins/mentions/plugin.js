(function() {

  var enterKey = 13;
  var escapeKey = 27;
  var upKey = 38;
  var downKey = 40
  var backSpaceKey = 8;
  var mentioningSymbol = CKEDITOR.SHIFT + 50; // @



  function cleanupBlur(editorInstance) {
    if(editorInstance.document.findOne('.mention-list')) {
      editorInstance.document.findOne('.mention-list').remove();
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
      editorInstance.suggestionList.remove();
      delete editorInstance.suggestionList;
    }
    if(editorInstance.mentionSpan) {
      if(!editorInstance.mentionSpan.hasAttribute('data-uuid')){
        editorInstance.mentionSpan.remove(true);
      }
      delete editorInstance.mentionSpan;
    }
    editorInstance.isMentioning = false;
    editorInstance.fire('change');
  }

  function formatName(name) {
    return name.replace(/[<>&\n]/g, function(x) {
      return {
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '\n': '<br />'
      }[x];
    });
  }

  function suggestionsReceived(event, editor) {

    if (!editor.suggestionList) {
      var suggestionList = editor.document.createElement('div', {
          attributes: {
            Class: "mention-list"
          }
        });

      editor.suggestionList = suggestionList;
      editor.mentionSpan.append(suggestionList);
    }

    var suggestions = event.data.map(function(mention, index) {
      var selectedClass = index === 0 ? 'selected' : '';
      return '<div class="' + selectedClass + '" data-uuid="' + formatName(mention.get('uuid')) + '"data-id="mention-item"' + '>' + formatName(mention.get('name')) + '</div>';
    });

    if(suggestions.isEmpty()) {
      return;
    }
    if (editor.suggestionList) {
      editor.suggestionList.setHtml(suggestions.join(''));
    }
  }

  function startMentioningKeyEvent(editorInstance, event) {
    if (!editorInstance.isMentioning && event.data.keyCode === mentioningSymbol) {
      event.cancel();
      var mentionSpan = editorInstance.mentionSpan = editorInstance.document.createElement('span', {
        attributes: {
          Class: 'is-mentioning'
        }
      });
      editorInstance.insertElement(mentionSpan);

      var range = editorInstance.createRange();
      range.moveToElementEditablePosition(mentionSpan, true);
      editorInstance.getSelection().selectRanges([range]);

      editorInstance.insertText('@');



      editorInstance.isMentioning = true;
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

  function selectMention(event, uuid, name) {
    event.cancel();
    if (uuid) {
      var editorInstance = event.editor;
      editorInstance.mentionSpan.setAttribute('data-uuid', uuid);
      editorInstance.mentionSpan.setText('@' + name);
      editorInstance.mentionSpan.setAttribute('contenteditable', false);
      editorInstance.mentionSpan.addClass('mention');
      editorInstance.mentionSpan.removeClass('is-mentioning');

      var range = editorInstance.createRange();
      range.moveToPosition(editorInstance.mentionSpan, CKEDITOR.POSITION_AFTER_END);
      editorInstance.getSelection().selectRanges([range]);
      editorInstance.insertText(' ');

      cleanup(editorInstance);
    }
  }

  function keyboardInteraction(editorInstance, event) {
    if (editorInstance.isMentioning) {
      var keyCode = event.data.keyCode;

      if (keyCode === enterKey) {
        var selected = editorInstance.suggestionList.$.querySelector('.selected');
        var uuid = selected.getAttribute('data-uuid');
        var name = selected.textContent;
        selectMention(event, uuid, name);
      } else if (keyCode === escapeKey) {
        cleanup(editorInstance);
      } else if (keyCode === upKey) {
        moveSelectTo(event, 'previousSibling');
      } else if (keyCode === downKey) {
        moveSelectTo(event, 'nextSibling');
      } else if (keyCode === backSpaceKey) {
        var range = editorInstance.getSelection().getRanges()[0];
        var text = range.endContainer.getText();
        if(text.length === 1 || text.indexOf("@") ===  -1){
          cleanup(editorInstance);
        }
      }
    }
  }

  CKEDITOR.plugins.add('mentions', {
    init: function(editor) {
      editor.on('key', function(event) {
        var editorInstance = event.editor;
        startMentioningKeyEvent(editorInstance, event);
        keyboardInteraction(editorInstance, event);
      });

      editor.on('mentionsSuggestions', function (event) {
        suggestionsReceived(event, editor);
      });

      editor.on('blur', function(event) {
        cleanupBlur(event.editor);
      });

      editor.on('contentDom', function(event) {

        event.editor.document.appendStyleSheet(CKEDITOR.plugins.getPath('mentions') + 'mentions.css');
        var editable = editor.editable();
        editable.attachListener( editable, 'click', function(e) {
          var editorInstance = event.editor;
          var target = e.data.$.target;
          if (target.dataset.id === 'mention-item') {
            var uuid = target.dataset.uuid;
            var name = target.innerText;
            selectMention(event, uuid, name);
          } else if (target.className === 'mention') {
            return;
          } else {
            cleanup(event.editor);
          }
        });
      });
    }
  });

})();
