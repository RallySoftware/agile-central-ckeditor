(function () {

  function insertTemplate(event) {
    event.cancel();
    if (event.data) {
      var editorInstance = event.editor;
      editorInstance.insertHtml(event.data);
    }
  }

  CKEDITOR.plugins.add('templates', {
    init: function (editor) {
      editor.addCommand('fireTemplatesButtonClicked', {
        exec: function (editor) {
          editor.fire('templatesButtonClicked', editor);
        }
      });
      editor.on('insertTemplate', insertTemplate);
      editor.ui.addButton('Templates', {
        label: 'Templates',
        command: 'fireTemplatesButtonClicked',
        toolbar: 'insert'
      });
    }
  });
})();
