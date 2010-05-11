SC.TextFieldView = SC.TextFieldView.extend({
  didLoseKeyResponderTo: function(keyView) {
    // Don't blur if we're now in an iFrames
    if (!SC.RootResponder.responder.get('iframeHasFocus')) this.$input()[0].blur() ;
  }
});