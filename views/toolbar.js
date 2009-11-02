RichText.ToolbarView = SC.View.extend(
/** @scope RichText.ToolbarView.prototype */ {

  classNames: 'rich-text-toolbar-view',

  childViews: 'boldButton'.w(),

  layout: { top: 0, left: 0, right: 0, height: 20 },

  boldButton: SC.ButtonView.design({
    title: 'B',
    command: 'bold',
    target: SC.outlet('parentView.parentView'),
    action: 'boldSelection'
  })

});