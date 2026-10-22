(function () {
  'use strict';

  var cfg = window.SITE_CONFIG || {};
  var whatsappNumber = cfg.WHATSAPP_NUMBER || '5511991189007';
  var whatsappDisplay = cfg.WHATSAPP_DISPLAY || '(11) 99118-9007';
  var whatsappBase = 'https://wa.me/' + whatsappNumber;

  var INTERESTE_MAP = {
    diagnostico: 'Diagnóstico de Prosperidade',
    soulprospera: 'SoulPróspera',
    'rica-de-alma': 'Rica de Alma'
  };

  function populateWhatsApp() {
    document.querySelectorAll('[data-whatsapp-display]').forEach(function (el) {
      el.textContent = whatsappDisplay;
    });
    document.querySelectorAll('a[data-whatsapp-link]').forEach(function (a) {
      if (!a.getAttribute('href') || a.getAttribute('href').indexOf('wa.me') === -1) {
        a.href = whatsappBase;
      }
      a.target = '_blank';
      a.rel = 'noopener';
    });
  }
  populateWhatsApp();

  var form = document.getElementById('form');
  if (!form) return;

  var nomeInput = document.getElementById('nome');
  var telInput = document.getElementById('telefone');
  var mensagemInput = document.getElementById('mensagem');
  var consentInput = form.querySelector('#consent');
  var honeypotInput = form.querySelector('#website');
  var interesseInput = form.querySelector('#interesse');
  var errorBox = document.getElementById('form-error');
  var okBox = document.getElementById('ok');
  var failBox = document.getElementById('form-fail');
  var interesseLine = document.getElementById('form-interesse');
  var submitBtn = form.querySelector('button[type="submit"]');
  var submitDefault = submitBtn ? submitBtn.textContent : '';

  var selectedInteresse = '';

  try {
    var params = new URLSearchParams(window.location.search);
    var raw = (params.get('interesse') || '').toLowerCase();
    if (INTERESTE_MAP[raw]) {
      selectedInteresse = raw;
      if (interesseInput) interesseInput.value = raw;
      if (interesseLine) {
        interesseLine.textContent = 'Você está interessada em: ' + INTERESTE_MAP[raw];
        interesseLine.hidden = false;
      }
    } else if (interesseInput) {
      interesseInput.value = '';
    }
  } catch (err) { /* ignore */ }

  if (nomeInput) {
    nomeInput.addEventListener('input', function () {
      nomeInput.value = nomeInput.value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s]/g, '');
    });
  }

  function maskPhone() {
    if (!telInput) return;
    var d = telInput.value.replace(/\D/g, '').slice(0, 11);
    if (d.length > 6) {
      telInput.value = '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
    } else if (d.length > 2) {
      telInput.value = '(' + d.slice(0, 2) + ') ' + d.slice(2);
    } else {
      telInput.value = d ? '(' + d : '';
    }
  }
  if (telInput) {
    telInput.addEventListener('input', maskPhone);
  }

  function showError(msg) {
    if (errorBox) {
      errorBox.textContent = msg;
      errorBox.hidden = false;
    }
  }

  function clearError() {
    if (errorBox) {
      errorBox.textContent = '';
      errorBox.hidden = true;
    }
  }

  function buildWhatsAppText(data) {
    var lines = [
      'Olá, Mariana. Vim pelo site.',
      'Nome: ' + data.nome,
      'Telefone: ' + data.telefone
    ];
    if (data.interesse && INTERESTE_MAP[data.interesse]) {
      lines.push('Interesse: ' + INTERESTE_MAP[data.interesse]);
    }
    lines.push('Mensagem: ' + data.mensagem);
    return lines.join('\n');
  }

  function showFail(data) {
    form.style.display = 'none';
    if (okBox) {
      okBox.classList.remove('show');
      okBox.hidden = true;
    }
    if (failBox) {
      failBox.hidden = false;
      failBox.classList.add('show');
      var waBtn = failBox.querySelector('[data-whatsapp-fallback]');
      if (waBtn && data) {
        waBtn.href = whatsappBase + '?text=' + encodeURIComponent(buildWhatsAppText(data));
        waBtn.target = '_blank';
        waBtn.rel = 'noopener';
      }
    }
  }

  function showSuccess() {
    form.style.display = 'none';
    if (failBox) {
      failBox.classList.remove('show');
      failBox.hidden = true;
    }
    if (okBox) {
      okBox.hidden = false;
      okBox.classList.add('show');
    }
  }

  function setSubmitting(busy) {
    if (!submitBtn) return;
    submitBtn.disabled = busy;
    if (busy) {
      submitBtn.setAttribute('aria-busy', 'true');
      submitBtn.textContent = 'Enviando...';
    } else {
      submitBtn.removeAttribute('aria-busy');
      submitBtn.textContent = submitDefault;
    }
  }

  function validate() {
    clearError();
    var nome = nomeInput ? nomeInput.value.trim() : '';
    var tel = telInput ? telInput.value.trim() : '';
    var msg = mensagemInput ? mensagemInput.value.trim() : '';

    if (honeypotInput && honeypotInput.value) {
      return { ok: false, spam: true };
    }

    if (!nome || nome.length < 2) {
      showError('Informe seu nome (apenas letras).');
      if (nomeInput) nomeInput.focus();
      return { ok: false };
    }
    if (!/^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/.test(nome)) {
      showError('Use apenas letras no nome.');
      if (nomeInput) nomeInput.focus();
      return { ok: false };
    }
    if (!/^\(\d{2}\) \d{5}-\d{4}$/.test(tel)) {
      showError('Informe um telefone válido com DDD, no formato (11) 90000-0000.');
      if (telInput) telInput.focus();
      return { ok: false };
    }
    if (!msg) {
      showError('Escreva uma mensagem.');
      if (mensagemInput) mensagemInput.focus();
      return { ok: false };
    }
    if (!consentInput || !consentInput.checked) {
      showError('É necessário concordar com a Política de Privacidade.');
      if (consentInput) consentInput.focus();
      return { ok: false };
    }

    return {
      ok: true,
      data: {
        nome: nome,
        telefone: tel,
        mensagem: msg,
        interesse: selectedInteresse || (interesseInput ? interesseInput.value : ''),
        pagina: window.location.pathname.split('/').pop() || 'contato.html',
        data_hora: new Date().toISOString(),
        origem: 'site'
      }
    };
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var result = validate();
    if (result.spam) return;
    if (!result.ok) return;

    var endpoint = (cfg.FORM_ENDPOINT || '').trim();
    if (!endpoint) {
      showFail(result.data);
      return;
    }

    setSubmitting(true);

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result.data)
    })
      .then(function (res) {
        if (res.status >= 200 && res.status < 300) showSuccess();
        else showFail(result.data);
      })
      .catch(function () {
        showFail(result.data);
      })
      .finally(function () {
        setSubmitting(false);
      });
  });
})();
