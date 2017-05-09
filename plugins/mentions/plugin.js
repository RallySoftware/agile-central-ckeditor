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

    // var range = editorInstance.createRange();
    // range.moveToPosition(editorInstance.mentioningElement, CKEDITOR.POSITION_BEFORE_START);
    // editorInstance.getSelection().selectRanges([range]);

    editorInstance.insertElement(mentionedSpan);
    editorInstance.insertText(' ');
    // editorInstance.mentioningElement.remove();
    // cleanup(editorInstance);
  }
}

  CKEDITOR.plugins.add('mentions', {
    init: function (editor) {
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
