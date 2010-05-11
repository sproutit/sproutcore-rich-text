sc_require('views/editor');

RichText.IFrameEditorView = RichText.EditorView.extend(
/** @scope RichText.IFrameEditorView.prototype */ {

  iframeRootResponder: null,

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

  _renderField: function(context, firstTime) {
    var name = this.get('layerId');

    if (firstTime) {
      context.push('<span class="border"></span>');
      context.push('<iframe name="%@"></iframe>'.fmt(name));
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

  _loseBlur: function(){
    if (this._isFocused) SC.RootResponder.responder.set('iframeHasFocus', NO);
    sc_super();
  },

  _field_fieldDidFocus: function(){
    sc_super();
    this.becomeFirstResponder();
  },

  willBecomeKeyResponderFrom: function(keyView) {
    // focus the text field.
    if (!this._isFocused) {
      this.becomeFirstResponder();
      if (this.get('isVisibleInWindow')) {
        SC.RootResponder.responder.set('iframeHasFocus', YES);
        this.$inputWindow().get(0).focus();
      }
    }
    sc_super();
  },
  
  // TODO: Reduce redundant code
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

  // TODO: Reduce redundant code
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

  // TODO: Reduce redundancy
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

  getStyle: function(elem, name, force) {
    return this._getStyleWithWindow(this.$inputWindow().get(0), elem, name, force);
  },

  execCommand: function() {
    if (!this.get('editorIsReady')) return null;
    var inputDocumentInstance = this.$inputDocument().get(0);
    return inputDocumentInstance.execCommand.apply(inputDocumentInstance, arguments);
  },

  queryState: function() {
    if (!this.get('editorIsReady')) return null;
    var inputDocumentInstance = this.$inputDocument().get(0);
    return inputDocumentInstance.queryCommandState.apply(inputDocumentInstance, arguments);
  },

  queryEnabled: function() {
    if (!this.get('editorIsReady')) return null;
    var inputDocumentInstance = this.$inputDocument().get(0);
    return inputDocumentInstance.queryCommandEnabled.apply(inputDocumentInstance, arguments);
  },

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