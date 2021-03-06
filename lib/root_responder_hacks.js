SC.RootResponder = SC.RootResponder.extend({

  /* Just a note that this is included */
  hasRichTextExtensions: YES,

  /* Track whether an RTE has focus */
  richTextEditorHasFocus: NO,

  /* Track whether body has focus */
  bodyHasFocus: NO,

  focus: function() {
    if (!this.get('bodyHasFocus')) this.set('bodyHasFocus', YES);
    return sc_super();
  },

  blur: function(evt, runNow) {
    if (this.get('bodyHasFocus')) this.set('bodyHasFocus', NO);

    // Ignore blurs if we're in an RTE
    if (!this.get('richTextEditorHasFocus')) {
      if (runNow) {
        sc_super();
      } else {
        // Wait for RTE to have a chance to blur
        this.invokeLater('blur', 1, evt, YES);
      }
    }
    return YES;
  }

});