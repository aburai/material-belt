;(function($) {
    'use strict'
    console.assert(typeof window.material !== 'undefined', 'Namespace window.material not defined!')

    window.material = window.material || {}

    // ====== Material Stepper ==================================================

    const DEFAULTS = {
        horizontal: true,
        linear: true,
        alternateLabels: false,
        on: {
            next: $.noop
        }
    }
    const TEMPLATES = {
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
        )
    }

    /**
     * Class Material Stepper
     * @param params
     * @param callback
     * @constructor MStepper
     */
    function MStepper(params, callback) {
        this.params = $.extend({}, DEFAULTS, params)
        this.params.name = this.params.name || _.uniqueId('mdl-stepper-') // unique name required
        this.callback = callback || $.noop
        this._layout(this._init.bind(this))
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
    }

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
    }

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
    }

    MStepper.prototype.back = function() {
        this.MaterialStepper.back();
        //_.isFunction(this.params.on.next) && this.params.on.next(this.getActiveStep());
        this.updateButtons();
    }

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
    }

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
    }

    /**
     * Add new step to stepper.
     * @param params
     * @param idx
     */
    MStepper.prototype.addStep = function(params, idx) {
        const label = _.isString(params) ? params : params.label
        const optional = _.isString(params) ? false : params.optional
        const $step = $(TEMPLATES.stepper({
            icon: idx+1,
            label: label,
            message: optional ? 'Optional' : ''
        })).appendTo(this.$stepper)

        _.isFunction(this.params.on.step) && this.params.on.step({
            $step: $step,
            index: idx
        })

        // check for existing action definitions
        // if no actions found, we hide the action panel
        // and recalc the height of the step content
        const $actions = $step.find('.mdl-step__actions')
        if (!$actions.children().length) {
            $actions.hide();
            $step.find('.mdl-step__content').height('calc(100% - 132px)');
        }
    }

    MStepper.prototype.getActiveStep = function() {
        var
            $active = this.$steps.filter('.is-active'),
            index = this.$steps.index($active);

        return {
            $step: $active,
            index: index
        };
    }

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
    }

    /**
     * Material Steppers Component.
     * @namespace material
     * @see https://material.google.com/components/steppers.html
     * @param {object} params
     * @param {function} callback
     */
    window.material.stepper = (params, callback) => {
        const Stepper = new MStepper(params, callback)
        return {
            next: Stepper.next.bind(Stepper),
            spinner: Stepper.spinner.bind(Stepper),
            alldone: Stepper.alldone.bind(Stepper)
        }
    }
})(window.jQuery)
