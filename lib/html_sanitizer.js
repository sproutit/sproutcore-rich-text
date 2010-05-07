/* Ported from Wysihat - needs proper credit */

// TODO: Do we need to undo the nested lists?

// TODO: Do we need to undo the font cleanup?
/*
    For colors IE 8, Chrome and Safari generate font tags like: <font color='#000000'>
    For bg-color IE 8 generates a font tag like: <FONT style="BACKGROUND-COLOR: #000000">

    For sizing IE 8 and FF generate a font tag: <font size=#>
      Chrome and Safari do: <span class="Apple-style-span" style="font-size: x-large;">
*/

// TODO: Do we need to undo the indent cleanup?
/*
    Chrome and Safari nest blockquotes:
      <blockquote class = "webkit-indent-blockquote" style="margin: 0 0 0 40px; border: none; padding: 0px;">
    FF adds: style="margin-left: 40px" to existing elements (or duplicates)
      and will avoid nesting when possible, so you'll end up with 80px, 120px, 160px...
    IE 8 nests blockquotes:
      <BLOCKQUOTE style="MARGIN-RIGHT: 0px" dir=ltr>
*/

RichText.HtmlSanitizer = {

  // From wysihat
  fontSizeNames: function() {
    var fontSizeNames = 'xxx-small xx-small x-small small medium large x-large xx-large'.w();

    if (SC.browser.safari) {
      fontSizeNames.shift();
      fontSizeNames.push('-webkit-xxx-large');
    }

    return fontSizeNames;
  }.property().cacheable(),

  fontSizePixels: '9 10 13 16 18 24 32 48'.w(),

  formatHTMLOutput: function(text) {
    var replaced, newTag, children, child, el, prev, fontColor, fontBgColor, fontSize, idx;

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

      // Aren't these redundant?
      //text = this._gsub(text, /^<p>/, '');
      //text = this._gsub(text, /<\/p>$/, '');
    }

    // text = this._gsub(text, /<b>/, "<strong>");
    // text = this._gsub(text, /<\/b>/, "</strong>");
    text = text.replace(/<b>/g, '<strong>');
    text = text.replace(/<\/b>/g, '</strong>');

    // text = this._gsub(text, /<i>/, "<em>");
    // text = this._gsub(text, /<\/i>/, "</em>");
    text = text.replace(/<i>/g, '<em>');
    text = text.replace(/<\/i>/g, '</em>');

    // text = this._gsub(text, /<(strike|s)>/, "<del>");
    // text = this._gsub(text, /<\/(strike|s)>/, "</del>");
    text = text.replace(/<(strike|s)>/g, '<del>');
    text = text.replace(/<\/(strike|s)>/g, '</del>');

    text = text.replace(/\n\n+/g, "</p>\n\n<p>");

    // text = this._gsub(text, (/(([^\n])(\n))(?=([^\n]))/), function(match){
    //   return match[2] + '<br />\n';
    // });
    text = text.replace(/([^\n])\n([^\n])/, function(m0, m1, m2){
      return m1+'<br />\n'+m2;
    });

    text = '<p>' + text + '</p>';

    text = text.replace(/<p>\s*/g, "<p>");
    text = text.replace(/\s*<\/p>/g, "</p>");

    var element = SC.$('<div></div>');
    element.html(text);

    // Proper list nesting
    element.find('ul, ol').each(function(){
      el = SC.$(this);
      prev = el.prev()[0];
      if (prev && prev.tagName === 'LI') el.prev().append(this);
    });

    // Cleanup font tags
    children = element.find('font');
    for(idx=0; idx < children.length; idx++) {
      child = children[idx];
      el = SC.$(child);
      newTag = SC.$('<span>'+el.html()+'</span>');

      // IE 8, Chrome, Safari
      if (fontColor = el.attr('color')) {
        newTag.css('color', fontColor);
      }
      // IE 8
      if (fontBgColor = child.style.backgroundColor) {
        newTag.css('background-color', fontBgColor);
      }
      // IE 8, FF
      if (fontSize = el.attr('size')) {
        newTag.css('font-size', this._fontSizeToPixels(fontSize));
      }

      el.replaceWith(newTag);
    };

    children = element.find('span');
    for(idx=0; idx < children.length; idx++){
      child = children[idx];
      el = SC.$(child);

      fontColor = child.style.color;
      fontBgColor = child.style.backgroundColor;

      if (fontColor === 'transparent' || fontColor === 'inherit') el.css('color', '');
      if (fontBgColor === 'transparent' || fontBgColor === 'inherit') el.css('background-color', '');

      if (child.style.length === 0) el.removeAttr('style');
    };

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
            if (el.attr('class') === '') el.removeAttr('class');
            replaced = true;
          } else if (child.style.fontWeight === 'bold') {
            el.css({fontWeight: ''});
            if (child.style.length === 0) el.removeAttr('style');
            el.html('<strong>' + el.html() + '</strong>');
            replaced = true;
          } else if (child.style.fontStyle === 'italic') {
            el.css({fontStyle: ''});
            if (child.style.length === 0) el.removeAttr('style');
            el.html('<em>' + el.html() + '</em>');
            replaced = true;
          } else if (child.style.textDecoration.match('underline')) {
            el.css({textDecoration: child.style.textDecoration.replace('underline', '').trim() });
            if (child.style.length === 0) el.removeAttr('style');
            el.html('<u>' + el.html() + '</u>');
            replaced = true;
          // TODO: Is this appropriate for safari?
          } else if (child.style.textDecoration.match('line-through')) {
            el.css({textDecoration: child.style.textDecoration.replace('line-through', '').trim() });
            if (child.style.length === 0) el.removeAttr('style');
            el.html('<del>' + el.html() + '</del>');
            replaced = true;
          } else if (fontSize = this._fontNameToPixels(child.style.fontSize)) {
            el.css('font-size', fontSize);
            replaced = true;
          } else if (child.attributes.length === 0) {
            el.replaceWith(el.html());
            replaced = true;
          }
        };
      } while (replaced);

    }


    // Cleanup indents

    if (SC.browser.safari || SC.browser.msie) {
      do {
        children = element.find('blockquote');
        children.each(function(){
          el = SC.$(this);
          el.replaceWith("<div style='margin-left: 40px'>"+el.html()+"</div>");
        });
      } while (children.length > 0);
    }

    // Remove attributes on BRs

    element.find('br').replaceWith('<br />');

    // Cleanup blank tags

    var acceptableBlankTags = ['BR', 'IMG'];

    element.find('*').
      filter(function(){ 
        return SC.$(this).html() === '' &&
                acceptableBlankTags.indexOf(this.nodeName) === -1 &&
                this.id !== 'bookmark';
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
        if (this.style.fontWeight === 'bold') {
          SC.$(this).addClass('Apple-style-span');
        }

        if (this.style.fontStyle === 'italic') {
          SC.$(this).addClass('Apple-style-span');
        }

        if (this.style.textDecoration === 'underline') {
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
    //text = this._gsub(text, /\r\n?/, "\n");
    text = text.replace(/\r\n?/, '\n');

    // text = this._gsub(text, /<([A-Z]+)([^>]*)>/, function(match) {
    //   return '<' + match[1].toLowerCase() + match[2] + '>';
    // });
    text = text.replace(/<([A-Z]+)([^>]*)>/, function(m0, m1, m2){
      return '<' + m1.toLowerCase() + m2 + '>';
    });

    // text = this._gsub(text, /<\/([A-Z]+)>/, function(match) {
    //   return '</' + match[1].toLowerCase() + '>';
    // });
    text = text.replace(/<\/([A-Z]+)>/, function(m0, m1){
      return '</' + m1.toLowerCase() + '>';
    });

    text = text.replace(/<br>/g, "<br />");

    return text;
  },

  // From wysihat
  standardizeColor: function(color) {
    var idx;

    if (!color || color.match(/[0-9a-f]{6}/i)) return color;

    var m = color.toLowerCase().match(/^(rgba?|hsla?)\(([\s\.\-,%0-9]+)\)/);
    if(m){
      var c = m[2].split(/\s*,\s*/), l = c.length, t = m[1];
      if((t == "rgb" && l == 3) || (t == "rgba" && l == 4)){
        var r = c[0];
        if(r.charAt(r.length - 1) == "%"){
          var a = [];
          for(idx=0; idx < c.length; idx++) a.push(parseFloat(c[idx]) * 2.56);
          if(l == 4){ a[3] = c[3]; }
          return this._colorFromArray(a);
        }
        return this._colorFromArray(c);
      }
      if((t == "hsl" && l == 3) || (t == "hsla" && l == 4)){
        var H = ((parseFloat(c[0]) % 360) + 360) % 360 / 360,
          S = parseFloat(c[1]) / 100,
          L = parseFloat(c[2]) / 100,
          m2 = L <= 0.5 ? L * (S + 1) : L + S - L * S,
          m1 = 2 * L - m2,
          a = [this._hue2rgb(m1, m2, H + 1 / 3) * 256,
            this._hue2rgb(m1, m2, H) * 256, this._hue2rgb(m1, m2, H - 1 / 3) * 256, 1];
        if(l == 4){ a[3] = c[3]; }
        return this._colorFromArray(a);
      }
    }
    return null; // dojo.Color
  },

  // From wysihat
  _colorFromArray: function(a) {
    var arr = [], idx;

    // Entirely transparent, so we don't really have a valid value
    if (a[3] === 0 || a[3] === '0') return null;

    for(idx=0; idx < 3 && idx < a.length; idx++){
      var s = parseInt(a[idx], 10).toString(16);
      arr.push(s.length < 2 ? "0" + s : s);
    };
    return "#" + arr.join(""); // String
  },

  _hue2rgb: function(m1, m2, h){
    if(h < 0){ ++h; }
    if(h > 1){ --h; }
    var h6 = 6 * h;
    if(h6 < 1){ return m1 + (m2 - m1) * h6; }
    if(2 * h < 1){ return m2; }
    if(3 * h < 2){ return m1 + (m2 - m1) * (2 / 3 - h) * 6; }
    return m1;
  },

  // From wysihat
  standardizeFontSize: function(fontSize) {
    var newSize, match;

    if (match = fontSize.match(/^(\d+)px$/)) {
      var fontSizePixels = this.fontSizePixels,
          tempSize = parseInt(match[1], 10),
          idx;

      newSize = 0;
      for(idx=0; idx < fontSizePixels.length; idx++) {
        if (tempSize > fontSizePixels[idx]) {
          newSize = idx + 1;
        } else {
          break;
        }
      }

      return newSize;
    } else {
      newSize = this.fontSizeNames().indexOf(fontSize);
      if (newSize >= 0) return newSize;
    }

    // Fallback
    return parseInt(fontSize, 10);
  },

  _fontSizeToPixels: function(fontSize) {
    var fontSizePixels = this.fontSizePixels,
        index = parseInt(fontSize, 10);
    if (index >= fontSizePixels.length) index = fontSizePixels.length - 1;
    return fontSizePixels[index] + 'px';
  },

  _fontNameToPixels: function(fontName) {
    var fontSizeNames = this.fontSizeNames(),
        fontSizePixels = this.fontSizePixels,
        index;

    index = fontSizeNames.indexOf(fontName);

    if (index >= 0) {
      return fontSizePixels[index] + 'px';
    } else {
      return null;
    }
  }

  // _gsub: function(source, pattern, replacement) {
  //   var result = '', match;
  // 
  //   while (source.length > 0) {
  //     if (match = source.match(pattern)) {
  //       result += source.slice(0, match.index);
  //       replaced = (typeof(replacement) === 'function') ? replacement(match) : replacement;
  //       result += replaced === null ? '' : String(replaced);
  //       source  = source.slice(match.index + match[0].length);
  //     } else {
  //       result += source;
  //       source = '';
  //     }
  //   }
  //   return result;
  // }

};