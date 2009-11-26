/* Ported from Wysihat - needs proper credit */

// TODO: Confirm that strike through is handled properly
// FIXME: Cleanup 'inherit' styles

RichText.HtmlSanitizer = {

  formatHTMLOutput: function(text) {
    text = this.tidyXHTML(text);

    if (SC.browser.safari) {
      text = text.replace(/(<div>)+/g, "\n");
      text = text.replace(/(<\/div>)+/g, "");

      text = text.replace(/<p>\s*<\/p>/g, "");

      text = text.replace(/<br \/>(\n)*/g, "\n");
    } else if (SC.browser.mozilla) {
      text = text.replace(/<p>/g, "");
      text = text.replace(/<\/p>(\n)?/g, "\n");

      text = text.replace(/<br \/>(\n)*/g, "\n");
    } else if (SC.browser.msie || SC.browser.opera) {
      text = text.replace(/<p>(&nbsp;|&#160;|\s)<\/p>/g, "<p></p>");

      text = text.replace(/<br \/>/g, "");

      text = text.replace(/<p>/g, '');

      text = text.replace(/&nbsp;/g, '');

      text = text.replace(/<\/p>(\n)?/g, "\n");

      text = this._gsub(text, /^<p>/, '');
      text = this._gsub(text, /<\/p>$/, '');
    }

    text = this._gsub(text, /<b>/, "<strong>");
    text = this._gsub(text, /<\/b>/, "</strong>");

    text = this._gsub(text, /<i>/, "<em>");
    text = this._gsub(text, /<\/i>/, "</em>");

    text = this._gsub(text, /<(strike|s)>/, "<del>");
    text = this._gsub(text, /<\/(strike|s)>/, "</del>");

    text = text.replace(/\n\n+/g, "</p>\n\n<p>");

    text = this._gsub(text, /(([^\n])(\n))(?=([^\n]))/, function(match){
      return match[2] + '<br />\n';
    });

    text = '<p>' + text + '</p>';

    text = text.replace(/<p>\s*/g, "<p>");
    text = text.replace(/\s*<\/p>/g, "</p>");

    var element = SC.$('<div></div>');
    element.html(text);

    if (SC.browser.safari || SC.browser.mozilla) {
      var replaced;
      do {
        replaced = false;
        element.children('span').each(function() {
          if (SC.$(this).hasClass('Apple-style-span')) {
            SC.$(this).removeClass('Apple-style-span');
            if (SC.$(this).attr('class') == '') SC.$(this).removeAttr('class');
            replaced = true;
          } else if (SC.$(this).css('fontWeight') == 'bold') {
            SC.$(this).css({fontWeight: ''});
            if (this.style.length == 0) SC.$(this).removeAttr('style');
            SC.$(this).html('<strong>' + SC.$(this).html() + '</strong>');
            replaced = true;
          } else if (SC.$(this).css('fontStyle') == 'italic') {
            SC.$(this).css({fontStyle: ''});
            if (this.style.length == 0) SC.$(this).removeAttr('style');
            SC.$(this).html('<em>' + SC.$(this).html() + '</em>');
            replaced = true;
          } else if (SC.$(this).css('textDecoration') == 'underline') {
            SC.$(this).css({textDecoration: ''});
            if (this.style.length == 0) SC.$(this).removeAttr('style');
            SC.$(this).html('<u>' + SC.$(this).html() + '</u>');
            replaced = true;
          // TODO: Is this appropriate for safari?
          } else if (SC.$(this).css('textDecoration') == 'line-through') {
            SC.$(this).css({textDecoration: ''});
            if (this.style.length == 0) SC.$(this).removeAttr('style');
            SC.$(this).html('<del>' + SC.$(this).html() + '</del>');
            replaced = true;
          } else if (this.attributes.length == 0) {
            SC.$(this).replaceWith(SC.$(this).html());
            replaced = true;
          }
        });
      } while (replaced);

    }

    var acceptableBlankTags = ['BR', 'IMG'];

    element.children().
      filter(function(){ 
        return SC.$(this).html() == '' &&
                acceptableBlankTags.indexOf(this.nodeName) == -1 &&
                this.id != 'bookmark';
      }).remove();

    text = element.html();
    text = this.tidyXHTML(text);

    text = text.replace(/<br \/>(\n)*/g, "<br />\n");
    text = text.replace(/<\/p>\n<p>/g, "</p>\n\n<p>");

    text = text.replace(/<p>\s*<\/p>/g, "");

    text = text.replace(/\s*$/g, "");

    return text;
  },

  formatHTMLInput: function(text) {
    var element = SC.$('<div></div>');
    element.html(text);

    if (SC.browser.mozilla || SC.browser.safari) {
      element.children('strong').each(function(){
        SC.$(this).replaceWith('<span style="font-weight: bold;">' + SC.$(this).html() + '</span>');
      });

      element.children('strong').each(function() {
        SC.$(this).replaceWith('<span style="font-weight: bold;">' + SC.$(this).html() + '</span>');
      });

      element.children('em').each(function() {
        SC.$(this).replaceWith('<span style="font-style: italic;">' + SC.$(this).html() + '</span>');
      });

      element.children('u').each(function() {
        SC.$(this).replaceWith('<span style="text-decoration: underline;">' + SC.$(this).html() + '</span>');
      });

      element.children('del').each(function() {
        SC.$(this).replaceWith('<span style="text-decoration: line-through;">' + SC.$(this).html() + '</span>');
      });
    }

    if (SC.browser.safari) {
      element.children('span').each(function() {
        if (SC.$(this).css('fontWeight') == 'bold') {
          SC.$(this).addClass('Apple-style-span');
        }

        if (SC.$(this).css('fontStyle') == 'italic') {
          SC.$(this).addClass('Apple-style-span');
        }

        if (SC.$(this).css('textDecoration') == 'underline') {
          SC.$(this).addClass('Apple-style-span');
        }
      });
    }


    text = element.html();
    text = this.tidyXHTML(text);

    text = text.replace(/<\/p>(\n)*<p>/g, "\n\n");

    text = text.replace(/(\n)?<br( \/)?>(\n)?/g, "\n");

    text = text.replace(/^<p>/g, '');
    text = text.replace(/<\/p>$/g, '');

    if (SC.browser.mozilla) {
      text = text.replace(/\n/g, "<br>");
      text = text + '<br>';
    } else if (SC.browser.safari) {
      text = text.replace(/\n/g, "</div><div>");
      text = '<div>' + text + '</div>';
      text = text.replace(/<div><\/div>/g, "<div><br></div>");
    } else if (SC.browser.msie || SC.browser.opera) {
      text = text.replace(/\n/g, "</p>\n<p>");
      text = '<p>' + text + '</p>';
      text = text.replace(/<p><\/p>/g, "<p>&nbsp;</p>");
      text = text.replace(/(<p>&nbsp;<\/p>)+$/g, "");
      text = text.replace(/<del>/g, "<strike>");
      text = text.replace(/<\/del>/g, "</strike>");
    }

    return text;
  },

  tidyXHTML: function(text) {
    text = this._gsub(text, /\r\n?/, "\n");

    text = this._gsub(text, /<([A-Z]+)([^>]*)>/, function(match) {
      return '<' + match[1].toLowerCase() + match[2] + '>';
    });

    text = this._gsub(text, /<\/([A-Z]+)>/, function(match) {
      return '</' + match[1].toLowerCase() + '>';
    });

    text = text.replace(/<br>/g, "<br />");

    return text;
  },

  _gsub: function(source, pattern, replacement) {
    var result = '', match;

    while (source.length > 0) {
      if (match = source.match(pattern)) {
        result += source.slice(0, match.index);
        replaced = (typeof(replacement) == 'function') ? replacement(match) : replacement;
        result += replaced == null ? '' : String(replaced);
        source  = source.slice(match.index + match[0].length);
      } else {
        result += source;
        source = '';
      }
    }
    return result;
  }

};