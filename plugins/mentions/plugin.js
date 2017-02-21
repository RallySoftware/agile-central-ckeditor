(function() {

  var users = [
    { name: 'T-roy' },
    { name: '"T124"' },
    { name: '<ref>' },
      { name: 'this1isjustaverylongnametotesthowitcanfitthesuggestionsdropdownhadanyoneusedacrazylongnamelikethisthoughunlikely' },
      { name: 'namewitha space' }
    ];

  function cleanup(editorInstance) {
    if (!editorInstance.isMentioning) {
      return;
    }

    if(editorInstance.mentionList) {
      editorInstance.mentionList.remove();
      delete editorInstance.mentionList;
    }
    if(editorInstance.mentionSpan) {
      if(!editorInstance.mentionSpan.hasAttribute('data-uuid')){
        editorInstance.mentionSpan.remove();
      }
      delete editorInstance.mentionSpan;
    }

    editorInstance.isMentioning = false;
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

  function startMentioningKeyEvent(editorInstance, event) {
    if (!editorInstance.isMentioning && event.data.keyCode === CKEDITOR.SHIFT + 50) { // @
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

      if (!editorInstance.mentionList) {
        var mentionSpan = editorInstance.mentionSpan;
        editorInstance.mentionList = CKEDITOR.dom.element.createFromHtml('<div class="mention-list"></div>');
        mentionSpan.append(editorInstance.mentionList);
        editorInstance.mentionSpan.removeAttribute('data-uuid');
      }

      var suggestions = users.map(function(mention, index) {
        var selectedClass = index === 0 ? 'selected' : '';
        return '<div class="' + selectedClass + '" data-uuid="' + 'example' + '"data-id="mention-item"' + '>' + formatName(mention.name) + '</div>';
      });

      editorInstance.mentionList.setHtml(suggestions.join(''));
    }
  }

  function moveSelectTo(event, whichSibling) {
    event.cancel();
    var editorInstance = event.editor;
    var selected = editorInstance.mentionList.$.querySelector('.selected');
    var nextSelected = selected[whichSibling]
    if (editorInstance.mentionList) {
      if (selected && nextSelected) {
        selected.className = '';
        nextSelected.className = 'selected';
        editorInstance.mentionList.$.scrollTop = nextSelected.offsetTop;
      }
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

  function keyboardInterationKeyEvents(editorInstance, event) {
    if (editorInstance.isMentioning) {
      if (event.data.keyCode === 13) { //enter

        var selected = editorInstance.mentionList.$.querySelector('.selected');
        var uuid = selected.getAttribute('data-uuid');
        var name = selected.textContent;

        selectMention(event, uuid, name);
      } else if (event.data.keyCode === 27) { // ESC
        cleanup(editorInstance);
      } else if (event.data.keyCode === 38) { // Up
        moveSelectTo(event, 'previousSibling');
      } else if (event.data.keyCode === 40) { // Down
        moveSelectTo(event, 'nextSibling');
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

        startMentioningKeyEvent(editorInstance, event);
        keyboardInterationKeyEvents(editorInstance, event);
      });

      editor.on('blur', function(event) {
        cleanup(event.editor);
      });

      editor.on('contentDom', function(event) {
        var editable = editor.editable();
          editable.attachListener( editable, 'click', function(e) {
            var target = e.data.$.target
            var editorInstance = event.editor

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