/* Ported from Wysihat - needs proper credit */

// TODO: Confirm that strike through is handled properly
// FIXME: Cleanup 'inherit' styles

RichText.HtmlSanitizer = {

  formatHTMLOutput: function(text) {
    var replaced, newTag, children, child, el, fontColor, fontBgColor, fontSize, idx;

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
      // TODO: Is this really the most efficient way to do it?
      do {
        replaced = false;
        children = element.find('span');
        for(idx=0; idx < children.length; idx++){
          child = children[idx];
          el = SC.$(child);
          if (el.hasClass('Apple-style-span')) {
            el.removeClass('Apple-style-span');
            if (el.attr('class') == '') el.removeAttr('class');
            replaced = true;
          } else if (el.css('fontWeight') == 'bold') {
            el.css({fontWeight: ''});
            if (child.style.length == 0) el.removeAttr('style');
            el.html('<strong>' + el.html() + '</strong>');
            replaced = true;
          } else if (el.css('fontStyle') == 'italic') {
            el.css({fontStyle: ''});
            if (child.style.length == 0) el.removeAttr('style');
            el.html('<em>' + el.html() + '</em>');
            replaced = true;
          } else if (el.css('textDecoration') == 'underline') {
            el.css({textDecoration: ''});
            if (child.style.length == 0) el.removeAttr('style');
            el.html('<u>' + el.html() + '</u>');
            replaced = true;
          // TODO: Is this appropriate for safari?
          } else if (el.css('textDecoration') == 'line-through') {
            el.css({textDecoration: ''});
            if (child.style.length == 0) el.removeAttr('style');
            el.html('<del>' + el.html() + '</del>');
            replaced = true;
          } else if (child.attributes.length == 0) {
            el.replaceWith(el.html());
            replaced = true;
          }
        };
      } while (replaced);

    }

    var acceptableBlankTags = ['BR', 'IMG'];

    element.find('*').
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
      element.find('strong').each(function() {
        SC.$(this).replaceWith('<span style="font-weight: bold;">' + SC.$(this).html() + '</span>');
      });

      element.find('em').each(function() {
        SC.$(this).replaceWith('<span style="font-style: italic;">' + SC.$(this).html() + '</span>');
      });

      element.find('u').each(function() {
        SC.$(this).replaceWith('<span style="text-decoration: underline;">' + SC.$(this).html() + '</span>');
      });

      element.find('del').each(function() {
        SC.$(this).replaceWith('<span style="text-decoration: line-through;">' + SC.$(this).html() + '</span>');
      });
    }

    if (SC.browser.safari) {
      element.find('span').each(function() {
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