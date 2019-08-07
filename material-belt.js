/**
 * Material Belt - v1.4.7 (c) 2016-2019; aburai
 *                  _            _       _   _          _ _
 *  _ __ ___   __ _| |_ ___ _ __(_) __ _| | | |__   ___| | |_
 * | '_ ` _ \ / _` | __/ _ \ '__| |/ _` | | | '_ \ / _ \ | __|
 * | | | | | | (_| | ||  __/ |  | | (_| | | | |_) |  __/ | |_
 * |_| |_| |_|\__,_|\__\___|_|  |_|\__,_|_| |_.__/ \___|_|\__|
 *
 * @file material-belt.js
 * @author André Bunse (aburai@github.com) <andre.bunse@gmail.com>
 * @version 1.4.7
 * @license Material Belt is released under the ISC license.
 *
 * Extend the mdl library from Jason Mayes.
 * https://github.com/google/material-design-lite
 *
 * @require
 * A component handler interface using the revealing module design pattern.
 * More details on this design pattern here:
 * https://github.com/jasonmayes/mdl-component-design-pattern
 * @author Jason Mayes.
 * @license Copyright Google, 2015. Licensed under an Apache-2 license.
 */
/**
 * Closure Core
 * @param {Object} $ jQuery Library
 */
/*jshint browser:true, jquery:true */
/*global _, Mousetrap, MaterialLayout, componentHandler */
;(function($) {
  'use strict';

  // TODO support require or module.export
  console.assert(typeof window.material === 'undefined', 'Namespace window.material already defined!');

  var
  WATCHDOG = {
    __version: '1.4.7',
    __build: '@BUILD@',
    __buildDate: '@BUILDDATE@'
  },

  LAYOUT_CLASSES = MaterialLayout.prototype.CssClasses_,
  CLASS_LAYOUT_HEADER = '.mdl-layout__header',
  CLASS_LAYOUT_HEADER_ROW = '.mdl-layout__header-row',
  CLASS_LAYOUT_DRAWER_BUTTON = '.mdl-layout__drawer-button',

  CLASS_LAYOUT_TABBAR = '.mdl-layout__tab-bar',
  CLASS_LAYOUT_TABBAR_BUTTON = '.mdl-layout__tab-bar-button',
  CLASS_LAYOUT_TAB = '.mdl-layout__tab',
  CLASS_LAYOUT_TAB_CONTENT = '.mdl-layout__content',
  CLASS_LAYOUT_TAB_PANEL = '.mdl-layout__tab-panel',
  CLASS_LAYOUT_TAB_PAGECONTENT = '.page-content',

  ANIMATION_END = 'webkitAnimationEnd.mdl mozAnimationEnd.mdl MSAnimationEnd.mdl oanimationend.mdl animationend.mdl',
  TRANSITION_END = 'webkitTransitionEnd.mdl mozTransitionEnd.mdl MSTransitionEnd.mdl otransitionend.mdl transitionend.mdl',

  /**
   * Definition of material belt control templates.
   * @private
   * @type {Object}
   */
  TEMPLATES = {
    // params: title, drawerTitle
    header: _.template('<div class="mdl-layout mdl-js-layout mdl-layout--fixed-header">' +
      '<header class="mdl-layout__header">' +
        '<div class="mdl-layout__header-row">' +
          '<span class="mdl-layout-title"><%= title %></span>' +
        '</div>' +
      '</header>' +
      '<div class="mdl-layout__drawer">' +
        '<span class="mdl-layout-title"><%= drawerTitle %></span>' +
      '</div>' +
      '</div>'
    ),
    tabbar: _.template('<div class="mdl-layout__tab-bar mdl-js-ripple-effect"></div>'),
    // params: href, title
    tabitem: _.template('<a href="<%= href %>" class="mdl-layout__tab"><%= title %></a>'),
    tabcontent: _.template('<main class="mdl-layout__content"></main>'),
    // params: id, content
    tabpanel: _.template('<section class="mdl-layout__tab-panel" id="<%= id %>">' +
        '<div class="page-content"><%= content %></div>' +
      '</section>'
    ),
    // params: label
    button: _.template('<button class="mdl-button mdl-js-button mdl-js-ripple-effect">' +
        '<%= label %>' +
      '</button>'
    ),
    // params: icon
    fab: _.template('<button class="mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect">' +
        '<i class="material-icons"><%= icon %></i>' +
      '</button>'
    ),
    // params: id, direction, effects, toggle, state, label, icon, list[{id,label,icon}]
    fabMulti: _.template('<ul id="<%= id %>" class="mfb-component--<%= direction %> mfb-<%= effects %>" data-mfb-hover data-mfb-toggle="<%= toggle %>" data-mfb-state="<%= state %>">' +
        // the menu content
        '<li class="mfb-component__wrap">' +
          // the main menu button
          '<a data-mfb-label="<%= label %>" class="mfb-component__button--main">' +
            // the main button icon visibile by default
            '<i class="mfb-component__main-icon--resting material-icons"><%= icon %></i>' +
            // the main button icon visibile when the user is hovering/interacting with the menu
            '<i class="mfb-component__main-icon--active material-icons"><%= icon %></i>' +
          '</a>' +
          '<ul class="mfb-component__list">' +
            // a child button, repeat as many times as needed
            '<% _.each(list, function(mfbl) { %>' +
            '<li>' +
              '<a id="mfb-<%= mfbl.id %>" href="//" data-mfb-label="<%= mfbl.label %>" class="mfb-component__button--child">' +
                '<i class="mfb-component__child-icon material-icons"><%= mfbl.icon %></i>' +
              '</a>' +
            '</li>' +
            '<% }) %>' +
          '</ul>' +
        '</li>' +
      '</ul>'
    ),
    // params: id, button.cls, button.icon
    search: _.template('<div class="mdl-search">' +
      '<div class="mdl-search__wrapper">' +
        '<select class="mdl-search__select mdl--left"></select>' +
        '<div class="mdl-textfield mdl-js-textfield">' +
          '<input type="text" class="mdl-textfield__input mdl-search__input" id="<%= id %>"/>' +
          '<label class="mdl-textfield__label hidden" for="<%= id %>"></label>' +
        '</div>' +
        '<button class="mdl-search__button mdl-button mdl-js-button mdl-js-ripple-effect <%= button.cls %>" disabled>' +
          '<i class="material-icons"><%= button.icon %></i>' +
        '</button>' +
      '</div>' +
      '</div>'
    ),
    // params: -
    searchDropdown: _.template('<div class="mdl-search__dropdown mdl-card mdl-shadow--2dp"></div>'),
    // params: id, label
    textfield: _.template('<div class="mdl-textfield mdl-js-textfield">' +
      '<input class="mdl-textfield__input" type="text" id="<%= id %>">' +
      '<label class="mdl-textfield__label" for="<%= id %>"><%= label %></label>' +
      '<span class="mdl-textfield__error"></span>' +
      '<span class="mdl-textfield__helper"></span>' +
      '</div>'
    ),
    // params: id, label, rows
    textarea: _.template('<div class="mdl-textfield mdl-js-textfield">' +
      '<textarea class="mdl-textfield__input" id="<%= id %>" rows="<%= rows %>"></textarea>' +
      '<label class="mdl-textfield__label" for="<%= id %>"><%= label %></label>' +
      '<span class="mdl-textfield__error"></span>' +
      '</div>'
    ),
    list: _.template('<ul class="mdl-list"></ul>'),
    // params: avatar, title
    listItemIconSingle: _.template('<li class="mdl-list__item">' +
      '<span class="mdl-list__item-primary-content">' +
        '<i class="material-icons mdl-list__item-icon"><%= avatar %></i>' +
        '<%= title %>' +
      '</span>' +
      '</li>'
    ),
    // params: avatar (material icons), title, body, action (material icons)
    listItemTwoLine: _.template('<li class="mdl-list__item mdl-list__item--two-line">' +
      '<span class="mdl-list__item-primary-content">' +
        '<i class="material-icons mdl-list__item-avatar"><%= avatar %></i>' +
        '<span><%= title %></span>' +
        '<span class="mdl-list__item-sub-title"><%= body %></span>' +
      '</span>' +
      '<span class="mdl-list__item-secondary-content">' +
        '<a class="mdl-list__item-secondary-action" href="//"><i class="material-icons"><%= action %></i></a>' +
      '</span>' +
      '</li>'
    ),
    // params: avatar (material icons), title, body, subtitle, action (material icons)
    listItemThreeLine: _.template('<li class="mdl-list__item mdl-list__item--three-line">' +
      '<span class="mdl-list__item-primary-content">' +
        '<i class="material-icons mdl-list__item-avatar"><%= avatar %></i>' +
        '<span><%= title %></span>' +
        '<span class="mdl-list__item-sub-title"><%= body %></span>' +
        '<span class="mdl-list__item-sub-sub-title"><%= subtitle %></span>' +
      '</span>' +
      '<span class="mdl-list__item-secondary-content">' +
        '<a class="mdl-list__item-secondary-action" href="//"><i class="material-icons"><%= action %></i></a>' +
      '</span>' +
      '</li>'
    ),
    // params: title, action
    card: _.template('<div class="mdl-card mdl-shadow--2dp">' +
      '<div class="mdl-card__title mdl-card--expand">' +
        '<h2 class="mdl-card__title-text"><%= title %></h2>' +
      '</div>' +
      '<div class="mdl-card__supporting-text"><%= text %></div>' +
      '<div class="mdl-card__actions mdl-card--border">' +
        '<a class="mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect"><%= action %></a>' +
      '</div>' +
      '</div>'
    ),
    // params: icon, label, message
    stepper: _.template('<li class="mdl-step mdl-step--optional">' +
        '<span class="mdl-step__label">' +
          '<span class="mdl-step__label-indicator">' +
            '<span class="mdl-step__label-indicator-content"><%= icon %></span>' +
          '</span>' +
          '<span class="mdl-step__title">' +
            '<span class="mdl-step__title-text"><%= label %></span>' +
            '<span class="mdl-step__title-message"><%= message %></span>' +
          '</span>' +
        '</span>' +
        '<div class="mdl-step__content"></div>' +
        '<div class="mdl-step__actions"></div>' +
      '</li>'
    ),
    // params: title, content
    dialog: _.template('<dialog class="mdl-dialog">' +
      '<h4 class="mdl-dialog__title hidden"><%= title %></h4>' +
      '<div class="mdl-dialog__content" style="overflow:hidden">' +
        '<p><%= content %></p>' +
      '</div>' +
      '<div class="mdl-dialog__actions hidden">' +
        '<button type="button" class="mdl-button hidden" data-name="agree"><%= agree %></button>' +
        '<button type="button" class="mdl-button hidden" data-name="disagree"><%= disagree %></button>' +
      '</div>' +
      '</dialog>'
    ),
    // params: -
    snackbar: _.template('<div class="mdl-snackbar mdl-js-snackbar">' +
      '<div class="mdl-snackbar__text"></div>' +
        '<button class="mdl-snackbar__action" type="button"></button>' +
      '</div>'
    ),
    // params: title, login, password, remember, message, tou (terms of use)
    login: _.template('<div class="mdl-login">' +
      '<div class="mdl-login__tou mdl-components__warning" data-lang="tou"><%= tou %></div>' +
      '<h4 data-lang="title"><%= title %></h4>' +
      '<div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">' +
        '<input class="mdl-login__login mdl-textfield__input" type="text" id="mdl-login__login">' +
        '<label class="mdl-textfield__label" for="login" data-lang="login"><%= login %></label>' +
      '</div>' +
      '<div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">' +
        '<input class="mdl-login__password mdl-textfield__input" type="password" id="mdl-login__password">' +
        '<label class="mdl-textfield__label" for="password" data-lang="password"><%= password %></label>' +
        '<span class="mdl-textfield__error" data-lang="password-incorrect">Password is incorrect.</span>' +
      '</div>' +
      '<div class="mdl-login__options">' +
        '<div class="mdl-login__remember mdl--left">' +
          '<label class="mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect" for="mdl-login__remember">' +
            '<input type="checkbox" id="mdl-login__remember" class="mdl-checkbox__input">' +
            '<span class="mdl-checkbox__label" data-lang="remember"><%= remember %></span>' +
          '</label>' +
        '</div>' +
      '</div>' +
      '<div class="mdl-login__message">' +
        '<label class="mdl-login__message-text" data-lang="authFailure"><%= message %></label>' +
        '<i class="material-icons">warning</i>' +
      '</div>' +
      '</div>'
    ),
    // params: cls, id
    menu: _.template('<ul class="mdl-menu <%= cls %> mdl-js-menu mdl-js-ripple-effect" data-mdl-for="<%= id %>"></ul>'),
    // params: id, item, icon
    menuItem: _.template('<li id="<%= id %>" class="mdl-menu__item">' +
      '<div style="display:inline-block;width:85%">' +
        '<span style="padding-right:30px;padding-left:4px;"><%= item %></span>' +
      '</div>' +
      '<div style="display:inline-block">' +
        '<i class="material-icons" style="position:relative;top:7px;left:10px;"><%= icon %></i>' +
      '</div>' +
      '</li>'
    ),
    // params: title
    drawer: _.template('<div class="mdl-drawer mdl-layout__drawer">' +
        '<span class="mdl-layout-title"><%= title %></span>' +
      '</div>' +
      '<div class="mdl-drawer-overlay mdl-layout__obfuscator"></div>'
    ),
    // params: id, label, checked
    toggle: _.template('<label class="mdl-switch mdl-js-switch mdl-js-ripple-effect" for="<%= id %>">' +
      '<input type="checkbox" id="<%= id %>" class="mdl-switch__input" <%= checked %>>' +
      '<span class="mdl-switch__label"><%= label %></span>' +
      '</label>'
    ),
    // params: id, label, checked
    checkbox: _.template('<label class="mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect" for="<%= id %>">' +
        '<input type="checkbox" id="<%= id %>" class="mdl-checkbox__input" <%= checked %>>' +
        '<span class="mdl-checkbox__label"><%= label %></span>' +
      '</label>'
    ),
    // params: id, name, label, value, checked
    radio: _.template('<label class="mdl-radio mdl-js-radio mdl-js-ripple-effect" for="<%= id %>">' +
        '<input type="radio" id="<%= id %>" class="mdl-radio__button" name="<%= name %>" value="<%= value %>" <%= checked %>>' +
        '<span class="mdl-radio__label"><%= label %></span>' +
      '</label>'
    ),
    // params: icon
    icon: _.template('<i class="material-icons"><%= icon %></i>'),
    // params:
    actionbar: _.template('<div class="mdl-actionbar"></div>'),
    // params: id
    tooltip: _.template('<div class="mdl-tooltip mdl-tooltip--large" for="<%= id %>"></div>'),
    // params: -
    spinner: _.template('<div class="mdl-spinner mdl-js-spinner"></div>'),
    // params: -
    progress: _.template('<div class="mdl-progress mdl-js-progress"></div>'),
    // params: title
    article: _.template('<div class="material-belt-article-layout mdl-layout mdl-layout--fixed-header mdl-js-layout mdl-color--grey-100">' +
      '<header class="material-belt-article-header mdl-layout__header mdl-color--grey-100 mdl-color-text--grey-800">' +
        '<div class="mdl-layout__header-row">' +
          '<span class="mdl-layout-title"><%= title %></span>' +
          '<div class="mdl-layout-spacer"></div>' +
          '<div class="mdl-textfield mdl-js-textfield mdl-textfield--expandable">' +
            '<label class="mdl-button mdl-js-button mdl-button--icon" for="search">' +
              '<i class="material-icons">search</i>' +
            '</label>' +
            '<div class="mdl-textfield__expandable-holder">' +
              '<input class="mdl-textfield__input" type="text" id="search">' +
              '<label class="mdl-textfield__label" for="search">Enter your query...</label>' +
            '</div>' +
           '</div>' +
        '</div>' +
      '</header>' +
      '<div class="material-belt-article-ribbon"></div>' +
      '<main class="material-belt-article-main mdl-layout__content">' +
        '<div class="material-belt-article-container mdl-grid">' +
          '<div class="mdl-cell mdl-cell--2-col mdl-cell--hide-tablet mdl-cell--hide-phone"></div>' +
          '<div class="material-belt-article-content mdl-color--white mdl-shadow--4dp mdl-color-text--grey-800 mdl-cell mdl-cell--8-col">' +
          '</div>' +
        '</div>' +
      '</main>' +
      '</div>'
    ),
    // params: label
    chips: _.template('<div class="mdl-chips__wrapper">' +
      '<div class="mdl-chips__label mdl-label"><%= label %></div>' +
      '<div class="mdl-chips__container">' + '' +
        '<textarea class="mdl-chips__sync hidden"/>' +
      '</div>' +
      '</div>'
    ),
    // params: prefixAction, prefix, label, action
    chip: _.template('<span class="mdl-chip">' +
      '<span class="mdl-chip__action mdl-chip__action-prefix hidden"><i class="material-icons"><%= prefixAction %></i></span>' +
      // '<a href="//" class="mdl-chip__action mdl-chip__action-prefix hidden"><i class="material-icons"><%= prefixAction %></i></a>' +
      '<span class="mdl-chip__contact hidden"><%= prefix %></span>' +
      '<span class="mdl-chip__text"><%= label %></span>' +
      '<span class="mdl-chip__action hidden"><i class="material-icons"><%= action %></i></span>' +
      // '<a href="//" class="mdl-chip__action hidden"><i class="material-icons"><%= action %></i></a>' +
      '</span>'
    ),
    // params: min, max, value
    slider: _.template('<div class="mdl-slider__wrapper">' +
      '<input class="mdl-slider mdl-js-slider" type="range" min="<%= min %>" max="<%= max %>" value="<%= value %>" tabindex="0">' +
      '<div class="mdl-slider__scala"/>' +
      '</div>'
    )
  },

  /**
   * Definition of material belt control defaults.
   * @private
   * @type {Object}
   */
  DEFAULTS = {
    forms: {
      hideHeader: false
    },
    slider: {
      min: 0,
      max: 100,
      value: 0,
      textfield: true,
      tooltip: false,
      scala: false
    },
    chips: {
      label: '',
      prefix: false,
      duplicates: false
    },
    chip: {
      label: '',
      prefixAction: '',
      prefix: false,
      prefixClass: '',
      action: false,
      actionClass: 'mdl-chip--deletable',
      on: {
        prefix: $.noop,
        action: $.noop,
        edit: $.noop
      }
    },
    select: {
      label: '',
      padded: true,
      bottomMenu: true
    },
    actionbar: {
      appendTo: 'body',
      theme: 'dark',
      noMore: false,
      hideMore: true,
      debug: false
    },
    table: {
      wrap: false,
      dense: false,
      selectable: false,
      shadow: false
    },
    snackbar: {
      message: '',
      timeout: 10000,
      type: 'info'
    },
    stepper: {
      horizontal: true,
      linear: true,
      alternateLabels: false,
      on: {
        next: $.noop
      }
    },
    tabs: {
      title: '',
      drawerTitle: '',
      hideHeader: false,
      hideButtons: 'auto',
      fullWidth: false,
      active: 0,
      store: '',
      on: {
        select: $.noop
      }
    },
    textfield: {
      id: '',
      label: '',
      appendTo: '',
      value: '',
      floatLabel: true,
      spellCheck: false,
      date: false,
      overlay: false,
      clear: true,
      helper: '',
      i18n: {
        agree: 'Übernehmen',
        disagree: 'Abbrechen',
        invalid: 'Ungültiges Datum'
      },
      on: {}
    },
    checkbox: {
      id: '',
      label: '',
      checked: ''
    },
    toggle: {
      label: '',
      checked: ''
    },
    button: {
      label: '',
      raised: false,
      colored: false,
      accent: false,
      icon: false
    },
    fab: {
      colored: true
    },
    fabMulti: {
      background: '#E40A5D',
      direction: 'br',
      effects: 'fountain',
      toggle: 'click',
      state: 'closed',
      label: '',
      list: []
    },
    search: {
      placeholder: 'enter search term..',
      button: {
        cls: 'mdl-button--colored mdl-button--raised',
        icon: 'search'
      },
      onClick: $.noop
    },
    dialog: {
      title: '',
      content: '',
      appendTo: 'body',
      agree: 'Agree',
      disagree: 'Disagree',
      submitOnReturn: false,
      closeOnEsc: false,
      timeout: 0,
      on: {
        agree: $.noop,
        disagree: $.noop
      }
    },
    login: {
      // property names for result object
      loginName: 'login',
      passwordName: 'password',
      // language settings
      lang: 'en',// default start language
      languages: {
        'de': {
          name: 'Deutsch',
          login: 'Benutzername',
          password: 'Passwort',
          submit: 'ANMELDEN',
          title: 'Geben Sie ihre Daten zur Anmeldung ein!',
          message: '',
          remember: 'Merken?',
          selectlang: 'Sprache auswählen',
          authSuccess: '',
          authFailure: '',
          //authSuccess: 'Anmeldung erfolgreich!',
          //authFailure: 'Anmeldung fehlgeschlagen!',
          tou: '',
          touAccept: 'Ich akzeptiere die',
          touLink: 'Nutzungsbedingungen',
          imprint: 'Impressum'
        },
        'en': {
          name: 'English',
          login: 'login',
          password: 'password',
          submit: 'SIGN IN',
          title: 'please enter your info to sign in',
          message: '',
          remember: 'remember me',
          selectlang: 'select language',
          authSuccess: '',
          authFailure: '',
          //authSuccess: 'authentication successful',
          //authFailure: 'authentication failed',
          tou: '',
          touAccept: 'I accept the',
          touLink: 'terms of use',
          imprint: 'Imprint'
        //},
        //'ja': {
        //  name: '日本語',
        //  login: 'ユーザ名',
        //  password: 'パスワード',
        //  submit: 'サインイン',
        //  title: 'サインインするあなたの情報を入力してください',
        //  message: '',
        //  remember: '私を覚えてますか',
        //  selectlang: '言語を選択する',
        //  authSuccess: '認証に成功',
        //  authFailure: '認証に失敗しました',
        //  tou: ''
        }
      },
      // flags
      submitOnReturn: true,
      autofocus: true,
      animate: true,
      imgLoaded: true,
      debug: false,
      // events
      on: {
        ready: $.noop,
        submit: $.noop,
        language: $.noop
      }
    },
    list: {},
    drawer: {
      title: '',
      overlay: true,
      on: {
        open: $.noop,
        close: $.noop
      },
      offset: {
        top: 0,
        bottom: 0
      },
      width: {
        mini: 80,
        fixed: 256,
        maxi: 320
      }
    },
    dropdown: {
      on: {
        click: $.noop,
        close: $.noop,
        pos: $.noop
      }
    },
    popup: {
      title: '',
      on: {
        loaded: $.noop,
        close: $.noop
      }
    }
  },

  KEYCODES = [],
  KEYCODES_ACTIVE = false,

  CLICKOUT = [],

  FN = {// private methods
    register_keycode: function(code, descr){
      if (!KEYCODES_ACTIVE) {
        KEYCODES_ACTIVE = true;
        Mousetrap.bind('* k', function() {
          var
          $list = $(TEMPLATES.list());

          _.each(KEYCODES, function(kc) {
            $list.append(TEMPLATES.listItemTwoLine({
              avatar: 'keyboard',
              title: kc.code,
              body: kc.descr,
              action: ''
            }));
          });

          window.material.dialog({
            width: 360,
            title: 'Keyboard Shortcuts',
            content: $list,
            disagree: 'OK',
            agree: false,
            open: true
          })
          .find('.mdl-dialog__content').css({ paddingLeft: 0, paddingRight: 0 });
        });
      }
      // TODO show dialog with registered keycodes
      KEYCODES.push({
        code: code,
        descr: descr
      });
    },
    hijack_login: function($mdlg, selector){
      if (!$(selector).length) { return; }

      var
      $hijack = $(selector),
      message;

      $hijack.hide();

      message = $hijack.find('span.message').html();
      message && $mdlg.find('.mdl-login__message-text').html($(message).text()).parent().show();

      $mdlg.on('click', '.mdl-button[data-name=agree]', function() {
        var
        $l = $('input[name=user]', $hijack),
        $p = $('input[name=password]', $hijack);

        $l.val($('#mdl-login__login').val());
        $p.val($('#mdl-login__password').val());
        $hijack.submit();
      });
    },
    // build jstree json data object from existing ul > li structure
    analyze_tree: function(selector){
      return getNode($('ul:first', selector));

      function getNode(node) {
        var
          nodes = [],
          nodeText,
          nodeHref,
          nodeName,
          n,
          $node = $(node),
          $li, $a, $c, $inp;

        $node.children('li').each(function() {
          $li = $(this);
          $a = $li.find('a:first');

          nodeText = $a.text().trim();
          nodeText = nodeText.replace(/&nbsp;/g, '');
          nodeText = nodeText.trim();

          nodeHref = $a.attr('href');
          nodeName = $a.attr('name');

          nodes.push(n = {
            data: { title: nodeText, attr: { href: nodeHref, name: nodeName } },
            attr: { id: nodeName }
          });

          switch (nodeText.toLowerCase()) {
            case 'exportsethome': n.data.icon = 'explicit'; break;
            case 'mappensymbole': n.data.icon = 'art_track'; break;
            //case 'replikation': n.data.icon = 'mdi:folder-upload'; break;
            default: n.data.icon = 'folder'; break;
          }

          $a.is('.active') && (n.attr['data-active'] = '');

          // mark up unloaded node
          $li.find('ins:first').is('.navitem-unloaded.subfolders') && (n.attr['data-unloaded'] = '');

          if ($li.is('.jstree-checked')) {
            n.attr['class'] = 'jstree-checked';
          }

          // get checkbox data
          $inp = $li.find('input[type=checkbox]');
          if ($inp.length) {
            // TODO extend n.data? check mtv.js
            n.data.checkbox = {
              name: $inp.attr('name'),
              value: $inp.attr('value')
            };
            n.attr['data-name'] = n.data.checkbox.name;
            n.attr['data-value'] = n.data.checkbox.value;
          }

          // detect subnodes
          $c = $li.children('ul');
          if ($c.length) {
            n.children = getNode($c);
            if (!$li.is('.jstree-closed') && n.children && n.children.length) {
              n.state = 'open';
            }
            // we have no childs, but an ul tag
            // subnodes will be loaded after click
            else {
              n.state = 'closed';
            }
          }
        });

        return nodes;
      }
    },
    style_header: function(header, colorClass){
      $(header)
      .find(CLASS_LAYOUT_HEADER).addClass(colorClass)
      .end()
      .find(CLASS_LAYOUT_TABBAR).addClass(colorClass)
      .end()
      .find(CLASS_LAYOUT_TABBAR_BUTTON).addClass(colorClass);
    },
    hide_header: function(header){
      $(header)
        .find(CLASS_LAYOUT_HEADER).css('minHeight', '48px')
          .end()
        .find(CLASS_LAYOUT_DRAWER_BUTTON).hide()
          .end()
        .find(CLASS_LAYOUT_HEADER_ROW).hide();
    },
    hide_tabbar_buttons: function(header, state){
      var
      $header = $(header),
      $tabs = $header.find(CLASS_LAYOUT_TAB),
      $buttons = $header.find(CLASS_LAYOUT_TABBAR_BUTTON);

      if (state === true) {
        hideButtons();
        //$tabs.width('calc(' + (100 / $tabs.length) + '% - 48px)');
      }
      else if (state === 'auto') {
        if (!needButtons()) {
          hideButtons();
        }
        $(window).resize(_.debounce(function() {
          needButtons() ? showButtons() : hideButtons();
        }, 800));
      }

      function hideButtons() {
        //if ($buttons.is(':hidden')) { return; }

        $buttons.hide();
        $header//.css({ overflow: 'hidden' })
        // overwrite width: calc(100% - 112px)
        .find(CLASS_LAYOUT_TABBAR).css({ width: '100%', padding: 0 });
      }
      function showButtons() {
        if ($buttons.is(':visible')) { return; }

        $buttons.show();
        $header.find(CLASS_LAYOUT_TABBAR)
        .css({ width: 'calc(100% - 112px)', paddingLeft: 56 })
        .scrollLeft(0);
      }
      function needButtons() {
        return getTabsWidth() > $header.width();
      }
      function getTabsWidth() {
        var tabsWidth = 0;
        $tabs.each(function() {
          tabsWidth += $(this).outerWidth(true);
        });
        return tabsWidth;
      }
    },
    // check and repair state for non progressive tree data
    repair_tree_data: function(tdata){
      _.each(tdata, checkState);

      function checkState(n) {
        // no children, repair state
        if (_.isEmpty(n.children)) {
          n.state = '';
          return;
        }

        // has children, check them
        _.each(n.children, function(nc) {
          checkState(nc);
        });
      }
    },
    // from material-icons to mdi
    // iconName => mdi:name
    convert_icon: function(el, iconName, callback){
      if (!el || !iconName) { return; }// params required
      if (!/^mdi:/.test(iconName)) { return; }// no valid mdi name

      var $el = $(el);

      if (!$el.is('.material-icons')) {
        $el = $el.find('.material-icons');
      }

      $el
        .text('').removeClass('material-icons')// remove stock classifier
        .addClass('mdi mdi-24px ' + iconName.replace(':', '-'));// add mdi classifier

      _.isFunction(callback) && callback($el);
    }
  };

  /**
   * Class Login
   * @constructor Login
   * @param {Object} dom dialog elements
   * @param {Object} params login parameter
   */
  function Login(dom, params) {
    this.dom = dom;
    this.lang = params.lang;
    this.languages = params.languages;
    this.classOut = 'flipOutX';
    this.classIn = 'flipInX';
    this.on = params.on;
  }

  Login.prototype.getDialog = function() {
    return this.dom.$dlg;
  };

  // "content", "background", callback()
  // "content", css:{}, callback()
  // or { content: "", background: "", css: {}, callback: function() }
  Login.prototype.setHeader = function() {
    var
    lgn = this,
    $header = lgn.dom.$title,
    args = _.toArray(arguments),
    arg0 = args.shift(),
    content,
    headerCss,
    background = args.shift(),
    callback = args.shift();

    // handle arguments
    if (_.isFunction(background)) {
      callback = background;
      background = null;
    }
    else if (_.isObject(background)) {
      headerCss = background;
      background = null;
    }
    // as json object
    if (_.isObject(arg0)) {
      background = background || arg0.background;
      headerCss = headerCss || arg0.css;
      callback = callback || arg0.callback;
      content = arg0.header || arg0.content;
    }
    else if (_.isString(arg0)) {
      content = arg0;
    }

    // start animation only if background or content changed
    if (background || content) {
      $header.animateCss(lgn.classOut, function() {
        var lastHeight = $header.outerHeight(true);
        $header.css('min-height', lastHeight);
        _.isObject(headerCss) && $header.css(headerCss);
        _.isString(background) && $header.css('background', background);
        _.isString(content) && $header.empty().append(content);
        $header.animateCss(lgn.classIn, callback);
      });
    }
    else {
      _.isFunction(callback) && callback();
    }
  };
  // "langKey" like "de", "en", "ja"
  Login.prototype.setLanguage = function() {
    var
    lgn = this,
    $dlg = lgn.dom.$dlg,
    args = _.toArray(arguments),
    lang = args.shift(),
    dlgLang;

    if (!lgn.languages) {
      console.warn('Login: no languages defined!');
      return this;
    }
    dlgLang = lgn.languages[lang];
    if (!dlgLang) {
      console.warn('Login: language "%s" not defined!', lang);
      console.info('defined languages: %s', Object.keys(lgn.languages).join(','));
      return this;
    }

    lgn.lang = lang;// set new language key
    lgn.on.language(lang);// callback handler

    // replace all dialog controls with lang data attribute
    _.each(dlgLang, function(value, key) {
      $dlg.find('[data-lang="' + key + '"]').text(value);
    });

    // set checked icon to new selected language
    lgn.dom.$languagesMenu.find('.mdl-menu__item').each(function() {
      $(this).find('.material-icons').text(this.id === lang ? 'radio_button_checked' : 'radio_button_unchecked');
    });
  };

  Login.prototype.setMessage = function() {
    var
      lgn = this,
      args = _.toArray(arguments),
      msg = args.shift(),
      $msg = lgn.dom.$message;

    $msg.text(msg);
    msg ? $msg.parent().show().animateCss('bounceIn') : $msg.parent().hide();
  };

  // ====== Material Action Bar ===============================================
  /**
   * Actionbar: Action definition
   *
   * # required properties #
   *
   * "name": {String} (must be unique)
   *
   * # common properties #
   *
   * "href": {String} (URL, javascript:)
   * "target": {String} (_blank => open in new tab/window)
   * "label": {String}
   * "title": {String} (Tooltip, Hint)
   * "badge": {String/Number}
   * "disabled": {Boolean}
   * "hidden": {Boolean}
   * "checked": {Booolean}
   * "cls": {String} (additional css class/es)
   *
   * # component properties #
   *
   * "icon": {String} (Material Icon, Material Design Icons => prefix mdi:)
   * "iconText": {String}
   * "select": {Array}
   * "checkbox": {Boolean}
   * "toggle": {Boolean}
   * "width": {Number}
   */

  /**
   * Class Material Action Bar.
   * @constructor ActionBar
   * @param params
   * @param {Function} callback
   */
  function ActionBar(params, callback) {
    this.params = $.extend({}, DEFAULTS.actionbar, params);
    this.name = this.params.name || 'mdl-actionbar-' + $.guid++;
    this.$element = $(TEMPLATES.actionbar(this.params)).data('instance', this);
    this.actions = {};
    this.callback = callback || $.noop;
    this._init();
  }

  ActionBar.prototype._init = function() {
    if (!_.layout) {
      console.error('window.material.actionbar: Borderlayout Belt not found!');
      return;
    }

    var
      ab = this,
      params = this.params,
      fixedKeys,
      fixedGroups,
      layoutParams = {
        name: params.name,
        theme: 'material',
        flags: { store: false },
        on: {
          resize: function() {
            ab.recalc();
          }
        }
      };

    this.$element.addClass(params.theme === 'dark' ? 'mdl-actionbar--dark' : 'mdl-actionbar--light');
    this.$element.addClass(params.direction === 'vertical' ? 'mdl-actionbar--vertical' : '');
    params.appendTo && this.$element.appendTo(params.appendTo);
    params.prependTo && this.$element.prependTo(params.prependTo);

    if (params.direction !== 'vertical') {
      layoutParams.sreg = 'c-,e-';
      layoutParams.east = { size: 289 };
    }
    else {
      layoutParams.sreg = 'c-,s-';
      layoutParams.south = { size: 289 };
    }

    _.layout.create(this.$element, layoutParams, function(layout) {
      ab.layout = layout;

      ab.$center = layout.panes.center.children().first().addClass('mdl-actionbar__scroll');
      if (params.direction !== 'vertical') {
        ab.$east = layout.panes.east.children().first().addClass('mdl-actionbar__fixed');
      }
      else {
        ab.$south = layout.panes.south.children().first().addClass('mdl-actionbar__fixed');
      }

      !params.noMore && ab.addMore();

      // insert fixed action group
      // show / hide east layout region
      if (!_.isEmpty(params.fixed)) {
        layout.show(params.direction !== 'vertical' ? 'east' : 'south');
        // check fixed group definition
        // if only actions, wrap in group definition
        fixedKeys = _.keys(_.first(params.fixed));
        if (!_.includes(fixedKeys, 'actions')) {
          fixedGroups = [{ id: 'fixed', actions: params.fixed }];
        }
        else {
          fixedGroups = params.fixed;
        }
        insertGroups(fixedGroups, params.direction !== 'vertical' ? ab.$east : ab.$south);
      }
      else {
        layout.hide(params.direction !== 'vertical' ? 'east' : 'south');
      }

      insertGroups(params.groups, ab.$center);

      ab.recalc();
      ab._bind();

      // TODO not all components are already upgraded
      // this may cause errors if someone use the instance in the callback
      ab.callback();
    });

    function insertGroups(groups, $appendTo) {
      // insert all other group definitions
      _.each(groups, function (group) {
        // filter out invalid action definitions
        const groupActions = _.filter(group.actions, function (ac) {
          return !_.isEmpty(ac) && !_.has(ab.actions, ac.name);
        });

        // skip groups with no actions
        if (!_.isEmpty(groupActions)) {
          const $group = $('<div/>')
            .addClass('mdl-actionbar__group mdl-actionbar__group--more mdl--left')
            .attr('data-id', group.id)
            .appendTo($appendTo);
          ab.addGroup(groupActions, $group);
        }
      });
    }
  };

  ActionBar.prototype.destroy = function() {
    // remove menus
    $('.mdl-menu[data-uid="' + this.name + '"]').parent().remove();
    // remove tooltips
    $('.mdl-tooltip[data-uid="' + this.name + '"]').remove();
    // unbind event handler
    this.$element.off('*');
    this.$moreMenu.off('*');
    // call existing destroy methods
    this.layout.destroy();
    // remove outer wrapper
    this.$element.remove();
  };

  // Bind Eventhandler:
  //   Icon Button clicked
  //   Select Button clicked
  //   Select changed
  //   Checkbox toggled / changed
  ActionBar.prototype._bind = function() {
    var
      ab = this;

    // button click handler for normal icon actions
    this.$element.on('click.mdl-actionbar', 'button.mdl-actionbar__item', function() {
      var actionName = $(this).attr('data-action');
      actionName && ab.callAction(actionName, this);
    });

    // button click handler for select+button controls
    this.$element.on('change.mdl-actionbar', '.mdl-actionbar__item > select', function() {
      var
        $item = $(this).parent(),
        action = $item.attr('data-action'),
        $opt = $(this).children(':selected'),
        actionCallback = _.go('params.on.action', ab);

      // sync selected option with action in the actionbar
      if (ab.$moreMenu) {
        $('#mi-' + action, ab.$moreMenu)
          .find('option[value="' + $opt.val() + '"]').prop('selected', true);
      }

      ab.callAction(action, this, { value: $opt.val() });

      /*
      if (_.isFunction(actionCallback)) {
        // if callback return false, we break up
        if (actionCallback.call(this, action, $opt, { value: $opt.val() }) === false) {
          //return;
        }
      }
      */
    });

    // button click handler for select+button controls
    this.$element.on('click.mdl-actionbar', '.mdl-actionbar__item-button', function() {
      var
        $sel = $(this).prev(),
        $opt = $sel.children(':selected'),
        action = $opt.data(),
        actionName;

      // no action on the option
      // get informations from the select
      if (_.isEmpty(action)) {
        actionName = $sel.data('name');
      }
      else {
        actionName = action.name || $sel.data('name');
      }

      ab.callAction(actionName);
    });

    // checkbox change handler
    this.$element.on('change', '.mdl-actionbar__item .mdl-checkbox__input', function() {
      var $mdlcbx = $(this).parent();
      ab.callAction($mdlcbx.attr('data-action'), $mdlcbx.get(0), { value: this.checked });
    });
    this.$element.on('change', '.mdl-actionbar__item .mdl-switch__input', function() {
      var $toggle = $(this).parents('.mdl-switch');
      ab.callAction($toggle.attr('data-action'), $toggle.get(0).MaterialSwitch);
    });

    // textfield change handler
    this.$element.on('change', '.mdl-actionbar__item .mdl-textfield__input', function() {
      var $tf = $(this).parents('.mdl-textfield');
      ab.callAction($tf.attr('data-action'), $tf.get(0).MaterialTextfield);
    });

    if (this.$moreMenu && this.$moreMenu.length) {
      this.$moreMenu
        .on('click.mdl-actionbar', '.mdl-actionbar__more-button', function() {
          var $this = $(this);
          if ($this.is('.disabled') || $this.is('[disabled]')) {
            return false;
          }

          ab.callAction($this.data('action'), this);
        })
        // set select in actionbar to selected option from more menu
        .on('change.mdl-actionbar', 'select', function() {
          var
            $li = $(this).parents('.mdl-actionbar__more-select'),
            actionName = $li.data('action'),
            $action = $('[data-action="' + actionName + '"]', ab.$element),
            selInst = $action.find('.mdl-select').data('instance');

          (selInst instanceof MSelect) && selInst.set(this.value);
        })
        .on('click.mdl-actionbar', '.mdl-actionbar__item-button', function() {
          var
            $li = $(this).parents('.mdl-menu__item'),
            $sel = $li.find('select'),
            $opt = $sel.children(':selected'),
            action = $opt.data(),
            actionName;

          // no action on the option
          // get informations from the select
          if (_.isEmpty(action)) {
            actionName = $sel.data('name');
          }
          else {
            actionName = action.name || $sel.data('name');
          }

          ab.callAction(actionName);
        })
        // TODO must we react on this clicks?
        // TODO the buttons after the select triggers by .mdl-actionbar__item-button
        .on('click.mdl-actionbar', '.mdl-actionbar__more-select', function(event) {
          // otherwise the click bubbles up and close the menu
          event.stopImmediatePropagation();
          return false;
          // NOTE IE fires event on option too
          //if ($(event.target).is('select') || $(event.target).is('option')) {
          //  event.stopImmediatePropagation();
          //  return false;
          //}
        //
        //  var
        //    $sel = $(this).find('select'),
        //    $opt = $sel.children(':selected'),
        //    action = $opt.data(),
        //    actionName;
        //
        //  if (_.isEmpty(action)) {
        //    actionName = $sel.data('name');
        //  }
        //  else {
        //    actionName = action.name || $sel.data('name');
        //  }
        //  ab.callAction(actionName, this);
        });

      // keyboard handling: open/close the more menu
      Mousetrap.bind('* o', function() {
        ab.$more.click();
      });
    }

    // TODO mehrere Actionbars, welche hat den Fokus?
    //ab.params.trap && Mousetrap.bind(['* * 1', '* * 2'], function(event) {
    //  var $buttons = this.getButtons(), which = parseInt(event.key, 10) - 1;
    //  $($buttons.get(which)).click();
    //}.bind(this));
    //ab.params.trap && Mousetrap.bind(['* * ?'], function() {
    //  var $btns = this.getButtons(), actions = [];
    //  $btns.each(function(i) {
    //    actions.push({ name: $(this).data('action'), label: i+1 });
    //  });
    //  this.badge(actions);
    //}.bind(this));
  };

  ActionBar.prototype.getButtons = function() {
    var $visibleGroups = this.$center.find('.mdl-actionbar__group');
    var $buttons = $visibleGroups.find('.mdl-button[data-action]:visible')
      .not(this.$more)
      .not('[disabled]');
    return $buttons;
  };

  ActionBar.prototype.callAction = function(actionName, context, data) {
    var
      action = this.actions[actionName],
      actionData = _.extend({ action: actionName }, data),
      bindTo,
      actionCallback = _.go('params.on.action', this);

    if (_.isFunction(actionCallback)) {
      bindTo = _.go('bindTo', action) || action;
      // if callback return false, we break up
      if (this.params.returnData) {
        if (actionCallback.call(context || this, actionName, actionData) === false) {
          return;
        }
      }
      else if (actionCallback.call(context || this, actionName, bindTo, action, context) === false) {
        return;
      }
    }

    _.open(action);
  };

  // build actions for group
  //   - labeled button with icon
  //   - icon button
  //   - select with button
  //   - toggle
  //   - checkbox
  //   - textfield
  ActionBar.prototype.addGroup = function(group, $appendTo) {
    let gid = _.uniqueId('ab-g');
    // build group wrapper
    // swap actions property
    if (!$appendTo && !_.isEmpty(group)) {
      $appendTo = $('<div/>')
        .addClass('mdl-actionbar__group mdl-actionbar__group--more mdl--left')
        .attr('data-id', group.id)
        .appendTo(this.$center);
      gid = group.id;
      group = group.actions;
    }
    else {
      gid = $appendTo.data('id');
    }

    if (_.isEmpty(group)) {
      $appendTo.remove();
      return;
    }// no actions -> remove container, prevent not nessecary html

    const ab = this;

    // remove all invalid action definitions
    // invalid = no object, empty object or no action name!!
    group = _.filter(group, function (action) {
      return !_.isEmpty(action) && !_.isUndefined(action.name);
    });

    if (_.isEmpty(group)) {
      $appendTo.remove();
      return;
    }// no actions -> hide container

    _.each(group, function (action) {
      if (!action.name) {
        ab.params.debug !== false && console.warn('window.material.actionbar: invalid action definition! missing property "name"', action);
      }
      if (ab.actions[action.name]) {
        ab.params.debug !== false && console.warn('window.material.actionbar: duplicate action definition! name already defined', action, ab.actions);
        return;
      }

      ab.actions[action.name] = action;
      ab.actions[action.name].gid = gid;

      // CHECKBOX
      // TODO more menu control
      if (action.checkbox) {
        action.$control = window.material.checkbox({
            appendTo: $appendTo,
            label: action.label,
            checked: action.checked
          })
          .attr('data-action', action.name)
          .data('name', action.name)
          .addClass('mdl-actionbar__item mdl--left' + (action.hidden ? ' hidden' : ''))
          .prop('disabled', action.disabled);
      }
      else if (action.textfield) {
        ab.addTextfield(action, $appendTo);
      }
      // CHECKBOX AS TOGGLE
      // TODO more menu control
      else if (action.toggle) {
        action.$control = window.material.toggle({
          appendTo: $appendTo,
          label: action.label,
          checked: action.checked
        })
          .width(action.width || 180)// TODO calc width but overwrite 100% from css
          .attr('data-action', action.name)
          .data('name', action.name)
          .addClass('mdl-actionbar__item mdl--left' + (action.hidden ? ' hidden' : ''))
          .prop('disabled', action.disabled);
      }
      // LABEL BUTTON WITH OPTIONAL ICON
      else if (action.label && action.icon) {
        ab.addButton(action, $appendTo);
      }
      // ICON BUTTON
      else if (action.icon || action.iconText) {
        ab.addIcon(action, $appendTo);
      }
      // SELECT
      else if (action.select) {
        // TODO skip empty selects
        !_.isEmpty(action.select) && ab.addSelect(action, $appendTo);
      }
      // LABEL ONLY
      else if (!_.isUndefined(action.label)) {
        action.$control = $('<label/>')
          .attr('data-action', action.name)
          .addClass('mdl-actionbar__label ' + (action.cls || ''))
          .text(action.label)
          .appendTo($appendTo);
        if (action.for) action.$control.attr('for', action.for);
      }

      if (!_.isUndefined(action.badge)) {
        $appendTo.append(
          action.$badge = $('<div/>').addClass('mdl-actionbar__item-badge mdl--left').text(action.badge)
          //action.$badge = $('<div/>').addClass('mdl-actionbar__item-badge mdl-badge mdl--left').attr('data-badge', action.badge)
        );
      }

      if (!_.isUndefined(action.trap)) {
        console.log('define mouse trap directly?', action.trap);
      }
    });
  };

  /**
   * Add a Icon Button Control in the ActionBar.
   * @param action
   * @param $appendTo
   */
  ActionBar.prototype.addIcon = function(action, $appendTo) {
    var
      ab = this,
      $btn,
      $menuItem;

    $btn = action.$control = window.material.button({
      appendTo: $appendTo,
      label: action.iconText || TEMPLATES.icon({ icon: action.icon }),
      cls: action.iconText ? 'mdl-actionbar__item--text' : '',
      icon: true,
      title: action.title || action.tooltip,
      data: { uid: ab.name },
      titlePosition: _.getObject('tooltips.position', ab.params) || 'bottom',
      disabled: true// create in disabled mode
    })
      .attr('data-action', action.name)
      .data('name', action.name)
      .addClass('mdl-actionbar__item mdl--left' + (action.hidden ? ' hidden' : ''));

    action.cls && $btn.addClass(action.cls);

    // support Material Design Icons Package
    FN.convert_icon($btn, action.icon);

    // more menu active?
    // only "clone" enabled actions from a more group
    // TODO hide all disabled actions??
    //if (ab.$moreMenu && !action.disabled && $appendTo.is('.mdl-actionbar__group--more')) {
    if (ab.$moreMenu && $appendTo.is('.mdl-actionbar__group--more')) {
      ab.$moreMenu.append($menuItem = action.$menu = $(TEMPLATES.menuItem({
        id: 'mi-' + action.name,
        item: action.title || action.iconText,
        icon: action.icon
      })));

      action.cls && $menuItem.addClass(action.cls);

      // support Material Design Icons Package
      FN.convert_icon($menuItem, action.icon, function($el) { $el.css('top', '3px'); });

      $menuItem
        .attr('disabled', 'disabled')
        .addClass('mdl-actionbar__more-button disabled')
        .attr('data-action', action.name)
        .children('div:last').width(64);

      if (action.badge) {
        $menuItem.children('div:last')
          .find('.material-icons')
            .addClass('mdl-badge mdl-badge--overlap')
            .attr('data-badge', action.badge);
      }
    }

    !action.disabled && ab.enable(action.name);
  };

  /**
   * Add a Button Control in the ActionBar.
   * @param action
   * @param $appendTo
   */
  ActionBar.prototype.addButton = function(action, $appendTo) {
    var
      ab = this,
      $btn,
      $menuItem,
      $badge;

    // remove "title" as tooltip, if data is the same as label
    if (action.label.toLowerCase() === (action.title||'').toLowerCase()) {
      action.title = '';
    }

    $btn = action.$control = window.material.button({
      appendTo: $appendTo,
      label: action.label,
      iconLeft: action.icon,
      title: action.title,
      data: { uid: ab.name },
      upload: action.upload,
      on: {
        upload: function(files) {
          if (_.isEmpty(files)) { return; }

          // store selected file(s)
          action.files = files;
          // preview selected file name in badge
          $badge.text(_.first(files).name);
          // hide the upload element
          $btn.find('.mdl-button__file-upload').hide();
        }
      }
    })
      .attr('data-action', action.name)
      .data('name', action.name)
      .addClass('mdl-actionbar__item mdl-actionbar__item-label-button mdl--left' + (action.hidden ? ' hidden' : ''));

    action.cls && $btn.addClass(action.cls);
    action.disabled && ab.disable(action.name);

    if (action.upload) {
      $appendTo.append(
        $badge = $('<div/>').addClass('mdl-actionbar__item-badge mdl--left')
          .text('?')
          //.append(window.material.icon('help_outline'))
      );
      // upload property could be a function
      // ex. to modify the container and wrap a form element
      if (_.isFunction(action.upload)) {
        action.upload.call(ab, action);
      }
    }

    if (ab.$moreMenu && $appendTo.is('.mdl-actionbar__group--more')) {
      ab.$moreMenu.append($menuItem = action.$menu = $(TEMPLATES.menuItem({
        id: 'mi-' + action.name,
        item: action.label || action.title,
        icon: action.icon
      })));

      $menuItem
        .attr('disabled', 'disabled')
        .addClass('mdl-actionbar__more-button disabled')
        .attr('data-action', action.name)
        .children('div:first').width('85%');

      if (action.badge) {
        $menuItem.children('div:last')
          .find('.material-icons')
          .addClass('mdl-badge mdl-badge--overlap')
          .attr('data-badge', action.badge);
      }
    }

    !action.disabled && ab.enable(action.name);
  };

  /**
   * Add a Select ~ Button Control in the ActionBar.
   * @param action { button: "material icon", name: "", select: [{label,value,selected}] }
   * @param $appendTo
   */
  ActionBar.prototype.addSelect = function(action, $appendTo) {
    var
      ab = this,
      $selItem = action.$control = $('<div class="mdl-actionbar__item mdl-actionbar__item-select-button mdl--left">' +
        '<select size="1" disabled></select>' +
        (action.button ? TEMPLATES.button({ label: TEMPLATES.icon({ icon: action.button }) }) : '') +
        '</div>'
      ).attr('data-action', action.name),
      $sel = $selItem.find('select').data('name', action.name),
      $button = $selItem.find('button').addClass('mdl-actionbar__item-button'),
      button = $button.get(0),
      $noption,
      $menuItem,
      options = [];

    if (action.button) {
      $sel.css({ borderTopRightRadius: 0, borderBottomRightRadius: 0 });
      window.componentHandler.upgradeElement(button);
      button.MaterialButton.disable();
    }

    // copy options from an existing element
    if (!Array.isArray(action.select) && (_.isElement(action.select) || _.isElement(action.select[0]))) {
      $(action.select).children('option').each(function () {
        options.push({
          value: this.value,
          label: this.innerText,
          selected: $(this).prop('selected')
        });
      });
      action.select = options;
      action.hidden = _.isEmpty(options);
    }

    _.each(action.select, function(opt) {
      if (opt && opt.label) {
        $noption = $(new Option(opt.label, opt.value || ''));
        $noption.prop('selected', opt.selected);
        $noption.data(opt);
        $sel.append($noption);
        // an option with href is a real action
        if (opt.href) {
          ab.actions[opt.name] = opt;
        }
      }
    });

    action.cls && $selItem.addClass(action.cls);
    action.hidden && $selItem.hide();

    $selItem.appendTo($appendTo);

    // convert select to material design
    action.select = _.first(window.material.selectFrom($sel, {
      width: action.width,
      //width: $selItem.outerWidth(true),
      padded: false,
      label: action.label,
      disabled: action.disabled
    }));
    action.button && action.select.$tf.addClass('mdl-textfield--no-radius-right');

    // add method to change options for actionbar and more menu
    action.options = function(newOptions, clear) {
      var $sel;

      // update actionbar select control
      action.select.options(newOptions, clear);

      // update more menu select
      $sel = action.$menu.find('select').empty();
      _.each(newOptions, function(no) {
        $sel.append(
          $('<option/>').attr({ value: no.value }).text(no.label).prop('selected', no.selected)
        );
      });
    };

    // create select ~ button control in the more menu
    if (ab.$moreMenu && $appendTo.is('.mdl-actionbar__group--more')) {
      ab.$moreMenu.append($menuItem = action.$menu = $(TEMPLATES.menuItem({
        id: 'mi-' + action.name,
        item: action.title,
        icon: action.icon
      })));

      $menuItem
        .attr('disabled', 'disabled')
        .addClass('mdl-actionbar__more-select disabled')
        .attr('data-action', action.name);

      action.hidden && $menuItem.addClass('hidden');

      $menuItem.children('div:first').width('82%').empty().append(
        $sel.clone(true).show()// true = copy option.data
      );
      $menuItem.children('div:last').empty().append(
        $button.clone(true, true)
      );
      // convert the cloned select
      //window.material.selectFrom($menuItem.find('select'), {
      //  padded: false
      //});
    }

    !action.disabled && ab.enable(action.name);
  };

  ActionBar.prototype.addTextfield = function(action, $appendTo) {
    action.$control = window.material.textfield({
        appendTo: $appendTo,
        placeholder: action.placeholder,
        value: action.value,
        label: action.label,
        width: action.width || 120
      })
      .css({backgroundColor: 'transparent', marginTop: -10, marginLeft: 6})
      .attr('data-action', action.name)
      .data('name', action.name)
      .addClass('mdl-actionbar__item mdl-actionbar__textfield mdl--left' + (action.hidden ? ' hidden' : ''))
      .prop('disabled', action.disabled);
  };

  ActionBar.prototype.addMore = function() {
    var
      moreId = this.name + '-more',
      $appendTo = $('body'),
      menuPositionClass;
      //$appendTo = this.params.appendTo.offsetParent();

    // create icon button to show hidden action groups
    this.$more = window.material.button({
      label: TEMPLATES.icon({ icon: 'more_vert' }),
      icon: true
    })
      .attr('id', moreId)
      .addClass('mdl-actionbar__item mdl-actionbar__item--more')
      .prop('disabled', true);

    // put button "more" into own group
    this.$center.append(
      $('<div/>').addClass('mdl-actionbar__group mdl-actionbar__group-more mdl--right').append(
        this.$more
      )
    );

    menuPositionClass = _.go('params.menu.position', this) === 'br' ? 'top-right' : 'bottom-right';
    this.$moreMenu = $(TEMPLATES.menu({ id: moreId, cls: 'mdl-menu--' + menuPositionClass }))
      .attr('data-uid', this.name)
      .appendTo($appendTo);

    window.componentHandler.registerUpgradedCallback('MaterialMenu', function() {
      //console.log('registerUpgradedCallback menu');
    });
    this.$moreMenu.one('mdl-componentupgraded', function() {
      //console.log('mdl-componentupgraded');
    });
    window.componentHandler.upgradeElement(this.$moreMenu.get(0));
  };

  ActionBar.prototype.recalc = function() {
    var
      ab = this,
      eastWidth = 0,
      centerWidth,
      centerPaneWidth;

    if (this.params.direction === 'vertical') { return; }// TODO

    this.$east.children(':visible').each(function(i, el) {
      // TODO without +1 controls wrapped
      // TODO with only +1 IE wraps button
      eastWidth += $(el).outerWidth(true) + 2;
    });
    this.layout.sizePane('east', eastWidth, false, true);

    centerPaneWidth = ab.layout.center.state.innerWidth;

    // TODO only show if fits
    getHiddenGroups().show();
    while ((centerWidth = getCenterWidth()) > centerPaneWidth && getVisibleGroups().length > 0) {
      hideLastGroup();
    }
    this.centerSpace = centerPaneWidth - centerWidth;
    this.debug && console.log('centerSpace: %d = %d - %d ', this.centerSpace, centerPaneWidth, centerWidth);

    checkMoreMenu();

    function checkMoreMenu() {
      if (!ab.$moreMenu || !ab.$moreMenu.length) { return; }

      var
        $hg = getHiddenGroups(),
        $lastAction = null,
        $lastDivider,
        more = hasMore();

      ab.debug && console.log('has more menu?', more);

      // manage "open more menu" action button
      ab.$more.prop('disabled', !more);
      ab.params.hideMore && ab.$more[more ? 'show' : 'hide']();

      // hide all menu items and remove the divider classifier
      ab.$moreMenu.find('.mdl-menu__item').removeClass('mdl-menu__item--full-bleed-divider').hide();

      // for every hidden group
      $hg.each(function() {
        // iterate the action bar items
        $(this).find('.mdl-actionbar__item').each(function() {
          // ignore items with class "hidden"
          if (!$(this).is('.hidden')) {
            $lastAction = $('#mi-' + $(this).data('action'), ab.$moreMenu).show();
          }
        });
        // set divider to last visible action of a group
        $lastAction && $lastAction.addClass('mdl-menu__item--full-bleed-divider');
      });

      // no divider after the last visible group
      $lastDivider = $('.mdl-menu__item--full-bleed-divider:visible', ab.$moreMenu).last();
      $lastDivider.removeClass('mdl-menu__item--full-bleed-divider');

      // refresh menu
      if (ab.$moreMenu.parents('.mdl-menu__container.is-visible').length) {
        ab.$moreMenu.get(0).MaterialMenu[ab.$moreMenu.find('li:visible').length ? 'show' : 'hide']();
      }
    }
    function hideLastGroup() {
      var
        $lg = getVisibleGroups().last().hide(),
        action;

      if (!ab.$moreMenu) { return; }

      // handle entries in more menu
      $lg.find('[data-action]').each(function() {
        action = this.getAttribute('data-action');
        $('#'+action, ab.$moreMenu).prop('disabled', true);
      });
    }
    function getVisibleGroups() {
      return ab.$center.children('.mdl-actionbar__group--more:visible');
    }
    function getHiddenGroups() {
      return ab.$center.children('.mdl-actionbar__group--more:hidden');
    }
    function hasMore() {
      return ab.$center.children('.mdl-actionbar__group--more:hidden').length > 0;
    }
    function getCenterWidth() {
      var cw = 0, w = 0;
      if (ab.debug) {
        console.groupCollapsed('getCenterWidth');
        console.log('number of groups: %d', ab.$center.children().length);
        console.log('visible groups: %d', ab.$center.children(':visible').length);
      }
      ab.$center.children(':visible').not('.mdl-actionbar__group-more').each(function(i, el) {
        w = Math.ceil($(el).outerWidth(true));
        cw += w;
        ab.debug && console.log('group width: %d = %d', w, cw);
      });
      ab.debug && console.groupEnd('getCenterWidth');
      return cw;
    }
  };

  ActionBar.prototype.progress = function() {
    var
      args = _.toArray(arguments),
      action = args.shift(),
      updateCount = 1;

    if (!this.$progress) {
      this.$progress = $('<div class="mdl-actionbar__progress"></div>');
      this.$progress.width(0);
      this.$element.append(this.$progress);
    }
    if (action === 'count') {
      this.progressCount = args.shift();
      this.progressIndex = 0;
      this.$progress.width(0);
    }
    else if (action === 'update') {
      updateCount = args.shift();// current index as argument
      this.progressIndex = updateCount || (this.progressIndex + 1);// otherwise increase by one
      this.$progress.width((this.progressIndex*100/this.progressCount)+'%');
      // hide progress on 100%
      if (this.progressIndex >= this.progressCount) {
        this.$progress.fadeOut();
      }
    }
  };

  // actionBar.enable('import')
  // actionBar.disable(['import', 'export'])
  // actionBar.disable({group:'id'})
  ActionBar.prototype.enable = function(actions) {
    const ab = this;
    if (_.isObject(actions) && actions.group) {
      const gid = actions.group;
      actions = [];
      _.each(ab.actions, function (a, ak) {
        if (a.gid === gid) actions.push(ak);
      });
    }
    _.each(checkActions(actions), function (a) {
      ab._toggle(a);
    });
  };
  ActionBar.prototype.disable = function(actions) {
    const ab = this;
    if (_.isObject(actions) && actions.group) {
      const gid = actions.group;
      actions = [];
      _.each(ab.actions, function (a, ak) {
        if (a.gid === gid) actions.push(ak);
      });
    }
    _.each(checkActions(actions), function (a) {
      ab._toggle(a, true);
    });
  };
  // internal method to toggle control state
  ActionBar.prototype._toggle = function(actionName, disabled) {
    var
      action = this.actions[actionName];

    if (!action) { return; }// action doesn't exists

    disabled = _.isBoolean(disabled) ? disabled : false;

    if (action.$menu) {
      // NOTE set <li> to disabled doesn't work with .prop()??
      if (disabled) {
        action.$menu.find(':input').prop('disabled', true);
        action.$menu.attr('disabled', 'disabled').addClass('disabled');
      }
      else {
        action.$menu.find(':input').prop('disabled', false);
        action.$menu.removeAttr('disabled').removeClass('disabled');
      }
    }

    if (action.$control.hasClass('mdl-actionbar__item-select-button')) {
      action.select.disable();
      action.$control.find('.mdl-select')[disabled ? 'addClass' : 'removeClass']('mdl-select--disabled');
      action.$control.find('.mdl-button').prop('disabled', disabled);
    }
    else {
      action.$control[disabled ? 'addClass' : 'removeClass']('disabled')
        .prop('disabled', disabled);

      // prevent not disappearing tooltips after disabling a button
      if (disabled) {
        $('.mdl-tooltip[for="' + action.$control.attr('id') + '"]').removeClass('is-active');
      }
    }
  };

  ActionBar.prototype.show = function(actions) {
    var ab = this;
    _.each(checkActions(actions), function(a) {
      ab.actions[a].$control.removeClass('hidden');
    });
  };
  ActionBar.prototype.hide = function(actions) {
    var ab = this;
    _.each(checkActions(actions), function(a) {
      ab.actions[a].$control.addClass('hidden');
    });
  };

  // add/remove badge for actionbar controls
  ActionBar.prototype.badge = function(actions) {
    if (_.isEmpty(this.actions)) { return; }

    var ab = this, action;

    _.each(checkActions(actions), function(a) {
      action = ab.actions[a.name];
      if (action) {
        // label there -> create badge
        if (a.label) {
          // if badge container doesn't exist -> create wrapper and badge
          if (!action.$badge) {
            action.$control.wrap('<div class="mdl-actionbar__item-badge-wrapper"/>');
            action.$control.parent().append(
              action.$badge = $('<div/>').addClass('mdl-actionbar__item-badge mdl-badge mdl--left')
            );
          }
          // set badge text
          action.$badge.text(a.label);
        }
        // label not there -> remove badge
        else {
          if (action.$badge) {
            action.$badge.remove();
            if (action.$control.parent().is('.mdl-actionbar__item-badge-wrapper')) {
              action.$control.unwrap();
            }
            action.$badge = null;
          }
        }
      }
    });
  };

  // set new tooltips to actions
  // actionBar.tooltip([{ name: 'import', title: 'new tooltip' }]);
  ActionBar.prototype.tooltip = function(actions) {
    if (_.isEmpty(actions) || _.isEmpty(this.actions)) { return; }

    var ab = this, action, aid;

    _.each(checkActions(actions), function(a) {
      action = ab.actions[a.name];
      aid = action.$control.attr('id');
      $('.mdl-tooltip[for="' + aid + '"]').text(a.title);
    });
  };

  function ActionBarBuilder() {
    this.groups = [];
  }

  ActionBarBuilder.prototype.group = function(id, actions) {
    this.groups.push({id, actions});
    return this;
  };
  ActionBarBuilder.prototype.icon = function(icon_or_params) {
    const action = _.isString(icon_or_params) ? {icon: icon_or_params} : icon_or_params;
    action.name = action.name || action.icon;
    return action;
  };
  ActionBarBuilder.prototype.checkbox = function(label_or_params) {
    const action = _.isString(label_or_params) ? {label: label_or_params} : label_or_params;
    action.name = action.name || action.label.toLowerCase().replace(/[^A-Z]/ig, '') || _.uniqueId('aba-');
    action.checkbox = true;
    return action;
  };
  ActionBarBuilder.prototype.select = function(options_or_params) {
    const action = Array.isArray(options_or_params) ? {select: options_or_params} : options_or_params;
    action.name = action.name || _.uniqueId('aba-');
    return action;
  };

  ActionBarBuilder.prototype.build = function() {
    return this.groups;
  };

  const ACTIONS = [
    { name: 'create', icon: 'create' },
    { name: 'help', icon: 'help' },
    { name: 'settings', icon: 'settings' },
    { name: 'alarm', icon: 'alarm' },
    { name: 'android', icon: 'android' },
    { name: 'backup', icon: 'backup' },
    { name: 'bookmark', icon: 'bookmark' },
    { name: 'build', icon: 'build' },
    { name: 'copyright', icon: 'copyright' },
    { name: 'daterange', icon: 'date_range' },
    { name: 'eject', icon: 'eject' },
    { name: 'explore', icon: 'explore' },
    { name: 'code', icon: 'code' },
    { name: 'event', icon: 'event' },
    { name: 'favorite', icon: 'favorite' },
    { name: 'extension', icon: 'extension' },
    { name: 'openinnew', icon: 'open_in_new' }
  ];

  ActionBarBuilder.prototype.randomize = function(_size) {
    const randomActions = [];
    _size = _size || 5;
    _.times(_size, function () {
      randomActions.push(_.sample(ACTIONS));
    });
    randomActions.push(this.randomButton())
    randomActions.push(this.randomSelect())
    return _.uniq(randomActions);
  };
  ActionBarBuilder.prototype.randomButton = function() {
    const sample = this.randomize(1);
    sample[0].label = sample[0].name;
    return sample;
  };
  ActionBarBuilder.prototype.randomSelect = function() {
    const sample = this.randomize(1);
    sample[0].button = sample[0].icon;
    sample[0].icon = null;
    sample[0].label = null;
    sample[0].select = [
      { label: 'Test 1', value: 't1', selected: true },
      { label: 'Test 2', value: 't2' },
      { label: 'Test 3', value: 't3' }
    ];
    return sample;
  };

  /**
   * Convert actions param to Array, if necessary.
   * @param actions {String|Array}
   * @returns {Array}
   */
  function checkActions(actions) {
    if (!Array.isArray(actions)) {
      actions = [actions];
    }
    if (!Array.isArray(actions)) { return []; }

    return actions;
  }

  // ====== Material Table ====================================================

  /**
   * Class Material Table
   * @param params
   * @constructor MTable
   */
  function MTable(params) {
    this.params = $.extend({}, DEFAULTS.table, params);
    this.$table = $('<table/>');
    this.table = this.$table.get(0);

    this._init();
  }

  MTable.prototype._init = function() {
    var
      mtable = this,
      $thr = $('<tr/>');

    this.$table
      .width('100%')
      .addClass('mdl-data-table mdl-js-data-table');

    this.params.shadow && this.$table.addClass('mdl-shadow--2dp');
    this.params.selectable &&  this.$table.addClass('mdl-data-table--selectable');
    this.params.wrap && this.$table.addClass('mdl-data-table--wrap');
    this.params.dense && this.$table.addClass('mdl-data-table--dense');

    this.$thead = $('<thead/>');

    $thr.appendTo(this.$thead);
    this.$thead.appendTo(this.$table);
    // TODO check param is set
    this.$table.appendTo(this.params.appendTo);

    // create table header
    _.each(this.params.th, function(h) {
      var
        txt = _.isString(h) ? h : h.label,
        num = _.isString(h) ? false : h.numeric,
        cls = num ? '' : 'mdl-data-table__cell--non-numeric',
        $th,
        cellWidth = _.isString(h) ? 0 : h.width;

      if (_.isObject(h) && h.center) {
        cls = 'mdl-data-table__cell--icon-center';
      }
      $th = $('<th/>').addClass(cls).appendTo($thr);
      if (!_.isString(h) && h.icon) {
        window.material.button({
          label: window.material.icon(h.icon),
          icon: true,
          title: h.title,
          appendTo: $th,
          disabled: h.disabled
        });
      }
      else if (txt) {
        $th.text(txt);
      }
      if (cellWidth) {
        $th.css('minWidth', cellWidth);
      }
    });

    this.$tbody = $('<tbody/>').appendTo(this.$table);

    _.each(this.params.td, function(row) {
      mtable.addRow(row);
    });

    window.componentHandler.upgradeElement(this.table);

    this._bind();
  };

  MTable.prototype._bind = function() {
    var mtable = this;
    this.$table.on('click.mdl-table', '.mdl-data-table__cell-action > i.material-icons', function () {
      _.isFunction(mtable.params.on.action) && mtable.params.on.action.call(this, $(this).parents('tr:first'));
    });
    if (this.params.selectable) {
      this.$thead.on('change', '.mdl-data-table__select', function () {
        const isChecked = $(this).is('.is-checked');
        mtable.rows().find('.mdl-data-table__select').each(function () {
          this.MaterialCheckbox[isChecked ? 'check' : 'uncheck']();
        })
      });
    }
  };

  MTable.prototype.addRow = function(data) {
    if (!_.isArray(data)) return;

    var
      $td,
      $tr = $('<tr/>'),
      cell,
      num,
      icon,
      checkbox,
      cls,
      cellWidth;

    if (this.params.selectable) {
      data.unshift({checkbox:true});
    }

    _.each(data, function(td) {
      cell = _.isString(td) ? td : td.content || '';
      num = _.isString(td) ? false : td.numeric;
      icon = _.isString(td) ? false : td.icon;
      checkbox = _.isString(td) ? false : td.checkbox;
      cls = num ? '' : 'mdl-data-table__cell--non-numeric';
      cellWidth = 0;

      $td = $('<td/>').appendTo($tr);

      if (!cell && checkbox) {
        window.material.checkbox({
          appendTo: $td,
          cls: 'mdl-data-table__select'
        });
      }
      else if (!cell && icon) {
        window.material.button({
          appendTo: $td,
          label: window.material.icon(icon),
          icon: true
        });
        cellWidth = 32;
        cls = 'mdl-data-table__cell--icon-center';
        if (icon === 'warning') {
          cls += ' mdl-color-text--yellow-700';
        }
      }
      else if (td && td.spinner) {
        $td.append(TEMPLATES.spinner());
        cls = 'mdl-data-table__cell--icon-center';
      }
      else {
        $td.html(cell);
      }

      if (_.isObject(td) && td.cls) {
        cls += ' ' + td.cls;
      }
      $td.addClass(cls);

      cellWidth && $td.width(cellWidth);
    });

    $tr.appendTo(this.$tbody);

    $tr.find('.mdl-js-spinner').each(function() {
      window.componentHandler.upgradeElement(this);
      $(this).addClass('is-active');
    });

    return $tr;
  };

  MTable.prototype.rows = function() {
    return this.$tbody.children('tr');
  };

  MTable.prototype.clear = function() {
    this.rows().remove();
  };

  // ====== Material Stepper ==================================================

  /**
   * Class Material Stepper
   * @param params
   * @param callback
   * @constructor MStepper
   */
  function MStepper(params, callback) {
    this.params = $.extend({}, DEFAULTS.stepper, params);
    this.params.name = this.params.name || _.uniqueId('mdl-stepper-');// unique name required
    this.callback = callback || $.noop;
    this._layout(this._init.bind(this));
  }

  // Stepper Layout
  //   North Region -> Steps
  //  Center Region -> Step Content
  MStepper.prototype._layout = function(callback) {
    _.layout.create(this.params.appendTo, {
      name: this.params.name,
      sreg: 'c-,n-',
      theme: 'material',
      north: { size: 80, initHidden: true },
      center: { scrollable: false }
    }, callback);
  };

  MStepper.prototype._init = function(layout) {
    var
      mstepper = this,
      params = this.params,
      $center = layout.panes.center.empty(),
      $stepper = $('<ul/>').addClass('mdl-stepper mdl-stepper--horizontal').appendTo($center),
      stepper = $stepper.get(0);

    this.layout = layout;
    this.$stepper = $stepper;

    params.id && $stepper.attr('id', params.id);
    $stepper.height('100%');

    params.steps.forEach(this.addStep.bind(this));
    this.$steps = $stepper.children('.mdl-step');

    window.componentHandler.upgradeElement(stepper);

    this.stepper = stepper;
    this.MaterialStepper = stepper.MaterialStepper;

    $stepper.on('click', '.mdl-step__label', function() {
      var idx = mstepper.$steps.index($(this).parents('.mdl-step').first());
      stepper.MaterialStepper.goto(idx+1);
      mstepper.updateButtons();
      _.isFunction(params.on.next) && params.on.next(mstepper.getActiveStep());
    });

    window.Mousetrap.bind('f2', function() {
      mstepper.back();
    });
    window.Mousetrap.bind('f4', function() {
      mstepper.next();
    });

    if (params.next) {
      $(params.next).click(function() {
        mstepper.next();
      });
    }
    if (params.back) {
      $(params.back).click(function() {
        mstepper.back();
      });
    }

    this.callback();
  };

  MStepper.prototype.next = function() {
    if (_.isFunction(this.params.on.validate)) {
      if (this.params.on.validate(this.getActiveStep())) {
        this.MaterialStepper.next();
        _.isFunction(this.params.on.next) && this.params.on.next(this.getActiveStep());
      }
      else {
        this.MaterialStepper.error('ERROR');
      }
    }
    else {
      this.MaterialStepper.next();
      _.isFunction(this.params.on.next) && this.params.on.next(this.getActiveStep());
    }

    this.updateButtons();
  };

  MStepper.prototype.back = function() {
    this.MaterialStepper.back();
    //_.isFunction(this.params.on.next) && this.params.on.next(this.getActiveStep());
    this.updateButtons();
  };

  MStepper.prototype.spinner = function(off) {
    var
      active = this.getActiveStep(),
      $indicator = active.$step.find('.mdl-step__label-indicator'),
      $spinner;

    if (!off) {
      $indicator
        .css('background-color', 'transparent')
        .find('.mdl-step__label-indicator-content').hide();
      $spinner = $('<span class="mdl-spinner mdl-js-spinner"></span>')
        .appendTo($indicator);
      window.componentHandler.upgradeElement($spinner.get(0));
      $spinner.addClass('is-active');
    }
    else {
      // wait a second to let the user recognize the spinner
      _.delay(function() {
        $indicator.find('.mdl-spinner').remove();
        $indicator
          .removeAttr('style')
          .find('.mdl-step__label-indicator-content').show();
      }, 1000);
    }
  };

  /**
   * Set all steps to state "completed".
   */
  MStepper.prototype.alldone = function() {
    var
      mstepper = this.MaterialStepper,
      STATE_COMPLETED = mstepper.StepState_.COMPLETED;

    _.each(mstepper.Steps_.collection, function(state) {
      mstepper.updateStepState_(state, STATE_COMPLETED);
    });
  };

  /**
   * Add new step to stepper.
   * @param params
   * @param idx
   */
  MStepper.prototype.addStep = function(params, idx) {
    var
      $step,
      $actions,
      label = _.isString(params) ? params : params.label,
      optional = _.isString(params) ? false : params.optional;

    $step = $(TEMPLATES.stepper({
      icon: idx+1,
      label: label,
      message: optional ? 'Optional' : ''
    }))
      .appendTo(this.$stepper);

    _.isFunction(this.params.on.step) && this.params.on.step({
      $step: $step,
      index: idx
    });

    // check for existing action definitions
    // if no actions found, we hide the action panel
    // and recalc the height of the step content
    $actions = $step.find('.mdl-step__actions');
    if (!$actions.children().length) {
      $actions.hide();
      $step.find('.mdl-step__content').height('calc(100% - 132px)');
    }
  };

  MStepper.prototype.getActiveStep = function() {
    var
      $active = this.$steps.filter('.is-active'),
      index = this.$steps.index($active);

    return {
      $step: $active,
      index: index
    };
  };

  MStepper.prototype.updateButtons = function() {
    var
      next = this.params.next,
      back = this.params.back,
      steps = this.MaterialStepper.Steps_,
      active = steps.active,
      total = steps.total;

    if (_.isFunction(next)) {
      next((active === total));
    }
    else {
      next.prop('disabled', (active === total));
    }

    if (_.isFunction(back)) {
      back((active === 1));
    }
    else {
      back.prop('disabled', (active === 1));
    }
  };

  // ====== Material Select ==================================================

  /**
   * Class Material Select
   * @param params
   * @constructor MSelect
   */
  function MSelect(params) {
    this.params = $.extend({}, DEFAULTS.select, params);
    this.init();
  }

  MSelect.prototype.init = function() {
    var
      msel = this,
      params = this.params,
      $wrapper = $('<div/>').addClass('mdl-select'),
      $sync = $('<select/>').addClass('hidden').appendTo($wrapper),
      selected = _.find(params.options, function(o) { return o.selected; }),
      $tf = window.material.textfield({
        appendTo: $wrapper,
        label: params.label,
        value: !_.isUndefined(selected) ? selected.label : '',
        disabled: false,
        readonly: true,
        clear: false,
        helper: params.helper
      }),
      $arrow = $(window.material.icon('keyboard_arrow_down')),
      $dropdown = $('<div/>').addClass('mdl-select__dropdown'),
      $options = $('<ul/>').addClass('mdl-select__options').appendTo($dropdown);

    if (params.parent) $dropdown.appendTo(params.parent);
    else $dropdown.appendTo(!params.inline ? 'body' : $wrapper)

    $wrapper.data('instance', this);// bind instance to select wrapper element

    params.appendTo && $wrapper.appendTo(params.appendTo);
    params.replace && $(params.replace).replaceWith($wrapper);

    this.$element = $wrapper;
    this.$sync = $sync;
    this.$tf = $tf;
    this.tf = $tf.get(0).MaterialTextfield;
    this.$dropdown = $dropdown;
    this.$list = $options;

    if (params.inline && !this.params.parent) {
      this.params.parent = $wrapper;
    }

    // init value as attribute for default getter
    if (!_.isEmpty(selected)) {
      this.tf.input_.setAttribute('data-val', selected.value);
    }
    params.name && this.$sync.attr('name', params.name);

    // use width from trigger element, if measurable
    if (!params.width && params.trigger) {
      this.$trigger = $(params.trigger);
      if (this.$trigger.is(':visible')) {
        params.width = this.$trigger.width();
      }
    }
    params.width && $tf.width(params.width) && $wrapper.width(params.width);

    params.disabled && $wrapper.addClass('mdl-select--disabled');
    !params.padded && $wrapper.addClass('mdl-select--notpadded');// true by default (formular style)
    $wrapper.append($arrow.addClass('mdl-select__arrow'));
    // TODO set dirty necessary?
    //params.label && $tf.addClass('is-dirty');

    if (_.isFunction(params.options)) {
      this._get_options = params.options;
      params.options = this._get_options();
      this.options(params.options);
      this.sync(selected);
    }
    else {
      this.options(params.options);
      this.sync(selected);
      // this.setPos();// pre-position of the dropdown
    }

    // bind events
    this.bindClickInput();
    this.bindClickOption();

    // debounce = wait 750ms before trigger first event
    $(window).on('resize', _.debounce(function () {
      msel.setPos();
    }, 750));
  };

  MSelect.prototype.set = function() {
    var
      mselect = this,
      args = _.toArray(arguments),
      option = args.shift();

    // first argument is a string value
    if (_.isString(option)) {
      option = mselect.get('option', option);
    }
    if (_.isEmpty(option)) { return; }

    // switch classification
    mselect.$dropdown.find('ul > li')
      .removeClass('is-selected')
      .filter('[data-val="' + option.value + '"]').addClass('is-selected');

    // set new option to text field
    mselect.tf.input_.value = option.label;
    mselect.tf.updateClasses_();
    mselect.tf.input_.setAttribute('data-val', option.value);

    // reflect option to original select element
    if (mselect.params.trigger) {
      $(mselect.params.trigger)
        .children('option[value="' + option.value + '"]').prop('selected', true)
        .end()
        .trigger('change');
    }

    mselect.sync(option);
  };
  MSelect.prototype.sync = function(option) {
    if (!option) { return; }

    const $option = $('<option/>')
      .attr('value', (option.value || ''))
      .text(option.label || '')
      .prop('selected', true);
    this.$sync.empty().append($option);

    if (this.params.trigger) {
      $(this.params.trigger).find('option[value="' + option.value + '"]')
        .prop('selected', true)
        .attr('selected', 'selected')
        .siblings().removeAttr('selected');
    }

    !_.isEmpty(this.params.on) && _.isFunction(this.params.on.change) && this.params.on.change.call(this, $option);
  };

  MSelect.prototype.get = function(type, value) {
    var tmp;

    // get an option definition object
    if (type === 'option') {
      tmp = _.find(this.$dropdown.find('.mdl-button'), function(o) {
        return $(o).data('option').value === value;
      });
      return !tmp ? tmp : $(tmp).data('option');
    }
    else {
      return this.tf.input_.getAttribute('data-val');
    }
  };

  MSelect.prototype.options = function(options, clear) {
    const $list = this.$list;

    clear && $list.empty();

    _.each(options, function (o) {
      $('<li/>').append(
        window.material.button({
          label: o.menu || o.label,
          disabled: o.disabled
        }).data('option', o)
      )
        .attr('data-val', o.value)
        .addClass(o.selected ? 'is-selected' : '')
        .appendTo($list);
    });

    if ($list.children('li').length === 1) {
      this.$element.addClass('mdl-select--singleoption');
      this.$element.find('.mdl-select__arrow').hide();
    }
    else {
      this.$element.removeClass('mdl-select--singleoption');
      this.$element.find('.mdl-select__arrow').show();
    }

    this.resize();

    // set selected option
    // if not defined, set first
    let selected = $list.find('.is-selected').data('val');
    if (_.isUndefined(selected)) {
      selected = $list.find('li:first').data('val');
    }
    this.set(selected);
  };

  MSelect.prototype.bindClickOption = function() {
    var mselect = this;
    mselect.$dropdown.on('click', '.mdl-button', function() {
      var o = $(this).data('option');
      mselect.set(o);
      // wait for ripple effect
      _.delay($.proxy(mselect, 'close'), 200);
      return false;
    });
  };

  MSelect.prototype.bindClickInput = function() {
    const mselect = this;
    mselect.$element.on('click', function() {
      if (!$(this).hasClass('mdl-select--disabled') && !$(this).hasClass('mdl-select--singleoption')) {
        if ((mselect.params.inline || mselect.params.bottomMenu) && mselect.$dropdown.hasClass('is-visible')) {
          mselect.close();
        }
        else {
          $(document).on('click.mselect-close', $.proxy(mselect, 'close'));
          mselect.open();
        }
      }
      return false;
    });
  };

  MSelect.prototype.bindKeyboard = function() {
    var
      mselect = this;

    // first not disabled ? or currently selected?
    mselect.$dropdown.find('.is-hovered').removeClass('is-hovered');
    mselect.$dropdown.find('button').not(':disabled').first().focus().parent().addClass('is-hovered');

    mselect.$dropdown.on('keydown', 'button', function(event) {
      if (event.key === 'ArrowDown') {
        next();
      }
      else if (event.key === 'ArrowUp') {
        prev();
      }
      else if (event.key === 'Enter') {
        mselect.$dropdown.find('.is-hovered').find('button').click();
      }
      else if (event.key === 'Escape') {
        mselect.close();
      }
    });
    mselect.$dropdown.on('focus', 'button', function() {
      $(this).parent().addClass('is-hovered');
    });
    mselect.$dropdown.on('blur', 'button', function() {
      $(this).parent().removeClass('is-hovered');
    });

    function next() {
      var
        $hovered = mselect.$dropdown.find('.is-hovered'),
        $next = $hovered.next(),
        $btn = $next.find('button');

      if (!$next.length) { return; }
      if ($btn.is(':disabled')) { return; }

      $hovered.removeClass('is-hovered');
      $next.addClass('is-hovered').find('button').focus();
    }
    function prev() {
      var
        $hovered = mselect.$dropdown.find('.is-hovered'),
        $prev = $hovered.prev(),
        $btn = $prev.find('button');

      if (!$prev.length) { return; }
      if ($btn.is(':disabled')) { return; }

      $hovered.removeClass('is-hovered');
      $prev.addClass('is-hovered').find('button').focus();
    }
  };

  MSelect.prototype.open = function() {
    if (this.$dropdown.is('.is-visible')) { return; }

    this.$element.addClass('is-open');
    // this.resize();
    this.$dropdown.css('opacity', 0).addClass('is-visible');
    this.setPos();
    this.bindKeyboard();
  };

  MSelect.prototype.close = function() {
    if (!this.$dropdown.is('.is-visible')) { return; }

    this.$element.removeClass('is-open');
    this.$dropdown.removeClass('is-visible');
    this.$dropdown.off('keydown');
    $(document).off('click.mselect');// unbind eventlistener
    this.params.on && _.isFunction(this.params.on.close) && this.params.on.close();
  };

  MSelect.prototype.enable = function() {
    this.$element.removeClass('mdl-select--disabled');
  };

  MSelect.prototype.disable = function() {
    // textfield is readonly
    this.$element.addClass('mdl-select--disabled');
  };

  MSelect.prototype.setPos = function() {
    var
      isVisible = $(this.tf.element_).is(':visible'),
      rect = this.tf.element_.getBoundingClientRect(),
      // offset parent for the dropdown container
      $parent = this.params.parent ? $(this.params.parent) : $(window),
      // height of dropdown menu
      mheight = this.$dropdown.height(),
      // current bottom y position of the dropdown
      bottom = $parent.height() - rect.top - mheight,
      // take margin / padding into account
      topgap = 0,
      //topgap = parseInt($(this.tf.element_).css('paddingTop'), 10) || 0,
      // height of input control
      iheight = $(this.tf.input_).outerHeight(true),
      // direction up or down
      ddtop = bottom > 0 ? rect.top + topgap : rect.top - mheight + iheight,
      // default: absolute position of textfield
      ddleft = rect.left,
      prect;

    if (!this.$dropdown.is('.is-visible')) { return; }
    if (!isVisible) {
      this.close();
      return;
    }

    // dropdown is inline, calc as relative position
    if (this.params.inline) {
      if (!this.params.parent) {
        ddtop = rect.height - (this.params.padded ? 20 : 0) + 1;
        ddleft = 0;
      }
      else {
        prect = $parent[0].getBoundingClientRect();
        ddtop = rect.top - prect.top + rect.height;
        if (ddtop + mheight > prect.height) {
          ddtop = ddtop - mheight - rect.height;
        }
        ddleft = rect.left - prect.left;
      }
    }
    // not inline but position under control
    else if (this.params.bottomMenu) {
      ddtop += rect.height;
    }

    // TODO check floating label for top?
    this.$dropdown.css({ top: ddtop, left: ddleft }).animate({opacity:1}, 300);
  };

  // recalc minimal width of select (ex. after options changed)
  MSelect.prototype.resize = function() {
    const $arrow = this.$element.find('.mdl-select__arrow');
    let sw = this.params.width;
    sw = sw || this.$list.parent().width() + ($arrow.is(':visible') ? $arrow.width() : 0);
    this.$tf.width(sw);
    // this.$dropdown.css('minWidth', sw);
  };

  MSelect.prototype.focus = function() {
    this.tf.input_.focus();
  };

  // ====== Material Chips ==================================================

  /**
   * Class Material Chips
   * @param params
   * @constructor MChips
   */
  function MChips(params) {
    this.params = $.extend({}, DEFAULTS.chips, params);
    this.init();
  }

  MChips.prototype.init = function() {
    var
      mchips = this,
      params = this.params;

    this.$chips = $(TEMPLATES.chips(params)).appendTo(params.appendTo);
    this.$container = this.$chips.find('.mdl-chips__container');
    this.$sync = this.$chips.find('textarea');

    this.val(params.value);

    if (params.name) {
      this.$sync.attr('name', params.name).val(params.value);
      this.prependAdd();
      this.$container.find('.mdl-chip__input').keydown(function(event) {
        if (event.keyCode === 13) {
          event.preventDefault();
          var $mci = $(this), val = $mci.val();
          $mci.val('');
          mchips.add(val);
          mchips.sync();
        }
      });
    }
  };

  // add chips value(s)
  // sync with input control
  MChips.prototype.val = function(vals) {
    if (_.isEmpty(vals)) { return; }// nothing to add

    if (_.isString(vals)) {// convert strings to array
      vals = vals.split(' ');
    }

    vals = _.reject(vals, function(v) { return !v; });
    if (_.isEmpty(vals)) { return; }// nothing to add

    var mchips = this;
    if (this.params.chunk && vals.length > this.params.chunk) {
      this.chunks = _.rest(vals, this.params.chunk);
      vals = _.first(vals, this.params.chunk);
    }
    _.each(vals, function(v) {
      mchips.add(v);
    });

    // TODO change color
    // TODO handle action and load more chunks
    if (!_.isEmpty(this.chunks)) {
      mchips.add({ label: 'MORE', action: 'add' });
    }

    this.sync();
  };

  MChips.prototype.add = function(val) {
    if (!val) { return; }

    var
      mchips = this,
      pfx,
      label,
      action,
      $chip;

    if (_.isObject(val)) {
      label = val.label || val.keyword || '';
      pfx = label.substr(0, 1);
      action = val.action || 'search';
    }
    else {
      label = val;
      pfx = label.substr(0, 1);
      action = 'cancel';
    }

    // no duplicates allowed
    if (!mchips.params.duplicates && mchips.contains(label)) {
      return;
    }

    $chip = window.material.chip({
      appendTo: this.$container,
      prefix: this.params.prefix ? pfx : false,
      label: label,
      action: action,
      onAction: function($c) {
        if (action === 'cancel') {
          $c.remove();
          mchips.sync();
        }
        else if (action === 'search') {
          _.open(val.href);
        }
      }
    });

    // set label for contains and direct chip access
    if (_.isString(label)) {
      $chip.attr('data-value', label);
    }
  };

  MChips.prototype.prependAdd = function() {
    var
      mchips = this,
      $chip = window.material.chip({
        label: '<input class="mdl-chip__input"/>',
        action: 'done',
        onAction: function($c) {
          var $mci = $c.find('.mdl-chip__input'), val = $mci.val();
          $mci.val('');
          mchips.add(val);
          mchips.sync();
        }
      });

    this.$container.prepend($chip);
    this.$container.find('.mdl-chip__input').width(120).attr('placeholder', 'Neues Stichwort');
  };

  MChips.prototype.sync = function() {
    var vals = '';

    this.$container.find('.mdl-chip').each(function() {
      vals += (vals ? ' ' : '');
      vals += $(this).find('.mdl-chip__text').text();
    });

    this.$sync.val(vals);
  };

  // check value in sync element
  // and checks if chip exists
  MChips.prototype.contains = function(val) {
    if (!_.isString(val)) { return false; }

    var
      currentValues = ' ' + this.$sync.val() + ' ',
      needle = ' ' + $.trim(val) + ' ',
      chipExists = this.$container.find('[data-value="'+val+'"]').length > 0;

    return window.s.contains(currentValues, needle) && chipExists;
  };

  // ========================================
  //   Defining underscore.material
  // ========================================

  /**
   * Material Belt Namespace
   * @namespace
   * @type {Object}
   */
  window.material = {
    /**
     * Material Login Dialog.
     *
     * @param {Object} params {string} header sign in form head (text, image, etc)<br>
     *                        {string} title <br>
     *                        {string} message user message (welcome, hints, etc)<br>
     *                        {string} submit text for submit button<br>
     *                        {selector} hijack use another form for login process and delegate events to it<br>
     */
    login: function(params){
      params = $.extend(true, {}, DEFAULTS.login, params);

      params.debug && console.group('material-belt-login');
      params.debug && console.time('material-belt-login.show');

      var
        iLogin,
        dlgLang = params.languages[params.lang],// get dialog language from current settings
        $languages = window.material.button({ label: TEMPLATES.icon({ icon: 'translate' }) })
          .attr('id', 'mb-login-translate'),
        $lmenu,
        $mi,
        $dlg = window.material.dialog({
          appendTo: 'body',
          title: params.header,
          content: '',
          agree: dlgLang.submit,
          agreeColored: true,
          disagree: false,
          open: false,
          noCenterClass: true,
          submitOnReturn: false,// self manage a pressed return
          on: {
            agree: onAgree
          }
        }),
        oLogin = {
          $dlg: $dlg,
          dlg: $dlg.get(0),
          $languages: $languages,
          $languagesMenu: $(TEMPLATES.menu({ id: 'mb-login-translate', cls: 'mdl-menu--top-left' })),
          $spinner: $('<div style="padding:4px"><div class="mdl-spinner mdl-js-spinner"></div></div>')
        };

      $dlg.css({ padding: 0, width: 360 });

      params.hideHeader && $dlg.find('.mdl-dialog__title').hide();
      params.backgroundColor && $dlg.css('background-color', params.backgroundColor);

      // append wait spinner
      $dlg.find('.mdl-dialog__actions').append(oLogin.$spinner);

      oLogin.$agree = $dlg.find('button[data-name="agree"]').attr('data-lang', 'submit');

      // create language selection button and popup menu
      $dlg.find('.mdl-dialog__actions')
        .css('justify-content', 'space-between')
        .append(
          $('<div/>').css('position', 'relative')
            .append(oLogin.$languages)
            .append(oLogin.$languagesMenu)
        );

      // append visual sign for our language popup menu
      $(TEMPLATES.icon({ icon: 'arrow_drop_up' }))
        .css({ marginLeft: '4px' })
        .insertAfter(oLogin.$languages.children(':first'));

      $lmenu = oLogin.$languagesMenu;
      _.each(params.languages, function(lang, langKey) {
        $lmenu.append($mi = $(TEMPLATES.menuItem({
          id: langKey,
          item: lang.name,
          icon: langKey === params.lang ? 'radio_button_checked' : 'radio_button_unchecked'
        })));
        $mi.children('div:first').width('75%');
      });

      if (_.isString(params.footer)) {
        $dlg.append('<div class="mdl-login__footer" style="height:32px">' + params.footer + '</div>');
        // TODO params.cls
        oLogin.$footer = $dlg.find('.mdl-login__footer').addClass(window.material.WHITE_ON_BLACK);
      }

      // TODO move css to stylesheet file
      oLogin.$title = $dlg.find('.mdl-dialog__title')
      .addClass('mdl--shadow')
      .css({ padding: '40px 0', background: '#222222' });

      // CREATE LOGIN TEMPLATE
      // insert the login html to the dialog content section
      $dlg.find('.mdl-dialog__content').empty().append(TEMPLATES.login(dlgLang)).removeClass('hidden');

      params.noOptions && $dlg.find('.mdl-login__options').remove();
      if (params.autocomplete !== true) {
        $dlg.find('.mdl-login__login, .mdl-login__password').attr('autocomplete', 'off');
      }
      if (params.autofocus) {
        $dlg.find('.mdl-login__login').prop('autofocus', true);
      }

      if (params.rememberPos === 'actions') {
        $dlg.find('.mdl-login__options').hide();
        window.material.switch({
          appendTo: $dlg.find('.mdl-dialog__actions'),
          label: dlgLang.remember,
          checked: ''
        })
        .css({
          position: 'absolute',
          left: '75px'
        })
        .addClass('mdl-login__remember-switch')
        .find('.mdl-switch__label').attr('data-lang', 'remember');
      }

      oLogin.$message = $dlg.find('.mdl-login__message-text');
      $dlg.find('.mdl-textfield').css({ width: '100%' });

      // rewrite material css, to overwrite other css for input fields
      // TODO rewrite ALL settings?
      $dlg.find('.mdl-textfield__input')
        .prop('spellcheck', false)
        .css({ border: '0', borderBottom: '1px solid rgba(0, 0, 0, 0.12)' });

      // upgrade all unregistered elements
      window.componentHandler.upgradeElements($dlg.get(0));

      // Support terms of use acceptance
      // Agree button will be disabled, until checkbox is set
      if (params.termsOfUse) {
        $dlg.find('button[data-name=agree]').prop('disabled', true);
        oLogin.$tou = $('<div/>').addClass('mdl-login__tou mdl-dialog__content').insertBefore($dlg.find('.mdl-dialog__actions'));
        window.material.checkbox({
          appendTo: oLogin.$tou,
          label: dlgLang.touAccept
        })
          .addClass('mdl--left')
          .width('auto')
          .find('.mdl-checkbox__label').attr('data-lang', 'touAccept')
          .end()
          .find('.mdl-checkbox__input').change(function() {
            $dlg.find('button[data-name=agree]').prop('disabled', !this.checked);
          });

        // append link to terms of use
        oLogin.$tou.append('<a href="//" class="mdl-login__toulink mdl--left" data-lang="touLink">' + dlgLang.touLink + '</a>');
        oLogin.$tou.find('.mdl-login__toulink').click(function() {
          $dlg.get(0).close();
          window.material.popup({
            title: '',
            content: function($cnt) {
              $cnt.parents('.mdl-layout').find('.mdl-textfield').remove();
              $cnt.load('/termsOfUse_' + document.login.lng.value + '.html');
            },
            onClose: function() {
              window.location.reload();
            }
          });
          return false;
        });
      }

      // Support imprint
      if (params.imprint) {
        oLogin.$imprint = $(
          '<span class="mdl--left" style="padding: 5px 0 0 15px">' +
          '<a href="//" data-lang="imprint" style="color:white">' + dlgLang.imprint + '</a>' +
          '</span>'
        );
        $dlg.find('.mdl-login__footer').append(oLogin.$imprint);
        oLogin.$imprint.click(function() {
          $dlg.get(0).close();
          window.material.popup({
            title: '',
            content: function($cnt) {
              $cnt.parents('.mdl-layout').find('.mdl-textfield').remove();
              $cnt.load('/imprint_' + document.login.lng.value + '.html');
            },
            onClose: function() {
              window.location.reload();
            }
          });
          return false;
        });
      }

      FN.hijack_login($dlg, params.hijack);

      startLogin();
      bindEvents();

      iLogin = new Login(oLogin, params);

      return {
        getDialog: _.bind(iLogin.getDialog, iLogin),
        setHeader: _.bind(iLogin.setHeader, iLogin),
        setLanguage: _.bind(iLogin.setLanguage, iLogin),
        setMessage: _.bind(iLogin.setMessage, iLogin)
      };

      function startLogin() {
        if (params.imgLoaded === true && _.isFunction($.fn.imagesLoaded)) {
          $dlg.imagesLoaded(function() {
            showLogin();
          });
        }
        else {
          showLogin();
        }
      }
      function showLogin() {
        $dlg.get(0).showModal();
        params.debug && console.timeEnd('material-belt-login.show');
        params.debug && console.groupEnd('material-belt-login');

        // set focus, if autofocus won't work (FF 50.1.0)
        //params.autofocus && $dlg.find('.mdl-login__login').focus();

        // HACK form field doesn't get dirty on browser autocomplete
        // and the field label stays instead of floating above the input
        _.delay(function() {
          var $inp_pw = $('.mdl-login__password', $dlg);

          hasValue($inp_pw) && $inp_pw.parent().addClass('is-dirty');
        }, 1000);

        if (params.animate) {
          $dlg.animateCss('bounce');
          _.delay(function() {
            oLogin.$footer && oLogin.$footer.children().first().animateCss('tada');
          }, 2000);
        }
        _.isFunction(params.on.ready) && params.on.ready();
      }
      function onAgree(btn) {
        params.debug && console.debug('Login: onAgree');
        $(btn).prop('disabled', true).hide();
        oLogin.$spinner.find('.mdl-spinner').addClass('is-active');
        if (_.isFunction(params.on.submit)) {
          params.on.submit(getResult(), function(auth, msg) {
            if (!auth) {
              oLogin.$spinner.find('.mdl-spinner').removeClass('is-active');
              $(btn).prop('disabled', false).show();
              // set focus to first input?
              $dlg.find('#mdl-login__login').focus();
            }
            msg = iLogin.languages[iLogin.lang]['auth' + (auth ? 'Success' : 'Failure')];
            iLogin.setMessage(msg);
          });
        }
      }
      function getResult() {
        var rslt = {};
        rslt[params.loginName] = $('.mdl-login__login', $dlg).val();
        rslt[params.passwordName] = $('.mdl-login__password', $dlg).val();
        return rslt;
      }
      function bindEvents() {
        var lastLoginValue;

        $dlg.keyup(function(event) {
          // NOTE don't trigger click if value is empty, prevents submitting on autocomplete selection
          if (params.submitOnReturn && event.keyCode === 13 && lastLoginValue) {
            oLogin.$agree.click();// trigger click to support hijack event listener
          }
        });
        $dlg.keydown(function() {// remember last value for login name
          lastLoginValue = getResult()[params.loginName];
        });
        oLogin.$languagesMenu.on('click', '.mdl-menu__item', function() {
          iLogin.setMessage('');// clear current message
          iLogin.setLanguage(this.id);
          return false;
        });
        // ensure pressing <ESC> doesn't close our login dialog
        $(document).keydown(function(event) {
          if (event.keyCode === 27) {
            event.preventDefault();
            event.stopImmediatePropagation();
          }
        });
      }
      // try to find out, if the input has a value
      // cause jQuery fires an error when use unknown pseudo selectors,
      // we catch all tries silently
      function hasValue(inp) {
        var
          $inp = $(inp),
          hasVal = $inp.val().length > 0;

        try { hasVal = hasVal || $inp.is(':autofill'); } catch(e) {}
        try { hasVal = hasVal || $inp.is(':-webkit-autofill'); } catch(e) {}
        try { hasVal = hasVal || $inp.is(':-moz-autofill'); } catch(e) {}

        return hasVal;
      }
    },

    /**
     * Material Forms
     * - based on Gridforms
     * @param  {Object} params parameters
     * @return {Object|undefined} Material Forms Object or undefined
     */
    forms: function(params){
      console.assert(typeof $.gf === 'object', 'Gridforms plugin required!');
      if (typeof $.gf !== 'object') { return; }

      var
        allReady,
        formsCount = 0,
        forms = {},
        formsName,
        formsParams,
        formsOptions = {
          plugins: ['validation'],
          core: {
            flags: {
              buttons: true
            },
            form: {
              directionClass: 'small-12 medium-10 medium-push-1 large-8 large-push-2',
              css: {
                marginTop: '24px'
              }
            }
          },
          validation: {
            initial: false,
            errorMessage: false,
            badge: {}
          }
        };

      formsParams = forms.params = $.extend({}, true, DEFAULTS.forms, params);
      formsName = forms.name = forms.params.name || _.uniqueId('mgf-');

      formsOptions.core.name = formsName;

      _.each(formsParams.refs, function(r) {
        if (!_.isEmpty(r.rows)) { formsCount++; }
      });
      allReady = _.after(formsCount, function() {
        _.isFunction(formsParams.on.ready) && formsParams.on.ready();
        _.delay(validateAll, 500);
      });

      // build tabs
      //
      forms.tabs = window.material.tabs({
        appendTo: formsParams.appendTo || 'body',
        title: formsParams.title,
        hideHeader: formsParams.hideHeader,
        store: formsParams.tabsStore,
        active: formsParams.active,// initial active tab index
        refs: formsParams.refs,
        onSelect: function(sel) {
          var href = $(sel).attr('href').replace(/^#/, '');
          _.isFunction(formsParams.on.tabChange) && formsParams.on.tabChange(href);
        }
      });

      if (formsParams.backgroundImage) {
        forms.tabs.tabcontent.css({
          backgroundImage: 'url("' + formsParams.backgroundImage + '")',
          backgroundSize: formsParams.backgroundSize || 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'top center'
        });
      }

      if (formsParams.drawer) {
        forms.tabs.drawer.find('.mdl-layout-title').text(formsParams.drawer.title);
        window.material.list({
          appendTo: forms.tabs.drawer,
          singleLine: formsParams.drawer.singleLine,
          items: formsParams.drawer.items
        }).on('click', '.mdl-list__item', function() {
          var action = $(this).data('action');
          _.isFunction(formsParams.on.drawer) && formsParams.on.drawer(action);
        });
      }

      // build gridforms
      //
      _.each(formsParams.refs, function(rr, rk) {
        var o = _.clone(formsOptions);
        o.core.tabidx = rr.index + 1;
        o.core.rows = formsParams.rows[rk];
        o.validation.badge.selector = forms.tabs.tabs.eq(rr.index).find('.mdl-badge');
        forms.tabs.content.eq(rr.index).gf(o);
      });

      $.gf.config.on({
        ready: function(inst) {
          allReady();
        },
        refresh: function() {
          // console.log('refresh');
          // validateAll();
        },
        allvalid: function() {
          //var submit = $.gf.query('submit');
          //console.log('allvalid.gf');
          //submit.dom.$btn.get(0).MaterialButton.enable();
        }
      });

      forms.$gfs = forms.tabs.content.find('.grid-form');
      forms.validate = validateAll;
      forms.values = function() {
        return $.gf.namespace('get', 'serialize', formsName);
      };

      return forms;

      function validateAll() {
        var
          values = $.gf.namespace('get', 'serialize', formsName),
          $badge = $('#badge');

        var err = $.gf.namespace('validate', formsName), errors = _.size(err);
        if (_.isUndefined(err)) { return; }

        if ($badge.length) {
          $badge.find('a').css('background-color', errors > 0 ? '#b94a48' : 'green');
          if (errors) {
            $badge.find('a > i:first').removeClass('material-icons').text(errors);
          }
          else {
            $badge.find('a > i:first').addClass('material-icons').text('check');
          }
        }

        return err;
      }
    },

    /**
     * Material Textfield Parameter Typedefinition.
     * @typedef {Object} TextfieldParams
     * @property {!string} id='mdl-textfield-${uniqueId}' - element id
     * @property {!string} label - textfield label
     * @property {boolean} floatLabel=true - use floating label
     * @property {!string} name - set input name
     * @property {!string} value - set input value
     * @property {!string} placeholder - set input placeholder
     * @property {number} size - set input size
     * @property {number} maxlength - set input max length
     * @property {boolean} clear=true - set clear button to end of input
     * @property {boolean} autofocus - set input autofocus
     * @property {boolean} readonly - set input to readonly
     * @property {boolean} disabled - set input to disabled
     * @property {boolean} hidden - set input to hidden
     * @property {!number} tabindex - set input tabindex
     * @property {!number} rows - set rows > 1 to use textarea
     * @property {!number|!string} width=300 - set input width (ex. '100%')
     * @property {string} cls - set classname to textfield
     * @property {string} helper - set input helper text
     * @property {Object} attr - set input attributes
     * @property {Object} data - set input data attributes
     * @property {JQuery|HTMLElement} appendTo - append textfield to
     * @property {JQuery|HTMLElement} prependTo - prepend textfield to
     * @property {boolean} date - create date input
     * @property {boolean} time - create time input
     * @property {Object} on - event callback handle
     */
    /**
     * Material Textfield.
     * @param {TextfieldParams} params
     * @return {jQuery} textfield element
     */
    textfield: function(params){
      params = $.extend({}, DEFAULTS.textfield, params);
      params.id = params.id || _.uniqueId('mdl-textfield-');

      var
        tpl_type = !params.rows || params.rows <= 1 ? 'textfield' : 'textarea',
        $tf = $(TEMPLATES[tpl_type](params)),// id, label, (rows)
        tf = $tf.get(0),
        $inp = tpl_type === 'textfield' ? $tf.find('input') : $tf.find('textarea'),
        attr,
        $clear;

      params.label && params.floatLabel && $tf.addClass('mdl-textfield--floating-label');
      params.size && $inp.attr('size', params.size);
      params.attr && params.attr.size && $inp.attr('size', params.attr.size);
      params.maxlength && $inp.attr('maxlength', params.maxlength);
      params.attr && params.attr.maxlength && $inp.attr('maxlength', params.attr.maxlength);
      params.name && $inp.attr('name', params.name);
      params.attr && params.attr.name && $inp.attr('name', params.attr.name);
      params.autofocus && $inp.prop('autofocus', true);
      params.readonly && $inp.prop('readonly', true);
      params.placeholder && $inp.attr('placeholder', params.placeholder);
      $inp.prop('spellcheck', params.spellCheck);
      params.tabindex && $inp.attr('tabindex', params.tabindex);
      params.width && $tf.width(params.width) && $inp.width(params.width);
      params.cls && $tf.addClass(params.cls);
      params.helper && $tf.find('.mdl-textfield__helper').text(params.helper);

      params.appendTo && $tf.appendTo(params.appendTo);
      params.prependTo && $tf.prependTo(params.prependTo);

      window.componentHandler.upgradeElement(tf);

      params.disabled && tf.MaterialTextfield.disable();
      params.hidden && $tf.hide();

      // TODO create param to enable/disable clear button
      if (params.clear) {
        $inp.css({paddingRight: 32}); // reduce input size for clear button
        $clear = window.material.button({
          appendTo: $tf,
          icon: true,
          label: window.material.icon('clear')
        }).css({right: 0}).hide().click(function () {
          setValue('');
          $inp.trigger('change');
          $inp.trigger('focus');
        });
        $clear.attr('tabindex', '-1');
      }

      if (params.date || params.time) {
        createDateTimeField();
      }
      else {
        $inp
          .on('change', function() {
            _.isFunction(params.on.value) && params.on.value.call(null, this.value);
          })
          .on('keyup', function() {
            _.isFunction(params.on.key) && params.on.key.call(null, this.value);
            $clear && $clear[this.value ? 'show' : 'hide']();
          });
      }

      params.value = '' + params.value;// force to string, otherwise 0 is not set
      params.value && setValue(params.value);

      if (params.data) {
        attr = {};
        _.each(params.data, function(dv, dn) {
          attr['data-'+dn] = dv;
        });
        $tf.attr(attr);
      }

      params.hidden && $tf.hide();

      return $tf;

      function setValue(value) {
        const isDisabled = $tf.is('.is-disabled');
        tf.MaterialTextfield.input_.value = value;
        tf.MaterialTextfield.updateClasses_();
        $clear && $clear[value && !isDisabled ? 'show' : 'hide']();
      }
      function createDateTimeField() {
        console.assert(window.moment, 'Plugin "moment.js" not found!');
        console.assert(window.mdDateTimePicker, 'Plugin "mdDateTimePicker.js" not found!');
        var
          i18n = params.i18n,
          $dteBtn = window.material.button({
            label: window.material.icon('today'),
            icon: true,
            cls: 'mdl-textfield__datepicker',
            attr: {
              id: _.uniqueId('mdl-textfield--date-'),
              tabindex: -1
            }
          }).click(function() {
            var
              mdDTP = $(this).data('mdDTP');

            _.isObject(mdDTP) && mdDTP.toggle();

            return false;
          }),
          dte = new window.mdDateTimePicker.default({
            type: params.date ? 'date' : 'time',
            orientation: 'PORTRAIT',
            mode: true,
            trigger: $inp.get(0),
            future: window.moment('2099-12-31'),
            ok: i18n.agree || 'Übernehmen',
            cancel: i18n.disagree || 'Abbrechen',
            format: {
              subtitle: 'YYYY',
              titleDay: 'dddd, ',
              titleMonth: 'MMMM D'
            },
            overlay: params.overlay
          }),
          inp = $inp.get(0);

        $tf.addClass('mdl-textfield--date').append($dteBtn);
        $dteBtn.data('mdDTP', dte);

        $inp
          .change(function() {
            if (params.validate && !window.moment(this.value).isValid()) {
              $tf.addClass('is-invalid');
              $tf.find('.mdl-textfield__error').text(i18n.invalid || 'invalid date!');
            }
          })
          .keydown(function(event) {
            if (event.keyCode === 40) {
              dte.show();
            }
          });

        inp.addEventListener('onOk', function() {
          var newValue, format;
          if (params.date) {
            format = (params.dateFormat||'').toUpperCase();
            if (params.dateFormat === 'mm/dd/yy') {
              format = 'MM/DD/YYYY';
            }
            else if (params.dateFormat === 'dd.mm.yy') {
              format = 'DD.MM.YYYY';
            }
            newValue = dte.time.format(format || 'DD.MM.YYYY');
            setValue(newValue);
          }
          else if (params.time) {
            newValue = dte.time.format(params.timeFormat || 'HH:mm');
            setValue(newValue);
          }
          _.isFunction(params.on.value) && params.on.value.call(null, dte, newValue);
        });
        inp.addEventListener('onCancel', function() {
          _.isFunction(params.on.cancel) && params.on.cancel.call(null);
        });
      }
    },

    /**
     * Material Tree Component. (by using jstree/mtv)
     * @param params
     */
    tree: function(params){
      if (!_.isFunction($.fn.jstree)) { return; }

      var
        $mtv = $('<div/>').appendTo(params.appendTo),
        plugins = ['json_data', 'themes', 'checkbox'],
        treeData = params.from ? FN.analyze_tree(params.from) : params.data,
        treeOptions = {
          plugins: plugins,
          core: {
            html_titles: true,
            show_child_count: false
          },
          json_data: {
            progressive_render: false
          },
          themes: {
            theme: 'material',
            dots: false,
            icons: false,
            buttons: true
          }
        };

      // overwrite plugins option setting
      // use function and push needed plugins
      // or use given array as option
      if (params.plugins) {
        if (_.isFunction(params.plugins)) {
          params.plugins = params.plugins(treeOptions.plugins);
        }
        else {
          treeOptions.plugins = params.plugins;
        }
      }

      //if (window.location.host === 'abu.test') {
      //  treeOptions.plugins.push('hotkeys');
      //}

      // set data option only if data exists,
      // otherwise an ajax option won't work
      if (!_.isEmpty(treeData)) {
        treeOptions.json_data.data = function() {
          if (!this._get_settings().json_data.progressive_render) {
            FN.repair_tree_data(treeData);
          }
          return treeData;
        };
      }

      // append or overwrite tree options (deep copy)
      if (params.options) {
        treeOptions = $.extend(true, {}, treeOptions, params.options);
      }

      params.id && $mtv.attr('id', params.id);

      $mtv.hide();// minimize FOUC
      return $mtv.jstree(treeOptions).on({
        'loaded.jstree': function(event, data) {
          // TODO currently plugin "grid" fires loaded without data and inst argument
          if (data && data.inst) {
            // HACK overwrite wrong height = 18 to prevent undetected state clicks (open, close node)
            data.inst.data.core.li_height = 36;
            $mtv.fadeIn('slow');// show the tree now
            _.isFunction(_.go('on.loaded', params)) && params.on.loaded(data.inst);
          }
        }
      });
    },
    /**
     * Material Tree (clone from existing tree)
     * @param selector
     * @param {Object} params
     * @returns {boolean}
     */
    treeFrom: function(selector, params){
      if (!$(selector).length) { return false; }

      var
        $treeFrom = $(selector), $mtv,
        treeSettings,
        treeData,
        plugins = ['themes', 'ui', 'json_data'];

      params = params || {};

      // get data from local storage
      // TODO put key to params
      if (params.store) {
        treeData = window.localStorage.getItem('dam30-navigation-tree');
        if (treeData) {
          try {
            treeData = JSON.parse(treeData);
          }
          catch(e){}
        }
      }
      treeData = treeData || FN.analyze_tree(selector);

      if (params.store) {
        window.localStorage.setItem('dam30-navigation-tree', JSON.stringify(treeData));
      }

      $treeFrom.hide();
      if (params.appendTo) {
        $mtv = $('<div/>').appendTo(params.appendTo);
      }
      else {
        $mtv = $('<div/>').insertBefore($treeFrom);
      }

      if (params.selection) {
        plugins.push('checkbox');
      }

      treeSettings = {
        plugins: plugins,
        core: {
          li_height: 36,
          show_child_count: false
        },
        json_data: {
          progressive_render: false,
          data: function() {
            return treeData;
          }
        },
        themes: {
          theme: 'material',
          dots: false,
          buttons: true
        }
      };

      if (params.on && params.on.search) {
        plugins.push('search');
        treeSettings.search = {
          show_only_matches: true
        };
      }

      if (_.isFunction($.fn.jstree)) {
        $mtv.hide();// minimize FOUC
        $mtv.jstree(treeSettings).on({
          'loaded.jstree': function(event, data) {
            // HACK overwrite wrong height = 18 to prevent undetected state clicks (open, close node)
            data.inst.data.core.li_height = 36;
            // convert material-icons to mdi
            data.inst.get_container_ul().find('a .jstree-icon .material-icons').each(function() {
              FN.convert_icon(this, $(this).text(), function($el) {
                $el.addClass('mdi-16px').removeClass('mdi-24px');
              });
            });
            $mtv.fadeIn('slow');// show the tree now
            _.isFunction(_.go('on.loaded', params)) && params.on.loaded(data.inst);
          },
          'select_node.jstree': function(event, data) {
            _.isFunction(_.go('on.select', params)) && params.on.select(_.go('rslt.obj', data));
          },
          'open_node.jstree': function(event, data) {
            var $node = _.go('rslt.obj', data);
            _.isFunction(_.go('on.open', params)) && params.on.open($node, data.inst);
          },
          'close_node.jstree': function(event, data) {
            var $node = _.go('rslt.obj', data);
            _.isFunction(_.go('on.close', params)) && params.on.close($node, data.inst);
          },
          'search.jstree': function(event, data) {
            _.isFunction(_.go('on.search', params)) && params.on.search(data.rslt, data.inst);
          }
        });
      }
    },

    header: function(params){
      var $header;

      params = params || {};
      params.title = params.title || 'Header Title';
      params.drawerTitle = params.drawerTitle || 'Menue Title';
      $header = $(TEMPLATES.header(params)).appendTo(params.appendTo);

      $header.css({ overflow: 'hidden' });

      componentHandler.upgradeAllRegistered();

      _.isString(params.colorClass) && FN.style_header($header, params.colorClass);

      return $header;
    },

    /**
     * Material Tabs Container.
     *
     * @param {Object} params
     * @return {Object}
     */
    tabs: function(params){
      var
        mtabs = {},
        ridx = 0,
        $tabItem,
        $tabpanel;

      params = $.extend({}, DEFAULTS.tabs, params);
      params.id = params.id || _.uniqueId('mdl-layout-');
      params.hideButtons = typeof params.hideButtons === 'boolean' ? params.hideButtons : 'auto';

      // add header
      if (params.appendTo) {
        mtabs.header = $(TEMPLATES.header(params)).attr('id', params.id);
        if (typeof params.appendTo === 'function') {
          params.appendTo(mtabs.header);
        }
        else {
          mtabs.header.appendTo(params.appendTo);
        }
        params.appendTabs = $(CLASS_LAYOUT_HEADER, mtabs.header);
      }

      console.assert(mtabs.header, 'window.material.tabs: header property not defined!');
      if (!mtabs.header) { return false; }

      mtabs.tabbar = $(CLASS_LAYOUT_TABBAR, mtabs.header);
      if (!mtabs.tabbar.length && params.appendTabs) {
        mtabs.tabbar = $(TEMPLATES.tabbar()).appendTo(params.appendTabs);
      }
      params.fullWidth && mtabs.tabbar.addClass('mdl-layout__tab-bar--fullwidth');

      mtabs.tabcontent = $(CLASS_LAYOUT_TAB_CONTENT, mtabs.header);
      if (!mtabs.tabcontent.length && mtabs.header) {
        mtabs.tabcontent = $(TEMPLATES.tabcontent()).appendTo(mtabs.header);
      }

      // build the referenced tabs
      // refs = [ "key": { title: '', content: '', append: element }]
      if (params.refs) {
        mtabs.tabbar.empty();
        mtabs.tabcontent.empty();

        // build necessary tab structures
        _.each(params.refs, function(ref, key) {
          ref.index = ref.index || ridx;
          ridx++;
          if (ref.hidden !== true) {
            ref.title = ref.title || '..';
            $tabItem = $(TEMPLATES.tabitem({ href: '#' + key, title: ref.title }));
            if (ref.badge) {
              $('<span/>').addClass('mdl-badge').css('paddingLeft', 8)
                .appendTo($tabItem);
            }
            mtabs.tabbar.append($tabItem);
            $tabpanel = $(TEMPLATES.tabpanel({ id: key, content: ref.content }));
            mtabs.tabcontent.append($tabpanel);
            ref.cls && $tabpanel.find(CLASS_LAYOUT_TAB_PAGECONTENT).addClass(ref.cls);
            if (ref.append) {
              $tabpanel.find(CLASS_LAYOUT_TAB_PAGECONTENT).append(ref.append);
              ref.append.show();
            }
          }
        });
      }

      window.componentHandler.upgradeElements(mtabs.header.get(0));

      mtabs.container = mtabs.header.parent('.'+LAYOUT_CLASSES.CONTAINER);

      _.isString(params.colorClass) && FN.style_header(mtabs.header, params.colorClass);
      params.hideHeader && FN.hide_header(mtabs.header);
      FN.hide_tabbar_buttons(mtabs.header, params.hideButtons);

      mtabs.tabs = mtabs.tabbar.find(CLASS_LAYOUT_TAB);
      mtabs.panels = mtabs.tabcontent.find(CLASS_LAYOUT_TAB_PANEL);
      mtabs.content = mtabs.tabcontent.find(CLASS_LAYOUT_TAB_PAGECONTENT);
      mtabs.drawer = mtabs.container.find('.mdl-layout__drawer');

      setActive();

      mtabs.refs = {};
      mtabs.tabs.each(function(i, el) {
        var href = $(el).attr('href').replace(/^#/, '');
        mtabs.refs[href] = {
          index: i,
          $el: $(el)
        };
        if (params[href]) {
          //console.log('params', params[href]);
          if (params[href].title) {
            //console.log('text', el.innerText);
            //el.innerText = params[href].title;
            //$(el).text(params[href].title);
          }
        }
      });

      onSelect(mtabs.tabs.filter('.is-active').get(0));
      mtabs.header.on('click', CLASS_LAYOUT_TAB, function() {
        onSelect(this);
        if (params.store && _.isObject(_.store)) {
          _.store.set(params.store, { activeId: $(this).attr('href') });
        }
      });

      // TODO add method to add a new tab

      return mtabs;

      function onSelect(target) {
        var tabData = getTabData(target);

        _.isFunction(_.go('on.select', params)) && params.on.select.call(null, target, tabData);
        _.isFunction(params.onSelect) && params.onSelect(target, tabData);
      }
      function getTabData(target) {
        var
          $target = $(target),
          href = $target.attr('href'),
          id = href.replace(/^#/, '');

        return {
          tab: $target,
          panel: $('#' + id)
        };
      }
      // detect tab to set to active one
      // scroll active one into view
      function setActive() {
        var
          store,
          activeId,
          activeIndex,
          activeRef,
          $activeTab;

        if (params.store) {
          store = _.store.get(params.store);
          if (store && store.activeId) {
            activeId = store.activeId.replace(/^#/, '');
          }
          if (params.refs) {
            if (params.refs[activeId]) {
              activeIndex = params.refs[activeId].index;
            }
            else {
              // refs by index
              activeRef = _.find(params.refs, function(r) {
                return r.key === activeId;
              });
              if (activeRef) {
                activeIndex = activeRef.index;
              }
            }
          }
        }

        params.active = params.active || activeIndex || 0;

        // ensure the active tab is there and visible
        $activeTab = mtabs.tabs.eq(params.active);
        if (!$activeTab.length || $activeTab.is(':hidden')) {
          params.active = 0;
        }

        mtabs.tabs.removeClass('is-active').eq(params.active).addClass('is-active');
        mtabs.panels.removeClass('is-active').eq(params.active).addClass('is-active');

        // if the active tab is outside of the users view
        // scroll it into view
        if (_.isFunction($.fn.scrollTo)) {
          if (params.active) {
            mtabs.tabbar.scrollTo(mtabs.tabs.eq(params.active), 200, { offset: { left: -56 }});
          }
        }
      }
    },
    tabsFrom: function(selector, params){
      if (!$(selector).length) { return; }

      var
        $from = $(selector),
        conf = {
          $from: $from
        },
        activeTab;

      $from.hide();

      params = params || {};
      params.tab = params.tab || '[role=tab]';
      params.panel = params.panel || '[role=tabpanel]';

      conf.$tabs = $(params.tab, $from);
      conf.$panels = $(params.panel, $from);

      conf.$wrapper = $('<div/>').addClass('mdl-layout__wrapper').insertBefore($from);

      conf.refs = {};
      conf.$tabs.each(function(i) {
        var
          $tab = $('[role=presentation]', this),
          title = $tab.text(),
          uniqueKey = 'mt-' + $tab.attr('href').replace(/^#/, '');

        conf.refs[uniqueKey] = {
          title: title,
          append: conf.$panels.eq(i),
          index: i
        };
      });

      // check, if tab id is defined in location.href
      activeTab = _.params().tab;
      if (activeTab) {
        activeTab = conf.$panels.index($('#'+activeTab));
      }

      var mtabs = window.material.tabs({
        appendTo: conf.$wrapper,
        hideHeader: true,
        colorClass: params.colorClass || window.material.WHITE_ON_DARKGREY,
        refs: conf.refs,
        store: params.store,
        active: activeTab,
        on: {
          select: params.onSelect
        }
      });

      mtabs.container.css({
        position: 'relative'
      });

      $from.off('*').remove();

      return conf;
    },

    /**
     * Material Actionbar.
     * @param {Object} params
     * @param {Function=} callback
     * @return {JQuery.Promise<any, any, any>}
     */
    actionbar: function(params, callback){
      if (_.isFunction(callback)) {
        return new ActionBar(params, callback);
      }

      const dfr = $.Deferred();

      new ActionBar(params, function() {
        dfr.resolve(this);
      });

      return dfr.promise();
    },
    actionbarBuilder: function(params){
      return new ActionBarBuilder(params);
    },

    /**
     * Material Snackbar / Toast - Transient popup notifications. Stacked.
     * Do not create multiple instances, just use return object with showSnackbar(params),
     * otherwise stacking doesn't work as expected.
     * @param {(String|Object)=} params
     * @param {String} params.message - text to show
     * @param {String=} [params.type='info'] - set type for coloring [info, success, warning, danger]
     * @param {Number=} [params.timeout=10000] - close after delay of number of ms
     * @param {String=} params.actionText - optional action text
     * @param {Function=} params.actionHandler - optional handler for clicked action
     * @param {Function=} callback - use callback function as action handler
     * @return {MaterialSnackbar} mdl snackbar class
     */
    snackbar: function(params, callback){
      const $snackbar = $(TEMPLATES.snackbar()).appendTo('body')
      const snackbar = $snackbar.get(0);

      window.componentHandler.upgradeElement(snackbar);

      if (_.isString(params)) {
        params = { message: params };
      }
      params = $.extend({}, DEFAULTS.snackbar, params);

      // snackbar with action button
      if (params.actionText && !params.actionHandler && _.isFunction(callback)) {
        params.actionHandler = callback;
      }

      if (params.message) snackbar.MaterialSnackbar.showSnackbar(params);

      return snackbar.MaterialSnackbar;
    },

    /**
     * Material Button.
     *
     * @param {Object} params
     * @param {(String|Object)?} params.appendTo
     * @param {(String|Object)?} params.prependTo
     * @param {String} params.label
     * @param {String?} params.id
     * @param {String?} params.title
     * @param {String?} params.cls
     * @param {boolean} [params.raised=false]
     * @param {boolean} [params.colored=false]
     * @param {boolean} [params.accent=false]
     * @param {boolean} [params.icon=false]
     * @param {String?} params.iconRight
     * @param {String?} params.iconLeft
     * @param {boolean} [params.disabled=false]
     * @param {boolean} [params.hidden=false]
     * @param {String?} params.keyCode
     * @param {String?} params.keyCodeDescr
     * @param {boolean} [params.upload=false]
     * @param {Number?} params.zIndex
     * @param {Object?} params.attr
     * @param {Array?} params.menu
     * @param {Object?} params.on - event callback handler
     * @return {JQuery} button element
     */
    button: function(params){
      params = $.extend({}, DEFAULTS.button, params);
      params.id = params.id || _.uniqueId('mdl-button-');

      var
        $btn = $(TEMPLATES.button({ label: params.label })),
        btn = $btn.get(0),
        $tooltip,
        $iconLeft,
        $iconRight,
        $upload,
        $uploadWrapper;

      params.id && $btn.attr('id', params.id);
      params.cls && $btn.addClass(params.cls);
      params.raised && $btn.addClass('mdl-button--raised');
      params.colored && $btn.addClass('mdl-button--colored');
      params.accent && $btn.addClass('mdl-button--accent');
      params.icon && $btn.addClass('mdl-button--icon');
      params.zIndex && $btn.css('zIndex', params.zIndex);

      // append right icon and wrap label
      if (params.iconRight) {
        $btn.text('');
        $btn.prepend($('<span class="mdl-button__label"/>').text(params.label));
        if (params.iconRight !== 'spinner') {
          $iconRight = $(TEMPLATES.icon({ icon: params.iconRight })).addClass('mdl-button__icon-right');
        }
        else {
          $btn.find('.mdl-button__label').css('paddingRight', 10);
          $iconRight = window.material.spinner({ single: true, active: true }).addClass('mdl-button__icon-right');
          // $iconRight = window.material.progress({indeterminate:true}).width(120).height(2).css('top', '-2px')
        }
        $btn.append($iconRight);
      }
      if (params.iconLeft) {
        $iconLeft = $(TEMPLATES.icon({ icon: params.iconLeft })).addClass('mdl-button__icon-left');
        $btn.prepend($iconLeft);
      }

      params.appendTo && $btn.appendTo(params.appendTo);
      params.prependTo && $btn.prependTo(params.prependTo);

      // create tooltip
      // appendTo needed, cause button must exists when creating tooltip
      // NOTE if the tooltip doesn't appear, a parent element was not on DOM right now
      if (params.title && (params.appendTo || params.prependTo)) {
        params.attr = params.attr || {};
        params.attr.id = params.attr.id || params.id || _.uniqueId('mdl-button-');
        $tooltip = $(TEMPLATES.tooltip(params.attr)).text(params.title).appendTo('body');
        if (params.titlePosition) {
          $tooltip.addClass('mdl-tooltip--' + params.titlePosition);
        }
        params.zIndex && $tooltip.css('zIndex', params.zIndex);
        _.each(params.data, function(d, dn) {
          $tooltip.attr('data-' + dn, d);
        });
      }

      _.isObject(params.attr) && !_.isEmpty(params.attr) && $btn.attr(params.attr);

      window.componentHandler.upgradeElement(btn);
      $tooltip && window.componentHandler.upgradeElement($tooltip.get(0));

      // set button initial to disabled state
      params.disabled && btn.MaterialButton.disable();
      params.hidden && $btn.hide();

      // overlay button with an invisible file input
      if (params.upload) {
        // TODO set width necessary??
        $uploadWrapper = $('<div/>').css('position', 'relative');//.width($btn.outerWidth());
        $btn.wrap($uploadWrapper);
        $upload = $('<input type="file" multiple/>')
          .attr('tabindex', '-1')
          .addClass('mdl-button__file-upload')
          .insertAfter($btn)
          .change(function() {
            params.on && _.isFunction(params.on.upload) && params.on.upload(this.files);
          });
        !_.go('upload.multiple', params) && $upload.prop('multiple', false);
      }

      // popup menu for button
      // TODO move to window.material.dropdown? this version has no positioning and event handler
      if (params.menu) {
        var $menu = $(TEMPLATES.menu({id: params.id, cls: 'mdl-menu--bottom-right'})).appendTo('body');
        // params: [{id, item, icon}]
        _.each(params.menu, function(m) {
          if (_.isFunction(m)) {
            $menu.append(m());
          }
          else {
            $menu.append(TEMPLATES.menuItem(m));
          }
        });
        window.componentHandler.upgradeElement($menu.get(0));
      }

      // bind button to a key code
      if (params.keyCode && _.isObject(window.Mousetrap)) {
        FN.register_keycode(params.keyCode, params.keyCodeDescr);
        window.Mousetrap.bind(params.keyCode, function() {
          $btn.click();
          return false;
        });
      }

      if (params.on && params.on.click) {
        $btn.on('click', params.on.click);
      }

      return $btn;
    },

    /**
     * Material FAB (Floating Action Button)
     * @param icon
     * @param params
     * @returns {*|HTMLElement}
     */
    fab: function(icon, params){
      console.assert(icon, 'window.material.fab: icon required!');

      var
        $fab = $(TEMPLATES.fab({ icon: icon })),
        fab = $fab.get(0),
        ITEM_CLASS = '.' + window.MaterialMenu.prototype.CssClasses_.ITEM,
        CONTAINER_CLASS = '.' + window.MaterialMenu.prototype.CssClasses_.CONTAINER;

      params = $.extend({}, DEFAULTS.fab, params);
      params.id = params.id || 'mdl-fab-' + $.guid++;
      if (params.colored) {
        params.cls = params.cls || '';
        params.cls += ' mdl-button--colored';
      }
      params.cls && $fab.addClass(params.cls);
      params.appendTo && $fab.appendTo(params.appendTo);
      params.prependTo && $fab.prependTo(params.prependTo);
      $fab.attr('id', params.id);

      window.componentHandler.upgradeElement(fab);

      params.disabled && fab.MaterialButton.disable();
      params.title && window.material.tooltip(params);

      if (params.menu) {
        var $menu = $(TEMPLATES.menu({ id: params.id, cls: 'mdl-menu--bottom-right' })).appendTo('body');
        _.each(params.menu, function(m) {
          if (_.isFunction(m)) {
            $menu.append(m());
          }
          else {
            $menu.append(TEMPLATES.menuItem(m));
          }
        });
        window.componentHandler.upgradeElement($menu.get(0));
        //params.menuHide && $menu.parents(CONTAINER_CLASS).css('visibility', 'hidden');
        if (_.isFunction(params.menuBeforeRender)) {
          params.menuBeforeRender($menu);
        }
        $menu.on('click', ITEM_CLASS, function() {
          _.isFunction(params.onClick) && params.onClick(this.id);
        });
        $fab.click(function() {
          params.menuHide && $menu.parents(CONTAINER_CLASS).css('visibility', 'hidden');
          // in the case the click is not fired by a real click,
          // we must wait for the end of the transition to repos the menu
          $menu.one(TRANSITION_END, _.throttle(function() {
            $menu.off(TRANSITION_END);
            _.isFunction(params.onMenu) && params.onMenu($menu, $fab);
            $menu.find(ITEM_CLASS).first().focus();
          }, 500));
        });
        if (params.menuTrigger) {
          $(params.menuTrigger).css('cursor', 'pointer').click(function() {
            $fab.click();
          });
        }
      }

      if (params.keyCode && _.isObject(window.Mousetrap)) {
        FN.register_keycode(params.keyCode, params.keyCodeDescr);
        Mousetrap.bind(params.keyCode, function() {
          $fab.click();
          //$menu.find(ITEM_CLASS).first().focus();
          return false;
        });
      }

      return $fab;
    },
    // WORK IN PROGRESS
    fabMulti: function(params){
      var $mfb = $(params.element || '#mfb'), $wrapper;
      if (!$mfb.length) {
        console.error('mfb element not found!');
        return;
      }

      /**
       * Some defaults
       */
      var clickOpt = 'click',
        hoverOpt = 'hover',
        toggleMethod = 'data-mfb-toggle',
        menuState = 'data-mfb-state',
        isOpen = 'open',
        isClosed = 'closed',
        mainButtonClass = 'mfb-component__button--main';

      /**
       * Internal references
       */
      var elemsToClick,
        elemsToHover,
        mainButton,
        target,
        currentState,
        mfbOffset = $mfb.offset();

      params = $.extend({}, DEFAULTS.fabMulti, params);
      params.id = $mfb.attr('id');
      mfbOffset.left = 120;

      $mfb.replaceWith(TEMPLATES.fabMulti(params));
      elemsToClick = getElemsByToggleMethod(clickOpt);
      attachEvt(elemsToClick, 'click');

      // TODO manual direction
      $('#' + params.id)
        //.removeClass('mfb-component--br')
        .css('position', 'absolute')
        .offset(mfbOffset);

      $wrapper = $('#' + params.id).find('.mfb-component__wrap');

      // set background
      $('.mfb-component__button--main, .mfb-component__button--child', $wrapper).css({
        backgroundColor: params.background
      });

      /**
       * On touch enabled devices we assume that no hover state is possible.
       * So, we get the menu with hover action configured and we set it up
       * in order to make it usable with tap/click.
       **/
      if (window.Modernizr && Modernizr.touch){
        elemsToHover = getElemsByToggleMethod(hoverOpt);
        replaceAttrs(elemsToHover);
      }

      elemsToClick = getElemsByToggleMethod(clickOpt);
      attachEvt(elemsToClick, 'click');

      return $wrapper;

      /**
       * For every menu we need to get the main button and attach the appropriate evt.
       */
      function attachEvt(elems, evt){
        for (var i = 0, len = elems.length; i < len; i++) {
          mainButton = elems[i].querySelector('.' + mainButtonClass);
          mainButton.addEventListener(evt, toggleButton, false);
        }
      }

      /**
       * Remove the hover option, set a click toggle and a default,
       * initial state of 'closed' to menu that's been targeted.
       */
      function replaceAttrs(elems){
        for (var i = 0, len = elems.length; i < len; i++) {
          elems[i].setAttribute(toggleMethod, clickOpt);
          elems[i].setAttribute(menuState, isClosed);
        }
      }

      function getElemsByToggleMethod(selector){
        return document.querySelectorAll('[' + toggleMethod + '="' + selector + '"]');
      }

      /**
       * The open/close action is performed by toggling an attribute
       * on the menu main element.
       *
       * First, check if the target is the menu itself. If it's a child
       * keep walking up the tree until we found the main element
       * where we can toggle the state.
       */
      function toggleButton(evt){
        target = evt.target;
        while (target && !target.getAttribute(toggleMethod)) {
          target = target.parentNode;
          if (!target) { return; }
        }
        currentState = target.getAttribute(menuState) === isOpen ? isClosed : isOpen;
        target.setAttribute(menuState, currentState);
      }
    },

    /**
     * Material Switch / Toggle.
     * @param {Object} params
     * @param {String} params.id
     * @param {String} params.appendTo
     * @param {Boolean} params.checked
     * @param {Boolean} params.help
     * @return {jQuery} switch element
     */
    toggle: function(params){
      params = $.extend({}, DEFAULTS.toggle, params);
      if (!params.id) {
        params.id = _.uniqueId('mdl-switch-');
      }

      const
        $sw = $(TEMPLATES.toggle(params)),// params: label, checked
        sw = $sw.get(0);

      params.appendTo && $sw.appendTo(params.appendTo);
      window.componentHandler.upgradeElement(sw);
      params.checked && sw.MaterialSwitch.on();

      if (params.help) {
        $sw.after('<div class="mdl-switch__help">' + params.help + '</div>');
      }

      return $sw;
    },

    /**
     * Material Drawer / Sidebar menu.
     *
     * TODO header optional
     * TODO modal (true = with overlay, false = slide in region, minimize center layout)
     * TODO fullheight (overlap layout header)
     *
     * @param {Object} params
     * @param {string} params.title - menu title
     * @param {(number|string)} params.width - drawer width
     * @param {boolean} params.overlay - show overlay or not
     * @param {array} params.list - menu items
     * @param {array} params.groups - grouped menu items
     * @param {boolean} params.open - start with open drawer
     * @param {boolean} params.mini - start with mini drawer
     * @param {(array|boolean)} params.breakpoints - set automatic view mode on resize
     * @param {*} params.trigger - element to trigger open state
     * @param {string} params.keyCode - mousetrap to toggle open state
     * @param {Object} params.on - callback methods
     * @param {Function} params.on.breakpoint - callback on breakpoint change
     * @param {Function} params.on.select - callback on select item
     * @param {Function} params.on.action - callback on select item action
     * @param {Function} params.on.open - callback on open drawer
     * @param {Function} params.on.close - callback on close drawer
     * @param {boolean} params.toggle - prepend a drawer mode toggle group
     * @param {(boolean|Object)} params.search - append input to drawer title for search operations
     * @param {string} params.search.placeholder - set placeholder text for search input
     * @param {Object=} params.offset - define drawer offset
     * @param {Number=} params.offset.top - offset top
     * @param {Number=} params.offset.bottom - offset bottom
     * @return {jQuery}
     */
    drawer: function(params){
      params = $.extend({}, DEFAULTS.drawer, params);

      $(TEMPLATES.drawer(params)).appendTo('body');

      var
        $drawer = $('.mdl-drawer'),
        $overlay = $('.mdl-drawer-overlay'),
        drawerMode,
        $menu,
        cbp,
        dheight = params.offset.top === 0 && params.offset.bottom === 0
          ? '100%'
          : 'calc(100% - ' + (params.offset.top + params.offset.bottom) + 'px)';

      $drawer.css({
        position: 'fixed',
        top: params.offset.top,
        bottom: params.offset.bottom,
        width: params.mini ? params.width.mini : params.width.fixed,
        height: dheight,
        transform: params.mini ? 'translateX(-90px)' : 'translateX(-256px)'
      });

      $menu = $(TEMPLATES.list()).appendTo($drawer);

      if (params.search) {
        var $search = $('<div class="mdl-layout-search"/>').css({ padding: '8px 16px 0' });
        $drawer.find('.mdl-layout-title').after($search);
        window.material.textfield({
          appendTo: $search,
          label: params.search.placeholder || 'Durchsuche Einträge...',
          width: '100%',
          on: {
            key: function(term) {
              searchList(term);
            },
            value: function(term) {
              searchList(term);
            }
          }
        });
      }

      // prepend drawer toggle group
      if (params.toggle) {
        params.groups.unshift({
          list: [{
            id: 'drawer-toggle',
            avatar: 'keyboard_arrow_right',
            title: 'Full drawer',
            callback: function () {
              const mode = $drawer.data('mode');
              if (mode === 'fixed') toggleMode('mini');
              if (mode === 'mini') toggleMode('fixed');
            }
          }]
        });
      }

      if (_.size(params.groups)) {
        _.each(params.groups, function(gr) {
          $menu.append($('<h3/>').addClass('mdl-list__header').text(gr.title));
          addList(gr.list);
        });
      }
      if (_.size(params.list)) {
        addList(params.list);
      }

      $menu.find('.mdl-list__item').attr('tabindex', '-1').css({
        cursor: 'pointer'
      });

      if (params.keyCode && _.isObject(window.Mousetrap)) {
        FN.register_keycode(params.keyCode, params.keyCodeDescr);
        Mousetrap.bind(params.keyCode, toggleDrawer);
      }

      $(params.trigger).on('click', toggleDrawer);

      $menu
        .on('click.mdl-drawer', '.mdl-list__item', function() {
          var action = $(this).data('action');
          if (_.isFunction(params.on.select)) {
            params.on.select(action);
            return false;
          }
          _.isFunction(action.callback) ? action.callback() : _.open(action);
        })
        .on('click.mdl-drawer', '.mdl-list__item-secondary-action', function() {
          var action = $(this).closest('.mdl-list__item').data('action');
          if (_.isFunction(params.on.action)) {
            params.on.action.call(this, action);
            return false;
          }
          _.isFunction(action.callback) ? action.callback() : _.open(action);
        });

      if (params.breakpoints) {
        $(window).resize(_.debounce(resizeHandler, 600));
        resizeHandler();
      }

      params.open && openDrawer();

      return $drawer;

      function addList(list) {
        var $item, itemId;
        _.each(list, function(li, i) {
          itemId = li.id || _.uniqueId('mdl-list-item-');
					li.action = li.action || '';
					li.subtitle = li.subtitle || '';
          if (li.subtitle) {
            // params: avatar (material icons), title, body, subtitle, action (material icons)
            $item = $(TEMPLATES.listItemThreeLine(li)).data('action', li);
          }
          else if (li.body) {
            // params: avatar (material icons), title, body, action (material icons)
            $item = $(TEMPLATES.listItemTwoLine(li)).data('action', li);
          }
          else {
            // params: avatar, title
            $item = $(TEMPLATES.listItemIconSingle(li)).data('action', li);
          }
          $item.attr('id', itemId);
          // if (!li.action) $item.find('.mdl-list__item-secondary-content').remove();
          if (li.color) {
            $item.find('.mdl-list__item-avatar').css({ backgroundColor: li.backgroundColor, color: li.color });
          }
          li.active && $item.addClass('is-active');
          (i === list.length-1) && $item.addClass('mdl-menu__item--full-bleed-divider');
					if (li.badge) {
						$item.find('.mdl-list__item-avatar.material-icons').addClass('mdl-badge').attr('data-badge', li.badge);
					}
          $menu.append($item);
					if (li.body) {
            window.material.tooltip({
              id: itemId,
              title: li.title + ': ' + li.body,
              cls: 'mdl-tooltip--right'
            });
          }
        });
      }

      // open drawer and handle events (key navigation, click to outside to close)
      function openDrawer() {
        if ($drawer.is('.is-visible')) return false;

        var
          curli = 0,
          $items = $menu.find('.mdl-list__item');

        setDrawerToggle();
        params.overlay && $overlay.addClass('is-visible');
        $drawer
          .css('transform', 'translateX(0)')
          .addClass('is-visible');

        // $items.eq(curli).trigger('focus');

        $(document)
          .on('click.mdl-drawer', function() {
            // all other modes stays open
            drawerMode === 'hide' && closeDrawer();
          });

        $drawer
          // TODO use keydown events only when focus is in drawer
          .on('keydown.mdl-drawer', function(event) {
            (event.key === 'Escape') && closeDrawer();
            if (event.key === 'ArrowDown') {
              if (curli < $items.length) {
                $items.eq(++curli).trigger('focus');
              }
            }
            else if (event.key === 'ArrowUp') {
              if (curli > 0) {
                $items.eq(--curli).focus();
              }
            }
            else if (event.key === 'Enter') {
              $items.eq(curli).trigger('click');
            }
          });

        params.on.open();

        return false;
      }
      function closeDrawer(event) {
        if (!$drawer.is('.is-visible')) return false;

        // close by event
        if (event) {
          // TODO is list item clicked?
          if ($(event.target).is('.mdl-list__item') || $(event.target).parents('.mdl-list__item').length) {
            return;
          }

          if ($drawer.find(event.target).length || event.target === $drawer.get(0)) {
            return;
          }// clicked inside drawer
        }

        $(document).off('.mdl-drawer');
        $drawer
          .off('.mdl-drawer')
          .css('transform', 'translateX(-330px)')
          .removeClass('is-visible');
        $overlay.removeClass('is-visible');
        setDrawerToggle();

        params.on.close();

        return false;
      }
      function toggleDrawer() {
        $drawer.is('.is-visible') ? closeDrawer() : openDrawer();
        return false;
      }

      function toggleMode(mode) {
        const currentMode = $drawer.attr('data-mode');
        if (currentMode === mode) return;

        drawerMode = mode;
        $drawer.attr('data-mode', mode);
        if (mode === 'mini') {
          $drawer.find('.mdl-layout-search').hide();
          $menu.find('.mdl-list__header').hide();
          $menu.find('.mdl-list__item-primary-content > span').hide();
          $menu.find('.mdl-list__item-secondary-content').hide();
          $drawer.css({
            width: params.width.mini,
            transform: 'translateX(-90px)'
          });
          closeDrawer();
          openDrawer();
        }
        else if (mode === 'fixed') {
          $drawer.find('.mdl-layout-search').show();
          $menu.find('.mdl-list__header').show();
          $menu.find('.mdl-list__item-primary-content > span').show();
          $menu.find('.mdl-list__item-secondary-content').show();
          $drawer.css({
            width: params.width.fixed,
            transform: 'translateX(-266px)'
          });
          closeDrawer();
          openDrawer();
        }
        else if (mode === 'maxi') {
          $drawer.find('.mdl-layout-search').show();
          $menu.find('.mdl-list__header').show();
          $menu.find('.mdl-list__item-primary-content > span').show();
          $menu.find('.mdl-list__item-secondary-content').show();
          $drawer.css({
            width: params.width.maxi,
            transform: 'translateX(-330px)'
          });
          closeDrawer();
          openDrawer();
        }
        else if (mode === 'hide') {
          closeDrawer();
        }
      }

      function setDrawerToggle() {
        const mode = $drawer.data('mode');
        const $toggle = $drawer.find('#drawer-toggle');
        const icon = mode !== 'fixed' ? 'keyboard_arrow_left' : 'keyboard_arrow_right';
        const hint = mode !== 'fixed' ? 'Full Drawer' : 'Mini Drawer';

        // $toggle.find('.mdl-list__item-avatar.material-icons').text(icon);
        // $toggle.find('.mdl-list__item-primary-content').text(hint);
      }

      function resizeHandler() {
        const width = window.innerWidth;
        const bp = _.find(params.breakpoints, function(b) { return width > b; });
        if (_.isFunction(params.on.breakpoint)) {
          params.on.breakpoint(bp, cbp, params, function(mode) {
            toggleMode(mode);
          });
        }
        else {
          if (width > params.breakpoints[0]) {
            toggleMode('maxi');
          } else if (width > params.breakpoints[1]) {
            toggleMode('fixed');
          } else if (width > params.breakpoints[2]) {
            toggleMode('mini');
          } else {
            toggleMode('hide');
          }
        }
        cbp = bp;
      }

      function searchList(term) {
        var $items = $menu.find('.mdl-list__item');
        if (!term) {
          $items.show();
          return;
        }

        var action, stext;
        $items.each(function() {
          action = $(this).data('action');
          stext = (action.title + action.body).toLowerCase();
          stext.indexOf(term) === -1 ? $(this).hide() : $(this).show();
        });
      }
    },

    /**
     * Create Material Search Control.
     *
     * @param  {Object} params
     * @return {jQuery} search main container
     */
    search: function(params){
      var
        $search, $select, $input, $button, $dropdown,
        tabs;

      params = $.extend({}, DEFAULTS.search, params);
      params.id = params.id || _.uniqueId('mdl-search-');
      $search = $(TEMPLATES.search(params)).hide();

      params.cls && $search.addClass(params.cls);

      $select = $search.find('select')
        .change(function() {
          _.isFunction(params.onSelect) && params.onSelect(this.value);
        });
      $input = $search.find('input')
        .val(params.value||'')
        .attr({
          placeholder: params.placeholder
        })
        .keyup(function(event) {
          $button.prop('disabled', !this.value);
          // ignore cursor up/down for keyboard selection
          // otherwise a new request was send on cursor key
          if (event.keyCode !== 38 && event.keyCode !== 40) {
            _.isFunction(params.onKey) && params.onKey(this.value);
          }
        })
        .keydown(function(event) {
          // RETURN submits search only with existing input value
          if (event.keyCode === 13) {
            $input.val().length && $button.click();
          }
        });
      $button = $search.find('button').click(function() {
        var rslt = {
          select: $select.val(),
          input: $input.val()
        };
        _.isFunction(params.onClick) && params.onClick(rslt);
        return false;
      });
      $dropdown = $(TEMPLATES.searchDropdown()).appendTo('body');
      $dropdown.hide();

      window.componentHandler.upgradeElement($search.find('.mdl-textfield').get(0));
      /*
       NS_ERROR_UNEXPECTED calling dispatchEvent on a disabled, unattached element
       https://bugzilla.mozilla.org/show_bug.cgi?id=889376
       */
      $button.prop('disabled', false);
      window.componentHandler.upgradeElement($button.get(0));
      $button.prop('disabled', true);

      if (_.isArray(params.options)) {
        var frag = document.createDocumentFragment();
        params.options.forEach(function(o) {
          var opt = new Option(o.label, o.value);
          o.preselected && $(opt).prop('selected', true);
          frag.appendChild(opt);
        });
        $select[0].appendChild(frag);
      }

      params.appendTo && $search.appendTo(params.appendTo);
      params.prependTo && $search.prependTo(params.prependTo);

      params.value && $input.trigger('keyup');
      $search.fadeIn();

      if (params.keyCode && _.isObject(window.Mousetrap)) {
        FN.register_keycode(params.keyCode, params.keyCodeDescr);
        window.Mousetrap.bind(params.keyCode, function() {
          $input.focus();
          return false;
        });
      }

      if (params.dropdown) {
        $dropdown
          .width($search.width())
          .height(256)// 5*48 items + 2*8 padding
          .css({
            top: $search.offset().top + $search.height() + 1,
            left: $search.offset().left
          });

        tabs = window.material.tabs({
          appendTo: $dropdown,
          hideHeader: true,
          hideButtons: true,
          colorClass: 'mdl-color--grey-700 hidden',// hide tabs until we have more than one
          refs: {
            'completion': {
              title: 'Vorschläge',// TODO translation
              content: ''
            }
          }
        });

        if (_.isFunction(params.dropdown)) {
          params.dropdown(tabs, $dropdown);
        }
      }

      return $search;
    },

    /**
     * Create Material Lists.
     * @param params
     * @returns {*|HTMLElement}
     */
    list: function(params){
      var
        $list,
        $item;

      params = $.extend({}, DEFAULTS.list, params);
      $list = $(TEMPLATES.list());

      // singleline params [{ title, avatar }]
      // twoline    params [{ title, avatar, body, action }]
      _.each(params.items, function(li) {
        $list.append(
          $item = $(TEMPLATES[params.singleLine ? 'listItemIconSingle' : 'listItemTwoLine'](li)).data('item', li)
        );
        li.action && $item.attr('data-action', li.action);
      });
      //$list.find('.mdl-list__item-secondary-action').eq(1).addClass('mdl-list__item-secondary-action--highlighted');

      params.appendTo && $list.appendTo(params.appendTo);
      params.prependTo && $list.prependTo(params.prependTo);

      return $list;
    },

    /**
     * Material Card.
     *
     * @param {Object} params
     * @return {jQuery} card
     */
    card: function(params){
      var $card;

      params = params || {};
      params.title = params.title || 'Card Title';
      params.text = params.text || 'Card Text...';
      params.action = params.action || 'Card Action';

      $card = $(TEMPLATES.card(params));

      params.width && $card.width(params.width);
      if (params.background) {
        $card.find('.mdl-card__title').css({
          background: 'url(' + params.background + ')',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          height: 150
        });
      }
      if (_.isFunction(params.beforeRender)) {
        params.beforeRender({
          $main: $card,
          $title: $card.find('.mdl-card__title-text'),// Title
          $text: $card.find('.mdl-card__supporting-text'),// Text
          $actions: $card.find('.mdl-card__actions')// Actions
        });
      }
      params.appendTo && $card.appendTo(params.appendTo);
      if (_.isFunction(params.afterRender)) {
        params.afterRender({
          $main: $card,
          $title: $card.find('.mdl-card__title-text'),// Title
          $text: $card.find('.mdl-card__supporting-text'),// Text
          $actions: $card.find('.mdl-card__actions')// Actions
        });
      }

      if (params.on && _.isFunction(params.on.action)) {
        $card.find('.mdl-card__actions .mdl-button').click(function() {
          params.on.action.call(this);
        });
      }

      return $card;
    },

    /**
     * Material Steppers Component.
     * @see https://material.google.com/components/steppers.html
     * @param {object} params
     * @param {function} callback
     */
    stepper: function(params, callback){
      var Stepper = new MStepper(params, callback);
      return {
        next: Stepper.next.bind(Stepper),
        spinner: Stepper.spinner.bind(Stepper),
        alldone: Stepper.alldone.bind(Stepper)
      };
    },

    /**
     * Material Table Component.
     * @param {Object} params
     * @return {MTable} the table element
     */
    table: function(params){
      return new MTable(params);
    },

    /**
     * Material Modal Dialog.
     * @param {Object} params
     * @param {(String|HTMLElement|JQuery)} params.appendTo
     * @param {String} params.title
     * @param {String} params.subtitle
     * @param {(String|Function|Object)} params.content
     * @param {(String|HTMLElement|JQuery)} params.$content
     * @param {(Number|String)} params.width
     * @param {Boolean} params.open
     * @param {Number} params.timeout
     * @param {String} params.agree
     * @param {Boolean} params.agreeColored? - set colored class to agree button
     * @param {String} params.disagree
     * @param {Boolean} params.destroy - remove element on close
     * @param {Object} params.ajax
     * @param {String} params.ajax.url
     * @param {Object} params.fab
     * @param {Number} params.fullwidth
     * @param {Boolean} params.submitOnReturn
     * @param {Boolean} params.closeOnEsc
     * @param {Object} params.on
     * @param {Function} params.on.agree - callback on click agree
     * @param {Function} params.on.disagree - callback on click disagree
     * @param {Function} params.on.beforeShow - callback before dialog is shown
     * @return {JQuery|undefined} dialog container
     */
    dialog: function(params){
      params = $.extend({}, DEFAULTS.dialog, params);
      params.open = typeof params.open === 'boolean' ? params.open : false;

      // ajax without url is invalid
      if (params.ajax && !params.ajax.url) {
        return;
      }

      if (_.isFunction(params.content)) {
        params.$content = params.content();
        params.content = '';
      }
      // parameter "content" could be an element or jquery object
      // if yes, we swap the param to $content
      else if (_.isObject(params.content)) {
        if (_.isElement(params.content) || _.isElement(params.content[0])) {
          params.$content = params.content;
          params.content = '';
        }
      }

      const $dlg = $(TEMPLATES.dialog(params)).appendTo(params.appendTo);
      const dlg = $dlg.get(0);
      const $dlgTitle = $dlg.find('.mdl-dialog__title');
      const $dlgContent = $dlg.find('.mdl-dialog__content');

      // $dlg.attr('data-backdrop', 'false');

      params.width && $dlg.width(params.width);
      if (params.fullwidth) {
        // mdl-dialog__actions--full-width
      }
      if (params.title) $dlgTitle.removeClass('hidden');
      if (params.subtitle) {
        $('<div class="mdl-dialog__subtitle"/>').text(params.subtitle).insertAfter($dlgTitle);
      }
      if (params.content) $dlgContent.removeClass('hidden');
      if (params.$content) {
        $dlgContent
          .empty()
          .append(params.$content)
          .removeClass('hidden');
      }
      if (params.agree || params.disagree) {
        const $actions = $dlg.find('.mdl-dialog__actions');
        const $agree = $actions.find('[data-name=agree]');
        const $disagree = $actions.find('[data-name=disagree]');
        $actions.removeClass('hidden');
        params.agree && $agree.removeClass('hidden');
        params.agreeColored && $agree.addClass('mdl-button--raised mdl-button--colored');
        !params.agreeColored && params.submitOnReturn && $agree.addClass('mdl-button--colored');
        params.disagree && $disagree.removeClass('hidden');
      }

      /**
       @see https://getmdl.io/components/#dialog-section
       NOTE Dialogs use the HTML <dialog> element, which currently has very limited cross-browser support.
       To ensure support across all modern browsers, please consider using a polyfill or creating your own.
       There is no polyfill included with MDL.
       */
      if (_.isUndefined(window.HTMLDialogElement) && !_.isUndefined(window.dialogPolyfill)) {
        // https://github.com/GoogleChrome/dialog-polyfill
        window.dialogPolyfill.registerDialog(dlg);
        // activate positioning css material-belt.css
        !params.noCenterClass && dlg.classList.add('mdl-dialog--polyfill');
      }
      else {
        window.componentHandler.upgradeElement(dlg);
      }
      console.assert(_.isFunction(dlg.showModal), 'window.material.dialog: HTML dialog element not initialized!');

      if (_.isFunction(params.on.beforeShow)) {
        params.on.beforeShow.call(dlg);
      }

      params.ajax && fromAjax();
      params.open && dlg.showModal();

      if (params.open && params.timeout) {
        setTimeout(function() { closeDialog(); }, params.timeout);
      }

      // bind events
      $dlg.on('click.mdl', '.mdl-dialog__actions .mdl-button[data-name]', function() {
        const
          isDisagree = $(this).data('name') === 'disagree',
          callback = params.on[isDisagree ? 'disagree' : 'agree'];

        _.isFunction(callback) && callback.call(dlg, this);

        if (isDisagree) {
          params.fab ? closeFAB() : closeDialog();
        }
        else if (params.destroy) closeDialog();
      });

      // handle RETURN as click on agree button
      params.submitOnReturn && $dlg.on('keyup', function(event) {
        if (event.key === 'Enter' && !/^(TEXTAREA)$/i.test(event.target.tagName)) {
          event.preventDefault();
          event.stopPropagation();
          $('.mdl-dialog__actions .mdl-button[data-name=agree]', $dlg).trigger('click');
        }
      });
      // handle ESC as click on disagree button
      params.closeOnEsc && $dlg.on('keydown', function(event) {
        if (event.key === 'Escape') {// ESC
          event.preventDefault();
          event.stopPropagation();
          $('.mdl-dialog__actions .mdl-button[data-name=disagree]', $dlg).trigger('click');
        }
      });

      if (params.fab) {
        $(params.fab).click(function() {
          dlg.showModal();
        });
      }

      return $dlg.trigger('focus');

      function closeDialog() {
        dlg.close();
        if (params.destroy) {
          $dlg.remove();
        }
      }
      function fromAjax() {
        var url = params.ajax.url, selector = params.ajax.selector;
        if (!url || !selector) { return; }

        $.get(url, function(responseText) {
          if (!responseText) { return; }

          var div = document.createElement('div');
          div.innerHTML = responseText;

          var content = div.querySelector(selector);
          if (content) {
            if (typeof params.ajax.beforeRender === 'function') {
              params.ajax.beforeRender(content);
            }
            $dlg.find('.mdl-dialog__content').empty().append(content).removeClass('hidden');
          }
        });
      }
      function closeFAB() {
        var
        $fab = $(params.fab),
        dlgCss = {
          width: $dlg.width(),
          height: $dlg.height(),
          margin: 'auto',
          top: '',
          left: '',
          borderRadius: 0,
          opacity: 1,
          zIndex: $dlg.zIndex()
        };
        $dlg.children().hide();
        $dlg.css({
          width: $fab.width(),
          height: $fab.height(),
          margin: 0,
          top: $dlg.offset().top,
          left: $dlg.offset().left,
          borderRadius: '50%',
          opacity: '0.35',
          zIndex: 0
        })
        .addClass($fab.attr('class'))
        .animate($fab.offset(), 500, function() {
          $dlg.get(0).close();
          $dlg.removeClass($fab.attr('class'))
          .css(dlgCss)
          .children().show();
          _.func(params.onClose)();
        });
      }
    },

    /**
     * Material Radio Group.
     *
     * window.material.radio([
     *   { id: 'mdl-radio-copy', value: 'copy', label: 'Copy', checked: true },
     *   { id: 'mdl-radio-move', value: 'move', label: 'Move' }
     * ], {
     *   appendTo: $content
     * });
     *
     * @param {Array} opts radio options { id, name, value, label, checked }
     * @param {Object} params
     * @param {String=} params.name?
     * @param {(String|JQuery<HTMLElement>|jQuery|HTMLElement)=} params.appendTo? - selector, node or jquery element
     * @return {Array} radios list of material radio templates
     */
    radio: function(opts, params){
      params = params || {};
      const radios = [];

      // build array of radio templates from given options
      _.each(opts, function(o) {
        o.id = o.id || 'mdl-option-' + $.guid++;
        o.name = o.name || params.name || 'options';
        o.label = o.label || '';
        o.checked = o.checked === true ? 'checked' : '';
        radios.push(TEMPLATES.radio(o));// params: id, name, label, value, checked
      });

      // append the radio templates to the DOM
      if (params.appendTo) {
        _.each(radios, function(o) {
          $(params.appendTo).append(o);
        });

        // upgrade mdl controls inside the menu
        $(params.appendTo)
          .find('.'+window.MaterialRadio.prototype.CssClasses_.JS_RADIO)
          .each(function() {
            window.componentHandler.upgradeElement(this);
          });
      }

      return radios;
    },

    /**
     * Material Checkbox Component.
     * @param {Object} params
     * @param {String=} params.id
     * @param {String=} params.label
     * @param {String=} params.name
     * @param {String=} params.value
     * @param {Boolean=} params.checked
     * @param {Boolean=} params.disabled
     * @param {String=} params.appendTo
     * @param {String=} params.cls
     * @return {jQuery} checkbox element
     */
    checkbox: function(params){
      params = $.extend({}, DEFAULTS.checkbox, params);
      params.id = params.id || _.uniqueId('mdl-checkbox-');
      // for the template we need the string "checked"
      if (_.isBoolean(params.checked) && params.checked === true) {
        params.checked = 'checked';
      }
      else {
        params.checked = '';
      }

      var
        $cbx = $(TEMPLATES.checkbox(params)),// params: id, label, checked
        cbx = $cbx.get(0),
        $inp = $cbx.find('input');

      params.name && $inp.attr('name', params.name);
      params.value && $inp.attr('value', params.value);
      params.cls && $cbx.addClass(params.cls);

      params.appendTo && $cbx.appendTo(params.appendTo);
      window.componentHandler.upgradeElement(cbx);

      params.disabled && cbx.MaterialCheckbox.disable();

      return $cbx;
    },
    checkboxFrom: function(selector, appendTo){
      var
        $selector = $(selector),
        $inp,
        $lbl,
        label;

      // no checkbox found to clone
      // return selector for chaining
      if (!$selector.length) { return $selector; }

      $inp = $selector.find('input[type=checkbox]');
      $lbl = $selector.find('label');
      label = $lbl.text() || $selector.text();

      return window.material.checkbox({
        name: $inp.attr('name'),
        value: $inp.val(),
        label: $.trim(label),
        checked: $inp.prop('checked'),
        appendTo: appendTo
      });
    },

    /**
     * Material Select Component.
     * @param params
     * @returns {MSelect}
     */
    select: function(params){
      return new MSelect(params);
    },
    selectFrom: function(selector, params){
      var
        $sels = $(selector),
        $sel,
        $opts,
        opts = [],
        seli,// created material select instance
        rslt = [];// collection of instances

      if (!$sels.length) { return; }

      params = params || {};

      let $o;
      $sels.each(function () {
        $sel = $(this).closest('select').hide();
        $opts = $(this).find('option');
        opts.length = 0;
        $opts.each(function () {
          $o = $(this);
          opts.push({
            value: this.value,
            label: this.innerText,
            menu: $o.data('menu'),
            selected: $o.is(':selected'),
            disabled: $o.is(':disabled')
          });
        });
        seli = window.material.select({
          appendTo: params.appendTo || $sel.parent(),
          options: opts,
          name: params.name,
          label: params.label || $sel.prev().text(),
          trigger: $sel,
          parent: params.parent,
          padded: params.padded,
          width: params.width,
          disabled: $sel.is(':disabled') || params.disabled,
          bottomMenu: true
        });
        rslt.push(seli);
      });

      return rslt;
    },

    /**
     * Material Icon.
     * @param {String} iconName - name of the icon
     * @return {String} html for icon
     */
    icon: function(iconName){
      if (!iconName || !_.isString(iconName)) return '';
      return TEMPLATES.icon({ icon: iconName });
    },

    /**
     * Material Chips
     * @param  {Object} params settings
     * @return {MChips} new Material Chips instance
     */
    chips: function(params){
      return new MChips(params);
    },
    chip: function(params){
      params = $.extend({}, DEFAULTS.chip, params);

      var
        $chip = $(TEMPLATES.chip(params)),// params: prefixAction, prefix, label, action
        $prefixAction,
        $action;

      if (params.prefix) {
        $chip.addClass('mdl-chip--contact');
        $chip.find('.mdl-chip__contact')
          .addClass(params.prefixClass)
          .removeClass('hidden');
      }

      if (params.prefixAction) {
        $chip.css('paddingLeft', 4);
        $prefixAction = $chip.find('.mdl-chip__action-prefix')
          .removeClass('hidden')
          .attr('tabindex', '-1');
        $prefixAction.on('click', function() {
          _.isFunction(params.onActionPrefix) && params.onActionPrefix($chip);
          params.on.prefix($chip);
          return false;
        });
      }

      if (params.action) {
        $chip.addClass(params.actionClass);
        $action = $chip.find('.mdl-chip__action').not('.mdl-chip__action-prefix')
          .removeClass('hidden')
          .attr('tabindex', '-1');
        params.actionDisabled && $action.addClass('disabled');
        $action.on('click',function() {
          _.isFunction(params.onAction) && params.onAction($chip);
          params.on.action($chip);
          return false;
        });
      }

      params.appendTo && $chip.appendTo(params.appendTo);

      if (params.editable) {
        $chip.on('click', function () {
          const $text = $(this).find('.mdl-chip__text');
          const text = $text.text();

          window.material.dialog({
            // title: 'Edit',
            content: function() {
              const $content = $('<div/>');
              window.material.textfield({
                appendTo: $content,
                // label: 'new value',
                value: text,
                width: '100%'
              });
              return $content;
            },
            width: 420,
            open: true,
            submitOnReturn: true,
            agree: params.agree,
            disagree: params.disagree,
            on: {
              agree: function() {
                const newText = $(this).find('input').val();
                $text.text(newText);
                this.close();
                params.on.edit($chip, newText);
              }
            }
          });
        });
      }

      return $chip;
    },

    /**
     * Material Progress Bar.
     * @param params
     * @returns {*|HTMLElement}
     */
    progress: function(params){
      params = params || {};
      const
        $progress = $(TEMPLATES.progress()),
        progress = $progress.get(0);

      params.indeterminate && $progress.addClass('mdl-progress__indeterminate');
      window.componentHandler.upgradeElement(progress);

      return $progress;
    },
    /**
     * Material Spinner.
     * @param {Object} params
     * @param {boolean?} params.single
     * @param {boolean?} params.active
     * @return {JQuery<HTMLElement> | jQuery | HTMLElement}
     */
    spinner: function(params){
      params = params || {};
      const
        $spinner = $(TEMPLATES.spinner()),
        spinner = $spinner.get(0);

      params.single && $spinner.addClass('mdl-spinner--single-color');
      window.componentHandler.upgradeElement(spinner);
      params.active && spinner.MaterialSpinner.start();

      return $spinner;
    },

    /**
     * Material Tooltip.
     * @param {Object} params id, title, appendTo, cls
     * @param {string} params.id
     * @param {string} params.title
     * @param {string} params.cls
     * @returns {HTMLElement|jQuery|undefined}
     */
    tooltip: function(params){
      if (_.isEmpty(params) || !params.id) {
        console.warn('window.material.tooltip: params.id required!');
        return;
      }
      if (!params.title) {
        console.warn('window.material.tooltip: params.title required!');
        return;
      }

      var
        $tooltip = $(TEMPLATES.tooltip(params)).text(params.title),
        tooltip = $tooltip.get(0),
        $for = $('#'+params.id),
        for_bcr = $for.length ? $for.get(0).getBoundingClientRect() : {};

      // set tooltip direction class to "top"
      // if element is below half the window height
      if (!params.cls && for_bcr.top > $(window).height() / 2) {
        params.cls = 'mdl-tooltip--top';
      }

      params.appendTo = params.appendTo || 'body';
      params.cls && $tooltip.addClass(params.cls);
      params.appendTo && $tooltip.appendTo(params.appendTo);

      // bind more elements to the same tooltip
      // this can reduce the number of identical tooltips
      if (params.add) {
        // before we proxy the context, wait for the upgraded component
        $tooltip.one('mdl-componentupgraded', function() {
          // create handler which delegate the events to the original handler
          var myBoundMouseEnterHandler = function(event) {
              this.handleMouseEnter_.call(this, event);
            },
            myBoundMouseLeaveHandler = function(event) {
              this.hideTooltip_.call(this, event);
            };
          // TODO append touch events (see material.js)
          $(params.add)
            .on('mouseenter', $.proxy(myBoundMouseEnterHandler, this.MaterialTooltip))
            .on('mouseleave', $.proxy(myBoundMouseLeaveHandler, this.MaterialTooltip));
        });
      }

      window.componentHandler.upgradeElement(tooltip);

      return $tooltip;
    },

    /**
     * Material Dropdown.
     * @param {Object} params
     * @param {(String|HTMLElement|jQuery)} params.element? - element for the dropdown (used to get offset and size)
     * @param {(String|HTMLElement|jQuery)} params.parent? - offset parent for the dropdown (used to get offset and size)
     * @param {Array} params.items - format = [{label, value, disabled]
     * @param {Object} params.on? - callback handler
     * @param {Function} params.on.click? - on click callback
     * @param {Function} params.on.close? - on close callback
     * @param {Function} params.on.pos? - on pos calculation callback
     * @return {jQuery} dropdown element
     */
    dropdown: function(params){
      params = $.extend({}, DEFAULTS.dropdown, params);
      const
        $dropdown = $('<div/>').addClass('mdl-dropdown').appendTo('body'),
        $list = $('<ul/>').addClass('mdl-dropdown__items').appendTo($dropdown);

      _.each(params.items, function(o) {
        $('<li/>').append(window.material.button(o).data('item', o))
          .attr('data-val', o.value)
          .addClass(o.selected ? 'is-selected' : '')
          .appendTo($list);
      });

      $dropdown.on('click', '.mdl-button', function() {
        _.isFunction(params.on.click) && params.on.click($(this).data('item'));
        close();
        return false;
      });

      _.clickout({
        selector: $dropdown,
        callback: close
      });

      setPos();
      $dropdown.addClass('is-visible');

      return $dropdown;

      function close() {
        $dropdown.removeClass('is-visible');
        $dropdown.remove();
        _.isFunction(params.on.close) && params.on.close();
      }
      function setPos() {
        var
          rect = params.element ? params.element.getBoundingClientRect() : {top: 0, left: 0},
          // offset parent for the dropdown container
          $parent = params.parent ? $(params.parent) : $(window),
          // height of dropdown menu
          mheight = $dropdown.height(),
          // current bottom y position of the dropdown
          bottom = $parent.height() - rect.top - mheight,
          // take margin / padding into account
          topgap = 0,
          //topgap = parseInt($(params.element).css('paddingTop'), 10) || 0,
          // height of input control
					iheight = 0,
          // iheight = $(this.tf.input_).outerHeight(true),
          // direction up or down
          ddtop = bottom > 0 ? rect.top + topgap : rect.top - mheight + iheight,
          ddleft = rect.left,
          onPos;

        if (_.isFunction(params.on.pos)) {
          onPos = params.on.pos(ddtop, ddleft, params.element, $dropdown);
          if (onPos) {
            ddtop = onPos.top;
            ddleft = onPos.left;
          }
        }

        $dropdown.css({ top: ddtop, left: ddleft });
      }
    },

    /**
     * Material Slider (Range Input)
     * @param  {[type]} params [description]
     * @return {[type]}        [description]
     */
    slider: function(params){
      params = $.extend({}, DEFAULTS.slider, params);
      params.id = params.id || _.uniqueId('mdl-slider-');
      params.suffix = '' + params.suffix;

      var
        $sliderWrapper = $(TEMPLATES.slider(params)),
        $slider = $sliderWrapper.find('.mdl-slider'), slider,
        $tf, tf,
        $tooltip;

      $sliderWrapper.height(30);
      $slider.attr('id', params.id);
      params.appendTo && $sliderWrapper.appendTo(params.appendTo);

      window.componentHandler.upgradeElement($slider.get(0));

      slider = $slider.get(0).MaterialSlider;
      $tf = window.material.textfield({
        prependTo: $slider.parent(),
        width: 50,
        name: params.name,
        value: params.value,
        maxlength: (params.max + '').length || 3,
        floatLabel: false,
        placeholder: params.min + '-' + params.max
      }).css({padding:0});
      tf = $tf.get(0).MaterialTextfield;

      $slider.width('calc(100% - 100px)');
      $slider.next().width('calc(100% - 112px)').css({marginLeft:76});

      params.scala && buildScala();

      if (params.tooltip) {
        $tooltip = window.material.tooltip({
          id: params.id,
          title: '' + (params.value || '0')
        });
      }

      $slider.on('change', function() {
        var newValue = this.value;
        tf.input_.value = newValue;// + params.suffix;
        tf.updateClasses_();
        $tooltip && $tooltip.text(newValue);
        params.on && _.isFunction(params.on.change) && params.on.change(newValue);
      });

      $(tf.input_).on('change', function() {
        slider.change(this.value);
        $slider.triggerHandler('change');
      });

      return $sliderWrapper;

      function buildScala() {
        var
          $scala,
          scalaWidth,
          maxtimes,
          factor = 1,
          frag = document.createDocumentFragment();

        scalaWidth = $sliderWrapper.find('.mdl-slider__background-flex').width();
        $scala = $sliderWrapper.find('.mdl-slider__scala').css({
          position: 'absolute',
          width: scalaWidth,
          bottom: -8,
          left: 8,
          marginLeft: 76
        });

        maxtimes = params.max;
        if (maxtimes > 20) { maxtimes = maxtimes / 10; factor = 10; }
        // TODO create fragment
        _.times(maxtimes, function(i) {
          $scala.append('<span>' + (params.min + (i * factor)) + '</span>');
        });
      }
    },

    loadIcons: function(){
      var found = _.find($('link'), function(el) {
        if (el && el.href && el.href.search(/(Material\+Icons)$/) !== -1) {
          return true;
        }
      });
      // if not found, append link to load Material Icons
      if (_.isUndefined(found)) {
        $('head')
          .append('<link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">')
          .append('<link rel="stylesheet" href="https://cdn.materialdesignicons.com/2.5.94/css/materialdesignicons.min.css">');
      }
    },
    loadFont: function(){
      var
        found = _.find($('link'), function(el) {
          if (el && el.href && el.href.search(/(family=Roboto)$/) !== -1) {
            return true;
          }
        }),
        sizes = '400,500,600,700',
        lang = ';lang=en';

      // if not found, append link to load Material Icons
      if (_.isUndefined(found)) {
        $('head').append('<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:' + sizes + lang + '">');
      }
    },

    /**
     * Material Popup.
     * @param {Object} params
     * @param {String} params.title?
     * @param {Function} params.content?
     * @param {Boolean} [params.scroll=false]
     * @param {Object} params.on - callback handler
     * @param {Function} params.on.close
     * @param {Function} params.on.loaded
     * @return {{$article: JQuery<HTMLElement>|jQuery|HTMLElement, $layout: JQuery<HTMLElement>|jQuery|HTMLElement, $content: JQuery<HTMLElement>|jQuery|HTMLElement, close: Function}}
     */
    popup: function(params){
      params = $.extend({}, DEFAULTS.popup, params);
      var
        $layout,
        $article = $(TEMPLATES.article({ title: params.title || '' })),
        $content = $article.find('.material-belt-article-content');

      $article.find('.mdl-textfield--expandable').hide();

      params.scroll && $article.find('.mdl-layout__header').addClass('mdl-layout__header--scroll');
      // $article.find('.mdl-layout__header').css({ position: 'fixed' });

      $content.empty();
      if (_.isFunction(params.content)) {
        params.content($content);
      }

      $article.appendTo('body');
      window.componentHandler.upgradeElement($article.get(0));
      $layout = $article.parent().css({ top: 0, zIndex: 4999 }); // NOTE dropdown menus have z-index 9999

      if (_.isFunction(params.on.loaded)) {
        params.on.loaded($article);
      }

      if (_.isFunction(params.on.close)) {
        window.material.button({
            appendTo: $article.find('.mdl-layout__header-row'),
            label: window.material.icon('close'),
            icon: true
          })
          .click(function () {
            _.isFunction(params.on.close) && params.on.close($layout);
          });
      }

      $(document).on('keyup', function(event) {
        if (event.key === 'Escape') {
          _.isFunction(params.on.close) && params.on.close($layout);
        }
      });

      return {
        $layout: $layout,
        $article: $article,
        $content: $content,
        close: function() {
          $layout.fadeOut(function() {
            $layout.remove();
          });
        }
      };
    },

    /**
     * Material Article Template
     * @return {jQuery}
     */
    article: function(params){
      return $(TEMPLATES.article(params));
    },

    // TODO manage content argument
    prompt: function(params, callback){
      callback = callback || $.noop;
      params = $.extend(true, {}, {
        title: '',
        open: true,
        width: 480,
        agree: 'OK',
        disagree: 'Cancel',
        submitOnReturn: true,
        cancelOnEsc: true,
        on: {
          agree: function () {
            this.close();
            callback(true);
          },
          disagree: function () {
            callback(false);
          }
        }
      }, params);
      return window.material.dialog(params);
    }
  };

  //
  // Extend jQuery Effin
  //
  $.fn.extend({
    /**
     * animateCss() - deferred animation from animate.css
     * automatically remove classes after animation end
     * support callback after animation
     * @param {string} animationName
     * @param {function} callback
     */
    animateCss: function(animationName, callback) {
      var $el = $(this), animationClasses = 'animated ' + animationName;
      $el.addClass(animationClasses).one(ANIMATION_END, function() {
        $el
          .off(ANIMATION_END)// one doesn't work on two simultan animations on one element
          .removeClass(animationClasses);
        _.isFunction(callback) && callback.call($el);// set callback context to our element
      });
      return this;
    },

    /**
     * jQuery imagesLoaded plugin v1.1.0
     * http://github.com/desandro/imagesloaded
     *
     * MIT License. by Paul Irish et al.
     *
     * $('#my-container').imagesLoaded(myFunction)
     * or
     * $('img').imagesLoaded(myFunction)
     *
     * execute a callback when all images have loaded.
     * needed because .load() doesn't work on cached images
     *
     * callback function gets image collection as argument
     *  `this` is the container
     */
    imagesLoaded: function(callback){
      var
        $this = this,
        $images = $this.find('img').add($this.filter('img')),
        len = $images.length,
        blank = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
        loaded = [];

      function triggerCallback() {
        callback.call($this, $images);
      }

      function imgLoaded(event) {
        var img = event.target;
        if (img.src !== blank && $.inArray(img, loaded) === -1) {
          loaded.push(img);
          if (--len <= 0) {
            setTimeout(triggerCallback);
            $images.off('.imagesLoaded', imgLoaded);
          }
        }
      }

      // if no images, trigger immediately
      if (!len) {
        triggerCallback();
      }

      $images.on('load.imagesLoaded error.imagesLoaded', imgLoaded).each(function() {
        // cached images don't fire load sometimes, so we reset src.
        var src = this.src;
        // webkit hack from http://groups.google.com/group/jquery-dev/browse_thread/thread/eee6ab7b2da50e1f
        // data uri bypasses webkit log warning (thx doug jones)
        this.src = blank;
        this.src = src;
      });

      return $this;
    }
  });

  //
  // Extend Underscore
  //
  _.mixin({
    // Build deep namespaces on objects (default: window)
    // ex. _.namespace('pbox.data.user')
    namespace: function(path, parent){
      path = path || '';
      var
        parent_space = parent || window,
        namespaces = path.split('.');

      if (!namespaces || !namespaces.length) {
        console.error('wrong call namespace', path, parent);
        return;
      }

      for (var i=0, z=namespaces.length; i<z; i++) {
        if (typeof parent_space[namespaces[i]] === 'undefined') {
          parent_space[namespaces[i]] = {};
        }
        parent_space = parent_space[namespaces[i]];
      }

      return parent_space;
    },

    // Get deep object data
    // ex. _.getObject('pbox.data.user.id')
    getObject: function(parts, create, obj){
      if (typeof parts === 'undefined') { return parts; }

      var p, def;

      if (typeof parts === 'string') { parts = parts.split('.'); }
      if (typeof create !== 'boolean') {
        def = obj;// use 3. argument as default
        obj = create;// swap obj when not create
        create = void 0;
      }
      obj = obj || window;// create on global as default
      while (obj && parts.length) {
        p = parts.shift();
        if (typeof obj[p] === 'undefined' && create) { obj[p] = {}; }
        obj = obj[p];
      }

      typeof obj === 'undefined' && typeof def !== 'undefined' && (obj = def);

      return obj;
    },

    /**
     * Parse string to JSON object.
     * @param {string} str
     * @returns {Object}
     */
    toJSON: function(str){
      try {
        return JSON.parse(str);
      }
      catch(e){
        return {};
      }
    },

    // Extract parameter string to key/value-pair object.
    params: function(obj){
      var keys = {}, uriPos;

      obj = obj || window.location.search;
      uriPos = obj.indexOf('?');
      if (uriPos > -1) { obj = obj.substr(uriPos+1); }
      obj = decodeURI(obj);
      if (typeof obj !== 'string' || obj.length === 0) { return keys; }

      // trim leading question mark
      if (obj.charAt(0) === '?') { obj = obj.substring(1); }

      // split into parameters
      _.each(obj.split('&'), function(p) {
        var kv = p.split('=');
        // split key/value pairs
        keys[kv[0]] = (kv.length > 1 ? kv[1] : '');
      });

      return keys;
    },

    // Set Location href or open new window for given action parameters
    open: function(action){
      if (_.isUndefined(action)) { return; }// required

      if (_.isString(action)) {
        action = { href: action };
      }

      var
        href = action.href || _.getObject('bindTo.href', action),
        target = action.target || _.getObject('bindTo.target', action),
        winHandle;

      if (!href) { return; }// required

      if (target === '_blank') {
        winHandle = window.open(href);
        if (winHandle) {
          winHandle.opener = winHandle.opener || window.self;// secure "opener" for new window is set
          winHandle.location.href = href;// set opened url as reference
          winHandle.focus();// try to focus new window
        }
      }
      else {
        window.location.href = href;
      }
    },

    form: function(params){
      if (!params) { return; }// required

      var $form;

      // use existing formular and fill fields
      if (params.clone) {
        $form = $(params.clone).clone();
        _.each(params.fields, function(f) {
          $('[name="' + f.name + '"]', $form).val(f.value);
        });
      }
      // or create new form and insert fields
      else {
        $form = $('<form/>').appendTo('body');
        params.attr && $form.attr(params.attr);
        _.each(params.fields, function(f) {
          $('<input type="hidden"/>').attr(f).appendTo($form);
        });
      }

      _.isFunction(params.beforeSubmit) && params.beforeSubmit($form);

      $form.submit();
    },

    // Convenience Document Click Handling
    clickout: function(){
      var
        args = _.toArray(arguments),
        params = args.shift();

      // TODO if params === 'off' -> clickout definition entfernen

      // store definition
      CLICKOUT.push({
        selector: params.selector,
        $selector: $(params.selector),
        ignore: params.ignore,
        callback: params.callback
      });

      // activate binding only on first definition
      if (_.size(CLICKOUT) > 1) {
        return;
      }

      // single event handler for "click outside" definitions
      $(document).on('click.out', function(event) {
        // check all registered clickout definitions
        _.each(CLICKOUT, function(co) {
          // selector element must be on DOM
          // selector is currently visible
          // clicked target is not part of selector element
          if (co.$selector.length &&
            co.$selector.is(':visible') &&
            !co.$selector.find(event.target).length) {

            // check ignore selector
            if (co.ignore) {
              if ($(co.ignore).find(event.target).length || $(co.ignore).get(0) === event.target) {
                return;
              }
            }

            _.isFunction(co.callback) && co.callback();
          }
        });
      });

      // single key event handler for "press esc"
      $(document).on('keydown.out', function(event) {
        if (event.keyCode === 27) {
          // check all registered clickout definitions
          _.each(CLICKOUT, function(co) {
            // selector element must be on DOM
            // selector is currently visible
            if (co.$selector.length &&
              co.$selector.is(':visible')) {
              _.isFunction(co.callback) && co.callback();
            }
          });
        }
      });
    },

    // shortcut for progress dialog
    progress: function(title, open){
      return window.material.dialog({
        title: title,
        content: window.material.progress({ indeterminate: true }),
        open: open,
        disagree: false,
        agree: false
      });
    }
  });

  window.material._VERSION = WATCHDOG.__version;
  window.material.DEFAULTS = DEFAULTS;

  window.material.TRANSPARENT = 'mdl-layout__header--transparent';
  window.material.COLOR_BLACK = 'mdl-color--black';
  window.material.COLOR_WHITE = 'mdl-color--white';
  window.material.COLOR_DARKGREY = 'mdl-color--grey-800';
  window.material.WHITE_ON_BLUE = 'mdl-color--blue-900 mdl-color-text--white';
  window.material.WHITE_ON_BLACK = 'mdl-color--black mdl-color-text--white';
  window.material.WHITE_ON_DARKGREY = 'mdl-color--grey-800 mdl-color-text--white';
  window.material.WHITE_ON_GREY = 'mdl-color--grey-300 mdl-color-text--white';
  window.material.BLACK_ON_WHITE = 'mdl-color--white mdl-color-text--black';
  window.material.BLACK_ON_GREY = 'mdl-color--grey-300 mdl-color-text--black';
  window.material.BLACK_ON_YELLOW = 'mdl-color--yellow-900 mdl-color-text--black';
  window.material.WHITE_ON_LIGHTBLUE = 'mdl-color--blue-300 mdl-color-text--white';
  window.material.WHITE_ON_LIGHTERBLUE = 'mdl-color--blue-200 mdl-color-text--white';

})(window.jQuery);
