RichText.FormattedText = SC.Object.extend({

  value: '',

  cleanedText: function(){
    return RichText.HtmlSanitizer.formatHTMLOutput(this.get('value'));
  }.property('value').cacheable(),

  toString: function(){
    return this.get('cleanedText');
  },

  toJSON: function(){
    return this.get('cleanedText');
  }

});

SC.RecordAttribute.registerTransform(RichText.FormattedText, {
  to: function(str, attr) {
    if (SC.none(str) || SC.instanceOf(str, RichText.FormattedText)) return str;
    else return RichText.FormattedText.create({ value: str });
  },

  /* While we could call toString() here, this leads to unnecessary conversion. Only call it when you really need it. */
  from: function(ft, attr) {
    return ft;
  }
});