sc_require('views/toolbar_button');

RichText.ToolbarView = SC.View.extend(
/** @scope RichText.ToolbarView.prototype */ {

  classNames: 'rich-text-toolbar-view',

  childViews: ('strikethroughButton boldButton underlineButton italicsButton ' + 
               'leftAlignButton justifyButton centerButton rightAlignButton ' +
               'defaultColorButton hightlightButton highlightBackgroundButton ' +
               'increaseSizeButton decreaseSizeButton resetSizeButton ' +
               'superscriptButton subscriptButton removeFormattingButton').w(),

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
  }),

  highlightBackgroundButton: RichText.ToolbarButtonView.extend({
    title: 'Highlight BG',
    valueBinding: '.parentView.editor.selectionIsBackgroundHighlighted'
  }),

  increaseSizeButton: RichText.ToolbarButtonView.extend({
    title: '+',
    buttonBehavior: SC.PUSH_BEHAVIOR,
    targetBinding: '.parentView.editor',
    action: 'selectionIncreaseSize',
    valueBinding: '.parentView.editor.selectionIsSizeIncreased'
  }),

  decreaseSizeButton: RichText.ToolbarButtonView.extend({
    title: '-',
    buttonBehavior: SC.PUSH_BEHAVIOR,
    targetBinding: '.parentView.editor',
    action: 'selectionDecreaseSize',
    valueBinding: '.parentView.editor.selectionIsSizeDecreased'
  }),

  resetSizeButton: RichText.ToolbarButtonView.extend({
    title: '+-',
    buttonBehavior: SC.TOGGLE_ON_BEHAVIOR,
    valueBinding: '.parentView.editor.selectionIsDefaultSize'
  }),

  superscriptButton: RichText.ToolbarButtonView.extend({
    title: 'Super',
    valueBinding: '.parentView.editor.selectionIsSuperscript'
  }),

  subscriptButton: RichText.ToolbarButtonView.extend({
    title: 'Sub',
    valueBinding: '.parentView.editor.selectionIsSubscript'
  }),

  removeFormattingButton: RichText.ToolbarButtonView.extend({
    title: 'Remove',
    buttonBehavior: SC.PUSH_BEHAVIOR,
    targetBinding: '.parentView.editor',
    action: 'selectionRemoveFormatting'
  })

});