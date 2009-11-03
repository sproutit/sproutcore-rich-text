SC.InlineTextFieldView = SC.InlineTextFieldView.extend({

  willRemoveFromParent: function() {
    // Don't blur if we're now in an RTE
    if (!SC.RootResponder.responder.get('richTextEditorHasFocus')) this.$input()[0].blur();
  },

  willLoseFirstResponder: function(responder) {
    if (responder !== this) return;

    // if we're about to lose first responder for any reason other than
    // ending editing, make sure we clear the previous first responder so 
    // isn't cached
    this._previousFirstResponder = null;
    
    // should have been covered by willRemoveFromParent, but this was needed 
    // too.
    // Don't blur if we're now in an RTE
    if (!SC.RootResponder.responder.get('richTextEditorHasFocus')) this.$input()[0].blur();
    return this.blurEditor() ;
  }

});