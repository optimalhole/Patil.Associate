/* Patil Associate — plain JavaScript, no frameworks.
   Shared by every page. Each page sets <body data-page="..."> */
(function () {
  'use strict'

  // ---------- storage ----------
  var LS = {
    get: function (k, f) {
      try { var r = localStorage.getItem(k); return r ? JSON.parse(r) : f } catch (e) { return f }
    },
    set: function (k, v) {
      try { localStorage.setItem(k, JSON.stringify(v)) } catch (e) { /* unavailable */ }
    },
  }

  // Prototype credentials — client-side only. Replace with real auth before relying on it.
  var ADMIN_EMAIL = 'admin@patilassociate.in'
  var ADMIN_PASS = 'Patil@123'
  var FALLBACK_IMG = u('photo-1600607687939-ce8a6c25118c')

  var page = document.body.getAttribute('data-page')
  var lang = LS.get('pa_lang', 'mr')
  var properties = LS.get('pa_props', initialProperties)
  var videos = LS.get('pa_videos', initialVideos)

  function t(k) { var v = translations[lang][k]; return v === undefined ? k : v }
  function isAdmin() { return LS.get('pa_admin', false) === true }
  function $(s, r) { return (r || document).querySelector(s) }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    })
  }

  // ---------- toast ----------
  var toastEl = document.createElement('div')
  toastEl.className = 'toast'
  toastEl.setAttribute('role', 'status')
  toastEl.setAttribute('aria-live', 'polite')
  document.body.appendChild(toastEl)
  var toastTimer
  function toast(msg) {
    toastEl.textContent = msg
    toastEl.classList.add('show')
    clearTimeout(toastTimer)
    toastTimer = setTimeout(function () { toastEl.classList.remove('show') }, 2600)
  }

  // ---------- scroll reveal ----------
  var io = 'IntersectionObserver' in window
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) }
        })
      }, { threshold: 0.12 })
    : null
  function observeReveal() {
    document.querySelectorAll('.reveal:not(.in)').forEach(function (el) {
      if (io) io.observe(el); else el.classList.add('in')
    })
  }

  // ---------- header / footer ----------
  var links = [
    ['index.html', 'navHome', 'home'],
    ['properties.html', 'navProperties', 'properties'],
    ['about.html', 'navAbout', 'about'],
    ['videos.html', 'navVideos', 'videos'],
    ['contact.html', 'navContact', 'contact'],
  ]

  function brand() {
    return '<a href="index.html" class="brand" aria-label="Patil Associate"><span class="brandmark">P</span><span>PATIL<br>ASSOCIATE</span></a>'
  }

  function renderHeader() {
    var cur = page === 'property' ? 'properties' : page
    var nl = links.map(function (l) {
      return '<a href="' + l[0] + '" class="' + (l[2] === cur ? 'active' : '') + '">' + t(l[1]) + '</a>'
    }).join('')
    var acct = isAdmin() ? ['admin.html', t('admin')] : ['login.html', t('login')]
    $('#site-header').innerHTML =
      '<header class="header"><div class="wrap header-row">' + brand() +
      '<nav class="nav" aria-label="Main">' + nl + '</nav>' +
      '<div class="header-actions">' +
      '<button class="btn btn-sm" id="langBtn" aria-label="Change language">' + (lang === 'mr' ? 'EN' : 'मराठी') + '</button>' +
      '<a class="btn btn-sm btn-dark hide-md" href="' + acct[0] + '">' + acct[1] + '</a>' +
      '<button class="menu-btn" id="menuBtn" aria-label="Menu" aria-expanded="false"><span></span></button>' +
      '</div></div></header>' +
      '<div class="drawer" id="drawer">' + nl +
      '<div class="drawer-actions"><a class="btn btn-dark" href="login.html">' + t('login') + '</a>' +
      '<a class="btn" href="admin.html">' + t('admin') + '</a></div></div>'

    $('#langBtn').onclick = function () {
      lang = lang === 'mr' ? 'en' : 'mr'
      LS.set('pa_lang', lang)
      renderAll()
    }
    var menuBtn = $('#menuBtn'), drawer = $('#drawer')
    menuBtn.onclick = function () {
      var open = !drawer.classList.contains('open')
      drawer.classList.toggle('open', open)
      menuBtn.classList.toggle('open', open)
      menuBtn.setAttribute('aria-expanded', open)
      document.body.style.overflow = open ? 'hidden' : ''
    }
  }

  function renderFooter() {
    $('#site-footer').innerHTML =
      '<footer class="footer"><div class="wrap"><div class="footer-top">' +
      '<div>' + brand() + '<p>' + t('aboutText') + '</p></div>' +
      '<div><h4>Menu</h4><ul>' +
      '<li><a href="properties.html">' + t('navProperties') + '</a></li>' +
      '<li><a href="about.html">' + t('navAbout') + '</a></li>' +
      '<li><a href="videos.html">' + t('navVideos') + '</a></li>' +
      '<li><a href="contact.html">' + t('navContact') + '</a></li></ul></div>' +
      '<div><h4>' + t('navContact') + '</h4><ul>' +
      '<li>Phone: +91 XXXXX XXXXX</li><li>hello@patilassociate.in</li><li>Maharashtra, India</li></ul></div>' +
      '</div><div class="footer-bottom"><span>© ' + new Date().getFullYear() + ' PATIL ASSOCIATE. ' + t('rights') +
      '</span><span>BUY • SELL • RENT</span></div></div></footer>'
  }

  function applyI18n() {
    document.documentElement.lang = lang
    document.querySelectorAll('[data-i]').forEach(function (el) { el.textContent = t(el.getAttribute('data-i')) })
    document.querySelectorAll('[data-ph]').forEach(function (el) { el.placeholder = t(el.getAttribute('data-ph')) })
  }

  // ---------- reusable pieces ----------
  function card(p) {
    return '<a class="card reveal" href="property.html?id=' + encodeURIComponent(p.id) + '">' +
      '<div class="card-img"><img src="' + esc(p.img) + '" alt="' + esc(p.title) + '" loading="lazy"><span class="tag">' + t(p.type) + '</span></div>' +
      '<div class="card-body"><h3>' + esc(p.title) + '</h3><div class="card-loc">⌖ ' + esc(p.place) + '</div>' +
      '<div class="card-meta"><span>' + esc(p.spec) + '</span><span class="price">' + esc(p.price) + '</span></div></div></a>'
  }

  function videoCard(v) {
    if (v.url) {
      return '<div class="video reveal"><video controls playsinline preload="metadata" src="' + esc(v.url) + '"></video>' +
        '<div class="video-title">' + esc(v.title) + '</div></div>'
    }
    return '<div class="video reveal"><div class="video-ph" style="--poster:url(' + esc(v.poster) + ')">' +
      '<div class="video-cap">' + esc(v.title) + '<small>' + t('videoSoon') + '</small></div></div>' +
      '<div class="play" aria-hidden="true">▶</div></div>'
  }

  // ---------- page modules ----------
  var pages = {}

  pages.home = {
    render: function () {
      $('#featured').innerHTML = properties.slice(0, 3).map(card).join('')
      $('#homeVideos').innerHTML = videos.slice(0, 3).map(videoCard).join('')
    },
  }

  pages.properties = {
    filter: 'all',
    init: function () {
      var f = new URLSearchParams(location.search).get('type')
      if (['sale', 'rent', 'plot', 'commercial'].indexOf(f) > -1) this.filter = f
      var self = this
      $('#search').addEventListener('input', function () { self.render() })
    },
    render: function () {
      var self = this
      var chips = ['all', 'sale', 'rent', 'plot', 'commercial']
      $('#chips').innerHTML = chips.map(function (c) {
        return '<button class="chip ' + (self.filter === c ? 'active' : '') + '" data-f="' + c + '">' + t(c) + '</button>'
      }).join('')
      document.querySelectorAll('#chips .chip').forEach(function (b) {
        b.onclick = function () {
          self.filter = b.getAttribute('data-f')
          try { history.replaceState(null, '', self.filter === 'all' ? 'properties.html' : 'properties.html?type=' + self.filter) } catch (e) {}
          self.render()
        }
      })
      var q = $('#search').value.trim().toLowerCase()
      var list = properties.filter(function (p) {
        return (self.filter === 'all' || p.type === self.filter) &&
          (!q || (p.title + ' ' + p.place + ' ' + p.spec).toLowerCase().indexOf(q) > -1)
      })
      $('#list').innerHTML = list.length ? list.map(card).join('') : '<p class="empty" style="grid-column:1/-1">' + t('noResults') + '</p>'
    },
  }

  pages.property = {
    render: function () {
      var id = new URLSearchParams(location.search).get('id')
      var p = properties.filter(function (x) { return String(x.id) === id })[0]
      var el = $('#detail')
      if (!p) {
        el.innerHTML = '<div style="padding:96px 0;text-align:center"><p class="lead" style="margin:0 auto 24px">' + t('notFound') +
          '</p><a class="btn" href="properties.html">← ' + t('navProperties') + '</a></div>'
        return
      }
      document.title = p.title + ' — Patil Associate'
      el.innerHTML =
        '<a href="properties.html" class="back">← ' + t('back') + '</a>' +
        '<div class="detail"><div class="detail-img"><img src="' + esc(p.img) + '" alt="' + esc(p.title) + '"></div>' +
        '<aside class="detail-side"><div class="kicker">' + t(p.type) + '</div><h1>' + esc(p.title) + '</h1>' +
        '<div class="card-loc">⌖ ' + esc(p.place) + '</div><div class="detail-price">' + esc(p.price) + '</div>' +
        '<div class="facts"><div><span>' + t('location') + '</span><span>' + esc(p.place) + '</span></div>' +
        '<div><span>' + t('details') + '</span><span>' + esc(p.spec) + '</span></div>' +
        '<div><span>' + t('typeLbl') + '</span><span>' + t(p.type) + '</span></div></div>' +
        '<a class="btn btn-dark btn-block" href="contact.html">' + t('enquire') + ' ↗</a></aside></div>'
    },
  }

  pages.videos = {
    render: function () { $('#videoList').innerHTML = videos.map(videoCard).join('') },
  }

  pages.contact = {
    init: function () {
      $('#enquiryForm').addEventListener('submit', function (e) {
        e.preventDefault()
        // TODO: send the form data to your backend (Firebase, Formspree, etc.)
        toast(t('thanks'))
        e.target.reset()
      })
    },
  }

  pages.login = {
    init: function () {
      $('#loginForm').addEventListener('submit', function (e) {
        e.preventDefault()
        if ($('#l-email').value.trim() === ADMIN_EMAIL && $('#l-pass').value === ADMIN_PASS) {
          LS.set('pa_admin', true)
          location.href = 'admin.html'
        } else {
          toast(t('loginNote'))
        }
      })
    },
  }

  pages.admin = {
    init: function () {
      if (!isAdmin()) { location.replace('login.html'); return }
      var self = this
      $('#logoutBtn').onclick = function () { LS.set('pa_admin', false); location.href = 'index.html' }

      $('#propForm').addEventListener('submit', function (e) {
        e.preventDefault()
        var f = e.target
        properties.unshift({
          id: Date.now(),
          title: f.elements.title.value.trim(),
          place: f.elements.place.value.trim() || '—',
          type: f.elements.type.value,
          price: f.elements.price.value.trim() || 'On request',
          spec: f.elements.spec.value.trim() || '—',
          img: f.elements.img.value.trim() || FALLBACK_IMG,
        })
        LS.set('pa_props', properties)
        f.reset()
        self.render()
        toast(t('added'))
      })

      $('#videoForm').addEventListener('submit', function (e) {
        e.preventDefault()
        var f = e.target
        videos.unshift({ id: Date.now(), title: f.elements.title.value.trim(), url: f.elements.url.value.trim(), poster: FALLBACK_IMG })
        LS.set('pa_videos', videos)
        f.reset()
        self.render()
        toast(t('added'))
      })
    },
    render: function () {
      if (!isAdmin()) return
      function rows(list, kind) {
        return list.map(function (x) {
          return '<div class="admin-row"><span>' + esc(x.title) + '</span>' +
            '<button class="btn btn-sm" data-kind="' + kind + '" data-id="' + x.id + '">' + t('del') + '</button></div>'
        }).join('')
      }
      $('#adminProps').innerHTML = rows(properties, 'p')
      $('#adminVideos').innerHTML = rows(videos, 'v')
      document.querySelectorAll('.admin-row button').forEach(function (b) {
        b.onclick = function () {
          var id = b.getAttribute('data-id')
          if (b.getAttribute('data-kind') === 'p') {
            properties = properties.filter(function (x) { return String(x.id) !== id })
            LS.set('pa_props', properties)
          } else {
            videos = videos.filter(function (x) { return String(x.id) !== id })
            LS.set('pa_videos', videos)
          }
          pages.admin.render()
        }
      })
    },
  }

  // ---------- boot ----------
  function renderAll() {
    renderHeader()
    renderFooter()
    applyI18n()
    var m = pages[page]
    if (m && m.render) m.render()
    observeReveal()
  }

  var mod = pages[page]
  if (mod && mod.init) mod.init()
  renderAll()
  window.scrollTo(0, 0)
})()
