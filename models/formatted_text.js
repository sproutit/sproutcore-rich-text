RichText.FormattedText = SC.Object.extend({

  value: '',

  cleanedText: function(){
    return RichText.HtmlSanitizer.formatHTMLOutput(this.get('value'))
  }.property('value').cacheable(),

  toString: function(){
    return this.get('cleanedText');
  }.property('cleanedText')

});