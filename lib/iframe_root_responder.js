SC.IFrameRootResponder = SC.RootResponder.extend({

  iframe: null,
  target: null,

  setup: function() {
    var iframe = this.get('iframe'),
        iframeWindow = iframe.contentWindow,
        iframeDocument = iframeWindow.document;

    // handle basic events        
    this.listenFor('keydown keyup mousedown mouseup click dblclick mouseout mouseover mousemove selectstart'.w(), iframeDocument)
        .listenFor('resize focus blur'.w(), iframeWindow);

    // handle special case for keypress- you can't use normal listener to block the backspace key on Mozilla
    if (this.keypress) {
      if (SC.CAPTURE_BACKSPACE_KEY && SC.browser.mozilla) {
        var responder = this ;
        iframeDocument.onkeypress = function(e) { 
          e = SC.Event.normalizeEvent(e);
          return responder.keypress.call(responder, e); 
        };
        
        SC.Event.add(iframeWindow, 'unload', this, function() { iframeDocument.onkeypress = null; }); // be sure to cleanup memory leaks
  
      // Otherwise, just add a normal event handler. 
      } else SC.Event.add(iframeDocument, 'keypress', this, this.keypress);
    }

    // handle these two events specially in IE
    'drag selectstart'.w().forEach(function(keyName) {
      var method = this[keyName] ;
      if (method) {
        if (SC.browser.msie) {
          var responder = this ;
          iframeDocument.body['on' + keyName] = function(e) { 
            // return method.call(responder, SC.Event.normalizeEvent(e)); 
            return method.call(responder, SC.Event.normalizeEvent(event || iframeWindow.event)); // this is IE :(
          };

          // be sure to cleanup memory leaks
           SC.Event.add(iframeWindow, 'unload', this, function() { 
            iframeDocument.body['on' + keyName] = null; 
          });
          
        } else {
          SC.Event.add(iframeDocument, keyName, this, method);
        }
      }
    }, this);

    // handle mousewheel specifically for FireFox
    var mousewheel = SC.browser.mozilla ? 'DOMMouseScroll' : 'mousewheel';
    SC.Event.add(iframeDocument, mousewheel, this, this.mousewheel);

    // do some initial set
    this.set('currentWindowSize', this.computeWindowSize()) ;
    // this.focus(); // assume the window is focused when you load.
  },

  teardown: function() {
    SC.Event.remove(iframeDocument);
    SC.Event.remove(iframeWindow);
  },

  computeWindowSize: function() {
    var iframe = this.get('iframe'), 
        iframeWindow = iframe.contentWindow,
        iframeDocument = iframeWindow.document,
        size;

    if (iframeWindow.innerHeight) {
      size = { 
        width: iframeWindow.innerWidth, 
        height: iframeWindow.innerHeight 
      } ;

    } else if (iframeDocument.documentElement && iframeDocument.documentElement.clientHeight) {
      size = { 
        width: iframeDocument.documentElement.clientWidth, 
        height: iframeDocument.documentElement.clientHeight 
      } ;

    } else if (iframeDocument.body) {
      size = { 
        width: iframeDocument.body.clientWidth, 
        height: iframeDocument.body.clientHeight 
      } ;
    }
    return size;
  },

  // There is a third parameter ('target') that we're ignoring
  sendEvent: function(action, evt) {
    var target = this.get('target'), ret;

    SC.RunLoop.begin() ;

    if (target && target[action]) {
      target[action](evt);
      ret = target;
    } else {
      ret = null;
    }

    SC.RunLoop.end() ;

    return ret;
  },

  targetViewForEvent: function() {
    return this.get('target');
  }

});