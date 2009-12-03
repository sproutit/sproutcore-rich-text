sc_require('tests/test_helper');

var pane, view, view1, view2;

module("RichText.EditorView",{
  setup: function() {
      SC.RunLoop.begin();
      pane = SC.MainPane.create({
        childViews: [
          RichText.EditorView.extend({
            value: ''
          })
        ]
    });
    pane.append(); // make sure there is a layer...
    SC.RunLoop.end();

    view  = pane.childViews[0];
    // view1 = pane.childViews[1];
    // view2 = pane.childViews[2];
  },

  teardown: function() {
    pane.remove();
    pane = view = view1 = view2 = null ;
  }
});

test('setting value updates iframe body', function(){
  ReadyCallback.run(view, function(){
    view.set('value', 'this is a test');
    ok(view.$inputBody().html().match('this is a test'), 'html should include "this is a test"');
  });
});

test('rawFieldValue should get iframe html', function(){
  ReadyCallback.run(view, function(){
    view.$inputBody().html('P1<br><br>P2');
    equals(view.rawFieldValue(), 'P1<br><br>P2', 'raw value should be "P1<br><br>P2"');
  });
});

test('value should get sanitized html', function(){
  ReadyCallback.run(view, function(){
    view.$inputBody().html('P1<br><br>P2');
    view._field_fieldValueDidChange();
    // escaping makes it easier to read
    equals(view.get('value'), '<p>P1</p>\n\n<p>P2</p>', 'value should be "<p>P1</p>\n\n<p>P2</p>"');
  });
});

test('setting value should prep for browser first');

test('not-empty class should apply properly');

test('should render with border and padding');

test('properly handles focus');