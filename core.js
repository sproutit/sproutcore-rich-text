// ==========================================================================
// Project:   RichText - SproutCore RichTextEditor
// Copyright: ©2010 Peter Wagenet
// ==========================================================================
/*globals RichText */

/** @namespace

  My cool new framework.  Describe your framework.
  
  @extends SC.Object
*/
RichText = SC.Object.create(
  /** @scope RichText.prototype */ {

  NAMESPACE: 'RichText',
  VERSION: '0.4.0',

  // TODO: Add global constants or singleton objects needed by your app here.

  blank: function(val) {
    return SC.none(val) || val === '';
  }

}) ;
