sc_require('tests/test_helper');

var pane, view, view1, view2;

module("RichText.EditorView",{
  setup: function() {
      SC.RunLoop.begin();
      pane = SC.MainPane.create({
        childViews: [
          RichText.EditorView.extend({
            value: 'testing'
          }),
          RichText.EditorView.extend({
            stylesheets: [sc_static('test')],
            loadStylesheetsInline: YES
          }),
          RichText.EditorView.extend({
            value: '<span style="font-weight: bold">Test</span>'
          })
        ]
    });
    pane.append(); // make sure there is a layer...
    SC.RunLoop.end();

    view  = pane.childViews[0];
    view1 = pane.childViews[1];
    view2 = pane.childViews[2];
  },

  teardown: function() {
    pane.remove();
    pane = view = view1 = view2 = null ;
  }
});

test('selection', function(){
  ReadyCallback.run(view, function(){
    createSelection(view);
    equals(view.get('selection'), 'testing', 'selection should be "testing"');
  });
});

test('selectionElement', function(){
  ReadyCallback.run(view2, function(){
    var node = view2.$inputBody().find('span').get(0);
    createSelection(view2);
    equals(view2.get('selectionElement'), node, 'selectionElement should be &lt;span&gt;');
  });
});

test('cursorPos', function(){
  ReadyCallback.run(view2, function(){
    // TextNode in <span>
    var node = view2.$inputBody().find('span').contents()[0];
    createSelection(view2, { startNode: node, startOffset: 2 });

    equals(view2.get('cursorPos'), 2, 'cursorPos should be 2');
  });
});

test('gets selection style', function(){
  ReadyCallback.run(view2, function(){
    // TextNode in <span>
    var node = view2.$inputBody().find('span').contents()[0];
    createSelection(view2, { startNode: node, startOffset: 2 });

    equals(view2.getSelectionStyle('font-weight'), 'bold', 'font-weight should be bold');
  });
});

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
    var result = (SC.browser.mozilla) ? null : '#000000'; // Won't be set in FF
    equals(view.get('defaultBackgroundColor'), result,
            'defaultBackgroundColor should be ' + (result === null ? 'null' : result));
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