/**
 * Borderlayout Belt - v1.2.5 (c) 2013,2017; aburai
 *
 * @file layout.js
 * @author André Bunse (aburai@github.com) <andre.bunse@gmail.com>
 * @version 1.2.5
 * @license licensed under MIT
 * @requires jQuery, Underscore, Motley
 */
/**
 * Closure Core
 * @param {jQuery} $ jQuery Library
 * @param {_} _ Underscore
 * @param {Motley} motley Motley Namespace
 */
;(function ($, _, motley) {/*global Meny */
  'use strict';

  var
  WATCHDOG = {
    __version: '1.2.5',
    __build: '@BUILD@',
    __buildDate: '@BUILDDATE@'
  },

  _INSTANCES = [],

  _def = {
    create: {
      sreg: 'n-,s-',// north, center, south (Header and Footer) (no padding)
      theme: 'holo',
      menyHeader: '',
      menyList: '',
      onResize: $.noop,
      on: {
        resize: $.noop
      }
    },
    north: {
      size: 40
    },
    south: {
      size: 80
    }
  },
  _tpl = {
    // TODO why? min-height:200px;
    wrapper: '<section style="position:relative;width:100%;height:100%;"></section>',
    material: {
      content: '<div class="layout-theme-material ui-layout-mask-inside-pane" '+
        'data-role="content" role="main"></div>'
    },
    holo: {
      // params: -
      content: '<div class="layout-theme-holo ui-layout-mask-inside-pane" '+
        'data-role="content" role="main">' +
        '</div>',
      toolbar: '<menu class="ui-layout-appbar motley-reset">'+
        '<ul class="ui-layout-appbar-buttons"></ul>'+
        '</menu>',
      // params: icon, title
      toolbarButton: '<li>'+
        '<span class="batch-wrapper">'+
          '<i class="batch batch-<%= icon %> <%= size %>" title="<%= title %>" data-action="<%= icon %>"></i>'+
        '</span>'+
        '<span class="charm-title roboto-bold"><%= title %></span>'+
        '</li>'
    },
    dark: {
      content: '<div class="layout-theme-dark ui-layout-mask-inside-pane" '+
        'data-role="content" role="main"></div>',
      toolbar: '<menu class="ui-layout-appbar motley-reset">'+
        '<ul class="ui-layout-appbar-buttons"></ul>'+
        '</menu>',
      // params: icon, title
      toolbarButton: '<li><a href="#">'+
        '<span class="batch-wrapper">'+
          '<i class="batch batch-<%= icon %> rounded <%= size %>"></i>'+
        '</span>'+
        '</a>'+
        '<span class="charm-title roboto-bold"><%= title %></span>'+
        '</li>'
    },
    white: {
      content: '<div class="layout-theme-white ui-layout-mask-inside-pane" '+
        'data-role="content" role="main"></div>',
      toolbar: '<menu class="ui-layout-appbar motley-reset">'+
        '<ul class="ui-layout-appbar-buttons"></ul>'+
        '</menu>',
      // params: icon, title
      toolbarButton: '<li><a href="#">'+
        '<span class="batch-wrapper">'+
          '<i class="batch batch-<%= icon %> rounded <%= size %>"></i>'+
        '</span>'+
        '</a>'+
        '<span class="charm-title roboto-bold"><%= title %></span>'+
        '</li>'
    },
    transparent: {
      content: '<div class="layout-theme-transparent ui-layout-mask-inside-pane" '+
      'data-role="content" role="main"></div>',
      toolbar: '<menu class="ui-layout-appbar motley-reset">'+
        '<ul class="ui-layout-appbar-buttons"></ul>'+
        '</menu>',
      // params: icon, title
      toolbarButton: '<li><a href="#">'+
        '<span class="batch-wrapper">'+
          '<i class="batch batch-<%= icon %> rounded <%= size %>"></i>'+
        '</span>'+
        '</a>'+
        '<span class="charm-title roboto-bold"><%= title %></span>'+
        '</li>'
    },
    menylist: '<ul class="motley-menu">'+
      '<li><a class="profile" href="#" data-action="profile"><i class="batch batch-person"></i>Edit Profile</a></li>'+
      '<li class="selected"><a class="messages" href="#" data-action="messages"><i class="batch batch-envelope"></i>Messages <em>5</em></a></li>'+
      '<li><a class="settings" href="#" data-action="settings"><i class="batch batch-gear"></i>App Settings</a></li>'+
      '<li><a class="logout" href="#" data-action="logout"><i class="batch batch-signout"></i>Logout</a></li>'+
      '</ul>',
    // params: label
    sketch: _.template('<div class="layout__sketch"><div class="layout__sketch-label"><%= label %></div></div>')
  },

  _jb = {},
  _jd = {
    defaults: {
      layoutButtons: {
        isBig: false,
        isButton: true,
        type: 'bs'
      }
    }
  },

  // ==========================================================================
  //     Private Methods
  // ==========================================================================
  //
  // -
  //
  _fn = {
    //
    // map region shortcuts
    // (n=north, w=west, e=east, s=south)
    //
    getRegion: function(reg){
      switch(reg[0]||'c') {
        case 's': return 'south';
        case 'n': return 'north';
        case 'w': return 'west';
        case 'e': return 'east';
        case 'c': return 'center';
      }
    },
    // map regions to directions
    getDirection: function(clz){
      var dir = '';
      if(clz.indexOf('-west') !== -1) { dir = 'left'; }
      if(clz.indexOf('-east') !== -1) { dir = 'right'; }
      if(clz.indexOf('-north') !== -1) { dir = 'up'; }
      if(clz.indexOf('-south') !== -1) { dir = 'down'; }
      return dir;
    }
  };

  //
  // Layout Instance.
  //
  function Layout(selector, params, callback){
    this.$app     = $(selector);// the wrapper container for the border layout
    console.assert(this.$app.length, 'Layout: invalid selector!');

    this.params   = params;
    this.settings = {};// settings for every single region / direction (north, west, east, south)
    this.dom      = {};// DOM element cache
    this.flags    = {};// layout flags (completed)
    this.store    = {};// local storage region settings
    this.callback = _.bind(callback, this);// callback to trigger when layout completed

    this._init();
  }

  Layout.DEFAULTS = {
    sreg: 'n-,s-',// north, center, south (Header and Footer) (no padding)
    theme: 'holo',
    menyHeader: '',
    menyList: '',
    flags: {
      store: true,
      overlay: false
    },
    onResize: $.noop,
    on: {
      resize: $.noop
    }
  };

  Layout.prototype = {
    //
    // Initialize Layout instance.
    //
    _init: function(){
      var layout = this;

      layout.params = $.extend(true, {}, Layout.DEFAULTS, layout.params);// layout params extended with defaults
      layout.flags  = layout.params.flags;

      // check layout id
      layout.id = _INSTANCES.length+1;
      layout.$app.data('layId', layout.id);

      // ensure we have a valid and unique layout name
      layout.name = layout.params.name || 'layout-'+layout.id;

      if (layout.params.name && layout.flags.store && _.store) {
        layout.store = _.store.get('borderlayout.'+layout.params.name, {});
      }

      layout._parse();

      // create wrapper element
      layout.$wrapper = $(_.template(_tpl.wrapper)()).addClass(layout.name||'').appendTo(layout.$app);

      // append theme content wrapper
      // set application main frame to instance
      layout.$app = (layout.params.theme ? $(_tpl[layout.params.theme].content).appendTo(layout.$wrapper) : layout.$wrapper);

      layout.background(layout.params.bgImage);
      layout._directions();
      layout._build();
    },

    //
    // Parse Layout Container for inline settings.
    //
    _parse: function(){
      var
      layout = this,
      lay = layout.$app.attr('data-layout'),
      idx;

      if (lay && _.isString(lay)) {
        layout.$app.removeAttr('data-layout');
        if (_.isFunction($.fn.metadata)) {
          layout.settings = $.metadata.get(layout.$app[0], { type: 'class' });
        }
        idx = lay.indexOf(':');
        layout.params.sreg = lay.substring(idx+1);
        // currently only type "b" for borderlayout is supported
        //laytype = lay.substring(0, idx);
      }
    },

    //
    // Build Layout Elements.
    //
    _build: function(){
      var layout = this;

      layout._afterEach = _.after(layout.laydirs.length, $.proxy(layout, '_layout'));

      // build layout regions
      _.each(layout.laydirs, $.proxy(layout, 'add'));

      // append overlay container
      if (layout.flags.overlay) {
        layout.dom.$ovly = _.overlay(layout.$app, {
          imgWidth: 30
        });
      }
    },
    _subcontrols: function(divAdd, dir){
      var layout = this;
      // pop first argument (center)
      var da = _.first(divAdd), adds = _.drop(divAdd);

      // set layout container as default inlay
      // some shortcuts create own inlay container
      layout.$inlay = layout.$lyd;

      $.when(
        // decode the shortcuts
        layout._insertShortcuts(adds, dir),
        // insert auto append templates
        layout._autoAppend(da)
      )
      .then(layout._afterEach);
    },

    //
    // Build UI Layout.
    //
    _layout: function(){
      var layout = this, params = layout.params, options;

      //
      // copy settings from store to layout region settings
      //
      if (!_.isEmpty(layout.store)) {
        _.each(layout.store, function(v, k) {
          layout.settings[k] = layout.settings[k] || {};
          layout.settings[k].initClosed = !v;
        });
      }

      //
      // build the layout options object
      //
      layout.options = _.extend({
        name: params.name,
        resizable: false,

        fxName: 'slide',
        fxSpeed: 600,

        spacing_open: params.spacing_open || 0,
        spacing_closed: params.spacing_closed || 0,

        center__onresize: function(){
          _.isFunction(params.on.resize) && params.on.resize.apply(layout, arguments);
        },
        onopen_start: function(dir/*$pane, state, settings, layoutId*/){
          var s = layout.settings[dir];
          if(s.slideOnOpen) {
            //console.log('on open start', arguments);
            //this.$app.data('layout').slideOpen(dir);
            //return 'abort';
          }
          _.func(params.on.open_start).apply(layout.$app.data('layout'), arguments);
        },
        onopen_end: function(dir, $pane, state, settings, layName){
          //_.func(params.on.open).apply(layout.$app.data('layout'), arguments);
          if (layout.flags.store) {
            layout.store[dir] = true;
            _.store && _.store.set('borderlayout.'+layName, layout.store);
          }
        },
        onclose: function(/*dir, $pane, state, settings, layoutId*/){
          //_.func(params.on.close).apply(layout.$app.data('layout'), arguments);
        },
        onclose_end: function(dir, $pane, state, settings, layName){
          if (layout.flags.store) {
            layout.store[dir] = false;
            _.store && _.store.set('borderlayout.'+layName, layout.store);
          }
        },
        onload_start: function(){
        },
        onload_end: function(lay/*,paneSettings,options,layName*/) {
          // trigger completion
          // and return full layout
          layout._complete(lay);
        }
      }, layout.settings||{});

      //
      // ensure the layout app container is visible
      // otherwise layout creation fail and we get
      // no callback from "onload_end"
      //
      if (layout.$app.is(':hidden')) {
        console.error('layout.$app is hidden!!', layout.$app[0]);
        console.debug('parent', layout.$app.parent().is(':visible'), layout.$app.parent());
        console.debug('dims', _.dims(layout.$app));
        console.debug('visible parent', layout.$app.parents().filter(':hidden'));
      }

      // build the layout
      layout.layout = layout.$app.layout(layout.options);
    },

    //
    // Get Region Shortcuts.
    //
    _directions: function(){
      this.laydirs = this.params.sreg.split(',') || [];
      // insert inner layout regions
      // n = north, s = south, w = west, e = east, c = center
      (this.laydirs.join().indexOf('c') === -1) && this.laydirs.unshift('c');
    },

    //
    // Insert Elements described by shortcuts
    // first char = direction
    // rest = additional element shortcuts
    // "f"  = footer
    // "t"  = toolbar
    // "b"  = button toolbar
    // "m"  = Meny Sidebar
    // "a"  = Application Bar
    // "m"  = Menu Bar (Meny)
    // "-"  = Layout Child Container (no padding)
    // "*"  = Layout Border Box (10px border)
    // "0"  = White Layout Background
    // (Deferred)
    //
    _insertShortcuts: function(adds, dir){
      var layout = this;
      var dfr = $.Deferred();
      var $lyd = layout.$lyd;

      if (_.isEmpty(adds)) { dfr.resolve(); }// no shortcuts to insert
      else {
        _.each(adds, function insertShortcuts(akz){
          var $tb, $ul, cols, colsHtml = '';

          if (akz === 'f') {
            cols = _.go('params.footer.cols', layout);
            if(_.isNumber(cols)) {
              for(var i=0; i<cols; i++) {
                colsHtml += '<td class="layout-table-col-' + i + '" width="' + Math.floor(100/cols) + '%"></td>';
              }
            }
            $lyd.append('<div class="layout-table-wrapper">'+
              '<table class="row-fluid">'+
                '<tbody>' + colsHtml + '</tbody>'+
              '</table>'+
              '</div>'
            );

            // copy references to complete layout object
            layout.settings.addCols = layout.settings.addCols || {};
            layout.settings.addCols[dir] = true;
          }
          else if (akz === 't') {
            $lyd.append('<div class="menu-bar navbar navbar-inverse notheme navbar-static-top"></div>');
            $lyd.find('.menu-bar').load('res/menubar.html', function() {
              // translate new inserted controls
              _.sub('once:translationLoaded', function() {
                $.global.translate('.i18n');
              });
              // check new controls for breakpoints
              _.breakpoints.refresh();
            });
          }
          else if (akz === 'a') {
            $lyd.append('<div class="app-bar navbar padded"></div>');
            $lyd.find('.app-bar').load('res/appbar.html', function() {
              // translate new inserted controls
              _.sub('once:translationLoaded', function() {
                $.global.translate('.i18n');
              });
              // check new controls for breakpoints
              _.breakpoints.refresh();
            });
          }
          // Meny
          else if (akz === 'm') {
            $lyd.append(motley.belt.templates.meny(layout.params));
            layout.settings.addMeny = true;
          }
          else if (akz === 'b') {
            $tb = $(_tpl[layout.params.theme].toolbar()).appendTo($lyd);
            if (!_.isEmpty(layout.params.toolbar)) {
              $ul = $tb.find('ul');
              _.each(layout.params.toolbar, function(btn) {
                btn.size = (layout.params.small ? '' : 'large');
                $(_tpl[layout.params.theme].toolbarButton(btn)).prependTo($ul);
              });
              layout.settings.addSouthBar = $ul;
            }
          }
          // Remove inner layout padding
          else if (akz === '-') {
            $lyd.addClass('layout-child-container');
          }
          else if (akz === '*') {
            layout.$inlay = $('<div/>').addClass('layout-border-box').appendTo($lyd);
          }
          else if (akz === '0') {
            layout.$inlay.addClass('layout-theme-holo');
          }
          else {
            console.warn('akz', akz);
          }
        });
        dfr.resolve();
      }

      return dfr.promise();
    },

    //
    // Add Region depending elements.
    // Check Region Background Image.
    //
    // append inlay elements
    // TODO how to find new $lyd container
    // last child of inlay elements
    // or use fix classifier
    // (Deferred)
    //
    _autoAppend: function(dir){
      var layout = this;
      var dfr = $.Deferred();
      var ldir = _fn.getRegion(dir), $inlay = layout.$inlay;

      if (_.go('bgImage', layout.settings[ldir])) {
        _.dom.image({
          appendTo: $inlay,
          src: _.go('bgImage', layout.settings[ldir]),
          data: { width: 1181, height: 788 },
          bgImage: true,
          cover: true,
          blur: 10
        });
      }

      var append = _.go('append.'+ldir, layout.params, '<div></div>');
      if (!append) {
        dfr.resolve();
      }
      else {
        // load HTML file
        if (append.search(/^load:/) === 0) {
          append = append.replace('load:', '');
          $inlay.load(append, dfr.resolve);
        }
        else {
          // can be a valid selector to move
          // or a HTML string to append new
          $(append).appendTo($inlay);
          //_.defer(dfr.resolve);
          dfr.resolve();
        }
      }

      return dfr.promise();
    },

    //
    // Set Layout to Complete.
    // Append Layout Belt Properties to UI Layout Object.
    //
    // Work after "onload_end" of Layout
    //
    _complete: function(lay){
      var layout = this;

      lay.panes.wrapper = layout.$wrapper;

      // initialize meny for this layout?
      if (layout.settings.addMeny) {
        lay.meny = _.layout.meny(layout.$app, { nocreate: true });
      }

      _.delay(function() {
        // add properties for table cols
        if (!_.isEmpty(layout.settings.addCols)) {
          _.each(layout.settings.addCols, function(t, dir) {
            if (lay[dir]) {
              lay[dir].cols = lay[dir].cols || [];
              lay.panes[dir].find('table tr:eq(0) > td').each(function() {
                lay[dir].cols.push(this);
              });
            }
          });
        }

        if (layout.settings.addSouthBar) {
          lay.south.toolbar = layout.settings.addSouthBar;
          lay.panes.toolbar = layout.settings.addSouthBar;
        }

        // append overlay container to layout panes
        if (layout.flags.overlay) {
          lay.panes.overlay = layout.dom.$ovly;
        }

        _.func(layout.callback)(lay);
      }, 200);
    },

    //
    // Add Layout Direction.
    //
    add: function(divDir){
      var layout = this;
      var dir, cls = '', dcls = '';

      dir = _fn.getRegion(divDir);
      if (_def[dir]) {
        layout.settings[dir] = _def[dir];
      }
      if (layout.params[dir]) {
        layout.settings[dir] = $.extend({}, layout.settings[dir], layout.params[dir]);
      }

      //
      // check for keys with dir+"__" (ex. "south__size": 40 -> "south: { size: 40 }")
      // convert them to dot notation
      //
      _.each(layout.settings, function(value, key) {
        // TODO remove _.so dependency
        // TODO check settings with __ (like south__initHidden: true)
        if (key.search(new RegExp(dir+'__')) !== -1) {
          _.so(key.replace('__', '.'), value, layout.settings);
          delete layout.settings[key];
        }
      });

      //
      // build layout classes
      //
      cls += 'layout-no-border ui-layout-' + dir;
      if (!_.go('scrollable', layout.params[dir])) { cls += ' layout-no-scroll'; }
      else { cls += ' layout-scroll'; }
      if (!layout.params.noBox) { cls += ' layout-box'; }
      dcls = layout.settings[dir] ? layout.settings[dir].cls : '';
      switch(dcls) {
        case 'WoDG': dcls = _.material.WHITE_ON_DARKGREY; break;
        case 'WoB': dcls = _.material.WHITE_ON_BLACK; break;
        case 'BoY': dcls = _.material.BLACK_ON_YELLOW; break;
        default: dcls = dcls || 'transparent'; break;
      }
      cls += ' ' + dcls;

      // append direction wrapper
      layout.$lyd = $('<div/>').addClass(cls).appendTo(layout.$app);

      layout._subcontrols(divDir, dir);
    },

    //
    // Set Region Background Element.
    //
    //
    // set global background image
    // spaned over all layout regions
    //
    background: function(src){
      if (!src || !_.isString(src)) { return; }// wrong source format

      var layout = this;
      var $bgImage;

      layout.$wrapper.css({ border: '2px solid rgba(0, 0, 0, 0.85)' });

      $bgImage = $('<div class="layout-flexbox absolute"/>').appendTo(layout.$wrapper);
      console.log('set background image', $bgImage, src);

      _.dom.image({
        appendTo: $bgImage,
        src: src,
        data: { width: 1181, height: 788 },
        bgImage: true,
        cover: true,
        blur: 5,
        fadeIn: true,
        fadeInTime: 400
      });
    }
  };

  // ====================================
  //      Defining underscore.layout
  // ====================================

  _.layout = {
    //
    // Create a new borderlayout
    // params:
    // - name
    // - onResize
    // - append
    // - menyHeader
    // - menyList
    //
    create: function($app, params, callback){
      if ($app && _.isFunction(params) && !callback) {
        callback = params;
        params = null;
      }
      callback = _.func(callback);
      if (!$app && !params) {
        console.info('usage _.layout.create():');
        console.info('arg 0: $app = wrapper container');
        console.info('arg 1: params = layout parameter');
        callback(null);
        return;
      }

      // if (!_.found($app)) {
      //   console.error('could not create borderlayout, wrapper container not valid!', $app);
      //   callback(null);
      //   return;
      // }

      _INSTANCES.push(new Layout($app, params, callback));
    },

    //
    // Empty all layout regions
    // Remove created wrapper
    // Call Layout "destroy" method
    //
    destroy: function(lay){
      if (!lay || !lay.panes) { return; }

      _.each(lay.panes, function(pane, name) {
        _.isjQuery(pane) && pane.empty();
        if ('wrapper' === name) { pane.remove(); }
        if ('overlay' === name) { pane.remove(); }
      });
      lay.destroy();
    },

    //
    // Initiate Meny Instance on given container
    //
    // Params:
    // - position             : 'left', ['right', 'top', 'bottom']
    // - width                : 150
    // - threshold            : 20
    // - nocreate             : false
    // - transitionDuration   : '1s' (1000ms)
    // - header
    // - list
    // - content
    //
    // Callbacks:
    // - onOpen
    // - onClose
    // - onAction
    //
    meny: function($container, params, callback){
      if (!_.found($container)) { return; }// invalid container for meny

      params = _.extend({}, {
        position: 'left',
        width: 'phi',
        minWidth: 0,
        maxWidth: 480,
        threshold: 20,
        transitionDuration: '1s',
        nocreate: true,// 22.9.15: change default for extra meny container
        header: '',
        content: '<div class="layout-meny-content"></div>',
        onAction: $.noop,
        onOpen: $.noop,
        onClose: $.noop
      }, params);

      if (!params.nocreate) {
        $container.append(motley.belt.templates.meny({
          menyHeader: params.header,
          menyList: params.list,
          menyContent: params.content
        }));
      }

      var meny, $meny = $container.find('.meny');
      if(!_.found($meny)) { return; }

      // style meny with colorset definition
      _.isString(params.wrapperClass) && $meny.addClass(params.wrapperClass);

      // calculate meny width over "golden ratio"
      if(params.width === 'phi') {
        var phi = _.phi($container.width());
        params.width = Math.min(phi.minor || 150, params.maxWidth);
        params.width = Math.max(params.minWidth, params.width);
      }

      $container.on('click', 'UL.motley-menu LI A', function(e) {
        e.preventDefault();// prevent the default action
        e.stopPropagation;// stop the click from bubbling

        var $this = $(this);
        $this.closest('UL').find('.selected').removeClass('selected');
        $this.parent().addClass('selected');
        _.isFunction(params.onAction) && params.onAction($this.data('action'));
      });

      //
      // Meny.create()
      // returns =>   .open()
      //              .close()
      //              .isOpen()
      //              .addEventListener()
      //              .removeEventListener()
      //
      motley.load('meny', function() {
        meny = Meny.create({
          // The element that will be animated in from off screen
          menuElement: $meny[0],
          // The contents that gets pushed aside while Meny is active
          contentsElement: $container.find('.contents')[0],
          // The alignment of the menu (top/right/bottom/left)
          position: params.position,
          // The width of the menu (when using left/right position)
          width: params.width,
          // The threshold element (use to calculate height using left/right position)
          thresholdElement: $container.find('.meny-threshold')[0],
          // [optional] Distance from mouse (in pixel) when menu should open
          threshold: params.threshold
        });

        // trigger event if meny is opened
        meny.addEventListener('open', params.onOpen);
        // trigger event if meny is closed
        meny.addEventListener('close', params.onClose);

        // make the meny visible (prevent FOUC on fill menu)
        $meny.removeClass('invisible');

        _.isFunction(callback) && callback(meny);
      });
    },

    //
    // Add button style to jQuery UI Layout.
    //
    resizerButtons: function(layoutInstance, options, isButton, type){
      var innerButton, buttonClass, dir, psize;

      // downward compatibility
      if (!_.isObject(options)) {
        options = { isBig: options, isButton: isButton, type: type };
      }
      options = $.extend({}, _jd.defaults.layoutButtons, options);

      switch(options.type) {
        case 'jui':
          innerButton = _.template('<span class="ui-icon<%= big %>"></span>', { big: (options.isBig ? ' big-toggler' : '') });
          //$innerButton = $('<span/>').addClass('ui-icon'+(options.isBig ? ' big-toggler' : ''));
          buttonClass = (options.isButton ? 'ui-state-default' : '');
          break;

        case 'bs':// Bootstrap Style
          innerButton = '<i class="batch batch-%s"></i>';
          buttonClass = (options.isButton ? 'btn-inverse' : '');
          break;

        case 'box':// Plugin "Box" Style
          innerButton = '<i class="batch batch-%s small"></i>';
          buttonClass = (options.isButton ? 'box-color-button' : '');
          break;

        case 'f':
          innerButton = '<i class="fi-%s"></i>';
          break;
      }

      layoutInstance.container.find('.ui-layout-toggler').each(function() {// inject toggler graphics
        dir   = _fn.getDirection(this.className);
        psize = ((/^(left|right)$/.test(dir)) ? $(this).width() : $(this).height());

        // set prefix "arrow-" for foundation icons
        if (options.type === 'f') {
          dir = 'arrow-' + dir;
          $(this).css({ backgroundColor: 'transparent' });
        }

        // add Theme Classifier for Resizer Bar
        (options.theme) && $(this).parent().addClass(options.theme);

        if (psize > 12) {
          $(this)
          .addClass(buttonClass)// style toggler as buttons
          // TODO remove _.tie dependency
          .empty().append(_.tie(innerButton, dir));// add primary icon to button
          (true === options.closed) && $(this).children().addClass('hideOnClosed');
          (true === options.open) && $(this).children().addClass('hideOnOpen');
        }
      });
    },
    //
    // Add text to jQuery UI Layout resizer.
    //
    resizerText: function(layoutInstance, params){
      if (!layoutInstance || !params || _.isEmpty(layoutInstance.togglers)) { return; }

      var togglers, $pt;

      togglers = layoutInstance.togglers;

      _.each(params, function(title, pane) {
        if (pane && togglers[pane]) {
          $pt = $('<div class="ui-layout-resizer-title"><span>' + title + '</span></div>')
          .insertBefore($(togglers[pane]));
        }
        else if ('css' === pane && _.isObject(title)) {
          $pt.children('SPAN').css(title);
        }
        (true === params.closed) && $pt.addClass('hideOnClosed');
        (true === params.open) && $pt.addClass('hideOnOpen');

        $pt.css('visibility', 'visible')
        .find('span').css('line-height', $pt.height()+'px');

        // push title above for long titles
        // default: top=25%
        if(title.length > 20) {
          switch(pane) {
            case 'west': $pt.css('top', '35%'); break;
            case 'east': $pt.css('top', '15%'); break;
          }
        }
      });
    },
    //
    // Add Controls as Toolbar.
    //
    resizerBar: function(layoutInstance, params){
      if (!layoutInstance || !params || _.isEmpty(layoutInstance.resizers)) { return; }

      var resizers, $pt, $i, pth;

      resizers = layoutInstance.resizers;

      // insert toolbar icons
      _.each(params, function(controls, pane) {
        if (pane && resizers[pane]) {
          // insert wrapper for the toolbar
          $pt = $('<div class="ui-layout-resizer-bar"></div>').prependTo($(resizers[pane]));

          pth = $pt.height();

          // insert defined controls
          _.each(controls, function(ctrl) {
            if (ctrl.type === 'label') {
              $('<label/>').css({
                margin: '0 5px 0 0',
                lineHeight: pth+'px',
                fontSize: 14,
                fontWeight: 'bold'
              }).addClass('pull-left').text(ctrl.title).appendTo($pt);
            }
            else {
              $i = $('<i class="material-icons" title="'+(ctrl.title||'')+'">'+ctrl.icon+'</i>').appendTo($pt);
              ctrl.url && $i.data('url', ctrl.url);
            }
          });

          $pt.css('visibility', 'visible');
        }
      });

      // bind click event listener
      $('.ui-layout-resizer-bar i').click(function() {
        var $this, open_url;

        $this = $(this);
        open_url = $this.data('url');
        //        console.log('open url', open_url);
        //        open_url && _.window(open_url);
        _.isFunction(params.onClick) && params.onClick(open_url);

        return false;
      });
    },

    //
    // Create meaningful overlays to current layout regions
    //
    sketch: function(arg){
      if (_.isEmpty(_INSTANCES)) {
        console.info('Layout: no instances found!');
        return;
      }

      if (arg === 'off' || arg === false) {
        $('.layout__sketch').remove();
        return;
      }

      _.each(_INSTANCES, function(li) {
        _.each(li.layout.panes, function(pane, key) {
          if (pane) {
            if (key === 'wrapper') {
              //console.log('wrapper');
            }
            else {
              pane.append(_tpl.sketch({ label: li.name + ': ' + key }));
            }
          }
        });
      });
    },

    //
    // Close all layout regions.
    //
    closeAll: function(lay, dirs){
      if (!lay || !_.isFunction(lay.close)) {
        console.warn('_.layout.closeAll(instance): instance required!');
        return;
      }

      (!dirs || dirs.indexOf('n') !== -1) && lay.hide('north');
      (!dirs || dirs.indexOf('w') !== -1) && lay.hide('west');
      (!dirs || dirs.indexOf('e') !== -1) && lay.hide('east');
      (!dirs || dirs.indexOf('s') !== -1) && lay.hide('south');
    }
  };

  _.layout.VERSION = WATCHDOG.__version;

  // Polyfill Motley Belt Methods
  if (typeof _.func === 'undefined') {
    _.func = function(fn){
      return (_.isFunction(fn) ? fn : $.noop);
    };
  }
  if (typeof _.go === 'undefined') {
    _.go = function(parts, create, obj){
      if(parts === undefined) { return parts; }

      var p, def;

      if(typeof parts === 'string') { parts = parts.split('.'); }
      if(typeof create !== 'boolean') {
        def = obj;// use 3. argument as default
        obj = create;// swap obj when not create
        create = undefined;
      }
      obj = obj || window;// create on global as default
      while(obj && parts.length) {
        p = parts.shift();
        if(obj[p] === undefined && create) { obj[p] = {}; }
        obj = obj[p];
      }

      //_.isUndefined(obj) && !_.isUndefined(def) && console.error('SET DEFAULT? getObject', obj, def);
      _.isUndefined(obj) && !_.isUndefined(def) && (obj = def);

      return obj;
    };
  }

  // Load jQuery UI Toolset for Resize Support
  // only load "jui" library, if jQuery is version 2+
  //(/^2/.test($.fn.jquery)) && motley.load('jui');
  //if (_.isUndefined($.fn.draggable)) {
  //  console.warn('motley.borderlayout needs jQuery UI. add motley module "jui"?');
  //}

})(window.jQuery, window._, window.motley);
