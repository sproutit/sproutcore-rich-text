SC.TextFieldView = SC.TextFieldView.extend({
  didLoseKeyResponderTo: function(keyView) {
    // Don't blur if we're now in an RTE
    if (!SC.RootResponder.responder.get('richTextEditorHasFocus')) this.$input()[0].blur() ;
  }
});