(function () {
  'use strict';
  var OWNER = 'r25347sh';
  var REPO = 'asobiseminar_backup';
  var RAW = 'https://raw.githubusercontent.com/' + OWNER + '/' + REPO + '/main/';

  var data = [];
  var selected = null;

  function $(id) { return document.getElementById(id); }

  function load() {
    fetch(RAW + 'src/backup.json?t=' + Date.now())
      .then(function (r) {
        if (!r.ok) throw new Error('backup.json ' + r.status);
        return r.json();
      })
      .then(function (json) {
        data = Array.isArray(json) ? json : [];
        render();
      })
      .catch(function (e) {
        $('list').innerHTML = '<p class="empty">読込失敗: ' + e.message + '</p>';
        $('status').textContent = 'エラー';
      });
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
    if (sel && sel.options.length <= 1) {
      uniquePaths().forEach(function (p) {
        var o = document.createElement('option');
        o.value = p;
        o.textContent = p;
        sel.appendChild(o);
      });
    }

    if (!items.length) {
      list.innerHTML = '<p class="empty">該当する履歴がありません</p>';
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
    $('detail-title').textContent = e.path + ' @ ' + (e.datetime || '');
    $('detail-body').textContent = JSON.stringify(e, null, 2);
    if ($('restore-sha')) $('restore-sha').value = e.backupPath || '';
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function doRestoreHint() {
    var path = ($('restore-sha') && $('restore-sha').value.trim()) || '';
    if (!path) {
      alert('バックアップパス（例: data/pages/members/xxx.html/2026-...html）を入力してください');
      return;
    }
    alert(
      '復元手順:\n' +
      '1. メインサイトの CMS (admin.html) にログイン\n' +
      '2. 「変更履歴」タブを開く\n' +
      '3. 該当エントリの「復元」ボタンを押す\n\n' +
      'または管理者権限で CMS から直接復元できます。\n\n' +
      '対象バックアップ: ' + path
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
