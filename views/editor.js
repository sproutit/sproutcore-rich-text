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

  value: null,

  classNames: ['rich-text-editor-view', 'sc-text-field-view', 'text-area'],

  editorIsReady: NO,

  toolbarView: RichText.ToolbarView,

  stylesheets: [],
  loadStylesheetsInline: NO,
  
  // TODO: Should stylesheets be a display property?
  displayProperties: 'fieldValue isEditing toolbarView'.w(),

  // TODO: Add support for disabling
  // TODO: Setup toolbar in a similar fashion to accessories
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


// SETUP

  createChildViews: function() {
    this.toolbarViewObserver() ;
  },

  toolbarViewObserver: function() {
    var classNames, createdView = false;

    var viewProperty = 'toolbarView';

    // Is there an accessory view specified?
    var previousView = this['_'+viewProperty] ;
    var toolbarView = this.get(viewProperty) ;

    // If the view is the same, there's nothing to do.  Otherwise, remove
    // the old one (if any) and add the new one.
    if (! (previousView
           &&  toolbarView
           &&  (previousView === toolbarView) ) ) {

      // If there was a previous previous accessory view, remove it now.
      if (previousView) {
        // Remove the "sc-rich-text-editor-toolbar-view" class name that we had
        // added earlier.
        classNames = previousView.get('classNames') ;
        classNames = classNames.without('sc-rich-text-editor-toolbar-view') ;
        previousView.set('classNames', classNames) ;
        this.removeChild(previousView) ;
        previousView = null ;
        this['_'+viewProperty] = null ;
      }

      // If there's a new accessory view to add, do so now.
      if (toolbarView) {
        // If the user passed in a class rather than an instance, create an
        // instance now.
        if (toolbarView.isClass) {
          createdView = true;
          toolbarView = toolbarView.create({
            layoutView: this
          }) ;
        }

        // Add in the "sc-rich-text-editor-toolbar-view" class name so that the
        // z-index gets set correctly.
        classNames = toolbarView.get('classNames') ;
        var className = 'sc-rich-text-editor-toolbar-view' ;
        if (classNames.indexOf(className) < 0) {
          classNames.push(className) ;
        }

        // Actually add the view to our hierarchy and cache a reference.
        this.appendChild(toolbarView) ;
        this['_'+viewProperty] = toolbarView ;

        // This may trigger again, but the observer won't run fully since it's the same as the previous
        if(createdView) this.set('toolbarView', toolbarView);
      }
    }
  }.observes('toolbarView'),

  render: function(context, firstTime) {
    arguments.callee.base.apply(this,arguments) ;

    var name = SC.guidFor(this);

    // always have at least an empty string
    var v = this.get('fieldValue');
    if (SC.none(v)) v = '';

    // update layer classes always
    context.setClass('not-empty', v.length > 0);

    var topAdjustment = this._getToolbarViewHeight();

    if (topAdjustment)  topAdjustment  += 'px' ;

    this._renderField(context, firstTime, v, topAdjustment) ;
  },

  _renderField: function(context, firstTime, value, topAdjustment) {
    if (firstTime) {
      var name = SC.guidFor(this), adjustmentStyle = '';

      context.push('<span class="border"></span>');

      if (topAdjustment) {
        adjustmentStyle = ' style="top: '+topAdjustment+'"';
      }

      // Render the iframe itself, and close off the padding.
      context.push('<iframe name="%@"%@></iframe></span>'.fmt(name, adjustmentStyle));
    }
  },

  _getToolbarViewHeight: function() {
    var toolbarView = this.get('toolbarView'), height = 0;
    if (toolbarView  &&  toolbarView.get) {
      var frame = toolbarView.get('frame');
      if (frame) height = frame.height; 
    }
    return height;
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

    inputDocumentInstance.open();
    inputDocumentInstance.write("<html><head>%@</head><body></body></html>".fmt(headers));
    inputDocumentInstance.close();
  },

  _setupEditor: function(){
    // Already setup
    if (this.get('editorIsReady')) return;

    var inputDocument = this.$inputDocument(),
        inputDocumentInstance = inputDocument.get(0),
        stylesheets = this.get('stylesheets'),
        stylesheet_url, headers = '', idx;

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

    SC.Event.add(this.$inputDocument(), 'keyup', this, this._field_fieldValueDidChange);
    SC.Event.add(this.$inputDocument(), 'focus', this, this._field_fieldDidFocus);
    SC.Event.add(this.$inputDocument(), 'blur', this, this._field_fieldDidBlur);
  },

  willDestroyLayer: function() {
    SC.Event.remove(this.$inputDocument(), 'blur', this, this._field_fieldDidBlur);
    SC.Event.remove(this.$inputDocument(), 'focus', this, this._field_fieldDidFocus);
    SC.Event.remove(this.$inputDocument(), 'keyup', this, this._field_fieldValueDidChange);
    SC.Event.remove(this.$input(), 'load', this, this._field_checkIFrameDidLoad);
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

// Editor actions

  boldSelection: function() {
    this.iframeExecCommand('bold', false, null);
  },

  iframeExecCommand: function() {
    var inputDocumentInstance = this.$inputDocument().get(0);
    return inputDocumentInstance.execCommand.apply(inputDocumentInstance, arguments);
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