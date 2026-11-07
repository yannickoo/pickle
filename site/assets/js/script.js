// Landing page demos. Expects the UMD build (window.Pickle) to be loaded first.
const Pickle = window.Pickle;

const memoryText = () => {
  const mem = performance.memory;
  return mem ? `${(mem.usedJSHeapSize / 1048576).toFixed(1)} MB` : null;
};

const setStatus = (el, text, state) => {
  el.textContent = text;
  el.className = `metric-value status-${state}`;
};

const setBusy = (button, busy) => {
  button.disabled = busy;
  button.querySelector('.loading-spinner').style.display = busy ? 'inline-block' : 'none';
};

/* ------------------------------------------------------------------ */
/* Live demo with theme switcher                                       */
/* ------------------------------------------------------------------ */
function initDemo() {
  const demo = new Pickle('#pickle-demo-1', { theme: 'landing-page' });
  const buttons = document.querySelectorAll('.theme-button');

  // aria-pressed marks the active theme; the CSS styles it.
  buttons.forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.theme === demo.theme));
    button.addEventListener('click', () => {
      demo.setTheme(button.dataset.theme);
      buttons.forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    });
  });
}

/* ------------------------------------------------------------------ */
/* The Incinerator: 100,000 options                                    */
/* ------------------------------------------------------------------ */
function initIncinerator() {
  const OPTION_COUNT = 100000;
  const button = document.getElementById('start-incinerator');
  const container = document.getElementById('incinerator-container');
  const select = document.getElementById('incinerator-select');
  const status = document.getElementById('performance-status');
  let instance = null;

  button.addEventListener('click', () => {
    setBusy(button, true);
    container.style.display = '';
    setStatus(status, 'Loading…', 'loading');

    // Let the status paint before the heavy work starts.
    requestAnimationFrame(() => setTimeout(() => {
      instance?.destroy();
      select.length = 1; // keep the placeholder option

      const start = performance.now();
      const fragment = document.createDocumentFragment();
      for (let i = 1; i <= OPTION_COUNT; i++) {
        fragment.appendChild(new Option(`Option ${i.toLocaleString('en-US')}`, `opt-${i}`));
      }
      select.appendChild(fragment);
      instance = new Pickle(select, { theme: 'landing-page', searchable: true });
      const elapsed = performance.now() - start;

      document.getElementById('option-count').textContent = OPTION_COUNT.toLocaleString('en-US');
      document.getElementById('render-time').textContent = `${elapsed.toFixed(0)}ms`;
      const mem = memoryText();
      if (mem) document.getElementById('memory-usage').textContent = mem;
      setStatus(status, 'Complete', 'complete');

      button.querySelector('.button-text').textContent = 'Stoke it again';
      setBusy(button, false);
    }, 0));
  });
}

/* ------------------------------------------------------------------ */
/* The Maelstrom: rapid add/remove                                     */
/* ------------------------------------------------------------------ */
function initMaelstrom() {
  const button = document.getElementById('toggle-maelstrom');
  const label = button.querySelector('.button-text');
  const spinner = button.querySelector('.loading-spinner');
  const container = document.getElementById('maelstrom-container');
  const status = document.getElementById('maelstrom-status');
  const opCountEl = document.getElementById('op-count');
  const optionCountEl = document.getElementById('maelstrom-option-count');
  const memoryEl = document.getElementById('maelstrom-memory-usage');

  let instance = null;
  let timer = null;
  let ops = 0;
  let nextId = 1;

  const tick = () => {
    const options = instance.getOptions();
    const shouldAdd = options.length < 5 || (options.length < 200 && Math.random() < 0.6);

    if (shouldAdd) {
      const id = nextId++;
      instance.addOption(`swirl-${id}`, `Swirling option #${id}`);
    } else {
      const victim = options[Math.floor(Math.random() * options.length)];
      instance.removeOption(victim.value);
    }

    ops++;
    opCountEl.textContent = ops.toLocaleString('en-US');
    optionCountEl.textContent = instance.getOptions().length.toLocaleString('en-US');
    if (ops % 20 === 0) {
      const mem = memoryText();
      if (mem) memoryEl.textContent = mem;
    }
  };

  button.addEventListener('click', () => {
    if (!instance) {
      container.style.display = '';
      instance = new Pickle('#maelstrom-select', { theme: 'landing-page', searchable: true });
    }

    if (timer) {
      clearInterval(timer);
      timer = null;
      label.textContent = 'Summon the Maelstrom';
      spinner.style.display = 'none';
      setStatus(status, 'Idle', 'ready');
    } else {
      timer = setInterval(tick, 50);
      label.textContent = 'Calm the Maelstrom';
      spinner.style.display = 'inline-block';
      setStatus(status, 'Running', 'running');
    }
  });
}

/* ------------------------------------------------------------------ */
/* The Anvil: malicious & malformed strings                            */
/* ------------------------------------------------------------------ */
function initAnvil() {
  const input = document.getElementById('anvil-input');
  const log = document.getElementById('anvil-log');
  const instance = new Pickle('#anvil-select', { theme: 'landing-page', searchable: true });
  let counter = 0;

  // Payloads flip a flag instead of alert(), so the page can report whether anything executed.
  window.__anvilExecuted = false;
  const attacks = {
    'attack-long-string': 'Pickle '.repeat(800).trim(),
    'attack-simple-xss': '<script>window.__anvilExecuted = true</script>Simple XSS',
    'attack-img-xss': '<img src="x" onerror="window.__anvilExecuted = true">Image XSS',
    'attack-unicode': 'Ｐｉｃｋｌｅ 🥒 Z̤͔ͧ̑̓ä͖̭̈̇lͮ̒ͫǫ̗ ‮esrever‬ 日本語 العربية \u0000 null'
  };

  const write = (message) => {
    const time = new Date().toLocaleTimeString();
    log.textContent = `[${time}] ${message}\n${log.textContent}`;
  };

  const verify = (action) => {
    // Give onerror handlers a moment to fire before checking.
    setTimeout(() => {
      const injected = instance.wrapper?.querySelector('script, img, iframe, object, embed');
      if (window.__anvilExecuted || injected) {
        write(`✗ ${action}: payload produced live markup or executed`);
      } else {
        write(`✓ ${action}: rendered as plain text, nothing executed`);
      }
    }, 150);
  };

  const getString = () => {
    if (!input.value) {
      write('Enter a string first, or pick a pre-canned attack.');
      return null;
    }
    return input.value;
  };

  Object.entries(attacks).forEach(([id, payload]) => {
    document.getElementById(id)?.addEventListener('click', () => {
      input.value = payload;
      write(`Loaded "${document.getElementById(id).textContent}" (${payload.length} chars)`);
    });
  });

  document.getElementById('action-add-option').addEventListener('click', () => {
    const str = getString();
    if (str === null) return;
    instance.addOption(`anvil-${++counter}`, str);
    verify('Add as Option');
  });

  document.getElementById('action-update-options').addEventListener('click', () => {
    const str = getString();
    if (str === null) return;
    instance.updateOptions([
      { value: 'good', text: 'A normal, safe option' },
      { value: str, text: str },
      { value: `${str}-2`, text: `${str} (again)` }
    ]);
    verify('Update All Options');
  });

  document.getElementById('action-set-value').addEventListener('click', () => {
    const str = getString();
    if (str === null) return;
    if (!instance.getOptions().some(opt => opt.value === str)) {
      instance.addOption(str, str);
    }
    instance.set(str);
    write(`Value is now ${JSON.stringify(instance.get()).slice(0, 80)}`);
    verify('Set as Value');
  });

  document.getElementById('action-search').addEventListener('click', () => {
    const str = getString();
    if (str === null) return;
    instance.open({ focusOption: false });
    setTimeout(() => {
      if (!instance.searchInput) return;
      instance.searchInput.value = str;
      instance.searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      verify('Search Term');
    }, 0);
  });
}

initDemo();
initIncinerator();
initMaelstrom();
initAnvil();
