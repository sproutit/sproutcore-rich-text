sc_require('tests/test_helper');

var pane, view, view1, view2;

module("RichText.EditorView",{
  setup: function() {
      SC.RunLoop.begin();
      pane = SC.MainPane.create({
        childViews: [
          RichText.EditorView.extend({
            layout: { top: 10, right: 10, width: 300, height: 400 },
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

test('fieldValue should get iframe html', function(){
  ReadyCallback.run(view, function(){
    view.$inputBody().html('p1<br><br>p2');
    equals(escapeHTML(view.getFieldValue().toLowerCase()), escapeHTML('p1<br><br>p2'),
            'raw value should match iframe html');
  });
});

test('value should get sanitized html', function(){
  ReadyCallback.run(view, function(){
    var html = (SC.browser.msie) ?
                  '<P>p1</P>\n<P>&nbsp;</P>\n<P>p2</P>' :
                  'p1<br><br>p2';

    view.$inputBody().html(html);
    view._field_fieldValueDidChange();

    equals(escapeHTML(view.get('value')), escapeHTML('<p>p1</p>\n\n<p>p2</p>'), 'value should be sanitized');
  });
});

test('setting value should prep for browser first');

test('not-empty class should apply properly');

test('should render with border and padding');

test('properly handles focus');