sc_require('tests/test_helper');

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
            value: 'SproutCore',
            isEnabled: NO
          }),
          RichText.EditorView.extend({
            value: '',
            stylesheets: [sc_static('test')]
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

test("renders an iframe input tag with appropriate attributes", function() {
  equals(view.get('value'), '', 'value should be empty');
  equals(view1.get('value'), 'SproutCore', 'value should not be empty ');
  equals(view.get('isEnabled'),YES,'field enabled' );
  equals(view1.get('isEnabled'),NO,'field not enabled' );
  var q = Q$('iframe', view.get('layer'));
  ok(q, 'should have an iframe');
  equals(q.attr('name'), view.get('layerId'), 'should have name as view_layerid');
});

test('should add stylesheet link tags', function(){
  ReadyCallback.run(view2, function(){
    var result = (SC.browser.msie) ?
                  '<LINK rel=stylesheet type=text/css href="'+sc_static('test')+'" charset=utf-8>' :
                  '<link rel="stylesheet" href="'+sc_static('test')+'" type="text/css" charset="utf-8">';

    equals(escapeHTML(view2.$inputDocument().find('head').html().trim()), escapeHTML(result), 'should have link tag');
  });
});

test('should load stylesheets inline');

test('$input', function(){
  equals(view.$input()[0], view.$().find('iframe')[0], 'should be iframe');
});

test('$inputWindow', function(){
  ReadyCallback.run(view, function(){
    equals(view.$inputWindow()[0], view.$().find('iframe')[0].contentWindow, 'should be iframe window');
  });
});

test('$inputDocument', function(){
  ReadyCallback.run(view, function(){
    equals(view.$inputDocument()[0], view.$().find('iframe')[0].contentWindow.document, 'should be iframe document');
  });
});

test('$inputBody', function(){
  ReadyCallback.run(view, function(){
    equals(view.$inputBody()[0], view.$().find('iframe')[0].contentWindow.document.body, 'should be iframe body');
  });
});

test('iframe should have basic html', function(){
  ReadyCallback.run(view, function(){
    ok(view.$inputDocument().find('html')[0], 'should have HTML');
    ok(view.$inputDocument().find('head')[0], 'should have a HEAD');
    ok(view.$inputDocument().find('body')[0], 'should have a BODY');
  });
});

test('editorIsReady', function(){
  if (!SC.browser.safari) {
    ok(!view.get('editorIsReady'), 'editor should not be ready at start');
  }
  ReadyCallback.run(view, function(){
    ok(view.get('editorIsReady'), 'editor should become ready');
  });
});

test('designmode is set', function(){
  ReadyCallback.run(view, function(){
    equals(view.$inputBody()[0].contentEditable, 'true', 'should be contentEditable');
  });
});