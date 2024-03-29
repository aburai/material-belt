/**
 * Material Belt - v1.4.9 (c) 2016-2021; aburai
 *                  _            _       _   _          _ _
 *  _ __ ___   __ _| |_ ___ _ __(_) __ _| | | |__   ___| | |_
 * | '_ ` _ \ / _` | __/ _ \ '__| |/ _` | | | '_ \ / _ \ | __|
 * | | | | | | (_| | ||  __/ |  | | (_| | | | |_) |  __/ | |_
 * |_| |_| |_|\__,_|\__\___|_|  |_|\__,_|_| |_.__/ \___|_|\__|
 *
 * @file material-belt.js
 * @author André Bunse (aburai@github.com) <andre.bunse@gmail.com>
 * @version 1.4.9
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
  'use strict'

  // TODO support require or module.export
  console.assert(typeof window.material === 'undefined', 'Namespace window.material already defined!')

  let KEYCODES_ACTIVE = false

  const
  WATCHDOG = {
    __version: '1.4.9',
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
        '<span class="mdl-button__label"><%= label %></span>' +
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
      '<span class="mdl-textfield__helper"></span>' +
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
    listItemIconDetail: _.template('<li class="mdl-list__item">' +
      '<span class="mdl-list__item-primary-hint-avatar">' +
        '<i class="material-icons mdl-list__item-icon"><%= avatar %></i>' +
      '</span>' +
      '<span class="mdl-list__item-primary-hint-content"><%= title %></span>' +
      '<span class="mdl-list__item-primary-hint"><%= hint %></span>' +
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
    // params: avatar (material icons), title, body, action (material icons)
    listItemThree: _.template('<li class="mdl-list__item mdl-list__item--three-line">' +
      '<span class="mdl-list__item-primary-content">' +
        '<i class="material-icons mdl-list__item-avatar"><%= avatar %></i>' +
        '<span><%= title %></span>' +
        '<span class="mdl-list__item-text-body"><%= body %></span>' +
      '</span>' +
      '<span class="mdl-list__item-secondary-content">' +
        '<a class="mdl-list__item-secondary-action" href="//"><i class="material-icons"><%= action %></i></a>' +
      '</span>' +
      '</li>'
    ),
    // params: avatar, title, id, checked
    listItemCheckbox: _.template('<li class="mdl-list__item">' +
      '<span class="mdl-list__item-primary-content">' +
        '<i class="material-icons mdl-list__item-avatar hidden"><%= avatar %></i>' +
        '<%= title %>' +
      '</span>' +
      '<span class="mdl-list__item-secondary-action">' +
        '<label class="mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect" for="<%= id %>">' +
          '<input type="checkbox" id="<%= id %>" class="mdl-checkbox__input" <%= checked %>>' +
        '</label>' +
      '</span>' +
      '</li>'
    ),
    // params: avatar, title, id, name, value, checked
    listItemRadio: _.template('<li class="mdl-list__item">' +
      '<span class="mdl-list__item-primary-content">' +
        '<i class="material-icons mdl-list__item-avatar hidden"><%= avatar %></i>' +
        '<%= title %>' +
      '</span>' +
      '<span class="mdl-list__item-secondary-action">' +
        '<label class="mdl-radio mdl-js-radio mdl-js-ripple-effect" for="<%= id %>">' +
          '<input type="radio" id="<%= id %>" class="mdl-radio__button" name="<%= name %>" value="<%= value %>" <%= checked %>>' +
        '</label>' +
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
    // params: title, content
    dialog: _.template('<dialog class="mdl-dialog">' +
      '<h4 class="mdl-dialog__title hidden"><%= title %></h4>' +
      '<div class="mdl-dialog__content" style="overflow:hidden">' +
        '<p><%= content %></p>' +
      '</div>' +
      '<div class="mdl-dialog__actions mdl-dialog--border hidden">' +
        '<button type="button" class="mdl-button mdl-js-button mdl-js-ripple-effect hidden" data-name="agree"><%= agree %></button>' +
        '<button type="button" class="mdl-button mdl-js-button mdl-js-ripple-effect hidden" data-name="disagree"><%= disagree %></button>' +
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
        '<label class="mdl-textfield__label" for="mdl-login__login" data-lang="login"><%= login %></label>' +
      '</div>' +
      '<div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">' +
        '<input class="mdl-login__password mdl-textfield__input" type="password" id="mdl-login__password">' +
        '<label class="mdl-textfield__label" for="mdl-login__password" data-lang="password"><%= password %></label>' +
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
      '<div style="display:inline-block">' +
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
    // params: id
    tooltip: _.template('<div class="mdl-tooltip" for="<%= id %>"></div>'),
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
          '<div class="material-belt-article-sidebar mdl-cell mdl-cell--2-col mdl-cell--1-offset mdl-cell--hide-tablet mdl-cell--hide-phone mdl-color--white mdl-shadow--4dp mdl-color-text--grey-800"></div>' +
          '<div class="material-belt-article-content mdl-color--white mdl-shadow--4dp mdl-color-text--grey-800 mdl-cell mdl-cell--8-col">' +
          '</div>' +
        '</div>' +
      '</main>' +
      '</div>'
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
    snackbar: {
      message: '',
      timeout: 10000,
      type: 'info'
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
      spellcheck: false,
      date: false,
      overlay: false,
      clear: true,
      resize: true,
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
      appendTo: 'body',
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
      actionBorder: true,
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
    list: {
      singleLine: true
    },
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
      defaultwidth: {
        mini: 80,
        fixed: 256,
        maxi: 320
      }
    },
    dropdown: {
      appendTo: 'body',
      offsetX: 0,
      offsetY: 0,
      on: {
        click: $.noop,
        close: $.noop,
        pos: $.noop
      }
    },
    popup: {
      title: '',
      gridsize: [2, 8],
      on: {
        loaded: $.noop,
        close: $.noop
      }
    }
  },

  KEYCODES = [],

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
    }
  }

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
  }

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
      $header.animateCss({animationName: lgn.classOut, animationSpeed: 'fast', callback: function() {
        var lastHeight = $header.outerHeight(true);
        $header.css('min-height', lastHeight);
        _.isObject(headerCss) && $header.css(headerCss);
        _.isString(background) && $header.css('background', background);
        _.isString(content) && $header.empty().append(content);
        $header.animateCss({animationName: lgn.classIn, animationSpeed: 'fast', callback})
      }});
    }
    else {
      _.isFunction(callback) && callback();
    }
  }
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
  }

  Login.prototype.setMessage = function() {
    var
      lgn = this,
      args = _.toArray(arguments),
      msg = args.shift(),
      $msg = lgn.dom.$message;

    $msg.text(msg);
    msg ? $msg.parent().show().animateCss({animationName: 'bounceIn'}) : $msg.parent().hide();
  }

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
          $dlg.animateCss({animationName: 'bounce'});
          _.delay(function() {
            oLogin.$footer && oLogin.$footer.children().first().animateCss({animationName: 'tada'});
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
     * @property {boolean} spellcheck - activate spellcheck or not
     * @property {boolean} resize=true - activate resizable (for textareas only)
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
      $inp.prop('spellcheck', params.spellcheck);
      params.tabindex && $inp.attr('tabindex', params.tabindex);
      params.width && $tf.width(params.width) && $inp.width(params.width);
      params.cls && $tf.addClass(params.cls);
      params.helper && $tf.find('.mdl-textfield__helper').text(params.helper);
      !params.resize && tpl_type === 'textarea' && $inp.addClass('no-resize');

      params.appendTo && $tf.appendTo(params.appendTo);
      params.prependTo && $tf.prependTo(params.prependTo);

      window.componentHandler.upgradeElement(tf);

      params.disabled && tf.MaterialTextfield.disable();
      params.hidden && $tf.hide();

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
        if (tpl_type === 'textarea' && params.resize) $clear.css('right', 16);
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
      params.value = params.value.trim();
      params.value && setValue(params.value);

      if (params.data) {
        attr = {};
        _.each(params.data, function(dv, dn) {
          attr['data-'+dn] = dv;
        });
        $tf.attr(attr);
      }

      params.hidden && $tf.hide();

      if (tpl_type === 'textarea' && !params.resize) {
        $(window).resize(_.debounce(regrowText, 300));
      }

      return $tf;

      function setValue(value) {
        const isDisabled = $tf.is('.is-disabled');
        const isReadonly = $inp.is('[readonly]');
        tf.MaterialTextfield.input_.value = value;
        tf.MaterialTextfield.updateClasses_();
        const isValid = value && !isDisabled && !isReadonly;
        $clear && $clear[isValid ? 'show' : 'hide']();
        $inp.css({paddingRight: isValid && params.clear ? 32 : 0}); // reduce input size for clear button
        regrowText();
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
      function regrowText() {
        if (tpl_type === 'textarea' && !params.resize) {
          $inp.height('auto');
          _.defer(function () {
            $inp.height($inp[0].scrollHeight);
          });
        }
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
            _.isFunction(_.get(params, 'on.loaded')) && params.on.loaded(data.inst);
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
            _.isFunction(_.get(params, 'on.loaded')) && params.on.loaded(data.inst);
          },
          'select_node.jstree': function(event, data) {
            _.isFunction(_.get(params, 'on.select')) && params.on.select(_.get(data, 'rslt.obj'));
          },
          'open_node.jstree': function(event, data) {
            var $node = _.get(data, 'rslt.obj');
            _.isFunction(_.get(params, 'on.open')) && params.on.open($node, data.inst);
          },
          'close_node.jstree': function(event, data) {
            var $node = _.get(data, 'rslt.obj');
            _.isFunction(_.get(params, 'on.close')) && params.on.close($node, data.inst);
          },
          'search.jstree': function(event, data) {
            _.isFunction(_.get(params, 'on.search')) && params.on.search(data.rslt, data.inst);
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

        _.isFunction(_.get(params, 'on.select')) && params.on.select.call(null, target, tabData);
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
     * @param {String?} params.titlePosition
     * @param {boolean?} params.titleLarge
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
      params.mini && $btn.addClass('mdl-button--mini-icon');
      params.zIndex && $btn.css('zIndex', params.zIndex);

      // append right icon and wrap label
      if (params.iconRight) {
        if (params.iconRight !== 'spinner') {
          $iconRight = $(TEMPLATES.icon({ icon: params.iconRight })).addClass('mdl-button__icon-right')
        }
        else {
          $btn.find('.mdl-button__label').css('paddingRight', 10)
          $iconRight = window.material.spinner({ single: true, active: true }).addClass('mdl-button__icon-right')
          // $iconRight = window.material.progress({indeterminate:true}).width(120).height(2).css('top', '-2px')
        }
        $btn.append($iconRight)
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
        const title = params.title + (params.keyCode ? ' (' + params.keyCode + ')' : '');
        $tooltip = $(TEMPLATES.tooltip(params.attr)).text(title).appendTo($btn);
        if (params.titlePosition) $tooltip.addClass('mdl-tooltip--' + params.titlePosition);
        if (params.titleLarge) $tooltip.addClass('mdl-tooltip--large');
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
        !_.get(params, 'upload.multiple') && $upload.prop('multiple', false);
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
          $btn.trigger('click');
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
      params.mini && $fab.addClass('mdl-button--mini-fab');
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
      const $el = $('#' + params.id)
      $el
        //.removeClass('mfb-component--br')
        .css('position', 'absolute')
        .offset(mfbOffset);

      $wrapper = $el.find('.mfb-component__wrap');

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
     * @param {(number|string)?} params.width - drawer width
     * @param {boolean?} params.overlay - show overlay or not
     * @param {array?} params.list - menu items
     * @param {array?} params.groups - grouped menu items
     * @param {boolean?} params.open - start with open drawer
     * @param {boolean?} params.mini - start with mini drawer
     * @param {(array|boolean)?} params.breakpoints - set automatic view mode on resize
     * @param {*} params.trigger - element to trigger open state
     * @param {string?} params.keyCode - mousetrap to toggle open state
     * @param {Object?} params.on - callback methods
     * @param {Function?} params.on.breakpoint - callback on breakpoint change
     * @param {Function} params.on.select - callback on select item
     * @param {Function} params.on.action - callback on select item action
     * @param {Function} params.on.open - callback on open drawer
     * @param {Function} params.on.close - callback on close drawer
     * @param {boolean?} params.toggle - prepend a drawer mode toggle group
     * @param {(boolean|Object)?} params.search - append input to drawer title for search operations
     * @param {string?} params.search.placeholder - set placeholder text for search input
     * @param {Object?} params.offset - define drawer offset
     * @param {Number?} params.offset.top - offset top
     * @param {Number?} params.offset.bottom - offset bottom
     * @param {boolean?} params.right - create drawer on right side
     * @param {boolean?} params.tooltip - show tooltip
     * @param {boolean?} params.fixed - create fixed drawer
     * @param {string?} params.class - class names to add
     * @param {Object?} params.defaultwidth?
     * @param {Number?} params.defaultwidth.mini? - drawer width in mini mode
     * @param {Number?} params.defaultwidth.fixed? - drawer width in fixed mode
     * @return {Object}
     */
    drawer: function(params){
        params = $.extend({}, DEFAULTS.drawer, params)

        $(TEMPLATES.drawer(params)).appendTo('body')

        const $drawer = $('.mdl-drawer').addClass(params.class)
        const $overlay = $('.mdl-drawer-overlay')
        const dheight = params.offset.top === 0 && params.offset.bottom === 0
            ? '100%'
            : 'calc(100% - ' + (params.offset.top + params.offset.bottom) + 'px)'
        const width = params.mini ? params.defaultwidth.mini : params.width || params.defaultwidth.fixed
        const tx = params.right ? width : -width

        let drawerMode
        let cbp

        $drawer.css({
            position: 'fixed',
            top: params.offset.top,
            bottom: params.offset.bottom,
            width,
            height: dheight,
            transform: `translateX(${tx}px)`
        })
        if (params.right) $drawer.css({right: 0, left: 'unset'})

        const $menu = $(TEMPLATES.list()).appendTo($drawer)

        if (params.search) {
            const $search = $('<div class="mdl-layout-search"/>')
            $drawer.find('.mdl-layout-title').after($search)
            window.material.textfield({
                appendTo: $search,
                label: params.search.placeholder || 'Durchsuche Einträge...',
                width: '100%',
                on: {
                    key: searchList,
                    value: searchList
                }
            })
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

        if (_.size(params.groups)) addGroups(params.groups)
        if (_.size(params.list)) addList(params.list)

        $menu.find('.mdl-list__item').attr('tabindex', '-1').css({
            cursor: 'pointer'
        })

        if (params.keyCode && _.isObject(window.Mousetrap)) {
            FN.register_keycode(params.keyCode, params.keyCodeDescr);
            window.Mousetrap.bind(params.keyCode, toggleDrawer);
        }

        $(params.trigger).on('click', toggleDrawer)
        $overlay.on('click', function () {
            closeDrawer()
        })

        $menu
            .on('click.mdl-drawer', '.mdl-list__item', function () {
                const action = $(this).data('action')
                if (_.isFunction(params.on.select)) {
                    params.on.select(action)
                    return false
                }
                _.isFunction(action.callback) ? action.callback() : _.open(action)
            })
            .on('click.mdl-drawer', '.mdl-list__item-secondary-action', function () {
                const action = $(this).closest('.mdl-list__item').data('action')
                if (_.isFunction(params.on.action)) {
                    params.on.action.call(this, action)
                    return false
                }
                _.isFunction(action.callback) ? action.callback() : _.open(action)
            })

        if (params.breakpoints) {
            $(window).resize(_.debounce(resizeHandler, 600));
            resizeHandler();
        }

        params.open && openDrawer()

        return {
            $drawer,
            groups: addGroups,
            list: addList,
            open: openDrawer,
            close: closeDrawer
        }

        function addGroups(groups, header) {
            $menu.empty()
            if (header) $menu.append($('<h2/>').addClass('mdl-list__group-header').text(header))
            _.each(groups, function (gr) {
                $menu.append($('<h3/>').addClass('mdl-list__header').text(gr.title))
                addList(gr.list)
            })
        }
        function addList(list) {
            let $item
            let itemId
            _.each(list, function (li, i) {
                itemId = li.id || _.uniqueId('mdl-list-item-')
                li.action = li.action || ''
                li.subtitle = li.subtitle || ''
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
                $item.attr('id', itemId)
                if (li.cls) $item.addClass(li.cls)
                // if (!li.action) $item.find('.mdl-list__item-secondary-content').remove();
                if (li.color) {
                    $item.find('.mdl-list__item-avatar').css({backgroundColor: li.backgroundColor, color: li.color});
                }
                li.active && $item.addClass('is-active')
                if (i === list.length - 1 || li.divider) $item.addClass('mdl-menu__item--full-bleed-divider')
                if (li.badge) {
                    $item.find('.mdl-list__item-avatar.material-icons').addClass('mdl-badge').attr('data-badge', li.badge);
                }
                $menu.append($item)
                if (params.tooltip && li.body) {
                    window.material.tooltip({
                        id: itemId,
                        title: li.title + ': ' + li.body,
                        cls: 'mdl-tooltip--right'
                    })
                }
            })
        }

        // open drawer and handle events (key navigation, click to outside to close)
        function openDrawer() {
            if ($drawer.is('.is-visible')) return false

            const $items = $menu.find('.mdl-list__item')
            let curli = 0

            setDrawerToggle()

            // TODO create param for content container
            //  create param for min-width
            const $layoutContent = $('.mdl-layout__content')
            if (params.fixed && params.right && $layoutContent.width() > 1600) {
                $layoutContent.css({marginRight: width})
            }
            // show overlay only when drawer is not fixed
            else {
                params.overlay && $overlay.addClass('is-visible')
            }
            $drawer.css('transform', 'translateX(0)').addClass('is-visible')

            // $items.eq(curli).trigger('focus');

            $(document).on('click.mdl-drawer', function () {
                // all other modes stays open
                drawerMode === 'hide' && closeDrawer();
            })

            // TODO use keydown events only when focus is in drawer
            $drawer.on('keydown.mdl-drawer', function (event) {
                (event.key === 'Escape') && closeDrawer()
                if (event.key === 'ArrowDown') {
                    if (curli < $items.length) {
                        $items.eq(++curli).trigger('focus')
                    }
                }
                else if (event.key === 'ArrowUp') {
                    if (curli > 0) {
                        $items.eq(--curli).focus()
                    }
                }
                else if (event.key === 'Enter') {
                    $items.eq(curli).trigger('click')
                }
            })

            if (params.on.open) params.on.open()

            return false
        }

        function closeDrawer(event) {
            if (!$drawer.is('.is-visible')) return false

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

            $(document).off('.mdl-drawer')
            if (params.fixed) {
                $('.mdl-layout__content').css({marginRight: 0})
            }
            $drawer
                .off('.mdl-drawer')
                .css('transform', `translateX(${tx}px)`)
                .removeClass('is-visible')
            $overlay.removeClass('is-visible')
            setDrawerToggle()

            if (params.on.close) params.on.close()

            return false
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
            const width = window.innerWidth
            const bp = _.find(params.breakpoints, function (b) {
                return width > b
            })
            if (_.isFunction(params.on.breakpoint)) {
                params.on.breakpoint(bp, cbp, params, function (mode) {
                    toggleMode(mode)
                })
            }
            else {
                if (width > params.breakpoints[0]) {
                    toggleMode('maxi')
                }
                else if (width > params.breakpoints[1]) {
                    toggleMode('fixed')
                }
                else if (width > params.breakpoints[2]) {
                    toggleMode('mini')
                }
                else {
                    toggleMode('hide')
                }
            }
            cbp = bp
        }

        function searchList(term) {
            const $items = $menu.find('.mdl-list__item')
            if (!term) {
                $items.show()
                return
            }

            let action
            let stext
            $items.each(function () {
                action = $(this).data('action')
                stext = (action.title + action.body).toLowerCase()
                stext.indexOf(term) === -1 ? $(this).hide() : $(this).show()
            })
            // TODO hide empty groups
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
     * @param {Object?} params
     * @param {(String|HTMLElement|JQuery)} params.appendTo
     * @param {(String|HTMLElement|JQuery)} params.prependTo
     * @param {Boolean} params.singleLine
     * @param {Boolean} params.singleCheckbox
     * @param {Boolean} params.singleRadio
     * @param {Boolean} params.threeLine
     * @param {Number} params.lines
     * @param {Array} params.items
     * @returns {*|HTMLElement}
     */
    list: function(params){
        params = $.extend({}, DEFAULTS.list, params)
        const $list = $(TEMPLATES.list())
        let $item

        // singleline      params [{ title, avatar }]
        // twoline         params [{ title, avatar, body, action }]
        // threeline       params [{ title, avatar, body, action, subtitle }]
        // singleCheckbox  params [{ title, id, avatar, checked }]
        // singleRadio     params [{ title, id, avatar, name, value, checked }]
        let itemTemplate = 'listItemTwoLine'
        if (params.singleLine) itemTemplate = 'listItemIconSingle'
        if (params.lines === 3) itemTemplate = 'listItemThreeLine'
        if (params.threeLine) itemTemplate = 'listItemThree'
        if (params.singleCheckbox) itemTemplate = 'listItemCheckbox'
        if (params.singleRadio) itemTemplate = 'listItemRadio'
        _.each(params.items, function (li) {
            li.avatar = li.avatar || ''
            li.action = li.action || ''
            if (li.checked) li.checked = 'checked' // force attribute string for checked
            else li.checked = ''
            $list.append(
                $item = $(TEMPLATES[itemTemplate](li)).data('item', li)
            )
            if (typeof li.action !== 'undefined' && li.action) $item.attr('data-action', li.action)
            if (li.action) $item.find('.mdl-list__item-secondary-action').removeClass('hidden')
            if (li.disabled) $item.find('input').prop('disabled', true)
        })
        //$list.find('.mdl-list__item-secondary-action').eq(1).addClass('mdl-list__item-secondary-action--highlighted');

        params.appendTo && $list.appendTo(params.appendTo)
        params.prependTo && $list.prependTo(params.prependTo)

        return $list
    },

    /**
     * Material Card.
     *
     * @param {Object} params
     * @return {jQuery} card
     */
    card: function(params){
      let $card;

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
     * Material Modal Dialog.
     * @param {Object} params
     * @param {(String|HTMLElement|JQuery)} params.appendTo
     * @param {String} params.title
     * @param {String} params.subtitle
     * @param {(String|Function|Object)} params.content
     * @param {(String|HTMLElement|JQuery)} params.$content
     * @param {(Number|String)} params.width
     * @param {String} params.cls - add class attribute
     * @param {Boolean} params.open
     * @param {Number} params.timeout
     * @param {String} params.agree
     * @param {Boolean} params.agreeColored? - set colored class to agree button
     * @param {Boolean} params.agreeDisabled? - set agree button to disabled
     * @param {String} params.disagree
     * @param {Boolean} params.destroy - remove element on close
     * @param {Object} params.ajax
     * @param {String} params.ajax.url
     * @param {Object} params.fab
     * @param {Number} params.fullwidth
     * @param {Boolean} params.submitOnReturn
     * @param {Boolean} params.closeOnEsc
     * @param {Boolean} params.actionBorder - set border top for dialog actions
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
      params.cls && $dlg.addClass(params.cls);
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
      const $actions = $dlg.find('.mdl-dialog__actions')
      if (!params.actionBorder) $actions.removeClass('mdl-dialog--border')
      if (params.agree || params.disagree) {
        const $agree = $actions.find('[data-name=agree]');
        const $disagree = $actions.find('[data-name=disagree]');
        $actions.removeClass('hidden');
        params.agree && $agree.removeClass('hidden');
        params.agreeColored && $agree.addClass('mdl-button--raised mdl-button--colored');
        !params.agreeColored && params.submitOnReturn && $agree.addClass('mdl-button--colored');
        params.disagree && $disagree.removeClass('hidden');
        window.componentHandler.upgradeElement($agree[0]);
        window.componentHandler.upgradeElement($disagree[0]);
        if (params.agreeDisabled) $agree[0].MaterialButton.disable();
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
        const $fab = $(params.fab);
        const dlgCss = {
          width: $dlg.width(),
          height: $dlg.height(),
          margin: 'auto',
          top: '',
          left: '',
          borderRadius: 0,
          opacity: 1,
          zIndex: $dlg.css('z-index')
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
     * @param {Object=} params?
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
      params = $.extend({}, DEFAULTS.checkbox, params)
      params.id = params.id || _.uniqueId('mdl-checkbox-')
      // for the template we need the string "checked"
      if (_.isBoolean(params.checked) && params.checked === true) {
        params.checked = 'checked'
      }
      else {
        params.checked = ''
      }

      const $cbx = $(TEMPLATES.checkbox(params)) // params: id, label, checked
      const cbx = $cbx.get(0)
      const $inp = $cbx.find('input')

      params.name && $inp.attr('name', params.name)
      params.value && $inp.attr('value', params.value)
      params.cls && $cbx.addClass(params.cls)

      params.appendTo && $cbx.appendTo(params.appendTo)
      window.componentHandler.upgradeElement(cbx)

      params.disabled && cbx.MaterialCheckbox.disable()

      return $cbx
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
     * Material Icon.
     * @param {String} iconName - name of the icon
     * @return {String} html for icon
     */
    icon: function(iconName){
      if (!iconName || !_.isString(iconName)) return '';
      return TEMPLATES.icon({ icon: iconName });
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
     * @param {Object} params
     * @param {(String|HTMLElement|JQuery)} params.appendTo
     * @param {string} params.id
     * @param {string} params.title
     * @param {string} params.cls
     * @param {String?} params.add
     * @returns {HTMLElement|jQuery|undefined}
     */
    tooltip: function(params){
      if (_.isEmpty(params) || !params.id) {
        console.warn('window.material.tooltip: params.id required!')
        return
      }
      if (!params.title) {
        console.warn('window.material.tooltip: params.title required!')
        return
      }

      const $tooltip = $(TEMPLATES.tooltip(params)).html(params.title)
      const tooltip = $tooltip.get(0)
      const $for = $('#'+params.id)
      const for_bcr = $for.length ? $for.get(0).getBoundingClientRect() : {}

      // set tooltip direction class to "top"
      // if element is below half the window height
      if (!params.cls && for_bcr.top > window.innerHeight / 2) {
        params.cls = 'mdl-tooltip--top'
      }

      params.appendTo = params.appendTo || 'body'
      params.cls && $tooltip.addClass(params.cls)
      params.appendTo && $tooltip.appendTo(params.appendTo)

      // bind more elements to the same tooltip
      // this can reduce the number of identical tooltips
      if (params.add) {
        // before we proxy the context, wait for the upgraded component
        $tooltip.one('mdl-componentupgraded', function() {
          // create handler which delegate the events to the original handler
          const myBoundMouseEnterHandler = function(event) {
            this.handleMouseEnter_.call(this, event)
          }
          const myBoundMouseLeaveHandler = function(event) {
            this.hideTooltip_.call(this, event)
          }
          // TODO append touch events (see material.js)
          $(params.appendTo)
            .on('mouseenter', params.add, $.proxy(myBoundMouseEnterHandler, this.MaterialTooltip))
            .on('mouseleave', params.add, $.proxy(myBoundMouseLeaveHandler, this.MaterialTooltip))
        })
      }

      window.componentHandler.upgradeElement(tooltip)

      return $tooltip
    },

    /**
     * Material Dropdown.
     * @param {Object} params
     * @param {(String|HTMLElement|jQuery)} params.appendTo="body" - where to append the dropdown container
     * @param {(String|HTMLElement|jQuery)} params.element? - element for the dropdown (used to get offset and size)
     * @param {(String|HTMLElement|jQuery)} params.parent? - offset parent for the dropdown (used to get offset and size)
     * @param {String?} params.cls? - add class to dropdown
     * @param {Number?} params.offsetX? - add offset to calced left value
     * @param {Number?} params.offsetY? - add offset to calced top value
     * @param {Array} params.items - format = [{label, value, disabled]
     * @param {Object} params.on? - callback handler
     * @param {Function} params.on.click? - on click callback
     * @param {Function} params.on.close? - on close callback
     * @param {Function} params.on.pos? - on pos calculation callback
     * @param {Function} params.on.item? - on each item with item element callback
     * @param {Boolean} params.singleLine? - select single line template
     * @param {Number} params.lines? - select three line template
     * @param {Array} params.list? - list of items to render in dropdown
     * @param {Boolean} params.nowrap? - do not wrap item text
     * @param {Boolean} params.nomax? - do not calc max width
     * @return {jQuery} dropdown element
     */
    dropdown: function(params){
      params = $.extend({}, DEFAULTS.dropdown, params)
      const $dropdown = $('<div/>').addClass('mdl-dropdown').appendTo(params.appendTo)
      const $list = $('<ul/>').addClass('mdl-dropdown__items').appendTo($dropdown)

      if (params.cls) $dropdown.addClass(params.cls)

      if (params.list) {
        // singleline   params [{ title, avatar }]
        // singledetail params [{ title, avatar, hint }]
        // twoline      params [{ title, avatar, body, action }]
        // threeline    params [{ title, avatar, body, action, subtitle }]
        // let itemTemplate = 'listItemTwoLine'
        let itemTemplate = 'listItemIconDetail'
        if (params.singleLine) itemTemplate = 'listItemIconSingle'
        if (params.lines === 3) itemTemplate = 'listItemThreeLine'
        let $item
        _.each(params.list, function(li) {
          $list.append(
            $item = $(TEMPLATES[itemTemplate](li)).data('item', li)
          )
          if (typeof li.action !== 'undefined') $item.attr('data-action', li.action)
          if (li.selected) $item.addClass('is-selected')
          _.isFunction(params.on.item) && params.on.item(li, $item)
        })
      }

      const mdlButton = window.material.button
      _.each(params.items, function(o) {
        $('<li/>').append(mdlButton(o).data('item', o))
          .attr('data-val', o.value)
          .addClass(o.selected ? 'is-selected' : '')
          .appendTo($list)
      })

      if (params.nowrap) $dropdown.find('.mdl-button').css('white-space', 'nowrap')

      $dropdown.on('click', '.mdl-button, .mdl-list__item', function() {
        const item = $(this).data('item')
        _.isFunction(params.on.click) && params.on.click(item)
        if (!item.stay) close()
        return false
      })

      _.clickout({
        selector: $dropdown,
        callback: close
      })

      setPos()
      $dropdown.addClass('is-visible')
      $dropdown.close = close

      return $dropdown

      function close() {
        $dropdown.removeClass('is-visible')
        $dropdown.remove()
        _.isFunction(params.on.close) && params.on.close()
      }
      function setPos() {
        let rect = params.element ? params.element.getBoundingClientRect() : {top: 0, left: 0}
        // offset parent for the dropdown container
        let $parent = params.parent ? $(params.parent) : $(window)
        // height of dropdown menu
        let mheight = $dropdown.height()
        // current bottom y position of the dropdown
        let bottom = $parent.height() - rect.top - mheight
        // take margin / padding into account
        let topgap = rect.height + params.offsetY
        // topgap = parseInt($(params.element).css('paddingTop'), 10) || 0,
        // height of input control
        let iheight = 0
        // iheight = $(this.tf.input_).outerHeight(true),
        // direction up or down
        let ddtop = bottom > 0 ? rect.top + topgap : rect.top - mheight + iheight
        let ddleft = rect.left + params.offsetX
        let onPos

        ddtop += $parent.scrollTop()

        if (_.isFunction(params.on.pos)) {
          onPos = params.on.pos(ddtop, ddleft, params.element, $dropdown)
          if (onPos) {
            ddtop = onPos.top
            ddleft = onPos.left
          }
        }

        // TODO optimize this for left or right aligned menu
        const maxWidth = $parent.width() - ddleft - 16 + $parent.offset().left
        if (!params.nomax && $dropdown.width() > maxWidth) {
          $dropdown.width(maxWidth)
        }

        $dropdown.css({ top: ddtop, left: ddleft })
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

      // $sliderWrapper.height(30);
      $sliderWrapper.height('auto')
      if (params.width) $sliderWrapper.width(params.width)
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

      if (params.input === false) $tf.hide()
      else {
        $slider.width('calc(100% - 100px)');
        $slider.next().width('calc(100% - 112px)').css({marginLeft:76});
      }

      params.scala && buildScala();

      if (params.tooltip) {
        $tooltip = window.material.tooltip({
          id: params.id,
          title: '' + (params.value || '0') + (params.suffix || '')
        });
      }

      $slider.on('change', function() {
        var newValue = this.value;
        tf.input_.value = newValue;// + params.suffix;
        tf.updateClasses_();
        $tooltip && $tooltip.text(newValue + params.suffix);
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
      const found = _.find($('link'), function(el) {
        if (el && el.href && el.href.search(/(Material\+Icons)$/) !== -1) {
          return true;
        }
      })
      // if not found, append link to load Material Icons
      if (_.isUndefined(found)) {
        $('head')
          .append('<link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">')
          // .append('<link rel="stylesheet" href="https://cdn.materialdesignicons.com/2.5.94/css/materialdesignicons.min.css">');
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
     * @param {Boolean} [params.expandable=false] - show header textfield with expandable input and search button
     * @param {Array} [params.gridsize=[2,8]] - set grid cell sizes
     * @param {Boolean} [params.hideSidebar=false] - set sidebar to hidden
     * @param {Object} params.on - callback handler
     * @param {Function} params.on.close
     * @param {Function} params.on.loaded
     * @param {Function} params.on.toggle
     * @return {{$article: JQuery<HTMLElement>|jQuery|HTMLElement, $layout: JQuery<HTMLElement>|jQuery|HTMLElement, $main: JQuery<HTMLElement>|jQuery|HTMLElement, $sidebar: JQuery<HTMLElement>|jQuery|HTMLElement, $content: JQuery<HTMLElement>|jQuery|HTMLElement, close: Function}}
     */
    popup: function(params){
      params = $.extend({}, DEFAULTS.popup, params)
      let
        $layout,
        $article = $(TEMPLATES.article({ title: params.title || '' })),
        $content = $article.find('.material-belt-article-content'),
        $main = $article.find('.material-belt-article-main'),
        $cells = $article.find('.mdl-cell')

      !params.expandable && $article.find('.mdl-textfield--expandable').remove()

      $main.height('calc(100vh - 64px)')
      params.scroll && $article.find('.mdl-layout__header').addClass('mdl-layout__header--scroll')
      // $article.find('.mdl-layout__header').css({ position: 'fixed' });

      const $cell1 = $cells.eq(0).removeClass('mdl-cell--2-col').addClass('mdl-cell--' + params.gridsize[0] + '-col')
      $cells.eq(1).removeClass('mdl-cell--8-col').addClass('mdl-cell--' + params.gridsize[1] + '-col')
      const icon = params.hideSidebar ? 'view_compact' : 'view_stream'
      const $toggleButton = window.material.button({
        prependTo: $article.find('.mdl-layout__header-row'),
        id: _.uniqueId('material-belt-article__toggle-'),
        label: window.material.icon(icon),
        icon: true
      }).css({marginRight: 16}).on('click', toggleSidebar)

      $content.empty()
      if (_.isFunction(params.content)) {
        params.content($content)
      }

      $article.appendTo('body')
      window.componentHandler.upgradeElement($article.get(0))
      $layout = $article.parent().css({ top: 0, zIndex: 4999 }) // NOTE dropdown menus have z-index 9999

      if (_.isFunction(params.on.loaded)) {
        params.on.loaded($article)
      }

      if (_.isFunction(params.on.close)) {
        window.material.button({
            appendTo: $article.find('.mdl-layout__header-row'),
            label: window.material.icon('close'),
            icon: true
          })
          .on('click', function () {
            _.isFunction(params.on.close) && params.on.close($layout)
          })

        $(document).on('keyup.popup', function(event) {
          if (event.key === 'Escape') {
            _.isFunction(params.on.close) && params.on.close($layout);
          }
        })
      }

      params.hideSidebar && $toggleButton.trigger('click')

      return {
        $layout: $layout,
        $article: $article,
        $main: $main,
        $content: $content,
        $sidebar: $cell1,
        close: function() {
          $(document).off('.popup')
          $layout.fadeOut(function() {
            $layout.remove()
          })
        }
      }

      function toggleSidebar() {
        const open = $cell1.is(':visible')
        $cell1[open ? 'hide' : 'show']()
        $toggleButton.find('i').text(open ? 'view_compact' : 'view_stream')
        $content.removeClass('mdl-cell--' + params.gridsize[1] + '-col mdl-cell--12-col')
            .addClass(open ? 'mdl-cell--12-col' : 'mdl-cell--' + params.gridsize[1] + '-col')
        _.isFunction(params.on.toggle) && params.on.toggle(!open)
      }
    },

    /**
     * Material Article Template
     * @return {jQuery}
     */
    article: function(params){
      return $(TEMPLATES.article(params));
    },

    // TODO manage content argument
    /**
     * Material prompt. Predefined dialog for simple agree/disagree confirmation.
     * @param {Object} params
     * @param {*} callback
     */
    dlg: function(params, callback){
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
    },

    /**
     * Return a template.
     * @param templateName
     * @return {*}
     */
    template: function(templateName) {
      return TEMPLATES[templateName]
    }
  }

  //
  // Extend jQuery Effin
  //
  $.fn.extend({
      /**
       * animateCss() - deferred animation from animate.css
       * automatically remove classes after animation end
       * support callback after animation
       * @param {Object} options
       * @param {String} options.animationName
       * @param {Function|String?} options.animationSpeed
       * @param {Function?} options.callback
       * @returns this
       */
      animateCss: function ({animationName = 'bounceInOut', animationSpeed, callback}) {
          // selector with no hits -> always call back
          if (!this.length) {
              _.isFunction(callback) && callback()
              return this
          }

          // remove existing animation classes
          const $el = $(this).attr('class', function () {
              return this.className.replace(/animate__[^ ]*|$/ig, '')
          }).off(ANIMATION_END)
          // build new animation class
          let animationClasses = 'animate__animated animate__' + animationName
          if (_.isString(animationSpeed) && animationSpeed) animationClasses += ` animate__${animationSpeed}`
          // apply classes and wait for animation end
          $el.addClass(animationClasses).one(ANIMATION_END, () => {
              // one doesn't work on two simultan animations on one element
              $el.off(ANIMATION_END).removeClass(animationClasses)
              _.isFunction(callback) && callback.call($el) // set callback context to our element
          })

          return this
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
      imagesLoaded: function (callback) {
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

          $images.on('load.imagesLoaded error.imagesLoaded', imgLoaded).each(function () {
              // cached images don't fire load sometimes, so we reset src.
              var src = this.src;
              // webkit hack from http://groups.google.com/group/jquery-dev/browse_thread/thread/eee6ab7b2da50e1f
              // data uri bypasses webkit log warning (thx doug jones)
              this.src = blank;
              this.src = src;
          });

          return $this;
      }
  })

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
      if (_.isUndefined(action)) return // required

      if (_.isString(action)) {
        action = { href: action }
      }

      const href = action.href || _.get(action, 'bindTo.href')
      const target = action.target || _.get(action, 'bindTo.target')
      let winHandle

      if (!href) return // required

      if (target === '_blank') {
        winHandle = window.open(href)
        if (winHandle) {
          winHandle.opener = winHandle.opener || window.self // secure "opener" for new window is set
          winHandle.location.href = href // set opened url as reference
          winHandle.focus() // try to focus new window
        }
      }
      else {
        window.location.href = href
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
  })

  window.material._VERSION = WATCHDOG.__version
  window.material.DEFAULTS = DEFAULTS

  window.material.TRANSPARENT = 'mdl-layout__header--transparent'
  window.material.COLOR_BLACK = 'mdl-color--black'
  window.material.COLOR_WHITE = 'mdl-color--white'
  window.material.COLOR_DARKGREY = 'mdl-color--grey-800'
  window.material.WHITE_ON_BLUE = 'mdl-color--blue-900 mdl-color-text--white'
  window.material.WHITE_ON_BLACK = 'mdl-color--black mdl-color-text--white'
  window.material.WHITE_ON_DARKGREY = 'mdl-color--grey-800 mdl-color-text--white'
  window.material.WHITE_ON_GREY = 'mdl-color--grey-300 mdl-color-text--white'
  window.material.BLACK_ON_WHITE = 'mdl-color--white mdl-color-text--black'
  window.material.BLACK_ON_GREY = 'mdl-color--grey-300 mdl-color-text--black'
  window.material.BLACK_ON_YELLOW = 'mdl-color--yellow-900 mdl-color-text--black'
  window.material.WHITE_ON_LIGHTBLUE = 'mdl-color--blue-300 mdl-color-text--white'
  window.material.WHITE_ON_LIGHTERBLUE = 'mdl-color--blue-200 mdl-color-text--white'

})(window.jQuery);
