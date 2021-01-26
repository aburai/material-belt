;(function ($) {
    'use strict'
    console.assert(typeof window.material !== 'undefined', 'Namespace window.material not defined!');

    window.material = window.material || {}

    // ====== Material Action Bar ===============================================

    const DEFAULTS = {
        appendTo: 'body',
        theme: 'dark',
        noMore: false,
        hideMore: true,
        debug: false
    }
    const TEMPLATES = {
        actionbar: _.template('<div class="mdl-actionbar"></div>')
    }
    // from material-icons to mdi
    // iconName => mdi:name
    const CONVERT_ICON = (el, iconName, callback) => {
        if (!el || !iconName) return // params required
        if (!/^mdi:/.test(iconName)) return // no valid mdi name

        let $el = $(el)
        if (!$el.is('.material-icons')) $el = $el.find('.material-icons')

        $el
            .text('').removeClass('material-icons') // remove stock classifier
            .addClass('mdi mdi-24px ' + iconName.replace(':', '-')) // add mdi classifier

        _.isFunction(callback) && callback($el)
    }

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
        this.params = $.extend({}, DEFAULTS, params)
        this.name = this.params.name || 'mdl-actionbar-' + $.guid++
        this.$element = $(TEMPLATES.actionbar(this.params)).data('instance', this)
        this.actions = {}
        this.callback = callback || $.noop
        this._init()
    }

    ActionBar.prototype._init = function () {
        if (!_.layout) {
            console.error('window.material.actionbar: Borderlayout Belt not found!')
            return
        }

        const ab = this
        const params = this.params
        let fixedKeys
        let fixedGroups
        const layoutParams = {
            name: params.name,
            theme: 'material',
            flags: {store: false},
            on: {
                resize: function () {
                    ab.recalc();
                }
            }
        }

        this.$element.addClass(params.theme === 'dark' ? 'mdl-actionbar--dark' : 'mdl-actionbar--light')
        this.$element.addClass(params.direction === 'vertical' ? 'mdl-actionbar--vertical' : '')

        params.appendTo && this.$element.appendTo(params.appendTo)
        params.prependTo && this.$element.prependTo(params.prependTo)

        if (params.direction !== 'vertical') {
            layoutParams.sreg = 'c-,e-'
            layoutParams.east = {size: 289}
        }
        else {
            layoutParams.sreg = 'c-,s-'
            layoutParams.south = {size: 289}
        }

        _.layout.create(this.$element, layoutParams, function (layout) {
            ab.layout = layout
            ab.$center = layout.panes.center.children().first().addClass('mdl-actionbar__scroll')

            if (params.direction !== 'vertical') {
                ab.$east = layout.panes.east.children().first().addClass('mdl-actionbar__fixed');
            }
            else {
                ab.$south = layout.panes.south.children().first().addClass('mdl-actionbar__fixed');
            }

            !params.noMore && ab.addMore()

            // insert fixed action group
            // show / hide east layout region
            if (!_.isEmpty(params.fixed)) {
                layout.show(params.direction !== 'vertical' ? 'east' : 'south');
                // check fixed group definition
                // if only actions, wrap in group definition
                fixedKeys = _.keys(_.first(params.fixed));
                if (!_.includes(fixedKeys, 'actions')) {
                    fixedGroups = [{id: 'fixed', actions: params.fixed}];
                }
                else {
                    fixedGroups = params.fixed;
                }
                insertGroups(fixedGroups, params.direction !== 'vertical' ? ab.$east : ab.$south);
            }
            else {
                layout.hide(params.direction !== 'vertical' ? 'east' : 'south');
            }

            insertGroups(params.groups, ab.$center)

            ab.recalc()
            ab._bind()

            // TODO not all components are already upgraded
            // this may cause errors if someone use the instance in the callback
            ab.callback(ab)
        })

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
    }

    ActionBar.prototype.destroy = function () {
        // unbind event handler
        this.$element.off('*');
        this.$moreMenu.off('*');
        // remove menus
        $('.mdl-menu[data-uid="' + this.name + '"]').parent().remove();
        // remove tooltips
        $('.mdl-tooltip[data-uid="' + this.name + '"]').remove();
        // remove select dropdowns
        $('.mdl-select__dropdown[data-uid="' + this.name + '"]').remove();
        // call existing destroy methods
        if (this.layout && !this.layout.destroyed) {
            this.layout.destroy();
        }
        // remove outer wrapper
        this.$element.remove();
    };

    // Bind Eventhandler:
    //   Icon Button clicked
    //   Select Button clicked
    //   Select changed
    //   Checkbox toggled / changed
    ActionBar.prototype._bind = function () {
        var
            ab = this;

        // button click handler for normal icon actions
        this.$element.on('click.mdl-actionbar', 'button.mdl-actionbar__item', function () {
            var actionName = $(this).attr('data-action');
            actionName && ab.callAction(actionName, this);
        });

        // button click handler for select+button controls
        this.$element.on('change.mdl-actionbar', '.mdl-actionbar__item > select', function () {
            var
                $item = $(this).parent(),
                action = $item.attr('data-action'),
                $opt = $(this).children(':selected'),
                actionCallback = _.get(ab, 'params.on.action');

            // sync selected option with action in the actionbar
            if (ab.$moreMenu) {
                $('#mi-' + action, ab.$moreMenu)
                    .find('option[value="' + $opt.val() + '"]').prop('selected', true);
            }

            ab.callAction(action, this, {value: $opt.val()});

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
        this.$element.on('click.mdl-actionbar', '.mdl-actionbar__item-button', function () {
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
        this.$element.on('change', '.mdl-actionbar__item .mdl-checkbox__input', function () {
            var $mdlcbx = $(this).parent();
            ab.callAction($mdlcbx.attr('data-action'), $mdlcbx.get(0), {value: this.checked});
        });
        this.$element.on('change', '.mdl-actionbar__item .mdl-switch__input', function () {
            var $toggle = $(this).parents('.mdl-switch');
            ab.callAction($toggle.attr('data-action'), $toggle.get(0).MaterialSwitch);
        });

        // textfield change handler
        this.$element.on('change', '.mdl-actionbar__item .mdl-textfield__input', function () {
            var $tf = $(this).parents('.mdl-textfield');
            ab.callAction($tf.attr('data-action'), $tf.get(0).MaterialTextfield);
        });

        // range change handler
        this.$element.on('change', '.mdl-actionbar__item .mdl-slider', function () {
            var $item = $(this).parents('.mdl-actionbar__item');
            ab.callAction($item.attr('data-action'), this.MaterialSlider);
        });

        if (this.$moreMenu && this.$moreMenu.length) {
            this.$moreMenu
                .on('click.mdl-actionbar', '.mdl-actionbar__more-button', function () {
                    var $this = $(this);
                    if ($this.is('.disabled') || $this.is('[disabled]')) {
                        return false;
                    }

                    ab.callAction($this.data('action'), this);
                })
                // set select in actionbar to selected option from more menu
                .on('change.mdl-actionbar', 'select', function () {
                    var
                        $li = $(this).parents('.mdl-actionbar__more-select'),
                        actionName = $li.data('action'),
                        $action = $('[data-action="' + actionName + '"]', ab.$element),
                        selInst = $action.find('.mdl-select').data('instance');

                    (selInst instanceof MSelect) && selInst.set(this.value);
                })
                .on('click.mdl-actionbar', '.mdl-actionbar__item-button', function () {
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
                .on('click.mdl-actionbar', '.mdl-actionbar__more-select', function (event) {
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
            Mousetrap.bind('* o', function () {
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

    ActionBar.prototype.getButtons = function () {
        const $visibleGroups = this.$center.find('.mdl-actionbar__group')
        return $visibleGroups.find('.mdl-button[data-action]:visible')
            .not(this.$more)
            .not('[disabled]')
    }

    ActionBar.prototype.callAction = function (actionName, context, data) {
        var
            action = this.actions[actionName],
            actionData = _.extend({action: actionName}, data),
            bindTo,
            actionCallback = _.get(this, 'params.on.action');

        if (_.isFunction(actionCallback)) {
            bindTo = _.get(action, 'bindTo') || action;
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
    ActionBar.prototype.addGroup = function (group, $appendTo) {
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
            else if (action.range) {
                ab.addRange(action, $appendTo)
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
    ActionBar.prototype.addIcon = function (action, $appendTo) {
        const ab = this
        const templateIcon = window.material.template('icon')
        const $btn = action.$control = window.material.button({
            appendTo: $appendTo,
            label: action.iconText || templateIcon({icon: action.icon}),
            cls: action.iconText ? 'mdl-actionbar__item--text' : '',
            icon: true,
            title: action.title || action.tooltip,
            data: {uid: ab.name},
            titlePosition: _.get(ab.params, 'tooltips.position') || 'bottom',
            disabled: true// create in disabled mode
        })
            .attr('data-action', action.name)
            .data('name', action.name)
            .addClass('mdl-actionbar__item mdl--left' + (action.hidden ? ' hidden' : ''));

        action.cls && $btn.addClass(action.cls);

        // support Material Design Icons Package
        CONVERT_ICON($btn, action.icon);

        // more menu active?
        // only "clone" enabled actions from a more group
        // TODO hide all disabled actions??
        //if (ab.$moreMenu && !action.disabled && $appendTo.is('.mdl-actionbar__group--more')) {
        if (ab.$moreMenu && $appendTo.is('.mdl-actionbar__group--more')) {
            const templateMenuItem = window.material.template('menuItem')
            let $menuItem
            ab.$moreMenu.append($menuItem = action.$menu = $(templateMenuItem({
                id: 'mi-' + action.name,
                item: action.title || action.iconText,
                icon: action.icon
            })));

            action.cls && $menuItem.addClass(action.cls);

            // support Material Design Icons Package
            CONVERT_ICON($menuItem, action.icon, function ($el) {
                $el.css('top', '3px');
            });

            $menuItem
                .attr('disabled', 'disabled')
                .addClass('mdl-actionbar__more-button disabled')
                .attr('data-action', action.name)
                .children('div:last').width(48);

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
    ActionBar.prototype.addButton = function (action, $appendTo) {
        var
            ab = this,
            $btn,
            $menuItem,
            $badge;

        // remove "title" as tooltip, if data is the same as label
        if (action.label.toLowerCase() === (action.title || '').toLowerCase()) {
            action.title = '';
        }

        $btn = action.$control = window.material.button({
            appendTo: $appendTo,
            label: action.label,
            iconLeft: action.icon,
            title: action.title,
            data: {uid: ab.name},
            upload: action.upload,
            on: {
                upload: function (files) {
                    if (_.isEmpty(files)) {
                        return;
                    }

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
            const templateMenuItem = window.material.template('menuItem')
            ab.$moreMenu.append($menuItem = action.$menu = $(templateMenuItem({
                id: 'mi-' + action.name,
                item: action.label || action.title,
                icon: action.icon
            })));

            $menuItem
                .attr('disabled', 'disabled')
                .addClass('mdl-actionbar__more-button disabled')
                .attr('data-action', action.name)
                .children('div:first')

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
    ActionBar.prototype.addSelect = function (action, $appendTo) {
        const templateButton = window.material.template('button')
        const templateIcon = window.material.template('icon')
        var
            ab = this,
            $selItem = action.$control = $('<div class="mdl-actionbar__item mdl-actionbar__item-select-button mdl--left">' +
                '<select size="1" disabled></select>' +
                (action.button ? templateButton({ label: templateIcon({ icon: action.button }) }) : '') +
                '</div>'
            ).attr('data-action', action.name),
            $sel = $selItem.find('select').data('name', action.name),
            $button = $selItem.find('button').addClass('mdl-actionbar__item-button'),
            button = $button.get(0),
            $noption,
            $menuItem,
            options = [];

        if (action.button) {
            $sel.css({borderTopRightRadius: 0, borderBottomRightRadius: 0});
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

        _.each(action.select, function (opt) {
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
            padded: false,
            label: action.label,
            disabled: action.disabled
        }));
        action.select.$dropdown.attr('data-uid', this.name);
        action.button && action.select.$tf.addClass('mdl-textfield--no-radius-right');

        // add method to change options for actionbar and more menu
        action.options = function (newOptions, clear) {
            var $sel;

            // update actionbar select control
            action.select.options(newOptions, clear);

            // update more menu select
            $sel = action.$menu.find('select').empty();
            _.each(newOptions, function (no) {
                $sel.append(
                    $('<option/>').attr({value: no.value}).text(no.label).prop('selected', no.selected)
                );
            });
        };

        // create select ~ button control in the more menu
        if (ab.$moreMenu && $appendTo.is('.mdl-actionbar__group--more')) {
            const templateMenuItem = window.material.template('menuItem')
            ab.$moreMenu.append($menuItem = action.$menu = $(templateMenuItem({
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
                $appendTo.find('label[for="' + action.name + '"]').clone(),
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

    ActionBar.prototype.addTextfield = function (action, $appendTo) {
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

    ActionBar.prototype.addRange = function (action, $appendTo) {
        action.$control = window.material.slider({
            appendTo: $appendTo,
            value: action.range.value || action.value,
            min: action.range.min,
            max: action.range.max,
            input: action.range.input,
            tooltip: action.range.tooltip || action.tooltip,
            suffix: action.range.suffix || action.suffix,
            width: action.width || 100
        })
            .css({backgroundColor: 'transparent'})
            .attr('data-action', action.name)
            .data('name', action.name)
            .addClass('mdl-actionbar__item mdl-actionbar__range mdl--left' + (action.hidden ? ' hidden' : ''))
            .prop('disabled', action.disabled)
        action.slider = action.$control.find('.mdl-slider').get(0).MaterialSlider
    };

    ActionBar.prototype.addMore = function () {
        var
            moreId = this.name + '-more',
            $appendTo = $(_.get(this, 'params.menu.appendTo', 'body')),
            menuPositionClass;

        // create icon button to show hidden action groups
        this.$more = window.material.button({
            label: window.material.icon('more_vert'),
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

        menuPositionClass = _.get(this, 'params.menu.position') === 'br' ? 'top-right' : 'bottom-right';
        const templateMenu = window.material.template('menu')
        this.$moreMenu = $(templateMenu({id: moreId, cls: 'mdl-actionbar__more-menu mdl-menu--' + menuPositionClass}))
            .attr('data-uid', this.name)
            .appendTo($appendTo);

        window.componentHandler.registerUpgradedCallback('MaterialMenu', function () {
            //console.log('registerUpgradedCallback menu');
        });
        this.$moreMenu.one('mdl-componentupgraded', function () {
            //console.log('mdl-componentupgraded');
        });
        window.componentHandler.upgradeElement(this.$moreMenu.get(0));
    };

    ActionBar.prototype.recalc = function () {
        var
            ab = this,
            eastWidth = 0,
            centerWidth,
            centerPaneWidth;

        if (this.params.direction === 'vertical') {
            return;
        }// TODO

        this.$east.children(':visible').each(function (i, el) {
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
            if (!ab.$moreMenu || !ab.$moreMenu.length) {
                return;
            }

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
            $hg.each(function () {
                // iterate the action bar items
                $(this).find('.mdl-actionbar__item').each(function () {
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

            if (!ab.$moreMenu) {
                return;
            }

            // handle entries in more menu
            $lg.find('[data-action]').each(function () {
                action = this.getAttribute('data-action');
                $('#' + action, ab.$moreMenu).prop('disabled', true);
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
            ab.$center.children(':visible').not('.mdl-actionbar__group-more').each(function (i, el) {
                w = Math.ceil($(el).outerWidth(true));
                cw += w;
                ab.debug && console.log('group width: %d = %d', w, cw);
            });
            ab.debug && console.groupEnd('getCenterWidth');
            return cw;
        }
    };

    ActionBar.prototype.progress = function () {
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
            this.$progress.width((this.progressIndex * 100 / this.progressCount) + '%');
            // hide progress on 100%
            if (this.progressIndex >= this.progressCount) {
                this.$progress.fadeOut();
            }
        }
    };

    // actionBar.enable('import')
    // actionBar.disable(['import', 'export'])
    // actionBar.disable({group:'id'})
    ActionBar.prototype.enable = function (actions) {
        const ab = this;
        actions = ab.getGroupActions(actions)
        _.each(checkActions(actions), function (a) {
            ab._toggle(a);
        });
    };
    ActionBar.prototype.disable = function (actions) {
        const ab = this;
        actions = ab.getGroupActions(actions)
        _.each(checkActions(actions), function (a) {
            ab._toggle(a, true);
        });
    };
    // internal method to toggle control state
    ActionBar.prototype._toggle = function (actionName, disabled) {
        var
            action = this.actions[actionName];

        if (!action) {
            return;
        }// action doesn't exists

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

    ActionBar.prototype.show = function (actions) {
        var ab = this
        actions = ab.getGroupActions(actions)
        _.each(checkActions(actions), function (a) {
            if (ab.actions[a] && ab.actions[a].$control) ab.actions[a].$control.removeClass('hidden')
        })
        ab.recalc()
    };
    ActionBar.prototype.hide = function (actions) {
        var ab = this
        actions = ab.getGroupActions(actions)
        _.each(checkActions(actions), function (a) {
            if (ab.actions[a] && ab.actions[a].$control) ab.actions[a].$control.addClass('hidden')
        })
        ab.recalc()
    };

    // add/remove badge for actionbar controls
    ActionBar.prototype.badge = function (actions) {
        if (_.isEmpty(this.actions)) {
            return;
        }

        var ab = this, action;

        _.each(checkActions(actions), function (a) {
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
    ActionBar.prototype.tooltip = function (actions) {
        if (_.isEmpty(actions) || _.isEmpty(this.actions)) {
            return;
        }

        var ab = this, action, aid;

        _.each(checkActions(actions), function (a) {
            action = ab.actions[a.name];
            aid = action.$control.attr('id');
            $('.mdl-tooltip[for="' + aid + '"]').text(a.title);
        });
    };

    ActionBar.prototype.getGroupActions = function (params) {
        if (_.isObject(params) && params.group) {
            const gid = params.group
            const actions = []
            _.each(this.actions, function (a, ak) {
                if (a.gid === gid) actions.push(ak)
            })
            return actions
        }
        return params
    }

    function ActionBarBuilder() {
        this.groups = [];
    }

    ActionBarBuilder.prototype.group = function (id, actions) {
        this.groups.push({id, actions});
        return this;
    };
    ActionBarBuilder.prototype.icon = function (icon_or_params) {
        const action = _.isString(icon_or_params) ? {icon: icon_or_params} : icon_or_params;
        action.name = action.name || action.icon;
        return action;
    };
    ActionBarBuilder.prototype.checkbox = function (label_or_params) {
        const action = _.isString(label_or_params) ? {label: label_or_params} : label_or_params;
        action.name = action.name || action.label.toLowerCase().replace(/[^A-Z]/ig, '') || _.uniqueId('aba-');
        action.checkbox = true;
        return action;
    };
    ActionBarBuilder.prototype.select = function (options_or_params) {
        const action = Array.isArray(options_or_params) ? {select: options_or_params} : options_or_params;
        action.name = action.name || _.uniqueId('aba-');
        return action;
    };

    ActionBarBuilder.prototype.build = function () {
        return this.groups;
    };

    const ACTIONS = [
        {name: 'create', icon: 'create'},
        {name: 'help', icon: 'help'},
        {name: 'settings', icon: 'settings'},
        {name: 'alarm', icon: 'alarm'},
        {name: 'android', icon: 'android'},
        {name: 'backup', icon: 'backup'},
        {name: 'bookmark', icon: 'bookmark'},
        {name: 'build', icon: 'build'},
        {name: 'copyright', icon: 'copyright'},
        {name: 'daterange', icon: 'date_range'},
        {name: 'eject', icon: 'eject'},
        {name: 'explore', icon: 'explore'},
        {name: 'code', icon: 'code'},
        {name: 'event', icon: 'event'},
        {name: 'favorite', icon: 'favorite'},
        {name: 'extension', icon: 'extension'},
        {name: 'openinnew', icon: 'open_in_new'}
    ];

    ActionBarBuilder.prototype.randomize = function (_size) {
        const randomActions = [];
        _size = _size || 5;
        _.times(_size, function () {
            randomActions.push(_.sample(ACTIONS));
        });
        randomActions.push(this.randomButton())
        randomActions.push(this.randomSelect())
        return _.uniq(randomActions);
    };
    ActionBarBuilder.prototype.randomButton = function () {
        const sample = this.randomize(1);
        sample[0].label = sample[0].name;
        return sample;
    };
    ActionBarBuilder.prototype.randomSelect = function () {
        const sample = this.randomize(1);
        sample[0].button = sample[0].icon;
        sample[0].icon = null;
        sample[0].label = null;
        sample[0].select = [
            {label: 'Test 1', value: 't1', selected: true},
            {label: 'Test 2', value: 't2'},
            {label: 'Test 3', value: 't3'}
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
        if (!Array.isArray(actions)) {
            return [];
        }

        return actions;
    }

    /**
     * Material Actionbar.
     * @namespace material
     * @param {Object} params
     * @param {Function=} callback
     * @return {Promise<ActionBar>}
     */
    window.material.actionbar = (params, callback) => {
        return new Promise(resolve => {
            new ActionBar(params, actionbar => {
                if (_.isFunction(callback)) callback(actionbar)
                resolve(actionbar)
            })
        })
    }

    window.material.actionbarBuilder = params => {
        return new ActionBarBuilder(params)
    }
})(window.jQuery)
