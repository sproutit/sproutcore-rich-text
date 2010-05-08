sc_require('views/toolbar_button');

RichText.ToolbarView = SC.View.extend(
/** @scope RichText.ToolbarView.prototype */ {

  classNames: 'rich-text-toolbar-view',

  childViews: ('strikethroughButton boldButton underlineButton italicsButton ' +
               'leftAlignButton justifyButton centerButton rightAlignButton ' +
               'defaultColorButton hightlightButton highlightBackgroundButton ' +
               'increaseSizeButton decreaseSizeButton resetSizeButton ' +
               'superscriptButton subscriptButton ' +
               'indentButton outdentButton orderedListButton unorderedListButton ' +
               'removeFormattingButton undoButton redoButton').w(),

  editor: null,

  layout: { top: 0, left: 0, right: 0, bottom: SC.LAYOUT_AUTO },

  strikethroughButton: RichText.ToolbarButtonView.extend({
    title: 'S',
    valueBinding: '*parentView.editor.selection.isStrikethrough'
  }),

  boldButton: RichText.ToolbarButtonView.extend({
    title: 'B',
    valueBinding: '*parentView.editor.selection.isBold'
  }),

  underlineButton: RichText.ToolbarButtonView.extend({
    title: 'U',
    valueBinding: '*parentView.editor.selection.isUnderlined'
  }),

  italicsButton: RichText.ToolbarButtonView.extend({
    title: 'I',
    valueBinding: '*parentView.editor.selection.isItalicized'
  }),

  leftAlignButton: RichText.ToolbarButtonView.extend({
    title: 'Left',
    buttonBehavior: SC.TOGGLE_ON_BEHAVIOR,
    valueBinding: '*parentView.editor.selection.isLeftAligned'
  }),

  justifyButton: RichText.ToolbarButtonView.extend({
    title: 'Justified',
    buttonBehavior: SC.TOGGLE_ON_BEHAVIOR,
    valueBinding: '*parentView.editor.selection.isJustified'
  }),

  centerButton: RichText.ToolbarButtonView.extend({
    title: 'Center',
    buttonBehavior: SC.TOGGLE_ON_BEHAVIOR,
    valueBinding: '*parentView.editor.selection.isCentered'
  }),

  rightAlignButton: RichText.ToolbarButtonView.extend({
    title: 'Right',
    buttonBehavior: SC.TOGGLE_ON_BEHAVIOR,
    valueBinding: '*parentView.editor.selection.isRightAligned'
  }),

  defaultColorButton: RichText.ToolbarButtonView.extend({
    title: 'Default Color',
    buttonBehavior: SC.TOGGLE_ON_BEHAVIOR,
    valueBinding: '*parentView.editor.selection.isDefaultColor'
  }),

  hightlightButton: RichText.ToolbarButtonView.extend({
    title: 'Highlight',
    valueBinding: '*parentView.editor.selection.isHighlighted'
  }),

  highlightBackgroundButton: RichText.ToolbarButtonView.extend({
    title: 'Highlight BG',
    valueBinding: '*parentView.editor.selection.isBackgroundHighlighted'
  }),

  highlightBackgroundButton: RichText.ToolbarButtonView.extend({
    title: 'Highlight BG',
    valueBinding: '*parentView.editor.selection.isBackgroundHighlighted'
  }),

  increaseSizeButton: RichText.ToolbarButtonView.extend({
    title: '+',
    buttonBehavior: SC.PUSH_BEHAVIOR,
    targetBinding: '*parentView.editor.selection',
    action: 'increaseSize',
    valueBinding: '*parentView.editor.selection.isSizeIncreased'
  }),

  decreaseSizeButton: RichText.ToolbarButtonView.extend({
    title: '-',
    buttonBehavior: SC.PUSH_BEHAVIOR,
    targetBinding: '*parentView.editor.selection',
    action: 'decreaseSize',
    valueBinding: '*parentView.editor.selection.isSizeDecreased'
  }),

  resetSizeButton: RichText.ToolbarButtonView.extend({
    title: '+-',
    buttonBehavior: SC.TOGGLE_ON_BEHAVIOR,
    valueBinding: '*parentView.editor.selection.isDefaultSize'
  }),

  superscriptButton: RichText.ToolbarButtonView.extend({
    title: 'Super',
    valueBinding: '*parentView.editor.selection.isSuperscript'
  }),

  subscriptButton: RichText.ToolbarButtonView.extend({
    title: 'Sub',
    valueBinding: '*parentView.editor.selection.isSubscript'
  }),

  indentButton: RichText.ToolbarButtonView.extend({
    title: 'Indent',
    buttonBehavior: SC.PUSH_BEHAVIOR,
    targetBinding: '*parentView.editor.selection',
    action: 'indent'
  }),

  outdentButton: RichText.ToolbarButtonView.extend({
    title: 'Outdent',
    buttonBehavior: SC.PUSH_BEHAVIOR,
    targetBinding: '*parentView.editor.selection',
    action: 'outdent'
  }),

  orderedListButton: RichText.ToolbarButtonView.extend({
    title: 'OL',
    valueBinding: '*parentView.editor.selection.isOrderedList'
  }),

  unorderedListButton: RichText.ToolbarButtonView.extend({
    title: 'UL',
    valueBinding: '*parentView.editor.selection.isUnorderedList'
  }),

  removeFormattingButton: RichText.ToolbarButtonView.extend({
    title: 'Remove',
    buttonBehavior: SC.PUSH_BEHAVIOR,
    targetBinding: '*parentView.editor.selection',
    action: 'removeFormatting'
  }),

  undoButton: RichText.ToolbarButtonView.extend({
    title: 'Undo',
    isEnabledBinding: '*parentView.editor.undoAllowed',
    buttonBehavior: SC.PUSH_BEHAVIOR,
    targetBinding: '*parentView.editor',
    action: 'undoChange'
  }),

  redoButton: RichText.ToolbarButtonView.extend({
    title: 'Redo',
    isEnabledBinding: '*parentView.editor.redoAllowed',
    buttonBehavior: SC.PUSH_BEHAVIOR,
    targetBinding: '*parentView.editor',
    action: 'redoChange'
  })

});