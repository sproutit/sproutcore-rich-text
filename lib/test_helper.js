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


function createSelection(view) {
  if (SC.browser.mozilla) {
    var win = view.$inputWindow().get(0),
        body = win.document.body,
        selection = win.getSelection(),
        range = win.createRange();

    range.setStart(body, 0);
    range.setEnd(body, 1);

    selection.addRange(range);
  } else {
    throw "not supported yet";
  }
};