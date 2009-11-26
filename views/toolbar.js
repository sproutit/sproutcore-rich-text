sc_require('views/toolbar_button');

RichText.ToolbarView = SC.View.extend(
/** @scope RichText.ToolbarView.prototype */ {

  classNames: 'rich-text-toolbar-view',

  childViews: ('strikethroughButton boldButton underlineButton italicsButton ' + 
               'leftAlignButton justifyButton centerButton rightAlignButton ' +
               'defaultColorButton hightlightButton highlightBackgroundButton').w(),

  editor: null,

  layout: { top: 0, left: 0, right: 0, bottom: SC.LAYOUT_AUTO },

  strikethroughButton: RichText.ToolbarButtonView.extend({
    title: 'S',
    valueBinding: '.parentView.editor.selectionIsStrikethrough'
  }),

  boldButton: RichText.ToolbarButtonView.extend({
    title: 'B',
    valueBinding: '.parentView.editor.selectionIsBold'
  }),

  underlineButton: RichText.ToolbarButtonView.extend({
    title: 'U',
    valueBinding: '.parentView.editor.selectionIsUnderlined'
  }),

  italicsButton: RichText.ToolbarButtonView.extend({
    title: 'I',
    valueBinding: '.parentView.editor.selectionIsItalicized'
  }),

  leftAlignButton: RichText.ToolbarButtonView.extend({
    title: 'Left',
    buttonBehavior: SC.TOGGLE_ON_BEHAVIOR,
    valueBinding: '.parentView.editor.selectionIsLeftAligned'
  }),

  justifyButton: RichText.ToolbarButtonView.extend({
    title: 'Justified',
    buttonBehavior: SC.TOGGLE_ON_BEHAVIOR,
    valueBinding: '.parentView.editor.selectionIsJustified'
  }),

  centerButton: RichText.ToolbarButtonView.extend({
    title: 'Center',
    buttonBehavior: SC.TOGGLE_ON_BEHAVIOR,
    valueBinding: '.parentView.editor.selectionIsCentered'
  }),

  rightAlignButton: RichText.ToolbarButtonView.extend({
    title: 'Right',
    buttonBehavior: SC.TOGGLE_ON_BEHAVIOR,
    valueBinding: '.parentView.editor.selectionIsRightAligned'
  }),

  defaultColorButton: RichText.ToolbarButtonView.extend({
    title: 'Default Color',
    buttonBehavior: SC.TOGGLE_ON_BEHAVIOR,
    valueBinding: '.parentView.editor.selectionIsDefaultColor'
  }),

  hightlightButton: RichText.ToolbarButtonView.extend({
    title: 'Highlight',
    valueBinding: '.parentView.editor.selectionIsHighlighted'
  }),

  highlightBackgroundButton: RichText.ToolbarButtonView.extend({
    title: 'Highlight BG',
    valueBinding: '.parentView.editor.selectionIsBackgroundHighlighted'
  })

});