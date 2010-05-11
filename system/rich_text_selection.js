RichText.RichTextSelection = SC.Object.extend({

  editor: null,

  text: function(){
    return this.getPath('editor.selectionText');
  }.property(),

  element: function(){
    return this.getPath('editor.selectionElement');
  }.property(),

  concatenatedProperties: ['updateProperties'],

  updateProperties: ('isBold isUnderlined isItalicized isStrikethrough ' + 
                      'isLeftAligned isJustified isCentered isRightAligned ' +
                      'color backgroundColor fontSize ' +
                      'isSubscript isSubscript isOrderedList isUnorderedList').w(),

  // PROPERTIES

  length: function() {
    var text = this.get('text');
    return text ? text.length : 0;
  }.property('text').cacheable(),

  color: function(key, val) {
    var editor = this.get('editor');
    if (!editor || !editor.get('editorIsReady')) return null;

    if (val !== undefined) {
      this.propertyWillChange('color');
      var x = editor.execCommand('forecolor', false, val);
      this.propertyDidChange('color');

      if(x) editor.changedSelection();
    }

    return RichText.HtmlSanitizer.standardizeColor(this.getStyle('color'));

  }.property().cacheable(),

  backgroundColor: function(key, val) {
    var editor = this.get('editor');
    if (!editor || !editor.get('editorIsReady')) return null;

    var bgCommand = SC.browser.mozilla ? 'hilitecolor' : 'backcolor';

    if (val !== undefined) {
      this.propertyWillChange('backgroundColor');
      var x = editor.execCommand(bgCommand, false, val);
      this.propertyDidChange('backgroundColor');

      if(x) editor.changedSelection();
    }

    return RichText.HtmlSanitizer.standardizeColor(this.getStyle('background-color'));

  }.property().cacheable(),

  fontSize: function(key, val) {
    var editor = this.get('editor');
    if (!editor || !editor.get('editorIsReady')) return null;

    if (val !== undefined) {
      this.propertyWillChange('fontSize');
      var x = editor.execCommand('fontsize', false, val);
      this.propertyDidChange('fontSize');

      if(x) editor.changedSelection();
    }

    var fontSize = this.getStyle('font-size');
    return fontSize && RichText.HtmlSanitizer.standardizeFontSize(fontSize);

  }.property().cacheable(),

  isBold: function(key, val) {
    return this._basicSelectionModifier('isBold', 'bold', val);
  }.property().cacheable(),

  isUnderlined: function(key, val) {
    return this._basicSelectionModifier('isUnderlined', 'underline', val);
  }.property().cacheable(),

  isItalicized: function(key, val) {
    return this._basicSelectionModifier('isItalicized', 'italic', val);
  }.property().cacheable(),

  isStrikethrough: function(key, val) {
    return this._basicSelectionModifier('isStrikethrough', 'strikethrough', val);
  }.property().cacheable(),

  isLeftAligned: function(key, val) {
    var ret = this._basicSelectionModifier('isLeftAligned', 'justifyleft', val);
    return SC.browser.safari ? (this.getStyle('text-align') == 'left') : ret;
  }.property().cacheable(),

  isJustified: function(key, val) {
    var ret = this._basicSelectionModifier('isJustified', 'justifyfull', val);
    return SC.browser.safari ? (this.getStyle('text-align') == 'justify') : ret;
  }.property().cacheable(),

  isCentered: function(key, val) {
    var ret = this._basicSelectionModifier('isCentered', 'justifycenter', val);
    return SC.browser.safari ? (this.getStyle('text-align') == 'center') : ret;
  }.property().cacheable(),

  isRightAligned: function(key, val) {
    var ret = this._basicSelectionModifier('isRightAligned', 'justifyright', val);
    return SC.browser.safari ? (this.getStyle('text-align') == 'right') : ret;
  }.property().cacheable(),

  isDefaultColor: function(key, val) {
    var color, backgroundColor;

    if (val === YES) {
      this.set('color', 'inherit');
      this.set('backgroundColor', 'transparent');
    }

    color = this.get('color');
    backgroundColor = this.get('backgroundColor');

    return (RichText.blank(color) || color === this.getPath('editor.defaultColor'))
            && (RichText.blank(backgroundColor) || backgroundColor === this.getPath('editor.defaultBackgroundColor'));

  }.property('color', 'backgroundColor').cacheable(),

  isHighlighted: function(key, val) {
    var color;

    if (val !== undefined) {
      val = (val) ? '#ffff00' : null; // yellow
      this.set('color', val);
    }

    color = this.get('color');

    return !RichText.blank(color) && color !== this.getPath('editor.defaultColor');

  }.property('color').cacheable(),

  isBackgroundHighlighted: function(key, val) {
    var backgroundColor;

    if (val !== undefined) {
      val = (val) ? '#ffff00' : null; // yellow
      this.set('backgroundColor', val);
    }

    backgroundColor = this.get('backgroundColor');

    return !RichText.blank(backgroundColor)
            && backgroundColor !== this.getPath('editor.defaultBackgroundColor');

  }.property('backgroundColor').cacheable(),

  isDefaultSize: function(key, val) {
    var fontSize, defaultFontSize = this.getPath('editor.defaultFontSize');

    if (val === YES) {
      this.set('fontSize', defaultFontSize);
    }

    fontSize = this.get('fontSize');

    return RichText.blank(fontSize) || fontSize === defaultFontSize;

  }.property('fontSize').cacheable(),

  isSizeIncreased: function() {
    var fontSize = this.get('fontSize');
    return !RichText.blank(fontSize) && fontSize > this.getPath('editor.defaultFontSize');
  }.property('fontSize').cacheable(),

  isSizeDecreased: function() {
    var fontSize = this.get('fontSize');
    return !RichText.blank(fontSize) && fontSize < this.getPath('editor.defaultFontSize');
  }.property('fontSize').cacheable(),

  isSuperscript: function(key, val) {
    return this._basicSelectionModifier('isSuperscript', 'superscript', val);
  }.property().cacheable(),

  isSubscript: function(key, val) {
    return this._basicSelectionModifier('isSubscript', 'subscript', val);
  }.property().cacheable(),

  isOrderedList: function(key, val) {
    return this._basicSelectionModifier('isOrderedList', 'insertorderedlist', val);
  }.property().cacheable(),

  isUnorderedList: function(key, val) {
    return this._basicSelectionModifier('isUnorderedList', 'insertunorderedlist', val);
  }.property().cacheable(),

  // COMMANDS

  increaseSize: function() {
    var fontSize = this.get('fontSize');
    this.set('fontSize', fontSize + 1);
  },

  decreaseSize: function() {
    var fontSize = this.get('fontSize');
    this.set('fontSize', fontSize - 1);
  },

  indent: function() {
    var editor = this.get('editor');
    if (!editor) return;

    editor.execCommand('indent', false, YES);
    editor.changedSelection();
  },

  outdent: function() {
    var editor = this.get('editor');
    if (!editor) return;

    editor.execCommand('outdent', false, YES);
    editor.changedSelection();
  },

  removeFormatting: function() {
    var editor = this.get('editor');
    if (!editor) return;

    editor.execCommand('removeformat', false, YES);
    editor.changedSelection();
  },

  // ..........................................................
  // INTERNAL SUPPORT
  //

  toString: function() {
    return this.get('text');
  },

  update: function() {
    var properties = this.get('updateProperties');
    var idx;
    for (idx=0; idx < properties.length; idx++) {
      this.notifyPropertyChange(properties[idx]);
    }
  }.observes('*editor.element', '*editor.text'),

  getStyle: function(name, force) {
    var editor = this.get('editor'),
        elem = this.get('element');
    return editor && elem ? editor.getStyle(elem, name, force) : null;
  },

  _basicSelectionModifier: function(property, type, val) {
    var editor = this.get('editor');
    if (!editor || !editor.get('editorIsReady')) return false;

    if (val !== undefined) {
      this.propertyWillChange(property);
      var x = editor.execCommand(type, false, val);
      this.propertyDidChange(property);

      if(x) editor.changedSelection();
    }

    return editor.queryState(type);
  }

}) ;
