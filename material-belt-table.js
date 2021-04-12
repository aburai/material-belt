;(function($) {
    'use strict'
    console.assert(typeof window.material !== 'undefined', 'Namespace window.material not defined!');

    window.material = window.material || {}

    // ====== Material Table ====================================================

    const DEFAULTS = {
        wrap: false,
        dense: false,
        selectable: false,
        shadow: false,
        fixedHeader: true
    }

    /**
     * Class Material Table
     * @param params
     * @constructor MTable
     */
    function MTable(params) {
        this.params = $.extend({}, DEFAULTS, params)
        this.$table = $('<table/>')
        this.table = this.$table.get(0)

        this._init()
    }

    MTable.prototype._init = function () {
        const mtable = this
        const $thr = $('<tr/>')

        this.$table
            .width('100%')
            .addClass('mdl-data-table mdl-js-data-table')

        this.params.shadow && this.$table.addClass('mdl-shadow--2dp')
        this.params.selectable && this.$table.addClass('mdl-data-table--selectable')
        this.params.wrap && this.$table.addClass('mdl-data-table--wrap')
        this.params.dense && this.$table.addClass('mdl-data-table--dense')

        this.$thead = $('<thead/>')

        $thr.appendTo(this.$thead)
        this.$thead.appendTo(this.$table)
        const $appendTo = $(this.params.appendTo)
        if ($appendTo.length) this.$table.appendTo($appendTo.css({position: 'relative'}))

        // create table header
        _.each(this.params.th, function (h) {
            const isObject = _.isObject(h)
            let
                txt = !isObject ? h : h.label,
                num = !isObject ? false : h.numeric,
                cls = num ? '' : 'mdl-data-table__cell--non-numeric ',
                $th,
                cellWidth = !isObject ? 0 : h.width;

            if (isObject && h.center) cls += 'mdl-data-table__cell--icon-center '
            if (isObject && h.sort) cls += 'mdl-data-table__header--sorted-descending '
            $th = $('<th/>').addClass(cls).appendTo($thr)
            if (isObject && h.icon) {
                window.material.button({
                    label: window.material.icon(h.icon),
                    icon: true,
                    title: h.title,
                    appendTo: $th,
                    disabled: h.disabled
                })
            }
            else if (txt) $th.text(txt)
            if (cellWidth) $th.width(cellWidth)
        })

        this.$tbody = $('<tbody/>').appendTo(this.$table)

        _.each(this.params.td, function (row) {
            mtable.addRow(row)
        })

        window.componentHandler.upgradeElement(this.table)

        if (this.params.selectable) {
            this.$thead.find('th').first().width(32)
        }
        if (this.params.fixedHeader && $appendTo.length) {
            this.$headclone = $('<table/>')
                .width('calc(100% - 8px)') // TODO calc 8px = scrollbar width
                .addClass(this.$table.attr('class'))
                .addClass('mdl-data-table__fixed-header')
                .append(this.$thead.clone())
                .hide()
                .insertBefore($appendTo)

            this.$headclone.find('thead tr > th:first').remove()

            this.tableHeadClone = this.$headclone[0]
            window.componentHandler.upgradeElement(this.tableHeadClone)

            // sync table header cell width
            this.syncHeader()

            let isFixed = false
            const $hc = this.$headclone
            $hc.on('change', '.mdl-data-table__select .mdl-checkbox__input', event => {
                const isChecked = event.target.checked
                this.toggle(this.table.MaterialDataTable.headerCheckbox, !isChecked)
                this.$tbody.find('.mdl-data-table__select.mdl-checkbox').each((i, el) => {
                    this.toggle(el, !isChecked)
                })
                _.isFunction(mtable.params.on.change) && mtable.params.on.change.call(this, isChecked)
            })
            const _throttledScrollHandler = _.throttle(event => {
                const scrollTop = event.target.scrollTop
                if (scrollTop) {
                    if (!isFixed) {
                        isFixed = true
                        $appendTo.css({marginTop: 32})
                        this.syncHeader()
                        $hc.show()
                    }
                }
                else if (isFixed) {
                    isFixed = false
                    $hc.hide()
                    $appendTo.css({marginTop: 0})
                }
            }, 100)
            $appendTo[0].addEventListener('scroll', _throttledScrollHandler, {passive: true})
            const _debouncedResizeHandler = _.debounce(() => {
                this.syncHeader()
            }, 300)
            window.addEventListener('resize', _debouncedResizeHandler, {passive: true})
        }

        this._bind()
    }

    MTable.prototype._bind = function () {
        const mtable = this
        this.$table.on('click.mdl-table', '.mdl-button', function () {
            const $this = $(this)
            const $tr = $this.parents('tr:first')
            const index = mtable.$tbody.children().index($tr)
            const data = mtable.params.td[index]
            _.isFunction(mtable.params.on.action) && mtable.params.on.action.call(this, $tr, data, index)
        })
        if (this.params.selectable) {
            this.$tbody.on('change.mdl-table', '.mdl-data-table__select .mdl-checkbox__input', function () {
                const $this = $(this)
                const checked = $this.is(':checked')
                const $tr = $this.parents('tr:first')
                const index = mtable.$tbody.children().index($tr)
                const data = mtable.params.td[index]
                const payload = [{$tr, data, index, checked}]
                _.isFunction(mtable.params.on.change) && mtable.params.on.change.call(this, payload)
            })
            this.$thead.on('change', '.mdl-data-table__select', function () {
                const isChecked = $(this).is('.is-checked')
                _.isFunction(mtable.params.on.change) && mtable.params.on.change.call(this, isChecked)
            })
        }
    }

    MTable.prototype.addRow = function (data) {
        if (!_.isArray(data)) return

        const $tr = $('<tr/>')

        let $td
        let cell
        let num
        let icon
        let checkbox
        let cls
        let cellWidth
        let color

        if (this.params.selectable) {
            // data.unshift({checkbox:true});
        }

        _.each(data, function (td) {
            const isObject = _.isObject(td)
            cell = !isObject ? td : td.content || ''
            num = !isObject ? false : td.numeric
            icon = !isObject ? false : td.icon
            checkbox = !isObject ? false : td.checkbox
            color = !isObject ? false : td.color
            cls = num ? '' : 'mdl-data-table__cell--non-numeric'
            cellWidth = !isObject ? 0 : td.width

            $td = $('<td/>').appendTo($tr)

            if (!cell && checkbox) {
                window.material.checkbox({
                    appendTo: $td,
                    cls: 'mdl-data-table__select'
                })
            }
            else if (!cell && icon) {
                if (td.button !== false) {
                    window.material.button({
                        appendTo: $td,
                        label: window.material.icon(icon),
                        icon: true
                    });
                }
                else $td.append(window.material.icon(icon))
                cellWidth = 32
                cls = 'mdl-data-table__cell--icon-center'
                if (icon === 'warning') {
                    cls += ' mdl-color-text--yellow-700';
                }
            }
            else if (td && td.spinner) {
                $td.append(TEMPLATES.spinner())
                cls = 'mdl-data-table__cell--icon-center'
            }
            else if (color) {
                $td.append($('<span/>').css('backgroundColor', color))
                cls += ' mdl-data-table__cell-color'
            }
            else $td.append(cell)

            if (isObject && td.cls) cls += ' ' + td.cls
            $td.addClass(cls)
            if (isObject && td.key) $tr.attr('data-key', td.key === true ? td.content : td.key)

            cellWidth && $td.width(cellWidth)
        })

        _.isFunction(this.params.on.beforeRow) && this.params.on.beforeRow.call(this, $tr, data)

        $tr.appendTo(this.$tbody)

        $tr.find('.mdl-js-spinner').each(function () {
            window.componentHandler.upgradeElement(this)
            $(this).addClass('is-active')
        })

        return $tr
    }

    MTable.prototype.rows = function () {
        return this.$tbody.children('tr')
    }

    MTable.prototype.syncHeader = function () {
        _.defer(() => {
            const hasCheckbox = !!this.params.selectable
            const $headCells = this.$headclone.find('thead tr > th')
            this.$thead.find('tr > th').each((i, el) => {
                const $el = $(el)
                let width = $el.width()
                if (hasCheckbox) {
                    if (i === 0) width = 32
                    else width = this.params.th[i - 1].width || width
                }
                else {
                    width = this.params.th[i].width || width
                }
                if (width > 0) {
                    $el.width(width)
                    $headCells.eq(i).width(width)
                }
            })
        })
    }

    MTable.prototype.toggle = function (el, checked) {
        const mcbx = el ? el.MaterialCheckbox : null
        if (mcbx) mcbx[checked ? 'uncheck' : 'check']()
    }
    MTable.prototype.toggleAll = function () {
        const ohcbx = this.table.MaterialDataTable.headerCheckbox.MaterialCheckbox
        const isChecked = ohcbx.inputElement_.checked
        this.toggle(this.table.MaterialDataTable.headerCheckbox, isChecked)
        this.toggle(this.tableHeadClone.MaterialDataTable.headerCheckbox, isChecked)
        this.$tbody.find('.mdl-data-table__select').each((i, el) => {
            this.toggle(el, isChecked)
        })
    }

    MTable.prototype.clear = function () {
        this.rows().remove()
    }

    /**
     * Material Table Component.
     * @namespace material
     * @param {Object} params
     * @param {(String|HTMLElement|JQuery)} params.appendTo
     * @param {Array} params.th
     * @param {Array} params.td
     * @param {Boolean} params.wrap
     * @param {Boolean} params.dense
     * @param {Boolean} params.selectable
     * @param {Boolean} params.shadow
     * @return {MTable} the table element
     */
    window.material.table = params => {
        return new MTable(params)
    }
})(window.jQuery)
