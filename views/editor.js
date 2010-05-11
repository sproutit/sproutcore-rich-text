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
    return this.$('div');
  },

  $inputBody: function(){
    return this.$input();
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
    if (this.get('editorIsReady')) this.$inputBody().html(newValue.toString()+"<p><br/></p>");
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
    sc_super();
    this._renderField(context, firstTime);
  },

  _renderField: function(context, firstTime) {
    var name = this.get('layerId');

    if (firstTime) {
      context.push('<span class="border"></span>');
      context.push('<span class="padding"><div name="%@" contenteditable="true"></div></span>'.fmt(name));
    }
  },

  didCreateLayer: function() {
    this._setupEditor();
  },

  _setupEditor: function(){
    // Already setup
    if (this.get('editorIsReady')) return;

    this.set('editorIsReady', YES);

    this.setFieldValue(this.get('fieldValue'));

    var input = this.$input();
    SC.Event.add(input, 'keydown', this, this.keyDown);
    SC.Event.add(input, 'paste', this, this.pasteCaught);
    SC.Event.add(input, 'focus', this, this._field_fieldDidFocus);
    SC.Event.add(input, 'blur', this, this._field_fieldDidBlur);
  },

  willDestroyLayer: function() {
    var input = this.$input();
    SC.Event.remove(input, 'blur', this, this._field_fieldDidBlur);
    SC.Event.remove(input, 'focus', this, this._field_fieldDidFocus);
    SC.Event.remove(input, 'paste', this, this.pasteCaught);
    SC.Event.remove(input, 'keydown', this, this.keyDown);
  },

  keyDown: function(evt) {
    if (evt.metaKey) {
      var handled = NO;
      switch(SC.PRINTABLE_KEYS[evt.which]) {
        case 'b':
          this.get('selection').set('isBold', !this.getPath('selection.isBold'));
          handled = YES;
          break;
        case 'u':
          this.get('selection').set('isUnderlined', !this.getPath('selection.isUnderlined'));
          handled = YES;
          break;
        case 'i':
          this.get('selection').set('isItalicized', !this.getPath('selection.isItalicized'));
          handled = YES;
          break;
        case 'z':
          evt.shiftKey ? this.redoChange() : this.undoChange();
          handled = YES;
          break;
        case 'y':
          this.redoChange();
          handled = YES;
          break;
      }
      if (handled) {
        evt.stop();
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

  mouseDown: function(evt){
    evt.allowDefault();
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
    this._isFocused = NO;
  },

  _field_fieldDidFocus: function(){
  },

  _field_fieldDidBlur: function(){
    this._loseBlur();
  },

  willBecomeKeyResponderFrom: function(keyView) {
    this._isFocused = YES ;
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
      rawSelection = this.$input().get(0).selection.createRange();
      selectionText = rawSelection.text;

      if (SC.none(selection)) selection = '';

      selectionElement = rawSelection.parentElement();
    } else {
      rawSelection = window.getSelection();

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
    var inputInstance = this.$input().get(0),
        cursorPos;

    if (inputInstance.getSelection) {
      var selObj = inputInstance.getSelection(),
          anchor = selObj.anchorNode,
          offset = selObj.anchorOffset;

      if (anchor && anchor.nodeType === 1) { // elementNode
        anchor = anchor.childNodes[offset];
        offset = 0;
      }

      cursorPos = anchor ? (this._anchorNodeOffset(anchor) + offset) : null;
    } else if (inputInstance.selection) {
      var range = inputInstance.selection.createRange();

      range.moveStart('sentence', -1000000);

      cursorPos = range.text.length;
    }

    this.setIfChanged('cursorPos', cursorPos);
  },

  _anchorNodeOffset: function(node) {
    if (node === this.$input().get(0)) return 0;

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

  getStyle: function(elem, name, force) {
    return this._getStyleWithWindow(window, elem, name, force);
  },

  // borrowed with slight changes from jQuery
  _getStyleWithWindow: function(defaultView, elem, name, force) {
    var ret, style = elem.style;

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
    return this.queryEnabled('undo');
  }.property('selectionText').cacheable(),

  redoAllowed: function() {
    return this.queryEnabled('redo');
  }.property('selectionText').cacheable(),

// Formatting commands

  undoChange: function() {
    this.execCommand('undo', false, YES);
    this.changedSelection();
  },

  redoChange: function() {
    this.execCommand('redo', false, YES);
    this.changedSelection();
  },

  execCommand: function() {
    if (!this.get('editorIsReady')) return null;
    return window.document.execCommand.apply(window.document, arguments);
  },

  queryState: function() {
    if (!this.get('editorIsReady')) return null;
    return window.document.queryCommandState.apply(window.document, arguments);
  },

  // FIXME: Make this actually work
  queryEnabled: function() {
    if (!this.get('editorIsReady')) return null;
    return window.document.queryCommandEnabled.apply(window.document, arguments);
  },

  init: function(){
    sc_super();
    this.set('selection', this.get('exampleSelection').create({ editor: this }));
  }

});