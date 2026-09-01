(function () {
  'use strict';

  var data = [];
  var selected = null;

  function $(id) { return document.getElementById(id); }

  function load() {
    var urls = [
      'src/backup.json?t=' + Date.now(),
      './src/backup.json?t=' + Date.now()
    ];
    var i = 0;
    function tryNext() {
      if (i >= urls.length) {
        $('list').innerHTML = '<p class="empty">読込失敗: backup.json にアクセスできません。GitHub Pages が有効か確認してください。</p>';
        $('status').textContent = 'エラー';
        return;
      }
      var url = urls[i++];
      fetch(url, { cache: 'no-store' })
        .then(function (r) {
          if (!r.ok) throw new Error(url + ' ' + r.status);
          return r.json();
        })
        .then(function (json) {
          data = Array.isArray(json) ? json : [];
          render();
        })
        .catch(function () { tryNext(); });
    }
    tryNext();
  }

  function filtered() {
    var q = (($('q') && $('q').value) || '').toLowerCase().trim();
    var pathFilter = (($('path-filter') && $('path-filter').value) || '').trim();
    return data.filter(function (e) {
      if (pathFilter && e.path !== pathFilter) return false;
      if (!q) return true;
      var hay = [e.path, e.userId, e.userName, e.message, e.datetime, e.ip].join(' ').toLowerCase();
      return hay.indexOf(q) >= 0;
    }).slice().reverse();
  }

  function uniquePaths() {
    var set = {};
    data.forEach(function (e) { if (e.path) set[e.path] = true; });
    return Object.keys(set).sort();
  }

  function render() {
    var list = $('list');
    var items = filtered();
    $('status').textContent = data.length + ' 件中 ' + items.length + ' 件表示';

    var sel = $('path-filter');
    if (sel) {
      var current = sel.value;
      sel.innerHTML = '<option value="">すべてのページ</option>';
      uniquePaths().forEach(function (p) {
        var o = document.createElement('option');
        o.value = p;
        o.textContent = p;
        if (p === current) o.selected = true;
        sel.appendChild(o);
      });
    }

    if (!items.length) {
      list.innerHTML = '<p class="empty">該当する履歴がありません（まだ保存されていないか空です）</p>';
      return;
    }

    list.innerHTML = '';
    items.forEach(function (e) {
      var card = document.createElement('div');
      card.className = 'card';
      card.innerHTML =
        '<div class="path"></div>' +
        '<div class="meta"></div>' +
        '<div class="msg"></div>';
      card.querySelector('.path').textContent = e.path || '(unknown)';
      card.querySelector('.meta').textContent =
        (e.userId || '') + ' · ' + (e.userName || '') + ' · ' + (e.datetime || '') +
        (e.ip ? ' · IP ' + e.ip : '') +
        (e.backupPath ? ' · ' + e.backupPath : '');
      card.querySelector('.msg').textContent = e.message || '';
      card.onclick = function () { showDetail(e); };
      list.appendChild(card);
    });
  }

  function showDetail(e) {
    selected = e;
    var box = $('detail');
    box.classList.remove('hidden');
    $('detail-title').textContent = (e.path || '') + ' @ ' + (e.datetime || '');
    $('detail-body').textContent = JSON.stringify(e, null, 2);
    if ($('restore-sha')) $('restore-sha').value = e.backupPath || '';
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function doRestoreHint() {
    var path = ($('restore-sha') && $('restore-sha').value.trim()) || '';
    if (!path) {
      alert('バックアップパスを入力するか、一覧から選択してください');
      return;
    }
    alert(
      '復元手順:\n' +
      '1. メインサイト CMS (admin.html) にログイン\n' +
      '2. 「変更履歴」タブを開く\n' +
      '3. 該当エントリの「復元」を押す\n\n' +
      '対象: ' + path
    );
  }

  function boot() {
    if ($('q')) $('q').oninput = render;
    if ($('path-filter')) $('path-filter').onchange = render;
    if ($('btn-refresh')) $('btn-refresh').onclick = load;
    if ($('btn-restore-hint')) $('btn-restore-hint').onclick = doRestoreHint;
    load();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
