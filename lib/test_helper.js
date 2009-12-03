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


function createSelection(view, options) {
  if (SC.browser.mozilla || SC.browser.safari) {
    var win = view.$inputWindow().get(0),
        doc = win.document,
        body = doc.body,
        selection = win.getSelection(),
        range = doc.createRange();

    options = SC.merge({
      startNode: body,
      startOffset: 0
    }, options || {});

    if (!options.endNode) options.endNode = options.startNode;
    if (!options.endOffset) options.endOffset = options.startOffset + 1;

    range.setStart(options.startNode, options.startOffset);
    range.setEnd(options.endNode, options.endOffset);

    selection.addRange(range);

    // Pretend we got a mouseup
    view.mouseUp();
  } else {
    CoreTest.defaultPlan().warn("Testing selection is not yet supported in this browser");
  }
};