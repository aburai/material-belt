/**
 * Material Design Date- & Timepicker - v1.0.3
 *
 * changes / fixes:
 * - scrollIntoViewIfNeeded only supported by chrome
 * - new properties: format { subtitle, titleDay, titleMonth }, overlay: true/false
 * - improved CSS (bigger font size)
 * - keyboard navigation
 */
(function (global, factory) {
	if (typeof define === "function" && define.amd) {
		define(['exports'], factory);
	} else if (typeof exports !== "undefined") {
		factory(exports);
	} else {
		const mod = {
			exports: {}
		};
		factory(mod.exports);
		global.mdDateTimePicker = mod.exports;
	}
})(this, function (exports) {
	'use strict';

	const _ID_CURRENT_YEAR = 'mddtp-date__currentYear'
	const _ID_SELECTED = 'mddtp-date__selected'
	const _CLASS_PICKER_INACTIVE = 'mddtp-picker--inactive'
	const _CLASS_CELL = 'mddtp-picker__cell'
	const _CLASS_SELECTED = 'mddtp-picker__cell--selected'
	const _CLASS_VIEW_LEFT = 'mddtp-picker__view--left'
	const _CLASS_VIEW_RIGHT = 'mddtp-picker__view--right'
	const _CLASS_VIEW_PAUSE = 'mddtp-picker__view--pause'
	const _CLASS_CELL_ROTATE = 'mddtp-picker__cell--rotate24'
	const _CLASS_COLOR_ACTIVE = 'mddtp-picker__color--active'
	const _CLASS_YEAR_INVISIBLE = 'mddtp-picker__years--invisible'
	const _CLASS_BUTTON_DISABLED = 'mddtp-button--disabled'

	Object.defineProperty(exports, "__esModule", {
		value: true
	})

	function _classCallCheck(instance, Constructor) {
		if (!(instance instanceof Constructor)) {
			throw new TypeError("Cannot call a class as a function");
		}
	}

	function _keyboardNavigation(event) {
		event.preventDefault()
		event.stopPropagation()

		const me = this

		if (event.code) {
			switch (event.code) {
				case 'ArrowUp': gotoDate(-7); break;
				case 'ArrowDown': gotoDate(7); break;
				case 'ArrowLeft': gotoDate(-1); break;
				case 'ArrowRight': gotoDate(1); break;
				case 'Tab': me._sDialog[event.shiftKey ? 'left' : 'right'].onclick(); break;
				case 'Enter': me._sDialog.ok.onclick(); break;
				case 'Escape': me._sDialog.cancel.onclick(); break;
				case 'Home': me._sDialog.today.onclick(); break;
			}
		}

		function gotoDate(days) {
			let newDate = document.getElementById(_ID_SELECTED);
			const il = Math.abs(days);
			for (let i = 0; i < il; i++) {
				if (newDate && newDate.nodeName === 'SPAN') {
					newDate = days < 0 ? newDate.previousSibling : newDate.nextSibling;
				}
			}
			if (newDate && newDate.nodeName === 'SPAN' && newDate.classList.contains(_CLASS_CELL)) {
				newDate.click();
			}
		}
	}

	const _createClass = function () {
		function defineProperties(target, props) {
			for (let i = 0, il = props.length; i < il; i++) {
				const descriptor = props[i];
				descriptor.enumerable = descriptor.enumerable || !1;
				descriptor.configurable = !0;
				if ("value" in descriptor) descriptor.writable = !0;
				Object.defineProperty(target, descriptor.key, descriptor);
			}
		}

		return function (Constructor, protoProps, staticProps) {
			if (protoProps) defineProperties(Constructor.prototype, protoProps);
			if (staticProps) defineProperties(Constructor, staticProps);
			return Constructor;
		};
	}()
	const _dialog = {
		view: !0,
		state: !1
	}

	exports.default = function () {
		/**
		 * [constructor of the mdDateTimePicker]
		 *
		 * @method constructor
		 *
		 * @param {Object}  _ref
		 * @param {String}  _ref.type = 'date' or 'time                   [type of dialog]
		 * @param {moment}  _ref.init                                     [initial value for the dialog date or time, defaults to today] [@default = today]
		 * @param {moment}  _ref.past                                     [the past moment till which the calendar shall render] [@default = exactly 21 Years ago from init]
		 * @param {moment}  _ref.future                                   [the future moment till which the calendar shall render] [@default = init]
		 * @param  {Boolean} _ref.mode                                    [this value tells whether the time dialog will have the 24 hour mode (true) or 12 hour mode (false)] [@default = false]
		 * @param {String}  _ref.orientation = 'LANDSCAPE' or 'PORTRAIT'  [force the orientation of the picker @default = 'LANDSCAPE']
		 * @param {element} _ref.trigger                                  [element on which all the events will be dispatched e.g var foo = document.getElementById('bar'), here element = foo]
		 * @param {String}  _ref.ok = 'ok'                                [ok button's text]
		 * @param {String}  _ref.cancel = 'cancel'                        [cancel button's text]
		 * @param {Boolean} _ref.colon = true                             [add an option to enable quote in 24 hour mode]
		 * @param {Boolean} _ref.autoClose = false                        [close dialog on date/time selection]
		 * @param {Boolean} _ref.inner24 = false                          [if 24-hour mode and (true), the PM hours shows in an inner dial]
		 * @param {Object}  _ref.format                                   [{subtitle: "YYYY", titleDay: "dddd, ", titleMonth: "MMMM D"}]
		 * @param {Boolean} _ref.overlay = false
		 *
		 * @return {Object}                                               [mdDateTimePicker]
		 */
		function mdDateTimePicker(_ref) {
			const type = _ref.type,
				_ref$init = _ref.init,
				init = _ref$init === undefined ? moment() : _ref$init,
				_ref$past = _ref.past,
				past = _ref$past === undefined ? moment().subtract(21, 'years') : _ref$past,
				_ref$future = _ref.future,
				future = _ref$future === undefined ? init : _ref$future,
				_ref$mode = _ref.mode,
				mode = _ref$mode === undefined ? !1 : _ref$mode,
				_ref$orientation = _ref.orientation,
				orientation = _ref$orientation === undefined ? 'LANDSCAPE' : _ref$orientation,
				_ref$trigger = _ref.trigger,
				trigger = _ref$trigger === undefined ? '' : _ref$trigger,
				_ref$ok = _ref.ok,
				ok = _ref$ok === undefined ? 'ok' : _ref$ok,
				_ref$cancel = _ref.cancel,
				cancel = _ref$cancel === undefined ? 'cancel' : _ref$cancel,
				_ref$today = _ref.today,
				today = _ref$today === undefined ? 'today' : _ref$today,
				_ref$colon = _ref.colon,
				colon = _ref$colon === undefined ? !0 : _ref$colon,
				_ref$autoClose = _ref.autoClose,
				autoClose = _ref$autoClose === undefined ? false : _ref$autoClose,
				_ref$inner24 = _ref.inner24,
				inner24 = _ref$inner24 === undefined ? false : _ref$inner24;

			_classCallCheck(this, mdDateTimePicker);

			this._type = type;
			this._init = init;
			this._past = past;
			this._future = future;
			this._mode = mode;
			this._orientation = orientation;
			this._trigger = trigger;
			this._ok = ok;
			this._cancel = cancel;
			this._today = today;
			this._colon = colon;
			this._autoClose = autoClose;
			this._inner24 = inner24;
			this._format = _ref.format || {};
			this._overlay = _ref.overlay === true;

			/**
			 * [dialog selected classes have the same structure as dialog but one level down]
			 * @type {Object}
			 * e.g
			 * sDialog = {
			 *   picker: 'some-picker-selected'
			 * }
			 */
			this._sDialog = {};

			// attach the dialog if not present
			if (!document.getElementById('mddtp-picker__' + this._type)) {
				this._buildDialog();
			}
		}

		/**
		 * [time to get or set the current picker's moment]
		 *
		 * @method time
		 *
		 * @param  {moment} m
		 *
		 */
		_createClass(mdDateTimePicker, [{
			key: 'show',
			value: function show() {
				this._selectDialog()
				if (this._type === 'date') this._initDateDialog(this._init)
				else if (this._type === 'time') this._initTimeDialog(this._init)
				this._showDialog()
			}
		}, {
			key: 'hide',
			value: function hide() {
				this._selectDialog();
				this._hideDialog();
			}
		}, {
			key: 'toggle',
			value: function toggle() {
				// work according to the current state of the dialog
				if (mdDateTimePicker.dialog.state) {
					this.hide();
				}
				else {
					this.show();
				}
			}
		}, {
			key: '_selectDialog',
			value: function _selectDialog() {
				this._sDialog.picker = document.getElementById('mddtp-picker__' + [this._type])

				/**
				 * [sDialogEls stores all inner components of the selected dialog or sDialog to be later getElementById]
				 *
				 * @type {Array}
				 */
				const sDialogEls = [
						'viewHolder', 'years', 'header', 'cancel', 'ok', 'left', 'right', 'previous', 'current', 'next', 'subtitle',
						'title', 'titleDay', 'titleMonth', 'AM', 'PM', 'needle', 'hourView', 'minuteView', 'hour', 'minute',
						'fakeNeedle', 'circularHolder', 'circle', 'dotSpan', 'overlay', 'today'
					]

				let	i = sDialogEls.length
				while (i--) {
					this._sDialog[sDialogEls[i]] = document.getElementById('mddtp-' + this._type + '__' + sDialogEls[i])
				}

				this._sDialog.tDate = this._init.clone()
				this._sDialog.sDate = this._init.clone()
			}
		}, {
			key: '_showDialog',
			value: function _showDialog() {
				const me = this
				const zoomIn = 'zoomIn'

				mdDateTimePicker.dialog.state = !0

				this._sDialog.picker.classList.remove(_CLASS_PICKER_INACTIVE)
				this._sDialog.picker.classList.add(zoomIn)

				// if the dialog is forced into portrait mode
				if (this._orientation === 'PORTRAIT') {
					this._sDialog.picker.classList.add('mddtp-picker--portrait');
				}

				setTimeout(function () {
					me._sDialog.overlay && me._sDialog.overlay.classList.add('is-active')
					me._sDialog.picker.classList.remove(zoomIn)
				}, 300)

				// bind keyboard events for navigation
				document.addEventListener('keydown', me.keyboardListener, true)
			}
		}, {
			key: '_hideDialog',
			value: function _hideDialog() {
				var me = this,
					years = this._sDialog.years,
					title = me._sDialog.title,
					subtitle = me._sDialog.subtitle,
					viewHolder = this._sDialog.viewHolder,
					AM = this._sDialog.AM,
					PM = this._sDialog.PM,
					minute = this._sDialog.minute,
					hour = this._sDialog.hour,
					minuteView = this._sDialog.minuteView,
					hourView = this._sDialog.hourView,
					picker = this._sDialog.picker,
					needle = this._sDialog.needle,
					dotSpan = this._sDialog.dotSpan,
					active = _CLASS_COLOR_ACTIVE,
					inactive = _CLASS_PICKER_INACTIVE,
					invisible = _CLASS_YEAR_INVISIBLE,
					zoomIn = 'zoomIn',
					zoomOut = 'zoomOut',
					hidden = 'mddtp-picker__circularView--hidden',
					selection = 'mddtp-picker__selection';

				mdDateTimePicker.dialog.state = !1;
				mdDateTimePicker.dialog.view = !0;
				this._sDialog.picker.classList.add(zoomOut);
				// reset classes
				if (this._type === 'date') {
					years.classList.remove(zoomIn, zoomOut);
					years.classList.add(invisible);
					title.classList.remove(active);
					subtitle.classList.add(active);
					viewHolder.classList.remove(zoomOut);
				}
				else {
					AM.classList.remove(active);
					PM.classList.remove(active);
					minute.classList.remove(active);
					hour.classList.add(active);
					minuteView.classList.add(hidden);
					hourView.classList.remove(hidden);
					subtitle.setAttribute('style', 'display: none');
					dotSpan.setAttribute('style', 'display: none');
					needle.className = selection;
				}
				setTimeout(function () {
					// remove portrait mode
					me._sDialog.picker.classList.remove('mddtp-picker--portrait');
					me._sDialog.picker.classList.remove(zoomOut);
					me._sDialog.overlay && me._sDialog.overlay.classList.remove('is-active');
					me._sDialog.picker.classList.add(inactive);
					// clone elements and add them again to clear events attached to them
					var pickerClone = picker.cloneNode(!0);
					picker.parentNode.replaceChild(pickerClone, picker);
				}, 300);

				// unbind keyboard events for navigation
				document.removeEventListener('keydown', me.keyboardListener, true);
			}
		}, {
			key: '_buildDialog',
			value: function _buildDialog() {
				const type = this._type,
					docfrag = document.createDocumentFragment(),
					container = document.createElement('div'),
					header = document.createElement('div'),
					body = document.createElement('div'),
					action = document.createElement('div'),
					cancel = document.createElement('button'),
					ok = document.createElement('button');

				// outer most container of the picker

				// header container of the picker

				// body container of the picker

				// action elements container

				// ... add properties to them
				container.id = 'mddtp-picker__' + type;
				container.classList.add('mddtp-picker');
				container.classList.add('mddtp-picker-' + type);
				container.classList.add(_CLASS_PICKER_INACTIVE);
				container.classList.add('animated');
				this._addId(header, 'header');
				this._addClass(header, 'header');
				// add header to container
				container.appendChild(header);
				this._addClass(body, 'body');
				body.appendChild(action);
				// add body to container
				container.appendChild(body);

				// add stuff to header and body according to dialog type
				if (this._type === 'date') {
					const subtitle = document.createElement('div'),
						title = document.createElement('div'),
						titleDay = document.createElement('div'),
						titleMonth = document.createElement('div'),
						viewHolder = document.createElement('div'),
						views = document.createElement('ul'),
						previous = document.createElement('li'),
						current = document.createElement('li'),
						next = document.createElement('li'),
						left = document.createElement('button'),
						right = document.createElement('button'),
						years = document.createElement('ul'),
						today = document.createElement('button');

					// inside header
					// adding properties to them
					this._addId(subtitle, 'subtitle');
					this._addClass(subtitle, 'subtitle');
					this._addId(title, 'title');
					this._addClass(title, 'title', [_CLASS_COLOR_ACTIVE]);
					this._addId(titleDay, 'titleDay');
					this._addId(titleMonth, 'titleMonth');
					// today button
					this._addId(today, 'today');
					this._addClass(today, 'today');
					today.classList.add('mddtp-button');
					today.setAttribute('type', 'button');
					// add title stuff to it
					title.appendChild(titleDay);
					title.appendChild(titleMonth);
					// add them to header
					header.appendChild(subtitle);
					header.appendChild(title);
					header.appendChild(today);
					// inside body
					// inside viewHolder
					this._addId(viewHolder, 'viewHolder');
					this._addClass(viewHolder, 'viewHolder', ['animated']);
					this._addClass(views, 'views');
					this._addId(previous, 'previous');
					previous.classList.add('mddtp-picker__view');
					this._addId(current, 'current');
					current.classList.add('mddtp-picker__view');
					this._addId(next, 'next');
					next.classList.add('mddtp-picker__view');

					// fill the views
					this._addView(previous);
					this._addView(current);
					this._addView(next);

					// add them
					viewHolder.appendChild(views);
					views.appendChild(previous);
					views.appendChild(current);
					views.appendChild(next);

					// inside body again
					this._addId(left, 'left');
					left.classList.add('mddtp-button');
					this._addClass(left, 'left');
					left.setAttribute('type', 'button');
					this._addId(right, 'right');
					right.classList.add('mddtp-button');
					this._addClass(right, 'right');
					right.setAttribute('type', 'button');
					this._addId(years, 'years');
					this._addClass(years, 'years', [_CLASS_YEAR_INVISIBLE, 'animated']);

					// add them to body
					body.appendChild(viewHolder);
					body.appendChild(left);
					body.appendChild(right);
					body.appendChild(years);
				}
				else {
					const _title = document.createElement('div'),
						hour = document.createElement('span'),
						span = document.createElement('span'),
						minute = document.createElement('span'),
						_subtitle = document.createElement('div'),
						AM = document.createElement('div'),
						PM = document.createElement('div'),
						circularHolder = document.createElement('div'),
						needle = document.createElement('div'),
						dot = document.createElement('span'),
						line = document.createElement('span'),
						circle = document.createElement('span'),
						minuteView = document.createElement('div'),
						fakeNeedle = document.createElement('div'),
						hourView = document.createElement('div');

					// add properties to them
					// inside header
					this._addId(_title, 'title');
					this._addClass(_title, 'title');
					this._addId(hour, 'hour');
					hour.classList.add(_CLASS_COLOR_ACTIVE);
					span.textContent = ':';
					this._addId(span, 'dotSpan');
					span.setAttribute('style', 'display: none');
					this._addId(minute, 'minute');
					this._addId(_subtitle, 'subtitle');
					this._addClass(_subtitle, 'subtitle');
					_subtitle.setAttribute('style', 'display: none');
					this._addId(AM, 'AM');
					AM.textContent = 'AM';
					this._addId(PM, 'PM');
					PM.textContent = 'PM';
					// add them to title and subtitle
					_title.appendChild(hour);
					_title.appendChild(span);
					_title.appendChild(minute);
					_subtitle.appendChild(AM);
					_subtitle.appendChild(PM);
					// add them to header
					header.appendChild(_title);
					header.appendChild(_subtitle);
					// inside body
					this._addId(circularHolder, 'circularHolder');
					this._addClass(circularHolder, 'circularHolder');
					this._addId(needle, 'needle');
					needle.classList.add('mddtp-picker__selection');
					this._addClass(dot, 'dot');
					this._addClass(line, 'line');
					this._addId(circle, 'circle');
					this._addClass(circle, 'circle');
					this._addId(minuteView, 'minuteView');
					minuteView.classList.add('mddtp-picker__circularView');
					minuteView.classList.add('mddtp-picker__circularView--hidden');
					this._addId(fakeNeedle, 'fakeNeedle');
					fakeNeedle.classList.add('mddtp-picker__circle--fake');
					this._addId(hourView, 'hourView');
					hourView.classList.add('mddtp-picker__circularView');
					// add them to needle
					needle.appendChild(dot);
					needle.appendChild(line);
					needle.appendChild(circle);
					// add them to circularHolder
					circularHolder.appendChild(needle);
					circularHolder.appendChild(minuteView);
					circularHolder.appendChild(fakeNeedle);
					circularHolder.appendChild(hourView);
					// add them to body
					body.appendChild(circularHolder);
				}
				action.classList.add('mddtp-picker__action');

				if (this._autoClose === true) {
					action.style.display = "none";
				}

				// add actions
				this._addId(cancel, 'cancel')
				cancel.classList.add('mddtp-button')
				cancel.setAttribute('type', 'button')
				this._addId(ok, 'ok')
				ok.classList.add('mddtp-button')
				ok.setAttribute('type', 'button')
				action.appendChild(cancel)
				action.appendChild(ok)

				// add actions to body
				body.appendChild(action)
				docfrag.appendChild(container)

				// add the container to the end of body
				document.getElementsByTagName('body').item(0).appendChild(docfrag)

				if (this._overlay) {
					const overlay = document.createElement('div')
					this._addId(overlay, 'overlay')
					document.getElementsByTagName('body').item(0).appendChild(overlay)
				}
			}
		}, {
			key: '_initTimeDialog',
			value: function _initTimeDialog(m) {
				var hour = this._sDialog.hour,
					minute = this._sDialog.minute,
					subtitle = this._sDialog.subtitle,
					dotSpan = this._sDialog.dotSpan;

				// switch according to 12 hour or 24 hour mode
				if (this._mode) {
					// CHANGED exception case for 24 => 0 issue #57
					var text = parseInt(m.format('H'), 10);
					if (text === 0) {
						text = '00';
					}
					this._fillText(hour, text);
					// add the configurable colon in this mode issue #56
					if (this._colon) {
						dotSpan.removeAttribute('style');
					}
				}
				else {
					this._fillText(hour, m.format('h'));
					this._sDialog[m.format('A')].classList.add(_CLASS_COLOR_ACTIVE);
					subtitle.removeAttribute('style');
					dotSpan.removeAttribute('style');
				}
				this._fillText(minute, m.format('mm'));
				this._initHour();
				this._initMinute();
				this._attachEventHandlers();
				this._changeM();
				this._dragDial();
				this._switchToView(hour);
				this._switchToView(minute);
				this._addClockEvent();
				this._setButtonText();
			}
		}, {
			key: '_initHour',
			value: function _initHour() {
				var hourView = this._sDialog.hourView,
					needle = this._sDialog.needle,
					hour = 'mddtp-hour__selected',
					selected = _CLASS_SELECTED,
					rotate = 'mddtp-picker__cell--rotate-',
					docfrag = document.createDocumentFragment(),
					hourNow = void 0;

				if (this._mode) {
					const degreeStep = (this._inner24 === true) ? 10 : 5;
					hourNow = parseInt(this._sDialog.tDate.format('H'), 10);
					for (let i = 1, j = degreeStep; i <= 24; i++, j += degreeStep) {
						const div = document.createElement('div'),
							span = document.createElement('span');

						div.classList.add(_CLASS_CELL);
						// CHANGED exception case for 24 => 0 issue #57
						if (i === 24) {
							span.textContent = '00';
						}
						else {
							span.textContent = i;
						}

						let position = j;
						if (this._inner24 === true && i > 12) {
							position -= 120;
							div.classList.add(_CLASS_CELL_ROTATE);
						}

						div.classList.add(rotate + position);
						if (hourNow === i) {
							div.id = hour;
							div.classList.add(selected);
							needle.classList.add(rotate + position);
						}
						// CHANGED exception case for 24 => 0 issue #58
						if (i === 24 && hourNow === 0) {
							div.id = hour;
							div.classList.add(selected);
							needle.classList.add(rotate + position);
						}
						div.appendChild(span);
						docfrag.appendChild(div);
					}
				}
				else {
					hourNow = parseInt(this._sDialog.tDate.format('h'), 10);
					for (let _i = 1, _j = 10; _i <= 12; _i++, _j += 10) {
						const _div = document.createElement('div'),
							_span = document.createElement('span');

						_div.classList.add(_CLASS_CELL);
						_span.textContent = _i;
						_div.classList.add(rotate + _j);
						if (hourNow === _i) {
							_div.id = hour;
							_div.classList.add(selected);
							needle.classList.add(rotate + _j);
						}
						_div.appendChild(_span);
						docfrag.appendChild(_div);
					}
				}
				// empty the hours
				while (hourView.lastChild) {
					hourView.removeChild(hourView.lastChild);
				}

				// set inner html accordingly
				hourView.appendChild(docfrag)
			}
		}, {
			key: '_initMinute',
			value: function _initMinute() {
				const minuteView = this._sDialog.minuteView
				let	minuteNow = parseInt(this._sDialog.tDate.format('m'), 10)
				const	sMinute = 'mddtp-minute__selected'
				const	rotate = 'mddtp-picker__cell--rotate-'
				const	docfrag = document.createDocumentFragment()

				for (let i = 5, j = 10; i <= 60; i += 5, j += 10) {
					const div = document.createElement('div')
					const	span = document.createElement('span')

					div.classList.add(_CLASS_CELL)
					span.textContent = this._numWithZero(i === 60 ? 0 : i)
					if (minuteNow === 0) minuteNow = 60
					div.classList.add(rotate + j)
					// (minuteNow === 1 && i === 60) for corner case highlight 00 at 01
					if (minuteNow === i || minuteNow - 1 === i || minuteNow + 1 === i || minuteNow === 1 && i === 60) {
						div.id = sMinute
						div.classList.add(_CLASS_SELECTED)
					}
					div.appendChild(span)
					docfrag.appendChild(div)
				}

				// empty the hours
				while (minuteView.lastChild) {
					minuteView.removeChild(minuteView.lastChild)
				}

				// set inner html accordingly
				minuteView.appendChild(docfrag)
			}
		}, {
			key: '_initDateDialog',
			value: function _initDateDialog(m) {
				const subtitle = this._sDialog.subtitle
				const	title = this._sDialog.title
				const	titleDay = this._sDialog.titleDay
				const	titleMonth = this._sDialog.titleMonth
				const	format = this._format

				this._fillText(subtitle, m.format(format.subtitle || 'YYYY'))
				this._fillText(titleDay, m.format(format.titleDay || 'ddd, '))
				this._fillText(titleMonth, m.format(format.titleMonth || 'MMMM D'))

				this._initYear()
				this._initViewHolder()
				this._attachEventHandlers()
				this._changeMonth()
				this._switchToView(subtitle)
				this._switchToView(title)
				this._setButtonText()
			}
		}, {
			key: '_initViewHolder',
			value: function _initViewHolder() {
				const current = this._sDialog.current
				const	previous = this._sDialog.previous
				const	next = this._sDialog.next
				const	past = this._past
				const	future = this._future

				let m = this._sDialog.tDate
				if (m.isBefore(past, 'month')) m = past.clone()
				if (m.isAfter(future, 'month')) m = future.clone()

				this._sDialog.tDate = m
				this._initMonth(current, m)
				this._initMonth(next, moment(this._getMonth(m, 1)))
				this._initMonth(previous, moment(this._getMonth(m, -1)))
				this._toMoveMonth()
			}
		}, {
			key: '_initMonth',
			value: function _initMonth(view, m) {
				const displayMonth = m.format('MMMM YYYY')
				const month = view.querySelector('.mddtp-picker__month')
				const	tr = view.querySelector('.mddtp-picker__tr')
				const	firstDayOfMonth = moment.weekdays(!0).indexOf(moment.weekdays(!1, moment(m).date(1).day()))
				const	lastDayOfMonth = parseInt(moment(m).endOf('month').format('D'), 10) + firstDayOfMonth - 1
				const docfrag = document.createDocumentFragment()

				let today = -1
				let	selected = -1
				let	past = firstDayOfMonth
				let	future = lastDayOfMonth

				this._fillText(month, displayMonth)

				/*
		    netTrek - first day of month dependented from moment.locale
		    //parseInt(moment(m).date(1).day(), 10)
		    */

				if (moment().isSame(m, 'month')) {
					today = parseInt(moment().format('D'), 10);
					today += firstDayOfMonth - 1;
				}
				if (this._past.isSame(m, 'month')) {
					past = parseInt(this._past.format('D'), 10);
					past += firstDayOfMonth - 1;
				}
				if (this._future.isSame(m, 'month')) {
					future = parseInt(this._future.format('D'), 10);
					future += firstDayOfMonth - 1;
				}
				if (this._sDialog.sDate.isSame(m, 'month')) {
					selected = parseInt(moment(m).format('D'), 10);
					selected += firstDayOfMonth - 1;
				}

				for (let i = 0; i < 42; i++) {
					const cell = document.createElement('span')
					const	currentDay = i - firstDayOfMonth + 1;

					if (i >= firstDayOfMonth && i <= lastDayOfMonth) {
						if (i > future || i < past) {
							cell.classList.add(_CLASS_CELL + '--disabled');
						}
						else {
							cell.classList.add(_CLASS_CELL);
						}
						this._fillText(cell, currentDay);
					}
					if (today === i) {
						cell.classList.add(_CLASS_CELL + '--today');
					}
					if (selected === i) {
						cell.classList.add(_CLASS_CELL + '--selected');
						cell.id = _ID_SELECTED;
					}
					docfrag.appendChild(cell);
				}

				// empty the tr
				while (tr.lastChild) {
					tr.removeChild(tr.lastChild)
				}

				// set inner html accordingly
				tr.appendChild(docfrag)

				// add handler
				this._addCellClickEvent(tr)
				month.onclick = () => {
					this._switchToDateView(month, this)
				}
			}
		}, {
			key: '_initYear',
			value: function _initYear() {
				var years = this._sDialog.years,
					currentYear = this._sDialog.tDate.year(),
					docfrag = document.createDocumentFragment(),
					past = this._past.year(),
					future = this._future.year();

				for (var year = past; year <= future; year++) {
					var li = document.createElement('li');
					li.textContent = year;
					if (year === currentYear) {
						li.id = _ID_CURRENT_YEAR;
						li.classList.add('mddtp-picker__li--current');
					}
					docfrag.appendChild(li);
				}
				//empty the years ul
				while (years.lastChild) {
					years.removeChild(years.lastChild);
				}
				// set inner html accordingly
				years.appendChild(docfrag);
				// attach event handler to the ul to get the benefit of event delegation
				this._changeYear(years);
			}
		}, {
			key: '_switchToView',
			value: function _switchToView(el) {
				const me = this

				// attach the view change button
				if (this._type === 'date') {
					el.onclick = function () {
						me._switchToDateView(el, me)
					}
				}
				else {
					if (this._inner24 === true && me._mode) {
						if (parseInt(me._sDialog.sDate.format('H'), 10) > 12) {
							me._sDialog.needle.classList.add(_CLASS_CELL_ROTATE)
						}
						else {
							me._sDialog.needle.classList.remove(_CLASS_CELL_ROTATE)
						}
					}

					el.onclick = function () {
						me._switchToTimeView(me)
					}
				}
			}
		}, {
			key: '_switchToTimeView',
			value: function _switchToTimeView(me) {
				var hourView = me._sDialog.hourView,
					minuteView = me._sDialog.minuteView,
					hour = me._sDialog.hour,
					minute = me._sDialog.minute,
					activeClass = _CLASS_COLOR_ACTIVE,
					hidden = 'mddtp-picker__circularView--hidden',
					selection = 'mddtp-picker__selection',
					needle = me._sDialog.needle,
					circularHolder = me._sDialog.circularHolder,
					circle = me._sDialog.circle,
					fakeNeedle = me._sDialog.fakeNeedle,
					spoke = 60,
					value = void 0;

				// toggle view classes
				hourView.classList.toggle(hidden);
				minuteView.classList.toggle(hidden);
				hour.classList.toggle(activeClass);
				minute.classList.toggle(activeClass);
				// move the needle to correct position
				needle.className = '';
				needle.classList.add(selection);
				if (mdDateTimePicker.dialog.view) {
					value = me._sDialog.sDate.format('m');

					// Need to deactivate for the autoClose mode as it mess things up.  If you have an idea, feel free to give it a shot !
					if (me._autoClose !== true) {
						// move the fakeNeedle to correct position
						setTimeout(function () {
							const hOffset = circularHolder.getBoundingClientRect()
							const cOffset = circle.getBoundingClientRect()

							fakeNeedle.setAttribute('style', 'left:' + (cOffset.left - hOffset.left) + 'px;top:' + (cOffset.top - hOffset.top) + 'px');
						}, 300);
					}
				}
				else {
					if (me._mode) {
						spoke = 24;
						value = parseInt(me._sDialog.sDate.format('H'), 10);
						// CHANGED exception for 24 => 0 issue #58
						if (value === 0) {
							value = 24;
						}
					}
					else {
						spoke = 12;
						value = me._sDialog.sDate.format('h');
					}
				}
				var rotationClass = me._calcRotation(spoke, parseInt(value, 10));
				if (rotationClass) {
					needle.classList.add(rotationClass);
				}
				// toggle the view type
				mdDateTimePicker.dialog.view = !mdDateTimePicker.dialog.view;
			}
		}, {
			key: '_switchToDateView',
			value: function _switchToDateView(el, me) {
				el.setAttribute('disabled', '')

				const viewHolder = me._sDialog.viewHolder
				const	years = me._sDialog.years
				const	title = me._sDialog.title
				const	subtitle = me._sDialog.subtitle
				const	currentYear = document.getElementById(_ID_CURRENT_YEAR)

				if (mdDateTimePicker.dialog.view) {
					viewHolder.classList.add('zoomOut')
					years.classList.remove(_CLASS_YEAR_INVISIBLE)
					years.classList.add('zoomIn')
					// scroll into the view
					// NOTE: scrollIntoViewIfNeeded currently only supported by chrome
					typeof currentYear.scrollIntoViewIfNeeded === 'function' ? currentYear.scrollIntoViewIfNeeded() : currentYear.scrollIntoView();
				}
				else {
					years.classList.add('zoomOut')
					viewHolder.classList.remove('zoomOut')
					viewHolder.classList.add('zoomIn')
					setTimeout(function () {
						years.classList.remove('zoomIn', 'zoomOut')
						years.classList.add(_CLASS_YEAR_INVISIBLE)
						viewHolder.classList.remove('zoomIn')
					}, 300)
				}

				title.classList.toggle(_CLASS_COLOR_ACTIVE)
				subtitle.classList.toggle(_CLASS_COLOR_ACTIVE)

				mdDateTimePicker.dialog.view = !mdDateTimePicker.dialog.view

				setTimeout(function () {
					el.removeAttribute('disabled')
				}, 300)
			}
		}, {
			key: '_addClockEvent',
			value: function _addClockEvent() {
				const me = this,
					hourView = this._sDialog.hourView,
					minuteView = this._sDialog.minuteView,
					sClass = _CLASS_SELECTED;

				hourView.onclick = function (e) {
					var sHour = 'mddtp-hour__selected',
						selectedHour = document.getElementById(sHour),
						setHour = 0;

					if (e.target && e.target.nodeName === 'SPAN') {
						// clear the previously selected hour
						selectedHour.id = '';
						selectedHour.classList.remove(sClass);
						// select the new hour
						e.target.parentNode.classList.add(sClass);
						e.target.parentNode.id = sHour;
						// set the sDate according to 24 or 12 hour mode
						if (me._mode) {
							setHour = parseInt(e.target.textContent, 10);
						}
						else {
							if (me._sDialog.sDate.format('A') === 'AM') {
								setHour = e.target.textContent;
							}
							else {
								setHour = parseInt(e.target.textContent, 10) + 12;
							}
						}
						me._sDialog.sDate.hour(setHour);
						// set the display hour
						me._sDialog.hour.textContent = e.target.textContent;
						// switch the view
						me._switchToTimeView(me);
					}
				};
				minuteView.onclick = function (e) {
					var sMinute = 'mddtp-minute__selected',
						selectedMinute = document.getElementById(sMinute),
						setMinute = 0;

					if (e.target && e.target.nodeName === 'SPAN') {
						// clear the previously selected hour
						if (selectedMinute) {
							selectedMinute.id = '';
							selectedMinute.classList.remove(sClass);
						}
						// select the new minute
						e.target.parentNode.classList.add(sClass);
						e.target.parentNode.id = sMinute;
						// set the sDate minute
						setMinute = e.target.textContent;
						me._sDialog.sDate.minute(setMinute);
						// set the display minute
						me._sDialog.minute.textContent = setMinute;
						// switch the view
						me._switchToTimeView(me);

						if (me._autoClose === true) {
							me._sDialog.ok.onclick();
						}
					}
				};
			}
		}, {
			key: '_addCellClickEvent',
			value: function _addCellClickEvent(el) {
				const me = this;
				el.onclick = function (e) {
					if (e.target && e.target.nodeName === 'SPAN' && e.target.classList.contains(_CLASS_CELL)) {
						const day = e.target.textContent,
							currentDate = me._sDialog.tDate.date(day),
							selected = document.getElementById(_ID_SELECTED),
							subtitle = me._sDialog.subtitle,
							titleDay = me._sDialog.titleDay,
							titleMonth = me._sDialog.titleMonth,
							format = me._format;

						if (selected) {
							selected.classList.remove(_CLASS_SELECTED);
							selected.id = '';
						}
						e.target.classList.add(_CLASS_SELECTED);
						e.target.id = _ID_SELECTED;

						// update temp date object with the date selected
						me._sDialog.sDate = currentDate.clone();

						me._fillText(subtitle, currentDate.format(format.subtitle || 'YYYY'));
						me._fillText(titleDay, currentDate.format(format.titleDay || 'ddd, '));
						me._fillText(titleMonth, currentDate.format(format.titleMonth || 'MMM D'));

						if (me._autoClose === true) {
							me._sDialog.ok.onclick();
						}
					}
				};
			}
		}, {
			key: '_setDate',
			value: function _setDate(date) {
				if (!date || !moment.isMoment(date)) return

				const me = this
				const	selected = document.getElementById(_ID_SELECTED)
				const	subtitle = me._sDialog.subtitle
				const	titleDay = me._sDialog.titleDay
				const	titleMonth = me._sDialog.titleMonth
				const next = me._sDialog.next
				const	current = me._sDialog.current
				const	previous = me._sDialog.previous
				const	format = me._format
				const m = date.clone()

				if (selected) {
					selected.classList.remove(_CLASS_SELECTED)
					selected.id = ''
				}

				me._sDialog.sDate = m

				me._fillText(subtitle, m.format(format.subtitle || 'YYYY'))
				me._fillText(titleDay, m.format(format.titleDay || 'ddd, '))
				me._fillText(titleMonth, m.format(format.titleMonth || 'MMM D'))

				this._initMonth(current, m)
				this._initMonth(next, moment(this._getMonth(m, 1)))
				this._initMonth(previous, moment(this._getMonth(m, -1)))
				this._toMoveMonth()
			}
		}, {
			key: '_toMoveMonth',
			value: function _toMoveMonth() {
				const m = this._sDialog.tDate
				const	left = this._sDialog.left
				const	right = this._sDialog.right
				const	past = this._past
				const	future = this._future

				left.removeAttribute('disabled')
				right.removeAttribute('disabled')
				left.classList.remove(_CLASS_BUTTON_DISABLED)
				right.classList.remove(_CLASS_BUTTON_DISABLED)

				if (m.isSame(past, 'month')) {
					left.setAttribute('disabled', '')
					left.classList.add(_CLASS_BUTTON_DISABLED)
				}
				if (m.isSame(future, 'month')) {
					right.setAttribute('disabled', '')
					right.classList.add(_CLASS_BUTTON_DISABLED)
				}
			}
		}, {
			key: '_changeMonth',
			value: function _changeMonth() {
				const me = this
				const	left = this._sDialog.left
				const	right = this._sDialog.right

				left.onclick = function () {
					moveStep(_CLASS_VIEW_RIGHT, me._sDialog.previous)
				}
				right.onclick = function () {
					moveStep(_CLASS_VIEW_LEFT, me._sDialog.next)
				}

				function moveStep(aClass, to) {
					/**
					 * [stepBack to know if the to step is going back or not]
					 * @type {Boolean}
					 */
					let stepBack = !1
					let	next = me._sDialog.next
					let	current = me._sDialog.current
					let	previous = me._sDialog.previous

					left.setAttribute('disabled', '')
					right.setAttribute('disabled', '')

					current.classList.add(aClass)
					previous.classList.add(aClass)
					next.classList.add(aClass)

					const clone = to.cloneNode(!0)
					let	del = void 0

					if (to === next) {
						del = previous
						current.parentNode.appendChild(clone)
						next.id = current.id
						current.id = previous.id
						previous = current
						current = next
						next = clone
					}
					else {
						stepBack = !0
						del = next
						previous.id = current.id
						current.id = next.id
						next = current
						current = previous
					}

					setTimeout(function () {
						if (to === previous) {
							current.parentNode.insertBefore(clone, current)
							previous = clone
						}
						// update real values to match these values
						me._sDialog.next = next
						me._sDialog.current = current
						me._sDialog.previous = previous

						current.classList.add(_CLASS_VIEW_PAUSE)
						next.classList.add(_CLASS_VIEW_PAUSE)
						previous.classList.add(_CLASS_VIEW_PAUSE)

						current.classList.remove(aClass)
						next.classList.remove(aClass)
						previous.classList.remove(aClass)

						del.parentNode.removeChild(del)
					}, 300)

					// REVIEW replace below code with requestAnimationFrame
					setTimeout(function () {
						current.classList.remove(_CLASS_VIEW_PAUSE)
						next.classList.remove(_CLASS_VIEW_PAUSE)
						previous.classList.remove(_CLASS_VIEW_PAUSE)

						if (stepBack) me._sDialog.tDate = me._getMonth(me._sDialog.tDate, -1)
						else me._sDialog.tDate = me._getMonth(me._sDialog.tDate, 1)

						// NOTE method enable left and right button
						me._initViewHolder()
					}, 350)
				}
			}
		}, {
			key: '_changeYear',
			value: function _changeYear(el) {
				const me = this;
				el.onclick = function (e) {
					if (e.target && e.target.nodeName === 'LI') {
						const selected = document.getElementById(_ID_CURRENT_YEAR);
						// clear previous selected
						selected.id = '';
						selected.classList.remove('mddtp-picker__li--current');
						// add the properties to the newer one
						e.target.id = _ID_CURRENT_YEAR;
						e.target.classList.add('mddtp-picker__li--current');
						// switch view
						me._switchToDateView(el, me);
						// set the tdate to it
						me._sDialog.tDate.year(parseInt(e.target.textContent, 10));
						// update the dialog
						me._initViewHolder();
					}
				};
			}
		}, {
			key: '_changeM',
			value: function _changeM() {
				const me = this,
					AM = this._sDialog.AM,
					PM = this._sDialog.PM;

				AM.onclick = function (e) {
					const m = me._sDialog.sDate.format('A');
					if (m === 'PM') {
						me._sDialog.sDate.subtract(12, 'h');
						AM.classList.toggle(_CLASS_COLOR_ACTIVE);
						PM.classList.toggle(_CLASS_COLOR_ACTIVE);
					}
				};
				PM.onclick = function () {
					const m = me._sDialog.sDate.format('A');
					if (m === 'AM') {
						me._sDialog.sDate.add(12, 'h');
						AM.classList.toggle(_CLASS_COLOR_ACTIVE);
						PM.classList.toggle(_CLASS_COLOR_ACTIVE);
					}
				};
			}
		}, {
			key: '_dragDial',
			value: function _dragDial() {
				var me = this,
					needle = this._sDialog.needle,
					circle = this._sDialog.circle,
					fakeNeedle = this._sDialog.fakeNeedle,
					circularHolder = this._sDialog.circularHolder,
					minute = this._sDialog.minute,
					quick = 'mddtp-picker__selection--quick',
					selection = 'mddtp-picker__selection',
					selected = _CLASS_SELECTED,
					rotate = 'mddtp-picker__cell--rotate-',
					hOffset = circularHolder.getBoundingClientRect(),
					divides = void 0;

				// move the fakeNeedle to correct position
				setTimeout(function () {
					const hOffset = circularHolder.getBoundingClientRect()
					const cOffset = circle.getBoundingClientRect()

					fakeNeedle.setAttribute('style', 'left:' + (cOffset.left - hOffset.left) + 'px;top:' + (cOffset.top - hOffset.top) + 'px');
				}, 300);

				fakeNeedle.addEventListener('mousedown', function (e) {
					e.preventDefault()
					hOffset = circularHolder.getBoundingClientRect()
				})
				/**
				 * netTrek
				 * fixes for iOS - drag
				 */
				fakeNeedle.addEventListener('mousemove', function (e) {
					let clientX = e.clientX
					let clientY = e.clientY

					if (clientX === undefined) {
						if (e.pageX === undefined) {
							if (e.touches && e.touches.length > 0) {
								clientX = e.touches[0].clientX;
								clientY = e.touches[0].clientY;
							}
							else {
								console.error('coult not detect pageX, pageY');
							}
						}
						else {
							clientX = e.pageX - document.body.scrollLeft - document.documentElement.scrollLeft;
							clientY = e.pageY - document.body.scrollTop - document.documentElement.scrollTop;
						}
					}
					// console.info('Drag clientX', clientX, clientY, e);

					var xPos = clientX - hOffset.left - hOffset.width / 2,
						yPos = clientY - hOffset.top - hOffset.height / 2,
						slope = Math.atan2(-yPos, xPos);

					needle.className = '';
					if (slope < 0) {
						slope += 2 * Math.PI;
					}
					slope *= 180 / Math.PI;
					slope = 360 - slope;
					if (slope > 270) {
						slope -= 360;
					}
					divides = slope / 6;
					var same = Math.abs(6 * divides - slope),
						upper = Math.abs(6 * (divides + 1) - slope);

					if (upper < same) {
						divides++;
					}
					divides += 15;
					needle.classList.add(selection);
					needle.classList.add(quick);
					needle.classList.add(rotate + divides * 2);
				});
				/**
				 * netTrek
				 * fixes for iOS - drag
				 */
				fakeNeedle.addEventListener('mouseup', function (e) {
					var minuteViewChildren = me._sDialog.minuteView.getElementsByTagName('div'),
						sMinute = 'mddtp-minute__selected',
						selectedMinute = document.getElementById(sMinute),
						cOffset = circle.getBoundingClientRect();

					fakeNeedle.setAttribute('style', 'left:' + (cOffset.left - hOffset.left) + 'px;top:' + (cOffset.top - hOffset.top) + 'px');
					needle.classList.remove(quick);
					var select = divides;
					if (select === 1) {
						select = 60;
					}
					select = me._nearestDivisor(select, 5);
					// normalize 60 => 0
					if (divides === 60) {
						divides = 0;
					}
					// remove previously selected value
					if (selectedMinute) {
						selectedMinute.id = '';
						selectedMinute.classList.remove(selected);
					}
					// add the new selected
					if (select > 0) {
						select /= 5;
						select--;
						minuteViewChildren[select].id = sMinute;
						minuteViewChildren[select].classList.add(selected);
					}
					minute.textContent = me._numWithZero(divides);
					me._sDialog.sDate.minutes(divides);
				});
			}
		}, {
			key: '_attachEventHandlers',
			value: function _attachEventHandlers() {
				const me = this
				const ok = this._sDialog.ok
				const cancel = this._sDialog.cancel
				const today = this._sDialog.today
				const overlay = this._sDialog.overlay
				const onCancel = new CustomEvent('onCancel')
				const onOk = new CustomEvent('onOk')
				const onToday = new CustomEvent('onToday')

				me.keyboardListener = _keyboardNavigation.bind(me);

				// create custom events to dispatch
				cancel.onclick = function () {
					me.toggle();
					if (me._trigger) {
						me._trigger.dispatchEvent(onCancel);
					}
				};
				ok.onclick = function () {
					me._init = me._sDialog.sDate;
					me.toggle();
					if (me._trigger) {
						me._trigger.dispatchEvent(onOk);
					}
				};
				today.onclick = function () {
					me._setDate(me._init.clone());
					if (me._trigger) {
						me._trigger.dispatchEvent(onToday);
					}
				};
				if (overlay) {
					overlay.onclick = function () {
						me.toggle();
						if (me._trigger) {
							me._trigger.dispatchEvent(onCancel);
						}
					}
				}
			}
		}, {
			key: '_setButtonText',
			value: function _setButtonText() {
				this._sDialog.cancel.textContent = this._cancel;
				this._sDialog.ok.textContent = this._ok;
				this._sDialog.today.textContent = this._today;
			}
		}, {
			key: '_getMonth',
			value: function _getMonth(moment, count) {
				var m = void 0;
				m = moment.clone();
				if (count > 0) {
					return m.add(Math.abs(count), 'M');
				}
				else {
					return m.subtract(Math.abs(count), 'M');
				}
			}
		}, {
			key: '_nearestDivisor',
			value: function _nearestDivisor(number, divided) {
				if (number % divided === 0) {
					return number;
				}
				else if ((number - 1) % divided === 0) {
					return number - 1;
				}
				else if ((number + 1) % divided === 0) {
					return number + 1;
				}
				return -1;
			}
		}, {
			key: '_numWithZero',
			value: function _numWithZero(n) {
				return n > 9 ? '' + n : '0' + n;
			}
		}, {
			key: '_fillText',
			value: function _fillText(el, text) {
				if (el.firstChild) {
					el.firstChild.nodeValue = text;
				}
				else {
					el.appendChild(document.createTextNode(text));
				}
			}
		}, {
			key: '_addId',
			value: function _addId(el, id) {
				el.id = 'mddtp-' + this._type + '__' + id;
			}
		}, {
			key: '_addClass',
			value: function _addClass(el, aClass, more) {
				el.classList.add('mddtp-picker__' + aClass);
				var i = 0;
				if (more) {
					i = more.length;
					more.reverse();
				}
				while (i--) {
					el.classList.add(more[i]);
				}
			}
		}, {
			key: '_addView',
			value: function _addView(view) {
				const month = document.createElement('button')
				const	grid = document.createElement('div')
				const	th = document.createElement('div')
				const	tr = document.createElement('div')
				const	weekDays = moment.weekdaysMin(!0).reverse()

				let week = 7
				/*
		     netTrek - weekday dependented from moment.locale
		     //['S', 'F', 'T', 'W', 'T', 'M', 'S']
		     */

				while (week--) {
					const span = document.createElement('span')
					span.textContent = weekDays[week]
					th.appendChild(span)
				}

				// add properties to them
				this._addClass(month, 'month')
				this._addClass(grid, 'grid')
				this._addClass(th, 'th')
				this._addClass(tr, 'tr')

				month.setAttribute('type', 'button')
				month.classList.add('mddtp-button')

				// add them to the view
				view.appendChild(month)
				view.appendChild(grid)
				grid.appendChild(th)
				grid.appendChild(tr)
			}
		}, {
			key: '_calcRotation',
			value: function _calcRotation(spoke, value) {
				// set clocks top and right side value
				if (spoke === 12) {
					value *= 10;
				}
				else if (spoke === 24) {
					value *= 5;
				}
				else {
					value *= 2;
				}
				// special case for 00 => 60
				if (spoke === 60 && value === 0) {
					value = 120;
				}
				return 'mddtp-picker__cell--rotate-' + value;
			}
		}, {
			key: 'time',
			get: function get() {
				return this._init;
			},
			set: function set(m) {
				if (m) {
					this._init = m;
				}
			}
		}, {
			key: 'trigger',
			get: function get() {
				return this._trigger;
			},
			set: function set(el) {
				if (el) {
					this._trigger = el;
				}
			}
		}], [{
			key: 'dialog',
			get: function get() {
				return _dialog;
			},
			set: function set(value) {
				mdDateTimePicker.dialog = value;
			}
		}])

		return mdDateTimePicker
	}()
})

// You can polyfill the CustomEvent() constructor functionality in Internet Explorer 9 and higher with the following code
// Internet Explorer >= 9 adds a CustomEvent object to the window, but with correct implementations, this is a function.
;(function () {
	if (typeof window.CustomEvent === 'function') { return false; }

	function CustomEvent(event, params) {
		params = params || { bubbles: false, cancelable: false, detail: undefined };
		const evt = document.createEvent('CustomEvent');
		evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
		return evt;
	}

	CustomEvent.prototype = window.Event.prototype;

	window.CustomEvent = CustomEvent;
})()
