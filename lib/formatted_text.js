RichText.FormattedText = SC.Object.extend({

  value: '',

  cleanedText: function(){
    return RichText.htmlSanitizer.formatHTMLOutput(this.get('value'));
  }.property('value').cacheable(),

  toString: function(){
    return this.get('cleanedText');
  }.property('cleanedText').cacheable()

});