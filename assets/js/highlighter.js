export default class SyntaxHighlighter {
  #definitions;
  #languageRegexCache = new Map();

  /**
   * Defines the token patterns for each language.
   * The order is important for matching, as the first matching rule for a
   * given position in the string will be used.
   */
  static #buildDefinitions() {
    const buildKeywordRegex = (keywords) => new RegExp(`\\b(${keywords.join('|')})\\b`);
    return {
      js: [
        { name: 'comment', pattern: /(?:\/\*[\s\S]*?\*\/|\/\/.*)/ },
        { name: 'string', pattern: /(?:`(?:\\.|[^`])*`|"(?:\\.|[^"])*"|'(?:\\.|[^'])*')/ },
        { name: 'keyword', pattern: buildKeywordRegex([
          'const','let','var','function','return','if','else','for','while',
          'async','await','try','catch','finally','class','extends','super',
          'import','export','from','default','new','this','switch','case',
          'break','continue','delete','typeof','instanceof','in','of','yield',
          'debugger','with','get','set'
        ])},
        { name: 'class_name', pattern: /\b([A-Z][\w$]*)\b/ },
        { name: 'function_call', pattern: /\b([\w$]+)(?=\s*\()/ },
        { name: 'boolean', pattern: /\b(true|false)\b/ },
        { name: 'null_undefined', pattern: /\b(null|undefined|NaN|Infinity)\b/ },
        { name: 'number', pattern: /\b-?(?:0[xX][\da-fA-F]+|0[oO][0-7]+|0[bB][01]+|\d*\.?\d+(?:[eE][+-]?\d+)?)\b/ },
        { name: 'operator', pattern: /(?:=>|--|\+\+|&&|\|\||\?\?|===|!==|==|!=|<=|>=|[+\-*/%&|!~^=<>?:])/ },
        { name: 'punctuation', pattern: /[.,;\[\]{}()]/ },
        { name: 'property', pattern: /(?<=\.)[a-zA-Z_$][\w$]*/ },
        { name: 'identifier', pattern: /\b[a-zA-Z_$][\w$]*\b/ }
      ],
      css: [
        { name: 'comment', pattern: /\/\*[\s\S]*?\*\// },
        { name: 'string', pattern: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/ },
        { name: 'at_rule', pattern: /@[\w-]+/ },
        { name: 'important', pattern: /!important\b/ },
        { name: 'variable', pattern: /--[\w-]+/ },
        { name: 'function', pattern: /\b(?:url|var|calc|rgb|rgba|hsl|hsla|linear-gradient|radial-gradient)\b/ },
        { name: 'color', pattern: /#[0-9a-fA-F]{3,8}\b/ },
        { name: 'number', pattern: /\b\d+(?:\.\d+)?(?:px|em|rem|%|vw|vh|s|ms|deg)?\b/ },
        { name: 'property', pattern: /\b[\w-]+(?=\s*:)/ },
        { name: 'selector', pattern: /[.#]?[\w-]+/ },
        { name: 'punctuation', pattern: /[{}():;,]/ }
      ],
      html: [
        { name: 'comment', pattern: /(?:<!--[\s\S]*?-->)/ },
        { name: 'doctype', pattern: /(?:<!DOCTYPE[^>]+>)/i },
        { name: 'cdata', pattern: /(?:<!\[CDATA\[[\s\S]*?]]>)/ },
        { name: 'tag', pattern: /(?:<\/?)([\w-]+)/ },
        { name: 'attr_name', pattern: /(?:\s+)([\w:-]+)(?==)/ },
        { name: 'attr_value', pattern: /(?:=")([^"]*)(?:")|='([^']*)'/ },
        { name: 'entity', pattern: /(&[\da-z#]+;)/i },
        { name: 'punctuation', pattern: /[<>/?=]/ },
      ],
      bash: [
        { name: 'comment', pattern: /#.*/ },
        { name: 'string', pattern: /(?:"(?:\\.|[^"\\])*"|'[^']*')/ },
        { name: 'variable', pattern: /\$(?:\w+|\{[^}]*\}|\d+|[#@*?$!-])/ },
        { name: 'keyword', pattern: buildKeywordRegex([
          'if', 'then', 'else', 'elif', 'fi', 'for', 'while', 'until', 'do', 'done',
          'case', 'esac', 'function', 'return', 'break', 'continue', 'exit',
          'local', 'export', 'readonly', 'declare', 'unset', 'source', 'alias'
        ])},
        { name: 'command', pattern: buildKeywordRegex([
          'echo', 'printf', 'read', 'test', 'cd', 'pwd', 'ls', 'cp', 'mv', 'rm',
          'mkdir', 'rmdir', 'chmod', 'chown', 'grep', 'sed', 'awk', 'sort', 'uniq',
          'cat', 'head', 'tail', 'wc', 'find', 'which', 'type', 'true', 'false'
        ])},
        { name: 'operator', pattern: /(?:&&|\|\||>>|<<|[|&;<>])/ },
        { name: 'flag', pattern: /-{1,2}[a-zA-Z0-9][a-zA-Z0-9-]*/ },
        { name: 'number', pattern: /\b\d+\b/ },
        { name: 'punctuation', pattern: /[(){}[\]]/ }
      ],
      json: [
        { name: 'property', pattern: /"(?:\\.|[^"\\])*"(?=\s*:)/ },
        { name: 'string', pattern: /"(?:\\.|[^"\\])*"/ },
        { name: 'number', pattern: /-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/ },
        { name: 'boolean', pattern: /\b(true|false)\b/ },
        { name: 'null', pattern: /\bnull\b/ },
        { name: 'punctuation', pattern: /[{}[\],:]/ }
      ],
      xml: [
        { name: 'comment', pattern: /<!--[\s\S]*?-->/ },
        { name: 'cdata', pattern: /<!\[CDATA\[[\s\S]*?\]\]>/ },
        { name: 'processing_instruction', pattern: /<\?[\s\S]*?\?>/ },
        { name: 'doctype', pattern: /<!DOCTYPE[\s\S]*?>/i },
        { name: 'tag', pattern: /<\/?[\w:-]+/ },
        { name: 'attr_name', pattern: /(?:\s+)([\w:-]+)(?==)/ },
        { name: 'attr_value', pattern: /=(?:"[^"]*"|'[^']*')/ },
        { name: 'entity', pattern: /&[\w#]+;/ },
        { name: 'punctuation', pattern: /[<>/=?!]/ }
      ]
    };
  }

  /**
   * Initializes the highlighter and applies it to all elements matching the selector.
   * @param {string} selector - A CSS selector for the code elements to highlight.
   */
  constructor(selector = 'pre code[class*="language-"]') {
    this.#definitions = SyntaxHighlighter.#buildDefinitions();
    document.querySelectorAll(selector).forEach(this.highlightElement);
  }

  /**
   * Creates a single, combined RegExp for a given language.
   * This is more efficient than running multiple RegExps.
   * @param {string} language The language to build a regex for.
   * @returns {RegExp} A single RegExp for tokenizing.
   */
  #getCombinedRegex(language) {
    if (this.#languageRegexCache.has(language)) {
      return this.#languageRegexCache.get(language);
    }

    const rules = this.#definitions[language];
    const combinedPattern = rules
      .map(rule => `(?<${rule.name}>${rule.pattern.source})`)
      .join('|');

    const regex = new RegExp(combinedPattern, 'g');
    this.#languageRegexCache.set(language, regex);
    return regex;
  }

  /**
   * Escapes HTML special characters in a string.
   * @param {string} str The string to escape.
   * @returns {string} The escaped string.
   */
  #escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /**
   * Highlights a single code element using a linear parsing method.
   * @param {HTMLElement} element The code element to apply syntax highlighting to.
   */
  highlightElement = (element) => {
    const language = element.className.match(/language-(\w+)/)?.[1];
    if (!language || !this.#definitions[language]) {
      element.innerHTML = this.#escapeHtml(element.textContent);
      return;
    }

    const code = element.textContent;
    const regex = this.#getCombinedRegex(language);
    const rules = this.#definitions[language];

    let result = '';
    let lastIndex = 0;

    for (const match of code.matchAll(regex)) {
      const precedingText = code.substring(lastIndex, match.index);
      result += this.#escapeHtml(precedingText);
      const tokenType = Object.keys(match.groups).find(key => match.groups[key] !== undefined);
      const matchedText = match[0];
            
      if (tokenType) {
        const cssClassName = tokenType.replace(/_/g, '-');
        result += `<span class="token-${cssClassName}">${this.#escapeHtml(matchedText)}</span>`;
      } else {
        result += this.#escapeHtml(matchedText);
      }
      lastIndex = match.index + matchedText.length;
    }
    const remainingText = code.substring(lastIndex);
    result += this.#escapeHtml(remainingText);
    element.innerHTML = result;
  };
}