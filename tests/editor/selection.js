sc_require('lib/test_helper');

var pane, view, view1, view2;

module("RichText.EditorView",{
  setup: function() {
      SC.RunLoop.begin();
      pane = SC.MainPane.create({
        childViews: [
          RichText.EditorView.extend({
            value: ''
          }),
          RichText.EditorView.extend({
            stylesheets: [sc_static('test')],
            loadStylesheetsInline: YES
          })
        ]
    });
    pane.append(); // make sure there is a layer...
    SC.RunLoop.end();

    view  = pane.childViews[0];
    view1 = pane.childViews[1];
    // view2 = pane.childViews[2];
  },

  teardown: function() {
    pane.remove();
    pane = view = view1 = view2 = null ;
  }
});

test('selection');
test('selectionElement');

test('cursorPos');

test('gets selection style');

test('gets default color', function(){
  ReadyCallback.run(view, function(){
    equals(view.get('defaultColor'), '#000000', 'defaultColor should be #00000');
  });

  // NOTE: This only works with inline stylesheets
  ReadyCallback.run(view1, function(){
    equals(view1.get('defaultColor'), '#cccccc', 'defaultColor should be #cccccc');
  });
});

test('gets default background color', function(){
  ReadyCallback.run(view, function(){
    // Won't be set
    equals(view.get('defaultBackgroundColor'), null, 'defaultBackgroundColor should be null');
  });

  // NOTE: This only works with inline stylesheets
  ReadyCallback.run(view1, function(){
    equals(view1.get('defaultBackgroundColor'), '#888888', 'defaultBackgroundColor should be #888888');
  });
});

test('gets default font size', function(){
  ReadyCallback.run(view, function(){
    // Will this change in other browsers?
    equals(view.get('defaultFontSize'), 3, 'defaultFontSize should be 3');
  });

  // NOTE: This only works with inline stylesheets
  ReadyCallback.run(view1, function(){
    equals(view1.get('defaultFontSize'), 2, 'defaultFontSize should be 2');
  });
});

test('gets default without inline stylesheets');

test('selection properties should work');

test('formatting commands should work');