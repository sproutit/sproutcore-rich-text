// ==========================================================================
// Project:   RichText.RichTextEditorView
// Copyright: ©2009 My Company, Inc.
// ==========================================================================
/*globals RichText */

/** @class

  (Document Your View Here)

  @extends SC.View
*/
RichText.EditorView = SC.FieldView.extend(
/** @scope RichText.EditorView.prototype */ {

  iframeRootResponder: null,

  value: null,

  classNames: ['rich-text-editor-view', 'sc-text-field-view', 'text-area'],

  editorIsReady: NO,

  selection: '',
  selectionElement: null,
  cursorPos: null,

  stylesheets: [],
  loadStylesheetsInline: NO,
  
  // TODO: Should stylesheets be a display property?
  displayProperties: 'fieldValue isEditing'.w(),

  // TODO: Add support for disabling
  // TODO: Can hints be made to work?

// CoreQuery Accessors

  $input: function(){
    return this.$('iframe');
  },

  $inputWindow: function(){
    return this.$input().map(function(){ return this.contentWindow; });
  },

  $inputDocument: function(){
    return this.$inputWindow().map(function(){ return this.document; });
  },

  $inputBody: function(){
    return this.$inputDocument().map(function(){ return this.body; });
  },

// Accessors

  setRawFieldValue: function(newValue) {
    if (!this.get('editorIsReady')) return null;

    var inputBody = this.$inputBody();
    inputBody.html(newValue);

    return this;
  },

  setFieldValue: function(newValue) {
    if (!newValue) newValue = ''; // Can't handle null

    newValue = RichText.HtmlSanitizer.formatHTMLInput(newValue);
    this.setRawFieldValue(newValue);

    return this;
  },

  rawFieldValue: function(){
    if (!this.get('editorIsReady')) return null;

    var inputBody = this.$inputBody();
    return inputBody.html();
  },

  getFieldValue: function() {
    var rawFieldValue = this.rawFieldValue() || '';
    return RichText.HtmlSanitizer.formatHTMLOutput(rawFieldValue);
  },

  _field_valueDidChange: function() {
    if(this.getFieldValue() != this.get('fieldValue')) this.setFieldValue(this.get('fieldValue'));
  }.observes('value'),

  render: function(context, firstTime) {
    arguments.callee.base.apply(this,arguments) ;

    var name = SC.guidFor(this);

    // always have at least an empty string
    var v = this.get('fieldValue');
    if (SC.none(v)) v = '';

    // update layer classes always
    context.setClass('not-empty', v.length > 0);

    this._renderField(context, firstTime, v) ;
  },

  _renderField: function(context, firstTime, value) {
    if (firstTime) {
      var name = SC.guidFor(this);

      context.push('<span class="border"></span>');

      // Render the iframe itself, and close off the padding.
      context.push('<iframe name="%@"></iframe></span>'.fmt(name));
    }
  },

  didCreateLayer: function() {
    SC.Event.add(this.$input(), 'load', this, this._field_checkIFrameDidLoad);
  },

  _field_checkIFrameDidLoad: function() {
    var iframe = this.$input().get(0);

    if (iframe.contentWindow && iframe.contentWindow.document) {
      this.iframeDidLoad();
    } else { 
      this.invokeLater('_field_checkIFrameDidLoad', 500);
    }
  },

  iframeDidLoad: function() {
    if (!this.get('editorIsReady')) {
      if (this.get('loadStylesheetsInline')) {
        this._loadStylesheets();
      } else {
        this._setupEditor();
      }
    }
  },

  _loadStylesheets: function(){
    var stylesheets = this.get('stylesheets'), stylesheet_url;
    this._pendingStylesheets = stylesheets.length;

    for(idx=0; idx < stylesheets.length; idx++) {
      stylesheet_url = stylesheets[idx];

      if (RichText.EditorView.loadedStylesheets[stylesheet_url]) {
        // already loaded
        this._stylesheetDidLoad(stylesheet_url);
      } else {
        // Need to load
        RichText.EditorView.loadStylesheet(stylesheet_url, this, '_stylesheetDidLoad');
      }
    }
  },

  _stylesheetDidLoad: function(url){
    this._pendingStylesheets -= 1;
    if (this._pendingStylesheets <= 0) this._setupEditor();
  },

  _writeDocument: function(headers){
    if (!headers) headers = '';
    var inputDocumentInstance = this.$inputDocument().get(0);

    inputDocumentInstance.open("text/html","replace");

    inputDocumentInstance.write("<html><head>%@</head><body></body></html>".fmt(headers));

    if(!SC.browser.msie) {
      // This fails in IE for unknown reasons
      inputDocumentInstance.close();
    }
  },

  _setupEditor: function(){
    // Already setup
    if (this.get('editorIsReady')) return;

    var inputDocument = this.$inputDocument(),
        inputDocumentInstance = inputDocument.get(0),
        focusTarget = (SC.browser.msie) ? this.$input() : inputDocument,
        stylesheets = this.get('stylesheets'),
        stylesheet_url, headers = '', responder, idx;

    // try {
    //   inputDocumentInstance.designMode = 'on';
    // } catch ( e ) {
    //   // Will fail on Gecko if the editor is placed in an hidden container element
    //   // The design mode will be set ones the editor is focused
    //   inputDocument.focus(function() { inputDocumentInstance.designMode(); } );
    // }

    if (this.get('loadStylesheetsInline')) {
      headers += "<style type='text/css'>\n";
      for(idx=0; idx < stylesheets.length; idx++) {
        stylesheet_url = stylesheets[idx];
        headers += "/* BEGIN %@ */\n\n".fmt(stylesheet_url);
        headers += RichText.EditorView.loadedStylesheets[stylesheet_url];
        headers += "/* END %@ */\n\n".fmt(stylesheet_url);
      }
      headers += "</style>\n";
    } else {
      for(idx=0; idx < stylesheets.length; idx++) {
        headers += '<link rel="stylesheet" href="%@" type="text/css" charset="utf-8">\n'.fmt(stylesheets[idx]);
      }
    }

    this._writeDocument(headers);

    if (inputDocumentInstance.body.contentEditable) {
      inputDocumentInstance.body.contentEditable = true;
    } else {
      inputDocumentInstance.designMode = 'On';
    }

    this.set('editorIsReady', YES);

    this.setFieldValue(this.get('fieldValue'));

    responder = SC.IFrameRootResponder.create({ iframe: this.$input().get(0), target: this });
    responder.setup();
    this.set('iframeRootResponder', responder);

    SC.Event.add(inputDocument, 'paste', this, this.pasteCaught);
    SC.Event.add(focusTarget, 'focus', this, this._field_fieldDidFocus);
    SC.Event.add(inputDocument, 'blur', this, this._field_fieldDidBlur);
  },

  willDestroyLayer: function() {
    var inputDocument = this.$inputDocument(),
        focusTarget = (SC.browser.msie) ? this.$input() : inputDocument,
        responder = this.get('iframeRootResponder');

    responder.teardown();
    this.set('iframeRootResponder', null);

    SC.Event.remove(inputDocument, 'blur', this, this._field_fieldDidBlur);
    SC.Event.remove(focusTarget, 'focus', this, this._field_fieldDidFocus);
    SC.Event.remove(inputDocument, 'paste', this, this.pasteCaught);
    SC.Event.remove(this.$input(), 'load', this, this._field_checkIFrameDidLoad);
  },

  keyUp: function(evt){
    this.querySelection();
    this.queryCursorPos();

    if(this.getFieldValue() !== this.get('value')) {
      this._field_fieldValueDidChange(evt);
    }
  },

  mouseUp: function(evt){
    this.querySelection();
    this.queryCursorPos();
  },

  pasteCaught: function(evt){
    this.querySelection();
    this.queryCursorPos();
  },

  _loseBlur: function(){
    if (this._isFocused) {
      this._isFocused = NO;
      SC.RootResponder.responder.set('richTextEditorHasFocus', NO);
    }
  },

  _field_fieldDidFocus: function(){
    this.becomeFirstResponder();
  },

  _field_fieldDidBlur: function(){
    this._loseBlur();
  },

  willBecomeKeyResponderFrom: function(keyView) {
    // focus the text field.
    if (!this._isFocused) {
      this._isFocused = YES ;
      this.becomeFirstResponder();
      if (this.get('isVisibleInWindow')) {
        SC.RootResponder.responder.set('richTextEditorHasFocus', YES);
        this.$inputWindow().get(0).focus();
      }
    }
  },

  willLoseKeyResponderTo: function(responder) {
    this._loseBlur();
  },

// Utility methods

  changedSelection: function() {
    this.querySelection();
    this._field_fieldValueDidChange();
  },

  // Based on github.com/etgryphon/sproutcore-ui
  querySelection: function() {
    if (SC.browser.msie) {
      var rawSelection = this.$inputDocument().get(0).selection.createRange(),
          selection = rawSelection.text,
          selectionElement;

      if (SC.none(selection)) selection = '';

      selectionElement = rawSelection.parentElement();
    } else {
      var selection = this.$inputWindow().get(0).getSelection(),
          selectionRange = selection.getRangeAt(0),
          commonAncestor = selectionRange.commonAncestorContainer,
          childNodes = commonAncestor.childNodes,
          selectionNodes = [], childNode, idx;

      for(idx=0; idx < childNodes.length; idx++) {
        childNode = childNodes[idx];
        // Check for full or partial containment and make sure it's not an empty text node
        if (selection.containsNode(childNode, true) && !(childNode.nodeType === 3 && childNode.length === 0)) {
          selectionNodes.push(childNode);
        }
      }

      // If only one selection node and it's an element, use that
      if (selectionNodes.length === 1 && selectionNodes[0].nodeType === 1) {
        selectionElement = selectionNodes[0];
      } else {
        selectionElement = commonAncestor;
      }

      while(selectionElement && selectionElement.nodeType !== 1) selectionElement = selectionElement.parentNode;
    }

    // NOTE: Before changing this, make sure it works property with the text align button states
    this.propertyWillChange('selection');
    this.propertyWillChange('selectionElement');
    this.set('selection', selection.toString());
    this.set('selectionElement', selectionElement);
    this.propertyDidChange('selection');
    this.propertyDidChange('selectionElement');
  },

  // Based on http://niichavo.wordpress.com/2009/01/06/contentEditable-div-cursor-position/
  queryCursorPos: function() {
    var inputWindow = this.$inputWindow().get(0),
        inputDocument = this.$inputDocument().get(0),
        cursorPos;

    if (inputWindow.getSelection) {
      var selObj = inputWindow.getSelection(),
          anchor = selObj.anchorNode,
          offset = selObj.anchorOffset;

      if (anchor.nodeType === 1) { // elementNode
        anchor = anchor.childNodes[offset];
        offset = 0;
      }

      cursorPos =  this._anchorNodeOffset(anchor) + offset;
    } else if (inputDocument.selection) {
      var range = inputDocument.selection.createRange();

      range.moveStart('sentence', -1000000);

      cursorPos = range.text.length;
    }

    this.setIfChanged('cursorPos', cursorPos);
  },

  _anchorNodeOffset: function(node) {
    if (node === this.$inputBody().get(0)) return 0;

    var offset = this._anchorNodeOffset(node.parentNode),
        siblings = node.parentNode.childNodes,
        child;

    for (var i = 0; i < siblings.length; i++) {
      child = siblings[i];

      if (child === node) {
        return offset;
      } else {
        offset += this._nodeLength(child);
      }
    }

    throw "couldn't find node";
  },

  _nodeLength: function(node){
    if (node.nodeType === 1) { // ElementNode
      var total = 0, child, idx;

      if (node.childNodes.length === 0) {
        return 1;
      } else {
        for(idx=0; idx < node.childNodes.length; idx++) {
          child = node.childNodes[idx];
          total += this._nodeLength(child);
        }
      }

      return total;
    } else if (node.nodeType === 3) { // TextNode
      return node.length;
    } else {
      return 0;
    }
  },

// Editor actions

  // From wysihat
  _standardizeColor: function(color) {
    var idx;

    if (!color || color.match(/[0-9a-f]{6}/i)) return color;

    var m = color.toLowerCase().match(/^(rgba?|hsla?)\(([\s\.\-,%0-9]+)\)/);
    if(m){
      var c = m[2].split(/\s*,\s*/), l = c.length, t = m[1];
      if((t == "rgb" && l == 3) || (t == "rgba" && l == 4)){
        var r = c[0];
        if(r.charAt(r.length - 1) == "%"){
          var a = [];
          for(idx=0; idx < c.length; idx++) a.push(parseFloat(c[idx]) * 2.56);
          if(l == 4){ a[3] = c[3]; }
          return this._colorFromArray(a);
        }
        return this._colorFromArray(c);
      }
      if((t == "hsl" && l == 3) || (t == "hsla" && l == 4)){
        var H = ((parseFloat(c[0]) % 360) + 360) % 360 / 360,
          S = parseFloat(c[1]) / 100,
          L = parseFloat(c[2]) / 100,
          m2 = L <= 0.5 ? L * (S + 1) : L + S - L * S,
          m1 = 2 * L - m2,
          a = [this._hue2rgb(m1, m2, H + 1 / 3) * 256,
            this._hue2rgb(m1, m2, H) * 256, this._hue2rgb(m1, m2, H - 1 / 3) * 256, 1];
        if(l == 4){ a[3] = c[3]; }
        return this._colorFromArray(a);
      }
    }
    return null; // dojo.Color
  },

  // From wysihat
  _colorFromArray: function(a) {
    var arr = [], idx;

    // Entirely transparent, so we don't really have a valid value
    if (a[3] === 0 || a[3] === '0') return null;

    for(idx=0; idx < 3 && idx < a.length; idx++){
      var s = parseInt(a[idx], 10).toString(16);
      arr.push(s.length < 2 ? "0" + s : s);
    };
    return "#" + arr.join(""); // String
  },

  _hue2rgb: function(m1, m2, h){
    if(h < 0){ ++h; }
    if(h > 1){ --h; }
    var h6 = 6 * h;
    if(h6 < 1){ return m1 + (m2 - m1) * h6; }
    if(2 * h < 1){ return m2; }
    if(3 * h < 2){ return m1 + (m2 - m1) * (2 / 3 - h) * 6; }
    return m1;
  },

  // From wysihat
  fontSizeNames:  function() {
    var fontSizeNames = 'xxx-small xx-small x-small small medium large x-large xx-large'.w();

    if (SC.browser.safari) {
      fontSizeNames.shift();
      fontSizeNames.push('-webkit-xxx-large');
    }

    return fontSizeNames;
  }.property().cacheable(),

  fontSizePixels: '9 10 13 16 18 24 32 48'.w(),

  // From wysihat
  _standardizeFontSize: function(fontSize) {
    var newSize, match;

    if (match = fontSize.match(/^(\d+)px$/)) {
      var fontSizePixels = this.get('fontSizePixels'),
          tempSize = parseInt(match[1], 10),
          idx;

      newSize = 0;
      for(idx=0; idx < fontSizePixels.length; idx++) {
        if (tempSize > fontSizePixels[idx]) {
          newSize = idx + 1;
        } else {
          break;
        }
      }

      return newSize;
    } else {
      newSize = this.get('fontSizeNames').indexOf(fontSize);
      if (newSize >= 0) return newSize;
    }

    // Fallback
    return parseInt(fontSize, 10);
  },

  // borrowed with slight changes from jQuery
  getStyle: function(elem, name, force) {
    var defaultView = this.$inputWindow().get(0),
        ret, style = elem.style;

    // A helper method for determining if an element's values are broken
    function color( elem ) {
      if ( !SC.browser.safari )
        return false;

      var ret = defaultView.getComputedStyle( elem, null );
      return !ret || ret.getPropertyValue("color") == "";
    }

    // We need to handle opacity special in IE
    if ( name == "opacity" && SC.browser.msie ) {
      ret = SC.$.attr( style, "opacity" );

      return ret == "" ?
        "1" :
        ret;
    }
    // Opera sometimes will give the wrong display answer, this fixes it, see #2037
    if ( SC.browser.opera && name == "display" ) {
      var save = style.outline;
      style.outline = "0 solid black";
      style.outline = save;
    }

    // Make sure we're using the right name for getting the float value
    if ( name.match( /float/i ) )
      name = styleFloat;

    if ( !force && style && style[ name ] )
      ret = style[ name ];

    else if ( defaultView.getComputedStyle ) {

      // Only "float" is needed here
      if ( name.match( /float/i ) )
        name = "float";

      name = name.replace( /([A-Z])/g, "-$1" ).toLowerCase();

      var computedStyle = defaultView.getComputedStyle( elem, null );

      if ( computedStyle && !color( elem ) )
        ret = computedStyle.getPropertyValue( name );

      // If the element isn't reporting its values properly in Safari
      // then some display: none elements are involved
      else {
        var swap = [], stack = [], a = elem, i = 0;

        // Locate all of the parent display: none elements
        for ( ; a && color(a); a = a.parentNode )
          stack.unshift(a);

        // Go through and make them visible, but in reverse
        // (It would be better if we knew the exact display type that they had)
        for ( ; i < stack.length; i++ ) {
          if ( color( stack[ i ] ) ) {
            swap[ i ] = stack[ i ].style.display;
            stack[ i ].style.display = "block";
          }
        }

        // Since we flip the display style, we have to handle that
        // one special, otherwise get the value
        ret = name == "display" && swap[ stack.length - 1 ] != null ?
          "none" :
          ( computedStyle && computedStyle.getPropertyValue( name ) ) || "";

        // Finally, revert the display styles back
        for ( i = 0; i < swap.length; i++ ) {
          if ( swap[ i ] != null ) {
            stack[ i ].style.display = swap[ i ];
          }
        }
      }

      // We should always get a number back from opacity
      if ( name == "opacity" && ret == "" )
        ret = "1";

    } else if ( elem.currentStyle ) {
      var camelCase = name.replace(/\-(\w)/g, function(all, letter){
        return letter.toUpperCase();
      });

      ret = elem.currentStyle[ name ] || elem.currentStyle[ camelCase ];

      // From the awesome hack by Dean Edwards
      // http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291

      // If we're not dealing with a regular pixel number
      // but a number that has a weird ending, we need to convert it to pixels
      if (!(/^\d+(px)?$/i).test( ret ) && (/^\d/).test( ret ) ) {
        // Remember the original values
        var left = style.left, rsLeft = elem.runtimeStyle.left;

        // Put in the new values to get a computed value out
        elem.runtimeStyle.left = elem.currentStyle.left;
        style.left = ret || 0;
        ret = style.pixelLeft + "px";

        // Revert the changed values
        style.left = left;
        elem.runtimeStyle.left = rsLeft;
      }
    }

    return ret;
  },

  getSelectionStyle: function(name, force) {
    var elem = this.get('selectionElement');
    return elem ? this.getStyle(elem, name, force) : null;
  },

  defaultColor: function() {
    if (!this.get('editorIsReady')) return null;

    var body = this.$inputBody().get(0);
    return this._standardizeColor(this.getStyle(body, 'color'));
  }.property('editorIsReady').cacheable(),

  defaultBackgroundColor: function(){
    if (!this.get('editorIsReady')) return null;

    var body = this.$inputBody().get(0);
    return this._standardizeColor(this.getStyle(body, 'background-color'));
  }.property('editorIsReady').cacheable(),

  defaultFontSize: function(){
    if (!this.get('editorIsReady')) return null;

    var body = this.$inputBody().get(0);
    return this._standardizeFontSize(this.getStyle(body, 'font-size'));
  }.property('editorIsReady').cacheable(),

  _basicSelectionModifier: function(property, type, val) {
    if (!this.get('editorIsReady')) return false;

    if (val !== undefined) {
      this.propertyWillChange(property);
      var x = this.iframeExecCommand(type, false, val);
      this.propertyDidChange(property);

      if(x) this.changedSelection();
    }

    return this.iframeQueryState(type);
  },

// Formatting properties

  selectionColor: function(key, val) {
    if (!this.get('editorIsReady')) return null;

    if (val !== undefined) {
      this.propertyWillChange('selectionColor');
      var x = this.iframeExecCommand('forecolor', false, val);
      this.propertyDidChange('selectionColor');

      if(x) this.changedSelection();
    }

    return this._standardizeColor(this.getSelectionStyle('color'));

  }.property('selectionElement').cacheable(),

  selectionBackgroundColor: function(key, val) {
    if (!this.get('editorIsReady')) return null;

    var bgCommand = SC.browser.mozilla ? 'hilitecolor' : 'backcolor';

    if (val !== undefined) {
      this.propertyWillChange('selectionBackgroundColor');
      var x = this.iframeExecCommand(bgCommand, false, val);
      this.propertyDidChange('selectionBackgroundColor');

      if(x) this.changedSelection();
    }

    return this._standardizeColor(this.getSelectionStyle('background-color'));

  }.property('selectionElement').cacheable(),

  selectionFontSize: function(key, val) {
    if (!this.get('editorIsReady')) return null;

    if (val !== undefined) {
      this.propertyWillChange('selectionFontSize');
      var x = this.iframeExecCommand('fontsize', false, val);
      this.propertyDidChange('selectionFontSize');

      if(x) this.changedSelection();
    }

    return this._standardizeFontSize(this.getSelectionStyle('font-size'));

  }.property('selectionElement').cacheable(),

  selectionIsBold: function(key, val) {
    return this._basicSelectionModifier('selectionIsBold', 'bold', val);
  }.property('selection').cacheable(),

  selectionIsUnderlined: function(key, val) {
    return this._basicSelectionModifier('selectionIsUnderlined', 'underline', val);
  }.property('selection').cacheable(),

  selectionIsItalicized: function(key, val) {
    return this._basicSelectionModifier('selectionIsItalicized', 'italic', val);
  }.property('selection').cacheable(),

  selectionIsStrikethrough: function(key, val) {
    return this._basicSelectionModifier('selectionIsStrikethrough', 'strikethrough', val);
  }.property('selection').cacheable(),

  selectionIsLeftAligned: function(key, val) {
    return this._basicSelectionModifier('selectionIsLeftAligned', 'justifyleft', val);
  }.property('selection').cacheable(),

  selectionIsJustified: function(key, val) {
    return this._basicSelectionModifier('selectionIsJustified', 'justifyfull', val);
  }.property('selection').cacheable(),

  selectionIsCentered: function(key, val) {
    return this._basicSelectionModifier('selectionIsCentered', 'justifycenter', val);
  }.property('selection').cacheable(),

  selectionIsRightAligned: function(key, val) {
    return this._basicSelectionModifier('selectionIsRightAligned', 'justifyright', val);
  }.property('selection').cacheable(),

  selectionIsDefaultColor: function(key, val) {
    var selectionColor, selectionBackgroundColor;

    if (val === YES) {
      this.set('selectionColor', 'inherit');
      this.set('selectionBackgroundColor', 'transparent');
    }

    selectionColor = this.get('selectionColor');
    selectionBackgroundColor = this.get('selectionBackgroundColor');

    return (RichText.blank(selectionColor) || selectionColor === this.get('defaultColor'))
            && (RichText.blank(selectionBackgroundColor) || selectionBackgroundColor === this.get('defaultBackgroundColor'));

  }.property('selectionColor', 'selectionBackgroundColor').cacheable(),

  selectionIsHighlighted: function(key, val) {
    var selectionColor;

    if (val !== undefined) {
      val = (val) ? '#ffff00' : null; // yellow
      this.set('selectionColor', val);
    }

    selectionColor = this.get('selectionColor');

    return !RichText.blank(selectionColor)
            && selectionColor !== this.get('defaultColor');

  }.property('selectionColor').cacheable(),

  selectionIsBackgroundHighlighted: function(key, val) {
    var selectionBackgroundColor;

    if (val !== undefined) {
      val = (val) ? '#ffff00' : null; // yellow
      this.set('selectionBackgroundColor', val);
    }

    selectionBackgroundColor = this.get('selectionBackgroundColor');

    return !RichText.blank(selectionBackgroundColor)
            && selectionBackgroundColor !== this.get('defaultBackgroundColor');

  }.property('selectionBackgroundColor').cacheable(),

  selectionIsDefaultSize: function(key, val) {
    var selectionFontSize, defaultFontSize = this.get('defaultFontSize');

    if (val === YES) {
      this.set('selectionFontSize', defaultFontSize);
    }

    selectionFontSize = this.get('selectionFontSize');

    return RichText.blank(selectionFontSize) || selectionFontSize === defaultFontSize;

  }.property('selectionFontSize').cacheable(),

  selectionIsSizeIncreased: function() {
    var selectionFontSize = this.get('selectionFontSize');
    return !RichText.blank(selectionFontSize) && selectionFontSize > this.get('defaultFontSize');
  }.property('selectionFontSize').cacheable(),

  selectionIsSizeDecreased: function() {
    var selectionFontSize = this.get('selectionFontSize');
    return !RichText.blank(selectionFontSize) && selectionFontSize < this.get('defaultFontSize');
  }.property('selectionFontSize').cacheable(),

  selectionIsSuperscript: function(key, val) {
    return this._basicSelectionModifier('selectionIsSuperscript', 'superscript', val);
  }.property('selection').cacheable(),

  selectionIsSubscript: function(key, val) {
    return this._basicSelectionModifier('selectionIsSubscript', 'subscript', val);
  }.property('selection').cacheable(),

  selectionIsOrderedList: function(key, val) {
    return this._basicSelectionModifier('selectionIsOrderedList', 'insertorderedlist', val);
  }.property('selection').cacheable(),

  selectionIsUnorderedList: function(key, val) {
    return this._basicSelectionModifier('selectionIsUnorderedList', 'insertunorderedlist', val);
  }.property('selection').cacheable(),

  undoAllowed: function() {
    return this.iframeQueryEnabled('undo');
  }.property('selection').cacheable(),

  redoAllowed: function() {
    return this.iframeQueryEnabled('redo');
  }.property('selection').cacheable(),

// Formatting commands

  selectionIncreaseSize: function() {
    var selectionFontSize = this.get('selectionFontSize');
    this.set('selectionFontSize', selectionFontSize + 1);
  },

  selectionDecreaseSize: function() {
    var selectionFontSize = this.get('selectionFontSize');
    this.set('selectionFontSize', selectionFontSize - 1);
  },

  selectionIndent: function() {
    this.iframeExecCommand('indent', false, YES);
    this.changedSelection();
  },

  selectionOutdent: function() {
    this.iframeExecCommand('outdent', false, YES);
    this.changedSelection();
  },

  selectionRemoveFormatting: function() {
    this.iframeExecCommand('removeformat', false, YES);
    this.changedSelection();
  },

  undoChange: function() {
    this.iframeExecCommand('undo', false, YES);
    this.changedSelection();
  },

  redoChange: function() {
    this.iframeExecCommand('redo', false, YES);
    this.changedSelection();
  },

  iframeExecCommand: function() {
    var inputDocumentInstance = this.$inputDocument().get(0);
    return inputDocumentInstance.execCommand.apply(inputDocumentInstance, arguments);
  },

  iframeQueryState: function() {
    var inputDocumentInstance = this.$inputDocument().get(0);
    return inputDocumentInstance.queryCommandState.apply(inputDocumentInstance, arguments);
  },

  iframeQueryEnabled: function() {
    var inputDocumentInstance = this.$inputDocument().get(0);
    return inputDocumentInstance.queryCommandEnabled.apply(inputDocumentInstance, arguments);
  }

});

RichText.EditorView.mixin({

  loadedStylesheets: {},
  pendingStylesheets: [],
  stylesheetObservers: {},

  stylesheetIsLoaded: function(url) {
    return !!this.loadedStylesheets[url];
  },

  stylesheetIsLoading: function(url) {
    return this.pendingStylesheets.indexOf(url) !== -1;
  },

  loadStylesheet: function(url, notify_target, notify_method){
    if(notify_target && notify_method) this.addStylesheetObserver(url, notify_target, notify_method);

    if (!this.stylesheetIsLoaded(url) && !this.stylesheetIsLoading(url)) {
      this.pendingStylesheets.push(url);
      return SC.Request.getUrl(url)
                       .notify(this, this._stylesheetDidLoad, { url: url })
                       .send();
    }
  },

  addStylesheetObserver: function(url, target, method) {
    var observers = this.stylesheetObservers;

    if (!observers[url]) observers[url] = [];
    observers[url].push({ target: target, method: method });

    return YES;
  },

  _stylesheetDidLoad: function(request, params){
    var response = request.get('response'),
        url = params.url,
        observers, observer, idx;

    this.loadedStylesheets[url] = response;
    this.pendingStylesheets.removeObject(url);
    this._notifyLoad(url);
  },

  _notifyLoad: function(url){
    var observers, observer;

    observers = this.stylesheetObservers[url];
    if (observers) {
      for(idx=0; idx < observers.length; idx++) {
        observer = observers[idx];
        observer.target[observer.method](url);
      }
    }
  }

});