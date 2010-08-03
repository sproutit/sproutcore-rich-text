// ==========================================================================
// Project:   RichText.RichTextEditorView
// Copyright: ©2009 My Company, Inc.
// ==========================================================================
/*globals RichText */

/** @class

  (Document Your View Here)

  @extends SC.View
*/

sc_require('system/rich_text_selection');

RichText.EditorView = SC.FieldView.extend(
/** @scope RichText.EditorView.prototype */ {

  value: null,

  iframeRootResponder: null,

  classNames: ['rich-text-editor-view', 'sc-text-field-view', 'text-area'],

  editorIsReady: NO,

  exampleSelection: RichText.RichTextSelection,

  selection: null,
  selectionText: '',
  selectionElement: null,
  cursorPos: null,

  stylesheets: [],
  loadStylesheetsInline: NO,
  
  // TODO: Should stylesheets be a display property?
  displayProperties: 'fieldValue isEditing'.w(),

  // TODO: Add support for disabling
  // TODO: Can hints be made to work?

  _fieldUpdateSkipCount: 0,

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

// fieldValue actions

  skipFieldUpdate: function(){
    this._fieldUpdateSkipCount++;
  },

  didSkipFieldUpdate: function(){
    if(this._fieldUpdateSkipCount == 0) return;
    this._fieldUpdateSkipCount--;
  },

  shouldSkipFieldUpdate: function(){
    return this._fieldUpdateSkipCount > 0;
  },

  valueDidChange: function(){
    var newValue = this.get('value');

    // Convert to FormattedText instance
    if (typeof(newValue) === 'string') {
      newValue = RichText.FormattedText.create({ value: newValue });
    }

    if (this._value !== newValue) {
      this._value = newValue;
      if (this.shouldSkipFieldUpdate()) {
        this.didSkipFieldUpdate();
      } else {
        this.setFieldValue(this.get('fieldValue'));
      }
    }
  }.observes('value'),

  // value: function(key, newValue) {
  //   if (newValue !== undefined) {
  //     // Convert to FormattedText instance
  //     if (typeof(newValue) === 'string') {
  //       newValue = RichText.FormattedText.create({ value: newValue });
  //     }
  // 
  //     var valueChanged = (this._value !== newValue);
  //     this.setValueWithoutField(newValue);
  //     if (valueChanged) this.setFieldValue(this.get('fieldValue'));
  //   }
  // 
  //   return this._value;
  // }.property().cacheable(),

  // setValueWithoutField: function(newValue) {
  //   this.propertyWillChange('value');
  //   this._value = newValue;
  //   this.propertyDidChange('value');
  // },

  fieldValue: function() {
    var value = sc_super();
    return value ? RichText.HtmlSanitizer.formatHTMLInput(value.toString()) : '';
  }.property('value', 'validator').cacheable(),

  setFieldValue: function(newValue) {
    this.propertyWillChange('fieldValue');
    if (this.get('editorIsReady')) this.$inputBody().html(newValue.toString());
    this.propertyDidChange('fieldValue');
    return this;
  },

  getFieldValue: function() {
    return this.get('editorIsReady') ? this.$inputBody().html() : null;
  },

  fieldValueDidChange: function(partialChange) {
    // collect the field value and convert it back to a value
    var fieldValue = this.getFieldValue();
    var value = this.objectForFieldValue(fieldValue, partialChange);

    // Compare raw values
    if (!this._value || this._value.get('value') !== value) {
      value = RichText.FormattedText.create({ value: value });
      this.skipFieldUpdate();
      this.set('value', value);
    }
  },

  // Do nothing, we're handling it in the computedProperty for 'value'
  _field_valueDidChange: function() { },

// Rendering

  render: function(context, firstTime) {
    arguments.callee.base.apply(this,arguments) ;

    var name = SC.guidFor(this);

    // TODO: Find a way to set this without calling fieldValue which triggers sanitizing

    // // always have at least an empty string
    // var v = this.get('fieldValue');
    // if (SC.none(v)) v = '';
    // 
    // // update layer classes always
    // context.setClass('not-empty', v.length > 0);


    if (firstTime) {
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

    // This has occasionally been an issue. Not sure what to do about it yet.
    if (!inputDocumentInstance) throw "No inputDocumentInstance!";

    // Tried using contenteditable but it had a weird bug where you had to type something before you could delete in a field
    try {
      inputDocumentInstance.designMode = 'on';
    } catch ( e ) {
      // Will fail on Gecko if the editor is placed in an hidden container element
      // The design mode will be set ones the editor is focused
      inputDocument.focus(function() { inputDocumentInstance.designMode(); } );
    }

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

  keyDown: function(evt) {
    if (evt.metaKey) {
      switch(SC.PRINTABLE_KEYS[evt.which]) {
        case 'b':
          this.get('selection').set('isBold', !this.getPath('selection.isBold'));
          return YES;
        case 'u':
          this.get('selection').set('isUnderlined', !this.getPath('selection.isUnderlined'));
          return YES;
        case 'i':
          this.get('selection').set('isItalicized', !this.getPath('selection.isItalicized'));
          return YES;
        case 'z':
          evt.shiftKey ? this.redoChange() : this.undoChange();
          return YES;
        case 'y':
          this.redoChange();
          return YES;
      }
    } else if (evt.which === SC.Event.KEY_TAB) {
      evt.shiftKey ? this.selectionOutdent() : this.selectionIndent();
      return YES;
    }

    evt.allowDefault();
  },

  keyUp: function(evt){
    this.querySelection();
    this.queryCursorPos();

    //if(this.getFieldValue() !== this.get('value')) {
      this._field_fieldValueDidChange(evt);
    //}
  },

  mouseUp: function(evt){
    this.querySelection();
    this.queryCursorPos();

    // Not setting this will cause problems with deselecting text
    evt.allowDefault();
  },

  pasteCaught: function(evt){
    this.querySelection();
    this.queryCursorPos();

    this._field_fieldValueDidChange(evt);
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
    var rawSelection,
        selectionText = '',
        selectionElement = null;

    if (SC.browser.msie) {
      rawSelection = this.$inputDocument().get(0).selection.createRange();
      selectionText = rawSelection.text;

      if (SC.none(selection)) selection = '';

      selectionElement = rawSelection.parentElement();
    } else {
      rawSelection = this.$inputWindow().get(0).getSelection();

      if (rawSelection.rangeCount > 0) {
        var selectionRange = rawSelection.getRangeAt(0),
            commonAncestor = selectionRange.commonAncestorContainer,
            childNodes = commonAncestor.childNodes,
            selectionNodes = [], childNode, idx;

        for(idx=0; idx < childNodes.length; idx++) {
          childNode = childNodes[idx];
          if (childNode) {
            // Check for full or partial containment and make sure it's not an empty text node
            if (rawSelection.containsNode(childNode, true) && !(childNode.nodeType === 3 && childNode.length === 0)) {
              selectionNodes.push(childNode);
            }
          }
        }

        // If only one selection node and it's an element, use that
        if (selectionNodes.length === 1 && selectionNodes[0].nodeType === 1) {
          selectionElement = selectionNodes[0];
        } else {
          selectionElement = commonAncestor;
        }

        while(selectionElement && selectionElement.nodeType !== 1) selectionElement = selectionElement.parentNode;

        selectionText = rawSelection.toString();
      }
    }

    // NOTE: Before changing this, make sure it works property with the text align button states
    this.propertyWillChange('selectionText');
    this.propertyWillChange('selectionElement');
    this.set('selectionText', selectionText);
    this.set('selectionElement', selectionElement);
    // Is this necessary?
    this.get('selection').update();
    this.propertyDidChange('selectionText');
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

      if (anchor && anchor.nodeType === 1) { // elementNode
        anchor = anchor.childNodes[offset];
        offset = 0;
      }

      cursorPos = anchor ? (this._anchorNodeOffset(anchor) + offset) : null;
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


  defaultColor: function() {
    if (!this.get('editorIsReady')) return null;

    var body = this.$inputBody().get(0);
    return RichText.HtmlSanitizer.standardizeColor(this.getStyle(body, 'color'));
  }.property('editorIsReady').cacheable(),

  defaultBackgroundColor: function(){
    if (!this.get('editorIsReady')) return null;

    var body = this.$inputBody().get(0);
    return RichText.HtmlSanitizer.standardizeColor(this.getStyle(body, 'background-color'));
  }.property('editorIsReady').cacheable(),

  defaultFontSize: function(){
    if (!this.get('editorIsReady')) return null;

    var body = this.$inputBody().get(0);
    return RichText.HtmlSanitizer.standardizeFontSize(this.getStyle(body, 'font-size'));
  }.property('editorIsReady').cacheable(),

// Formatting properties

  undoAllowed: function() {
    return this.iframeQueryEnabled('undo');
  }.property('selectionText').cacheable(),

  redoAllowed: function() {
    return this.iframeQueryEnabled('redo');
  }.property('selectionText').cacheable(),

// Formatting commands

  undoChange: function() {
    this.iframeExecCommand('undo', false, YES);
    this.changedSelection();
  },

  redoChange: function() {
    this.iframeExecCommand('redo', false, YES);
    this.changedSelection();
  },

  iframeExecCommand: function() {
    if (!this.get('editorIsReady')) return null;
    var inputDocumentInstance = this.$inputDocument().get(0);
    return inputDocumentInstance.execCommand.apply(inputDocumentInstance, arguments);
  },

  iframeQueryState: function() {
    if (!this.get('editorIsReady')) return null;
    var inputDocumentInstance = this.$inputDocument().get(0);
    return inputDocumentInstance.queryCommandState.apply(inputDocumentInstance, arguments);
  },

  iframeQueryEnabled: function() {
    if (!this.get('editorIsReady')) return null;
    var inputDocumentInstance = this.$inputDocument().get(0);
    return inputDocumentInstance.queryCommandEnabled.apply(inputDocumentInstance, arguments);
  },

  init: function(){
    sc_super();
    this.set('selection', this.get('exampleSelection').create({ editor: this }));
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
