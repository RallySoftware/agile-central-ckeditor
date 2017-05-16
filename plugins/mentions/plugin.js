(function () {

  function insertMention(event) {
    event.cancel();
    if (event.data.uuid) {
      var editorInstance = event.editor;
      var mentionedSpan = editorInstance.document.createElement('span', {
        attributes: {
          'class': 'mention',
          contenteditable: false,
          'data-mention': event.data.uuid
        }
      });
      mentionedSpan.setText('@' + event.data.name);

      editorInstance.insertElement(mentionedSpan);
      editorInstance.insertText(' ');
    }
  }

  CKEDITOR.plugins.add('mentions', {
    init: function (editor) {
      editor.addContentsCss(CKEDITOR.plugins.getPath('mentions') + 'mentions.css');
      editor.addCommand('insertMentions', {
        exec: function (editor) {
          editor.fire('mentionSearch', editor);
        }
      });
      editor.on('insertMention', insertMention);
      editor.ui.addButton('Mentions', {
        label: 'Insert mentions',
        command: 'insertMentions',
        toolbar: 'insert'
      });
    }
  });
})();
