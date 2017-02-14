(function() {

  /*
  TODO:
  - position list relative to @
  - handle periodic race condition with debounce/tune debounce
  */

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
    editorInstance.fire('mentionComplete');
  }

  CKEDITOR.plugins.add('mentions', {
    init: function(editor) {

      editor.on('contentDom', function(event) {
        event.editor.document.appendStyleSheet(CKEDITOR.plugins.getPath('mentions') + 'mentions.css');
      });

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
              editorInstance.fire('mentionComplete');
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

      editor.on('change', function(event) {
        var editorInstance = event.editor;
        if (editorInstance.isMentioning) {
          var text = editorInstance.mentionSpan.getText().replace(/[\u200B]/g, '').replace(/^[@]/, '');

          editorInstance.fire('mention', {
            search: text
          });
        }
      });

      editor.on('updateMentions', function(event) {
        var editorInstance = event.editor;
        if (editorInstance.isMentioning) {
          if (!editorInstance.mentionList) {
            var mentionSpan = editorInstance.mentionSpan;
            editorInstance.mentionList = editorInstance.document.createElement('div', {
              attributes: {
                Class: 'mention-list'
              },
              //TODO: something in ckeditor config is stripping these styles.
              //the values are correct however
              styles: {
                top: mentionSpan.$.offsetTop + mentionSpan.$.offsetHeight,
                left: mentionSpan.$.offsetLeft
              }
            });
            editorInstance.document.getBody().append(editorInstance.mentionList);
            editorInstance.mentionSpan.removeAttribute('data-uuid');
          }

          var suggestions = event.data.mentions.map(function(mention, index) {
            var selectedClass = index === 0 ? 'selected' : '';
            return '<div class="' + selectedClass + '" data-uuid="' + mention.uuid + '">' + mention.name + '</div>';
          });
          if (!suggestions.length) {
            suggestions.push('<div class="selected">No users found.</div>');
          }
          editorInstance.mentionList.setHtml(suggestions.join(''));
        }
      });

      editor.on('blur', function(event) {
        cleanup(event.editor);
      });

      editor.on('selectionChange', function(event) {
        var editorInstance = event.editor,
          selection = event.data.selection,
          selectedElement = selection && selection.getStartElement();

        if (!editorInstance.isMentioning && selectedElement && selectedElement.hasClass('mention')) {
          editorInstance.mentionSpan = selectedElement;
          editorInstance.isMentioning = true;
        } else if (editorInstance.isMentioning && (!selectedElement || !selectedElement.hasClass('mention'))) {
          cleanup(editorInstance);
        }
      });
    }
  });
})();
