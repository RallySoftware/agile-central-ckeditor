(function() {

  var enterKey = 13;
  var escapeKey = 27;
  var upKey = 38;
  var downKey = 40
  var backSpaceKey = 8;


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
    console.log('Suggestions received', event);
    editor.isMentioning = true;

    var suggestionList = editor.document.createElement('div', {
      attributes: {
        Class: "mention-list"
      }
    });

    var suggestions = event.data.map(function(mention, index) {
      var selectedClass = index === 0 ? 'selected' : '';
      return '<div class="' + selectedClass + '" data-uuid="' + formatName(mention.get('uuid')) + '"data-id="mention-item"' + '>' + formatName(mention.get('name')) + '</div>';
    });

    console.log('suggestions here', suggestions);
    // if(editor.suggestionList) {
    //   console.log('Deleting suggestionList: ', editor.suggestionList);
    //   editor.suggestionList.remove();
    //   delete editor.suggestionList;
    // }

    if(suggestions.isEmpty()) {
      return;
    }

    suggestionList.setHtml(suggestions.join(''));
    editor.suggestionList = suggestionList;
    editor.mentionSpan.append(suggestionList);

    var range = editor.createRange();
    range.moveToElementEditablePosition(suggestionList, true);
    //editor.getSelection().selectRanges([range]);
  }

  function startMentioningKeyEvent(editorInstance, event) {
    if (!editorInstance.isMentioning && event.data.keyCode === CKEDITOR.SHIFT + 50) { // @dmsangwao...[cursor]
      event.cancel();
      var mentionSpan = editorInstance.mentionSpan = editorInstance.document.createElement('span', {
        attributes: {
          Class: 'mention'
        }
      });
      editorInstance.insertElement(mentionSpan);

      var range = editorInstance.createRange();
      range.moveToElementEditablePosition(mentionSpan, true);
      editorInstance.getSelection().selectRanges([range]);

      editorInstance.insertText('@');

      editorInstance.isMentioning = true;

      if (!editorInstance.suggestionList) {
        var mentionSpan = editorInstance.mentionSpan;
        editorInstance.suggestionList = CKEDITOR.dom.element.createFromHtml('<div class="mention-list"></div>');
        mentionSpan.append(editorInstance.suggestionList);
        editorInstance.mentionSpan.removeAttribute('data-uuid');
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

  function selectMention(event, uuid, name) {
    event.cancel();
    if (uuid) {
      var editorInstance = event.editor;
      editorInstance.mentionSpan.setAttribute('data-uuid', uuid);
      editorInstance.mentionSpan.setText('@' + name);

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
        console.log('EditorInstance: ', editorInstance);
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
      editor.on('contentDom', function(event) {
        event.editor.document.appendStyleSheet(CKEDITOR.plugins.getPath('mentions') + 'mentions.css');
      });

      editor.on('key', function(event) {
        var editorInstance = event.editor;
        if(editorInstance.suggestionList) {
          editorInstance.suggestionList.remove();
          delete editorInstance.suggestionList;
        }
        var editorInstance = event.editor;

        startMentioningKeyEvent(editorInstance, event);
        keyboardInteraction(editorInstance, event);
      });

      editor.on('mentionsSuggestions', function (event) {
        console.log('CKEditor mentionSuggestions fired');
        suggestionsReceived(event, editor);
      });

      editor.on('blur', function(event) {
        // cleanup(event.editor);
      });

      editor.on('contentDom', function(event) {
        var editable = editor.editable();
        editable.attachListener( editable, 'click', function(e) {

          var target = e.data.$.target;
          var editorInstance = event.editor;

          if (target.dataset.id === 'mention-item') {
            var uuid = target.dataset.uuid;
            var name = target.innerText;
            console.log(`EditorInstance: `, editorInstance);
            console.log(`e: `, e);
            selectMention(event, uuid, name);
          } else if (target.className === 'mention') {
            return;
          } else {
            // cleanup(event.editor);
          }
        });
      });
    }
  });
})();
