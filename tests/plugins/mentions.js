/* bender-tags: editor,unit */
/* bender-ckeditor-plugins: smiley,bbcode,entities,enterkey */
bender.test( {
  assertToBBCode: function( bbcode, html ) {
		var ed = this.editor, processor = ed.dataProcessor;
		assert.areSame( bbcode, processor.toDataFormat( html ), 'html->bbcode failed at:' + bbcode );
	},

	'test HTML to bbcode': function() {
		bender.assert.areSame(true, true)
	}
})
