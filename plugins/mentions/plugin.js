(function() {
  function cleanup(editorInstance) {
    if(editorInstance.mentionList) {
      editorInstance.mentionList.remove();
      delete editorInstance.mentionList;
    }
    if(editorInstance.mentionSpan) {
      if(!editorInstance.mentionSpan.hasAttribute('data-uuid')){
        editorInstance.mentionSpan.remove(true);
      }
      delete editorInstance.mentionSpan;
    }

    editorInstance.isMentioning = false;
  }

  CKEDITOR.plugins.add('mentions', {
    init: function(editor) {

      editor.on('contentDom', function(event) {
        event.editor.document.appendStyleSheet(CKEDITOR.plugins.getPath('mentions') + 'mentions.css');
      });

      var users = [
        { name: 'T-roy' },
        { name: '"T124"' },
        { name: '<ref>' },
        { name: 'this1isjustaverylongnametotesthowitcanfitthesuggestionsdropdownhadanyoneusedacrazylongnamelikethisthoughunlikely' },
        { name: 'namewitha space' }
      ];

      editor.on('key', function(event) {
        var editorInstance = event.editor;
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
            return '<div class="' + selectedClass + '" data-uuid="' + 'example' + '">' + mention.name.replace(/[<>&\n]/g, function(x) {
    return {
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
       '\n': '<br />'
    }[x];
}) + '</div>';
          });

          editorInstance.mentionList.setHtml(suggestions.join(''));
        }

        if (editorInstance.isMentioning) {
          if (event.data.keyCode === 13) { //enter
            event.cancel();

            var selected = editorInstance.mentionList.$.querySelector('.selected');
            var uuid = selected.getAttribute('data-uuid');
            var name = selected.textContent;

            if (uuid) {
              editorInstance.mentionSpan.setAttribute('data-uuid', uuid);
              editorInstance.mentionSpan.setText('@' + name);

              editorInstance.mentionList.remove();

              var range = editorInstance.createRange();
              range.moveToPosition(editorInstance.mentionSpan, CKEDITOR.POSITION_AFTER_END);
              editorInstance.getSelection().selectRanges([range]);
              editorInstance.insertText(' ');

              delete editorInstance.mentionSpan;
              delete editorInstance.mentionList;
              editorInstance.isMentioning = false;
            }
          } else if (event.data.keyCode === 27) { // ESC
            cleanup(editorInstance);
          } else if (event.data.keyCode === 38) { // Up
            if (editorInstance.mentionList) {
              event.cancel();
              var selected = editorInstance.mentionList.$.querySelector('.selected');
              if (selected && selected.previousSibling) {
                selected.className = '';
                selected.previousSibling.className = 'selected';
                editorInstance.mentionList.$.scrollTop = selected.previousSibling.offsetTop;
              }
            }
          } else if (event.data.keyCode === 40) { // Down
            if (editorInstance.mentionList) {
              event.cancel();
              var selected = editorInstance.mentionList.$.querySelector('.selected');
              if (selected && selected.nextSibling) {
                selected.className = '';
                selected.nextSibling.className = 'selected';
                editorInstance.mentionList.$.scrollTop = selected.offsetTop;
              }
            }
          }
        }
      });

      editor.on('blur', function(event) {
        cleanup(event.editor);
      });

    }
  });
})();
