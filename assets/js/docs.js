import SyntaxHighlighter from './highlighter.js';
new SyntaxHighlighter();
document.addEventListener('DOMContentLoaded', () => {
  const sidebarToggle = document.querySelector('.sidebar-toggle');
  const sidebar = document.querySelector('.docs-sidebar');
  const sidebarClose = document.querySelector('.sidebar-close');
  const sidebarOverlay = sidebar;
  const openSidebar = () => {
    sidebar.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  const closeSidebar = () => {
    sidebar.classList.remove('active');
    document.body.style.overflow = '';
  };
  sidebarToggle?.addEventListener('click', openSidebar);
  sidebarClose?.addEventListener('click', closeSidebar);
  sidebar?.addEventListener('click', (e) => {
    if (e.target === sidebar) {
      closeSidebar();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('active')) {
      closeSidebar();
    }
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024) {
      closeSidebar();
    }
  });

  const themeToggle = document.getElementById('theme-toggle');
  // The initial theme is applied by assets/js/theme.js in <head> to avoid a flash.
  themeToggle?.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
    window.setSiteTheme(newTheme);
  });
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
  function updateActiveNavigation() {
    const sections = document.querySelectorAll('.docs-section[id]');
    const navLinks = document.querySelectorAll('.nav-link, .page-nav-link');
        
    let currentSection = '';
        
    sections.forEach(section => {
      const sectionTop = section.getBoundingClientRect().top;
      const sectionHeight = section.offsetHeight;
      if (sectionTop <= 150 && sectionTop + sectionHeight > 150) {
        currentSection = section.id;
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentSection}`) {
        link.classList.add('active');
      }
    });
  }
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(updateActiveNavigation, 10);
  });
  updateActiveNavigation();
  const copyToClipboard = async (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return Promise.resolve();
      } catch (error) {
        console.warn('Clipboard API failed, falling back to legacy method:', error);
      }
    }
        
    return new Promise((resolve, reject) => {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        textArea.style.opacity = '0';
        textArea.style.pointerEvents = 'none';
        textArea.style.tabIndex = '-1';
        textArea.setAttribute('aria-hidden', 'true');
                
        document.body.appendChild(textArea);
                
        textArea.focus();
        textArea.select();
        textArea.setSelectionRange(0, text.length);
                
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
                
        if (successful) {
          resolve();
        } else {
          reject(new Error('Copy command failed'));
        }
      } catch (error) {
        reject(error);
      }
    });
  };
  document.querySelectorAll('.copy-button').forEach(button => {
    button.addEventListener('click', async () => {
      const codeBlock = button.parentElement.querySelector('code');
      if (codeBlock) {
        const code = codeBlock.textContent;
                
        try {
          await copyToClipboard(code);
                    
          const originalHTML = button.innerHTML;
          button.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 6L9 17l-5-5"></path>
          </svg>`;
          button.style.color = 'var(--brand-accent)';
          button.setAttribute('aria-label', 'Copied!');
                    
          setTimeout(() => {
            button.innerHTML = originalHTML;
            button.style.color = '';
            button.setAttribute('aria-label', 'Copy code');
          }, 2000);
                    
        } catch (error) {
          console.error('Copy failed:', error);
                    
          const originalHTML = button.innerHTML;
          button.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"></path>
          </svg>`;
          button.style.color = '#ef4444';
          button.setAttribute('aria-label', 'Copy failed');
                    
          setTimeout(() => {
            button.innerHTML = originalHTML;
            button.style.color = '';
            button.setAttribute('aria-label', 'Copy code');
          }, 2000);
        }
      }
    });
  });
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const docsNav = document.querySelector('.docs-nav');
    
  // On small screens the header menu button opens the docs sidebar.
  mobileMenuToggle?.addEventListener('click', openSidebar);
  sidebar?.querySelectorAll('.nav-link').forEach(link => link.addEventListener('click', closeSidebar));
  document.querySelectorAll('.collapsible-header').forEach(header => {
    header.addEventListener('click', () => {
      const content = header.nextElementSibling;
      const isOpen = content.style.display !== 'none';
            
      content.style.display = isOpen ? 'none' : 'block';
      header.classList.toggle('collapsed', isOpen);
    });
  });
  const searchInput = document.querySelector('#docs-search');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const searchTerm = searchInput.value.toLowerCase();
      console.log('Searching for:', searchTerm);
    });
  }
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const searchInput = document.querySelector('#docs-search');
      if (searchInput) {
        searchInput.focus();
      }
    }
    if (e.key === 'Escape') {
      const searchInput = document.querySelector('#docs-search');
      if (searchInput && searchInput === document.activeElement) {
        searchInput.blur();
      }
            
      if (docsNav && docsNav.classList.contains('mobile-open')) {
        docsNav.classList.remove('mobile-open');
      }
    }
  });
  window.addEventListener('beforeprint', function() {
    document.querySelectorAll('.collapsible-content').forEach(content => {
      content.style.display = 'block';
    });
  });
  document.querySelectorAll('a[href^="http"]').forEach(link => {
    if (!link.hostname.includes(window.location.hostname)) {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    }
  });
});
