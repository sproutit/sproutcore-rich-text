// Alias
var escapeHTML = SC.RenderContext.escapeHTML;

// We don't want to create the plan until this is called
function warn(){
  var plan = CoreTest.defaultPlan();
  return plan.warn.apply(plan, arguments);
};

var ReadyCallback = SC.Object.extend({
  view:     null,
  callback: null,

  run: function(){
    var view = this.get('view');

    if (view.get('editorIsReady')) {
      ReadyCallback.complete(this);
      try {
        if(this.callback) this.callback();
      } catch(e) {
        ok(false, "unexpected error: "+e);
      }
    } else {
      // Need to force the timers to schedule
      SC.RunLoop.begin();
      this.invokeLater('run', 100);
      SC.RunLoop.end();
    }
  }
});

ReadyCallback.mixin({
  activeRCs: [],

  run: function(view, callback) {
    var rc = ReadyCallback.create({ view: view, callback: callback });

    // Make sure tests are stopped
    stop();

    this.activeRCs.push(rc);

    rc.run();

    return rc;
  },

  complete: function(rc) {
    this.activeRCs.removeObject(rc);

    // Resume tests if none active
    if (this.activeRCs.length === 0) start();
  }
});

MockEvent = function(){ }
MockEvent.prototype.allowDefault = function(){ };

function createSelection(view, node, options) {
  if (!(SC.browser.mozilla || SC.browser.safari || SC.browser.msie)) {
    warn("Testing selection is not yet supported in this browser");
    return;
  }

  var win = view.$inputWindow().get(0),
      doc = win.document,
      body = doc.body,
      selection, range;

  if(!node) node = body;
  if(!options) options = { startOffset: 0 };

  if (SC.browser.mozilla || SC.browser.safari) {
    if(!options.endOffset) options.endOffset = options.startOffset + 1;

    selection = win.getSelection();
    range = doc.createRange();

    range.setStart(node, options.startOffset);
    range.setEnd(node, options.endOffset);

    selection.addRange(range);

  } else if (SC.browser.msie) {
    // IE wants an element
    while(node.nodeType != 1) node = node.parentNode;

    win.focus();

    range = body.createTextRange();

    range.moveToElementText(node);
    range.moveStart('character', options.startOffset);

    if (options.endOffset) {
      range.collapse();
      range.moveEnd('character', options.endOffset - options.startOffset);
    }

    range.select();
  }

  // Pretend we got a mouseup
  view.mouseUp(new MockEvent);
};