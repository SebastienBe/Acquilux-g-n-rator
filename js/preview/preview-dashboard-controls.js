// ========================================
// DASHBOARD CONTROLS - Modification CSS et contenu en temps réel
// ========================================

(function() {
  let pdfPreview = null;

  // Initialisation
  function init() {
    pdfPreview = document.getElementById('pdfPreview');
    if (!pdfPreview) {
      // Attendre que le DOM soit prêt
      setTimeout(init, 100);
      return;
    }

    setupTabs();
    setupStyleControls();
    setupContentControls();
    loadSavedSettings();
  }

  // ========================================
  // GESTION DES ONGLETS
  // ========================================
  function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const drawerTitle = document.getElementById('drawerTitle');

    const tabTitles = {
      badges: 'Gérer les atouts',
      styles: 'Styles du PDF',
      content: 'Contenu du PDF'
    };

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;

        // Désactiver tous les onglets
        tabButtons.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        // Activer l'onglet sélectionné
        btn.classList.add('active');
        document.getElementById(`tab-${targetTab}`).classList.add('active');

        // Mettre à jour le titre du drawer
        if (drawerTitle && tabTitles[targetTab]) {
          drawerTitle.textContent = tabTitles[targetTab];
        }
      });
    });
  }

  // ========================================
  // CONTRÔLES DE STYLE
  // ========================================
  function setupStyleControls() {
    // Couleurs
    setupColorControl('styleHeaderColor', (color) => {
      applyStyle('.header-orange-band', 'background', color);
      saveSetting('headerColor', color);
    });

    setupColorControl('styleTextColor', (color) => {
      applyStyle('#pdfPreview', 'color', color);
      saveSetting('textColor', color);
    });

    setupColorControl('styleBgColor', (color) => {
      applyStyle('#pdfPreview', 'background', color);
      saveSetting('bgColor', color);
    });

    setupColorControl('styleAccentColor', (color) => {
      applyStyle('#pdfPreview ul li strong, #pdfPreview .recipe strong, #pdfPreview .recipe p strong', 'color', color);
      applyStyle('#pdfPreview ul li::before', 'background', color);
      applyStyle('#pdfPreview .recipe', 'border-left-color', color);
      saveSetting('accentColor', color);
    });

    // Typographie - Tailles
    setupRangeControl('styleH1Size', (value) => {
      const rem = value + 'rem';
      applyStyle('#pdfPreview .header-content h1', 'font-size', rem);
      document.getElementById('styleH1SizeValue').textContent = rem;
      saveSetting('h1Size', rem);
    });

    setupRangeControl('styleH2Size', (value) => {
      const rem = value + 'rem';
      applyStyle('#pdfPreview h2', 'font-size', rem);
      document.getElementById('styleH2SizeValue').textContent = rem;
      saveSetting('h2Size', rem);
    });

    setupRangeControl('styleTextSize', (value) => {
      const rem = value + 'rem';
      applyStyle('#pdfPreview ul li, #pdfPreview .recipe p', 'font-size', rem);
      document.getElementById('styleTextSizeValue').textContent = rem;
      saveSetting('textSize', rem);
    });

    // Typographie - Poids
    setupSelectControl('styleH1Weight', (value) => {
      applyStyle('#pdfPreview .header-content h1', 'font-weight', value);
      saveSetting('h1Weight', value);
    });

    setupSelectControl('styleH2Weight', (value) => {
      applyStyle('#pdfPreview h2', 'font-weight', value);
      saveSetting('h2Weight', value);
    });

    setupSelectControl('styleTextWeight', (value) => {
      applyStyle('#pdfPreview ul li, #pdfPreview .recipe p, #pdfPreview .recipe em', 'font-weight', value);
      saveSetting('textWeight', value);
    });

    setupSelectControl('styleSloganWeight', (value) => {
      applyStyle('#pdfPreview .header-content .slogan', 'font-weight', value);
      saveSetting('sloganWeight', value);
    });

    setupSelectControl('styleStrongWeight', (value) => {
      applyStyle('#pdfPreview ul li strong', 'font-weight', value);
      saveSetting('strongWeight', value);
    });

    setupSelectControl('styleFooterLogoWeight', (value) => {
      applyStyle('#pdfPreview .otera-logo', 'font-weight', value);
      saveSetting('footerLogoWeight', value);
    });

    setupSelectControl('styleFooterTaglineWeight', (value) => {
      applyStyle('#pdfPreview .otera-tagline', 'font-weight', value);
      saveSetting('footerTaglineWeight', value);
    });

    // Espacements
    setupRangeControl('styleHeaderPadding', (value) => {
      const px = value + 'px';
      applyStyle('#pdfPreview .header-content', 'padding', `${px} 20px`);
      document.getElementById('styleHeaderPaddingValue').textContent = px;
      saveSetting('headerPadding', px);
    });

    setupRangeControl('styleFirstH2MarginTop', (value) => {
      const px = value + 'px';
      // Appliquer au premier h2 (h2:first-of-type et .header-content + h2)
      applyStyle('#pdfPreview h2:first-of-type', 'margin-top', px);
      applyStyle('#pdfPreview .header-content + h2', 'margin-top', px);
      document.getElementById('styleFirstH2MarginTopValue').textContent = px;
      saveSetting('firstH2MarginTop', px);
    });

    setupRangeControl('styleSectionMargin', (value) => {
      const px = value + 'px';
      // Appliquer à tous les h2 sauf le premier
      if (pdfPreview) {
        const allH2 = pdfPreview.querySelectorAll('h2');
        allH2.forEach((h2, index) => {
          // Ne pas modifier le premier h2 (géré par styleFirstH2MarginTop)
          if (index > 0) {
            h2.style.margin = `${px} 20px 6px 20px`;
          }
        });
      }
      document.getElementById('styleSectionMarginValue').textContent = px;
      saveSetting('sectionMargin', px);
    });

    setupRangeControl('styleContentPadding', (value) => {
      const px = value + 'px';
      applyStyle('#pdfPreview ul, #pdfPreview .recipe', 'margin-left', px);
      applyStyle('#pdfPreview ul, #pdfPreview .recipe', 'margin-right', px);
      document.getElementById('styleContentPaddingValue').textContent = px;
      saveSetting('contentPadding', px);
    });

    setupRangeControl('styleFooterPadding', (value) => {
      const px = value + 'px';
      applyStyle('#pdfPreview .otera-footer', 'padding', `${px} 20px`);
      document.getElementById('styleFooterPaddingValue').textContent = px;
      saveSetting('footerPadding', px);
    });
  }

  // ========================================
  // CONTRÔLES DE CONTENU
  // ========================================
  function setupContentControls() {
    // Titre
    const titleInput = document.getElementById('contentTitle');
    if (titleInput) {
      titleInput.addEventListener('input', (e) => {
        const h1 = pdfPreview?.querySelector('.header-content h1');
        if (h1) {
          h1.textContent = e.target.value || 'Produit';
          saveSetting('title', e.target.value);
        }
      });
    }

    // Slogan
    const sloganInput = document.getElementById('contentSlogan');
    if (sloganInput) {
      sloganInput.addEventListener('input', (e) => {
        const slogan = pdfPreview?.querySelector('.header-content .slogan');
        if (slogan) {
          slogan.textContent = e.target.value || 'Un trésor de saveurs à découvrir';
          saveSetting('slogan', e.target.value);
        }
      });
    }

    // Footer vide - pas de contrôles de texte nécessaires
    const footerLogoInput = document.getElementById('contentFooterLogo');
    if (footerLogoInput) {
      footerLogoInput.disabled = true;
      footerLogoInput.placeholder = 'Désactivé - Footer vide';
    }

    const footerTaglineInput = document.getElementById('contentFooterTagline');
    if (footerTaglineInput) {
      footerTaglineInput.disabled = true;
      footerTaglineInput.placeholder = 'Désactivé - Footer vide';
    }
  }

  // ========================================
  // HELPERS
  // ========================================
  function setupColorControl(id, callback) {
    const input = document.getElementById(id);
    if (!input) return;

    input.addEventListener('input', (e) => {
      callback(e.target.value);
    });
  }

  function setupRangeControl(id, callback) {
    const input = document.getElementById(id);
    if (!input) return;

    input.addEventListener('input', (e) => {
      callback(parseFloat(e.target.value));
    });
  }

  function setupSelectControl(id, callback) {
    const select = document.getElementById(id);
    if (!select) return;

    select.addEventListener('change', (e) => {
      callback(e.target.value);
    });
  }

  function applyStyle(selector, property, value) {
    if (!pdfPreview) return;
    const elements = pdfPreview.querySelectorAll(selector);
    elements.forEach(el => {
      el.style[property] = value;
    });
  }


  // ========================================
  // SAUVEGARDE / CHARGEMENT
  // ========================================
  function saveSetting(key, value) {
    const settings = getSettings();
    settings[key] = value;
    sessionStorage.setItem('pdfPreviewSettings', JSON.stringify(settings));
  }

  function getSettings() {
    try {
      const stored = sessionStorage.getItem('pdfPreviewSettings');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  // Exposer getSettings globalement pour l'utiliser dans preview-pdf-generator.js
  window.getSavedSettings = getSettings;

  function loadSavedSettings() {
    const settings = getSettings();
    
    // Appliquer les styles sauvegardés
    if (settings.headerColor) {
      document.getElementById('styleHeaderColor').value = settings.headerColor;
      applyStyle('.header-orange-band', 'background', settings.headerColor);
    }
    if (settings.textColor) {
      document.getElementById('styleTextColor').value = settings.textColor;
      applyStyle('#pdfPreview', 'color', settings.textColor);
    }
    if (settings.bgColor) {
      document.getElementById('styleBgColor').value = settings.bgColor;
      applyStyle('#pdfPreview', 'background', settings.bgColor);
    }
    if (settings.accentColor) {
      document.getElementById('styleAccentColor').value = settings.accentColor;
      applyStyle('#pdfPreview ul li strong, #pdfPreview .recipe strong, #pdfPreview .recipe p strong', 'color', settings.accentColor);
      applyStyle('#pdfPreview ul li::before', 'background', settings.accentColor);
      applyStyle('#pdfPreview .recipe', 'border-left-color', settings.accentColor);
    }

    // Appliquer les valeurs de range
    if (settings.h1Size) {
      const value = parseFloat(settings.h1Size);
      document.getElementById('styleH1Size').value = value;
      document.getElementById('styleH1SizeValue').textContent = settings.h1Size;
      applyStyle('#pdfPreview .header-content h1', 'font-size', settings.h1Size);
    }
    if (settings.h2Size) {
      const value = parseFloat(settings.h2Size);
      document.getElementById('styleH2Size').value = value;
      document.getElementById('styleH2SizeValue').textContent = settings.h2Size;
      applyStyle('#pdfPreview h2', 'font-size', settings.h2Size);
    }
    if (settings.textSize) {
      const value = parseFloat(settings.textSize);
      document.getElementById('styleTextSize').value = value;
      document.getElementById('styleTextSizeValue').textContent = settings.textSize;
      applyStyle('#pdfPreview ul li, #pdfPreview .recipe p', 'font-size', settings.textSize);
    }
    if (settings.firstH2MarginTop) {
      const value = parseFloat(settings.firstH2MarginTop);
      document.getElementById('styleFirstH2MarginTop').value = value;
      document.getElementById('styleFirstH2MarginTopValue').textContent = settings.firstH2MarginTop;
      applyStyle('#pdfPreview h2:first-of-type', 'margin-top', settings.firstH2MarginTop);
      applyStyle('#pdfPreview .header-content + h2', 'margin-top', settings.firstH2MarginTop);
    }

    // Appliquer les poids de police
    if (settings.h1Weight) {
      document.getElementById('styleH1Weight').value = settings.h1Weight;
      applyStyle('#pdfPreview .header-content h1', 'font-weight', settings.h1Weight);
    }
    if (settings.h2Weight) {
      document.getElementById('styleH2Weight').value = settings.h2Weight;
      applyStyle('#pdfPreview h2', 'font-weight', settings.h2Weight);
    }
    if (settings.textWeight) {
      document.getElementById('styleTextWeight').value = settings.textWeight;
      applyStyle('#pdfPreview ul li, #pdfPreview .recipe p, #pdfPreview .recipe em', 'font-weight', settings.textWeight);
    }
    if (settings.sloganWeight) {
      document.getElementById('styleSloganWeight').value = settings.sloganWeight;
      applyStyle('#pdfPreview .header-content .slogan', 'font-weight', settings.sloganWeight);
    }
    if (settings.strongWeight) {
      document.getElementById('styleStrongWeight').value = settings.strongWeight;
      applyStyle('#pdfPreview ul li strong', 'font-weight', settings.strongWeight);
    }
    if (settings.footerLogoWeight) {
      document.getElementById('styleFooterLogoWeight').value = settings.footerLogoWeight;
      applyStyle('#pdfPreview .otera-logo', 'font-weight', settings.footerLogoWeight);
    }
    if (settings.footerTaglineWeight) {
      document.getElementById('styleFooterTaglineWeight').value = settings.footerTaglineWeight;
      applyStyle('#pdfPreview .otera-tagline', 'font-weight', settings.footerTaglineWeight);
    }

    // Appliquer les espacements sauvegardés
    if (settings.headerPadding) {
      const value = parseFloat(settings.headerPadding);
      document.getElementById('styleHeaderPadding').value = value;
      document.getElementById('styleHeaderPaddingValue').textContent = settings.headerPadding;
      applyStyle('#pdfPreview .header-content', 'padding', `${settings.headerPadding} 20px`);
    }
    if (settings.firstH2MarginTop) {
      const value = parseFloat(settings.firstH2MarginTop);
      document.getElementById('styleFirstH2MarginTop').value = value;
      document.getElementById('styleFirstH2MarginTopValue').textContent = settings.firstH2MarginTop;
      applyStyle('#pdfPreview h2:first-of-type', 'margin-top', settings.firstH2MarginTop);
      applyStyle('#pdfPreview .header-content + h2', 'margin-top', settings.firstH2MarginTop);
    }
    if (settings.sectionMargin) {
      const value = parseFloat(settings.sectionMargin);
      document.getElementById('styleSectionMargin').value = value;
      document.getElementById('styleSectionMarginValue').textContent = settings.sectionMargin;
      const allH2 = pdfPreview?.querySelectorAll('#pdfPreview h2');
      if (allH2) {
        allH2.forEach((h2, index) => {
          if (index > 0) {
            h2.style.margin = `${settings.sectionMargin} 20px 6px 20px`;
          }
        });
      }
    }
    if (settings.contentPadding) {
      const value = parseFloat(settings.contentPadding);
      document.getElementById('styleContentPadding').value = value;
      document.getElementById('styleContentPaddingValue').textContent = settings.contentPadding;
      applyStyle('#pdfPreview ul, #pdfPreview .recipe', 'margin-left', settings.contentPadding);
      applyStyle('#pdfPreview ul, #pdfPreview .recipe', 'margin-right', settings.contentPadding);
    }
    if (settings.footerPadding) {
      const value = parseFloat(settings.footerPadding);
      document.getElementById('styleFooterPadding').value = value;
      document.getElementById('styleFooterPaddingValue').textContent = settings.footerPadding;
      applyStyle('#pdfPreview .otera-footer', 'padding', `${settings.footerPadding} 20px`);
    }

    // Appliquer le contenu sauvegardé
    if (settings.title) {
      document.getElementById('contentTitle').value = settings.title;
      const h1 = pdfPreview?.querySelector('.header-content h1');
      if (h1) h1.textContent = settings.title;
    }
    if (settings.slogan) {
      document.getElementById('contentSlogan').value = settings.slogan;
      const slogan = pdfPreview?.querySelector('.header-content .slogan');
      if (slogan) slogan.textContent = settings.slogan;
    }
    if (settings.footerLogo) {
      document.getElementById('contentFooterLogo').value = settings.footerLogo;
      const logo = pdfPreview?.querySelector('.otera-logo');
      if (logo) logo.textContent = settings.footerLogo;
    }
    if (settings.footerTagline) {
      document.getElementById('contentFooterTagline').value = settings.footerTagline;
      const tagline = pdfPreview?.querySelector('.otera-tagline');
      if (tagline) tagline.textContent = settings.footerTagline;
    }
  }

  // Initialiser quand le DOM est prêt
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Réinitialiser quand le preview est mis à jour
  const originalDisplayPreview = window.displayPreview;
  if (originalDisplayPreview) {
    window.displayPreview = async function(...args) {
      await originalDisplayPreview(...args);
      setTimeout(() => {
        pdfPreview = document.getElementById('pdfPreview');
        if (pdfPreview) {
          initializeFromPreview();
          loadSavedSettings();
          // Réappliquer le filtre de couleur des badges
          const settings = getSettings();
          if (settings.badgeColor) {
            applyBadgeColorFilter(settings.badgeColor);
          }
        }
      }, 100);
    };
  }

  // Initialiser les valeurs depuis le preview actuel
  function initializeFromPreview() {
    if (!pdfPreview) return;

    // Récupérer les valeurs actuelles du preview
    const h1 = pdfPreview.querySelector('.header-content h1');
    const h2 = pdfPreview.querySelector('h2');
    const slogan = pdfPreview.querySelector('.header-content .slogan');
    // Footer vide - pas de texte à lire
    const headerBand = pdfPreview.querySelector('.header-orange-band');
    const textElement = pdfPreview.querySelector('ul li');
    const strongElement = pdfPreview.querySelector('ul li strong');

    // Initialiser les inputs de contenu
    if (h1 && document.getElementById('contentTitle')) {
      document.getElementById('contentTitle').value = h1.textContent || '';
    }
    if (slogan && document.getElementById('contentSlogan')) {
      document.getElementById('contentSlogan').value = slogan.textContent || '';
    }
    // Footer vide - pas de texte à initialiser

    // Initialiser les couleurs depuis les styles calculés
    if (headerBand) {
      const headerColor = window.getComputedStyle(headerBand).backgroundColor;
      if (headerColor && document.getElementById('styleHeaderColor')) {
        document.getElementById('styleHeaderColor').value = rgbToHex(headerColor);
      }
    }

    const previewBg = window.getComputedStyle(pdfPreview).backgroundColor;
    if (previewBg && document.getElementById('styleBgColor')) {
      document.getElementById('styleBgColor').value = rgbToHex(previewBg);
    }

    const previewColor = window.getComputedStyle(pdfPreview).color;
    if (previewColor && document.getElementById('styleTextColor')) {
      document.getElementById('styleTextColor').value = rgbToHex(previewColor);
    }

    // Initialiser les poids de police depuis les styles calculés
    if (h1 && document.getElementById('styleH1Weight')) {
      const h1Weight = window.getComputedStyle(h1).fontWeight;
      if (h1Weight) {
        document.getElementById('styleH1Weight').value = normalizeFontWeight(h1Weight);
      }
    }
    if (h2 && document.getElementById('styleH2Weight')) {
      const h2Weight = window.getComputedStyle(h2).fontWeight;
      if (h2Weight) {
        document.getElementById('styleH2Weight').value = normalizeFontWeight(h2Weight);
      }
    }
    if (textElement && document.getElementById('styleTextWeight')) {
      const textWeight = window.getComputedStyle(textElement).fontWeight;
      if (textWeight) {
        document.getElementById('styleTextWeight').value = normalizeFontWeight(textWeight);
      }
    }
    if (slogan && document.getElementById('styleSloganWeight')) {
      const sloganWeight = window.getComputedStyle(slogan).fontWeight;
      if (sloganWeight) {
        document.getElementById('styleSloganWeight').value = normalizeFontWeight(sloganWeight);
      }
    }
    if (strongElement && document.getElementById('styleStrongWeight')) {
      const strongWeight = window.getComputedStyle(strongElement).fontWeight;
      if (strongWeight) {
        document.getElementById('styleStrongWeight').value = normalizeFontWeight(strongWeight);
      }
    }
    if (logo && document.getElementById('styleFooterLogoWeight')) {
      const logoWeight = window.getComputedStyle(logo).fontWeight;
      if (logoWeight) {
        document.getElementById('styleFooterLogoWeight').value = normalizeFontWeight(logoWeight);
      }
    }
    if (tagline && document.getElementById('styleFooterTaglineWeight')) {
      const taglineWeight = window.getComputedStyle(tagline).fontWeight;
      if (taglineWeight) {
        document.getElementById('styleFooterTaglineWeight').value = normalizeFontWeight(taglineWeight);
      }
    }

    // Initialiser les espacements depuis les styles calculés
    const headerContent = pdfPreview.querySelector('.header-content');
    if (headerContent && document.getElementById('styleHeaderPadding')) {
      const headerPadding = window.getComputedStyle(headerContent).paddingTop;
      if (headerPadding) {
        const value = parseFloat(headerPadding);
        document.getElementById('styleHeaderPadding').value = value;
        document.getElementById('styleHeaderPaddingValue').textContent = headerPadding;
      }
    }

    const firstH2 = pdfPreview.querySelector('h2:first-of-type');
    if (firstH2 && document.getElementById('styleFirstH2MarginTop')) {
      const firstH2MarginTop = window.getComputedStyle(firstH2).marginTop;
      if (firstH2MarginTop) {
        const value = parseFloat(firstH2MarginTop);
        document.getElementById('styleFirstH2MarginTop').value = value;
        document.getElementById('styleFirstH2MarginTopValue').textContent = firstH2MarginTop;
      }
    }

    const footer = pdfPreview.querySelector('.otera-footer');
    if (footer && document.getElementById('styleFooterPadding')) {
      const footerPadding = window.getComputedStyle(footer).paddingTop;
      if (footerPadding) {
        const value = parseFloat(footerPadding);
        document.getElementById('styleFooterPadding').value = value;
        document.getElementById('styleFooterPaddingValue').textContent = footerPadding;
      }
    }
  }

  // Normaliser le poids de police (peut être "700" ou "bold")
  function normalizeFontWeight(weight) {
    if (typeof weight === 'string') {
      const weightMap = {
        'normal': '400',
        'bold': '700',
        'lighter': '300',
        'bolder': '700'
      };
      return weightMap[weight.toLowerCase()] || weight;
    }
    return String(weight);
  }

  // Convertir RGB en hex
  function rgbToHex(rgb) {
    if (rgb.startsWith('#')) return rgb;
    const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (!match) return '#000000';
    return '#' + [1, 2, 3].map(i => {
      const hex = parseInt(match[i]).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }
})();

