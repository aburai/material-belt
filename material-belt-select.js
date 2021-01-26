;(function($) {
    'use strict'
    console.assert(typeof window.material !== 'undefined', 'Namespace window.material not defined!')

    window.material = window.material || {}

    // ====== Material Select ==================================================

    const DEFAULTS = {
        label: '',
        padded: true,
        bottomMenu: true
    }

    /**
     * Class Material Select
     * @param params
     * @constructor MSelect
     */
    function MSelect(params) {
        this.params = $.extend({}, DEFAULTS, params)
        this.init()
    }

    MSelect.prototype.init = function() {
        const msel = this
        const params = this.params
        const $wrapper = $('<div/>').addClass('mdl-select')
        const $sync = $('<select/>').addClass('hidden').appendTo($wrapper)
        const selected = _.find(params.options, o => o.selected)
        const $tf = window.material.textfield({
                appendTo: $wrapper,
                label: params.label,
                value: !_.isUndefined(selected) ? selected.label : '',
                disabled: false,
                readonly: true,
                clear: false,
                helper: params.helper
            })
        const $arrow = $(window.material.icon('keyboard_arrow_down'))
        const $dropdown = $('<div/>').addClass('mdl-select__dropdown')
        const $options = $('<ul/>').addClass('mdl-select__options').appendTo($dropdown)

        if (params.parent) $dropdown.appendTo(params.parent)
        else $dropdown.appendTo(!params.inline ? 'body' : $wrapper)

        $wrapper.data('instance', this) // bind instance to select wrapper element

        params.appendTo && $wrapper.appendTo(params.appendTo)
        params.replace && $(params.replace).replaceWith($wrapper)

        this.$element = $wrapper
        this.$sync = $sync
        this.$tf = $tf
        this.tf = $tf.get(0).MaterialTextfield
        this.$dropdown = $dropdown
        this.$list = $options

        if (params.inline && !params.parent) params.parent = $wrapper

        // init value as attribute for default getter
        if (!_.isEmpty(selected)) {
            this.tf.input_.setAttribute('data-val', selected.value)
        }
        params.name && this.$sync.attr('name', params.name)

        // use width from trigger element, if measurable
        if (!params.width && params.trigger) {
            this.$trigger = $(params.trigger)
            if (this.$trigger.is(':visible')) {
                params.width = this.$trigger.width()
            }
        }
        params.width && $tf.width(params.width) && $wrapper.width(params.width)

        params.disabled && $wrapper.addClass('mdl-select--disabled')
        !params.padded && $wrapper.addClass('mdl-select--notpadded') // true by default (formular style)
        $wrapper.append($arrow.addClass('mdl-select__arrow'))
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
        this.bindClickInput()
        this.bindClickOption()

        // debounce = wait 750ms before trigger first event
        $(window).on('resize', _.debounce(function () {
            msel.setPos();
        }, 750))
    }

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
    }
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
    }

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
    }

    MSelect.prototype.prev = function() {
        const value = this.tf.input_.getAttribute('data-val');
        const options = this.params.options;
        const index = _.findIndex(options, {value});
        if (index > 0) this.set(options[index - 1].value);
    }
    MSelect.prototype.next = function() {
        const value = this.tf.input_.getAttribute('data-val');
        const options = this.params.options;
        const index = _.findIndex(options, {value});
        if (index < options.length - 1) this.set(options[index + 1].value);
    }

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
    }

    MSelect.prototype.bindClickOption = function() {
        var mselect = this;
        mselect.$dropdown.on('click', '.mdl-button', function() {
            var o = $(this).data('option');
            mselect.set(o);
            // wait for ripple effect
            _.delay($.proxy(mselect, 'close'), 200);
            return false;
        });
    }

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
    }

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
    }

    MSelect.prototype.open = function() {
        if (this.$dropdown.is('.is-visible')) { return; }

        this.$element.addClass('is-open');
        // this.resize();
        this.$dropdown.css('opacity', 0).addClass('is-visible');
        this.setPos();
        this.bindKeyboard();
    }

    MSelect.prototype.close = function() {
        if (!this.$dropdown.is('.is-visible')) { return; }

        this.$element.removeClass('is-open');
        this.$dropdown.removeClass('is-visible');
        this.$dropdown.off('keydown');
        $(document).off('click.mselect');// unbind eventlistener
        this.params.on && _.isFunction(this.params.on.close) && this.params.on.close();
    }

    MSelect.prototype.enable = function() {
        this.$element.removeClass('mdl-select--disabled');
    }

    MSelect.prototype.disable = function() {
        // textfield is readonly
        this.$element.addClass('mdl-select--disabled');
    }

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
            if (bottom > 0) ddtop += rect.height
            else ddtop -= rect.height
            ddtop += $parent.scrollTop()
        }

        // TODO check floating label for top?
        this.$dropdown.css({top: ddtop, left: ddleft}).animate({opacity: 1}, 300);
    }

    // recalc minimal width of select (ex. after options changed)
    MSelect.prototype.resize = function() {
        const $arrow = this.$element.find('.mdl-select__arrow');
        let sw = this.params.width;
        sw = sw || this.$list.parent().width() + ($arrow.is(':visible') ? $arrow.width() : 0);
        this.$tf.width(sw);
        // this.$dropdown.css('minWidth', sw);
    }

    MSelect.prototype.focus = function() {
        this.tf.input_.focus();
    }

    /**
     * Material Select Component.
     * @namespace material
     * @param {Object} params
     * @param {(String|HTMLElement|JQuery)} params.appendTo
     * @param {(String|HTMLElement|JQuery)} params.parent
     * @param {(String|HTMLElement|JQuery)} params.trigger
     * @param {(String|HTMLElement|JQuery)} params.replace
     * @param {Boolean} params.disabled
     * @param {Boolean} params.padded
     * @param {Boolean} params.inline
     * @param {Number} params.width
     * @return {MSelect} the select class
     */
    window.material.select = params => {
        return new MSelect(params)
    }

    /**
     * Convert existing "select" elements to Material Select Component.
     * @param {(String|HTMLElement|JQuery)} selector
     * @param {Object} params
     * @param {(String|HTMLElement|JQuery)} params.appendTo
     * @param {String} params.name
     * @param {String} params.label
     * @param {String} params.parent
     * @param {Boolean} params.disabled
     * @param {Boolean} params.padded
     * @param {Number} params.width
     * @return {[]}
     */
    window.material.selectFrom = (selector, params = {}) => {
        const rslt = []
        const $sels = $(selector)
        if (!$sels.length) return rslt

        $sels.each(function () {
            const $this = $(this)
            const $sel = $this.closest('select').hide()
            const $opts = $this.find('option')
            const opts = []
            $opts.each(function () {
                const $o = $(this)
                opts.push({
                    value: this.value,
                    label: this.innerText,
                    menu: $o.data('menu'),
                    selected: $o.is(':selected'),
                    disabled: $o.is(':disabled')
                })
            })
            rslt.push(window.material.select({
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
            }))
        })
        return rslt
    }
})(window.jQuery)
