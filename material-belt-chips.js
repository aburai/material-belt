;(function($) {
    'use strict'
    console.assert(typeof window.material !== 'undefined', 'Namespace window.material not defined!')

    window.material = window.material || {}

    // ====== Material Chips ==================================================

    const DEFAULTS = {
        chips: {
            label: '',
            prefix: false,
            duplicates: false,
            inputDebounce: 600
        },
        chip: {
            label: '',
            prefixAction: '',
            prefix: false,
            prefixClass: '',
            action: false,
            actionClass: 'mdl-chip--deletable',
            outlined: false,
            color: 'rgb(222, 222, 222)',
            on: {
                prefix: $.noop,
                action: $.noop,
                edit: $.noop
            }
        }
    }
    const TEMPLATES = {
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
        )
    }

    /**
     * Class Material Chips
     * @param params
     * @constructor MChips
     */
    function MChips(params) {
        this.params = $.extend({}, DEFAULTS.chips, params)
        this.init()
    }

    MChips.prototype.init = function() {
        const params = this.params

        this.$chips = $(TEMPLATES.chips(params)).appendTo(params.appendTo)
        this.$container = this.$chips.find('.mdl-chips__container').addClass(params.cls)
        this.$sync = this.$chips.find('textarea')

        if (params.status) {
            this.$status = $('<div/>').addClass('mdl-chips__status').appendTo(this.$chips)
        }

        this.val(params.value)

        if (params.name) {
            this.$sync.attr('name', params.name)
            if (_.isString(params.value)) this.$sync.val(params.value)
            this.prependAdd()
        }
        else if (params.create) {
            this.prependAdd()
        }
    }

    // add chips value(s)
    // sync with input control
    MChips.prototype.val = function(vals) {
        if (_.isEmpty(vals)) return // nothing to add

        if (_.isString(vals)) {// convert strings to array
            vals = vals.split(' ')
        }

        vals = _.reject(vals, v => !v)
        if (_.isEmpty(vals)) return // nothing to add

        const mchips = this
        if (this.params.chunk && vals.length > this.params.chunk) {
            this.chunks = _.rest(vals, this.params.chunk);
            vals = _.first(vals, this.params.chunk);
        }
        _.each(vals, function(v) {
            mchips.add(v)
        })

        // TODO change color
        // TODO handle action and load more chunks
        if (!_.isEmpty(this.chunks)) {
            mchips.add({ label: 'MORE', action: 'add' })
        }

        this.sync()
    }

    MChips.prototype.add = function(val) {
        if (!val) return

        const mchips = this
        let
            cls,
            pfx,
            pfxClass,
            pfxAction,
            label,
            action,
            actionClass,
            $chip;

        if (_.isObject(val)) {
            label = val.label || val.keyword || '';
            cls = val.cls;
            pfx = val.prefix || label.substr(0, 1);
            pfxClass = val.prefixClass;
            pfxAction = val.prefixAction;
            action = val.action || (val.href ? 'search' : '');
            actionClass = val.actionClass;
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

        const cb = _.get(mchips, 'params.on.action', _.noop).bind(mchips)

        $chip = window.material.chip({
            appendTo: this.$container,
            prefix: this.params.prefix ? pfx : '',
            prefixClass: pfxClass,
            prefixAction: pfxAction,
            label: label,
            action: action,
            actionClass: actionClass,
            dense: this.params.dense,
            onAction: function($c, params) {
                if (cb('action', $c, params)) return

                if (action === 'cancel') {
                    $c.remove();
                    mchips.sync();
                }
                else if (action === 'search') {
                    _.open(val.href);
                }
            }
        }).addClass(cls)

        // console.log(this.$container.find('.mdl-chip').not('.mdl-chip__input-chip').last()[0])
        // this.$container.append($chip);
        // this.$container.find('.mdl-chip').not('.mdl-chip__input-chip').last().after($chip);
        const $last = this.$container.find('.mdl-chip').not('.mdl-chip__input-chip').last()
        if ($last.length) $chip.insertAfter($last)
        else this.$container.append($chip)

        // set label for contains and direct chip access
        if (_.isString(label)) {
            $chip.attr('data-value', label);
        }

        $chip
            .on('click', function () {
                cb('click', $chip, val);
            })
            .on('mouseenter', function () {
                cb('mouseenter', $chip, val);
            })
            .on('mouseleave', function () {
                cb('mouseleave', $chip, val);
            })

        return $chip
    }

    MChips.prototype.prependAdd = function() {
        const mchips = this
        const cb = _.get(mchips, 'params.on.action', _.noop).bind(mchips)
        const $chip = window.material.chip({
            label: '<input class="mdl-chip__input" spellcheck="false"/>',
            action: 'done',
            dense: this.params.dense,
            cls: 'mdl-chip__input-chip',
            onAction: function($c) {
                const $mci = $c.find('.mdl-chip__input');
                const val = $mci.val();
                if (cb('add', $c, val)) return

                $mci.val('');
                mchips.add(val);
                mchips.sync();
            }
        })

        this.$container[this.params.create === 'append' ? 'append' : 'prepend']($chip)

        const $inp = this.$container.find('.mdl-chip__input')
        $inp.width('auto').attr('placeholder', mchips.params.placeholder || 'Neues Stichwort')
        $inp
            .on('keyup', _.debounce(function () {
                cb('input', $chip, this.value);
            }, mchips.params.inputDebounce))
            .on('keydown', function (event) {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    if (cb('add', $chip)) return

                    const $mci = $(this);
                    const val = $mci.val();
                    $mci.val('');
                    mchips.add(val);
                    mchips.sync();
                }
            })
    }

    MChips.prototype.sync = function() {
        let vals = ''

        this.$container.find('.mdl-chip').each(function() {
            vals += (vals ? ' ' : '');
            vals += $(this).find('.mdl-chip__text').text();
        })

        this.$sync.val(vals)
    }

    // check value in sync element
    // and checks if chip exists
    MChips.prototype.contains = function(val) {
        if (!_.isString(val)) return false

        const currentValues = ' ' + this.$sync.val() + ' '
        const needle = ' ' + $.trim(val) + ' '
        const chipExists = this.$container.find('[data-value="'+val+'"]').length > 0

        return _.includes(currentValues, needle) && chipExists
    }

    /**
     * Material Chips Component.
     * @namespace material
     * @param {Object} params settings
     * @param {(String|HTMLElement|JQuery)} params.appendTo
     * @param {String} params.color
     * @param {Boolean} params.dense
     * @param {Boolean} params.xsmall
     * @param {Boolean} params.outlined
     * @param {Boolean} params.prefix
     * @param {String} params.prefixClass
     * @param {Function} params.onActionPrefix
     * @param {Boolean} params.action
     * @param {String} params.actionClass
     * @param {Boolean} params.actionDisabled
     * @param {Boolean} params.editable
     * @param {Object} params.on
     * @param {Function} params.on.prefix
     * @param {Function} params.on.action
     * @return {MChips} new Material Chips instance
     */
    window.material.chips = params => new MChips(params)

    window.material.chip = params => {
        params = $.extend({}, DEFAULTS.chip, params)

        const $chip = $(TEMPLATES.chip(params)) // params: prefixAction, prefix, label, action
        let $prefixAction
        let $action

        if (params.color) $chip.css({background: params.color})
        if (params.cls) $chip.addClass(params.cls)
        if (params.dense || params.small) $chip.addClass('mdl-chip--dense')
        if (params.xsmall) $chip.addClass('mdl-chip--xsmall')
        if (params.outlined) $chip.addClass('mdl-chip--outlined')

        if (params.prefix) {
            $chip.addClass('mdl-chip--contact')
            $chip.find('.mdl-chip__contact')
                .addClass(params.prefixClass)
                .removeClass('hidden')
        }

        if (params.prefixAction) {
            $chip.css('paddingLeft', 4)
            $prefixAction = $chip.find('.mdl-chip__action-prefix')
                .removeClass('hidden')
                .attr('tabindex', '-1')
            $prefixAction.on('click', function() {
                _.isFunction(params.onActionPrefix) && params.onActionPrefix($chip)
                params.on.prefix($chip)
                return false
            })
        }

        if (params.action) {
            $chip.addClass(params.actionClass)
            $action = $chip.find('.mdl-chip__action').not('.mdl-chip__action-prefix')
                .removeClass('hidden')
                .attr('tabindex', '-1')
            params.actionDisabled && $action.addClass('disabled')
            $action.on('click',function() {
                _.isFunction(params.onAction) && params.onAction($chip, params)
                params.on.action($chip, params)
                return false
            })
        }

        params.appendTo && $chip.appendTo(params.appendTo)

        if (params.editable) {
            $chip.on('click', function () {
                const $text = $(this).find('.mdl-chip__text')
                const text = $text.text()

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
                })
            })
        }

        return $chip
    }
})(window.jQuery)
