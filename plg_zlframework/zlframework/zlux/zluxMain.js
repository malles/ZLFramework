/* ===================================================
 * ZLUX Main
 * https://zoolanders.com/extensions/zl-framework
 * ===================================================
 * Copyright (C) JOOlanders SL 
 * http://www.gnu.org/licenses/gpl-2.0.html GNU/GPLv2 only
 * ========================================================== */
(function ($) {
	var Plugin = function(options){
		this.options = $.extend({}, this.options, options);
		this.events = {};
	};
	Plugin.prototype = $.extend(Plugin.prototype, {
		name: 'zluxMain',
		options: {},
		// var for internal events, must be reseted when expanding
		events: {},
		assets: {},
		/**
		 * BETA - A cache factory that will abstract out the actual task to be performed when a key isn't in the cache yet
		 *
		 * @method createCache
		 * @param {Function} Function to be abstracted
		 */
		createCache: function(requestFunction) {
			var cache = {};
			return function( key, callback ) {
				if ( !cache[ key ] ) {
					cache[ key ] = $.Deferred(function( defer ) {
						requestFunction( defer, key );
					}).promise();
				}
				return cache[ key ].done( callback );
			};
		},
		/**
		 * Load Asset and execute callback using Deferrers
		 */
		loadAsset: function(asset) {
			var $this = this;

			if ( !$this.assets[ asset ] ) {

				$this.assets[ asset ] = $.Deferred(function( defer ) {

					yepnope({
						test: asset,
						load: asset,
						callback: function (url, result, key) {
							if (result) {
								// if asset loaded resolve
								defer.resolve();
							} else {
								defer.reject();
							}
						}
					})

				})
			}

			return $this.assets[ asset ].promise();
		},
		/**
		 * Returns the Joomla root URL, for relative assets urls
		 */
		JRoot: function() {
			return $.fn[Plugin.prototype.name].prototype.JRoot;
		},
		/**
		 * Returns the Joomla base URL, for ajax urls
		 */
		JBase: function() {
			return $.fn[Plugin.prototype.name].prototype.JBase;
		},
		/**
		 * Returns the ZLUX Ajax URL
		 */
		AjaxURL: function() {
			return this.JBase() + 'index.php?option=com_zoo&controller=zlux&format=raw';
		},
		/**
		 * Dispatches the specified event name and it's arguments to all listeners.
		 *
		 * @method trigger
		 * @param {String} name Event name to fire.
		 * @param {Object..} Multiple arguments to pass along to the listener functions.
		 */
		trigger : function(name) {
			var list = this.events[name.toLowerCase()], i, args;

			// console.log(name, arguments);

			if (list) {
				// Replace name with sender in args
				args = Array.prototype.slice.call(arguments);
				args[0] = this;

				// Dispatch event to all listeners
				for (i = 0; i < list.length; i++) {
					// Fire event, break chain if false is returned
					if (list[i].func.apply(list[i].scope, args) === false) {
						return false;
					}
				}
			}

			return true;
		},
		/**
		 * Adds an event listener by name.
		 *
		 * @method bind
		 * @param {String} name Event name to listen for.
		 * @param {function} func Function to call ones the event gets fired.
		 * @param {Object} scope Optional scope to execute the specified function in.
		 */
		bind: function(names, func, scope){
			var $this = this;

			names.split(' ').each(function(name){
				var list;

				name = name.toLowerCase();
				list = $this.events[name] || [];
				list.push({func : func, scope : scope || $this});
				$this.events[name] = list;
			})

			// chaining
			return this;
		},
		/**
		 * Removes the specified event listener.
		 *
		 * @method unbind
		 * @param {String} name Name of event to remove.
		 * @param {function} func Function to remove from listener.
		 */
		unbind : function(name) {
			name = name.toLowerCase();

			var list = this.events[name], i, func = arguments[1];

			if (list) {
				if (func !== undef) {
					for (i = list.length - 1; i >= 0; i--) {
						if (list[i].func === func) {
							list.splice(i, 1);
								break;
						}
					}
				} else {
					list = [];
				}

				// delete event list if it has become empty
				if (!list.length) {
					delete this.events[name];
				}
			}
		},
		/**
		 * Removes all event listeners.
		 *
		 * @method unbindAll
		 */
		unbindAll : function() {
			var $this = this;
			
			plupload.each(events, function(list, name) {
				$this.unbind(name);
			});
		},
		/**
		 * Check whether uploader has any listeners to the specified event.
		 *
		 * @method hasEventListener
		 * @param {String} name Event name to check for.
		 */
		hasEventListener : function(name) {
			return !!this.events[name.toLowerCase()];
		},
		/**
		 * Log an error message
		 *  @param {int} iLevel log error messages, or display them to the user
		 *  @param {string} sMesg error message
		 */
		_ErrorLog: function(iLevel, sMesg ) {
			var $this = this,
				sAlert = ($this.ID === undefined) ?
				$this.name + ": " + sMesg :
				$this.name + " warning (id = '" + $this.ID + "'): " + sMesg;

			if ( iLevel === 0 )
			{
				alert( sAlert );
				return;
			}
			else if ( window.console && console.log )
			{
				console.log( sAlert );
			}
		},
		/**
		 * Translates the specified string by checking for the english string in the language pack lookup.
		 *
		 * @param {String} str String to look for.
		 * @return {String} Translated string or the input string if it wasn't found.
		 */
		translate: function(str) {
			return $.fn[Plugin.prototype.name].translations[str] || str;
		},
		/**
		 * Shortcut for translate function
		 *
		 * @param {String} str String to look for.
		 * @return {String} Translated string or the input string if it wasn't found.
		 */
		_: function(str) {
			return this.translate(str);
		},
		/**
		 * Pseudo sprintf implementation - simple way to replace tokens with specified values.
		 *
		 * @param {String} str String with tokens
		 * @return {String} String with replaced tokens
		 */
		sprintf: function(str) {
			var args = [].slice.call(arguments, 1), reStr = '';

			str.split(/%[sdf]/).forEach(function(part) {
				reStr += part;
				if (args.length) {
					 reStr += args.shift();
				}
			});
			return reStr;
		},
		/**
		 * Clean a path from double / and others
		 *
		 * @method cleanPath
		 * @param {String} path The path to be cleaned
		 */
		cleanPath : function(path) {
			// return path and
			return path

			// lower it
			.toLowerCase()

			// remove undefined and / from end
			.replace(/(undefined|\/$)/g, '')

			// replace double / and \ with /
			.replace(/(\/\/|\\)/g, '/')

			// recover the http double /
			.replace(/:\//g, ':\/\/')
		},
		/**
		 * Get a relative url to the passed path
		 *
		 * @method getRelURL
		 * @param {String} path The path to be threated
		 */
		getRelURL : function(path) {
			var path = this.cleanPath(path);
		}
	});
	// save the plugin for global use
	$.fn[Plugin.prototype.name] = Plugin;
})(jQuery);


/* ===================================================
 * ZLUX Manager
 * https://zoolanders.com/extensions/zl-framework
 * ===================================================
 * Copyright (C) JOOlanders SL 
 * http://www.gnu.org/licenses/gpl-2.0.html GNU/GPLv2 only
 * ========================================================== */
(function ($) {
	var Plugin = function(options){
		this.options = $.extend({}, this.options, options);
		this.events = {};
	};
	Plugin.prototype = $.extend(Plugin.prototype, $.fn.zluxMain.prototype, {
		name: 'zluxManager',
		options: {},
		events: {},
		initialize: function(target, options) {
			this.options = $.extend({}, this.options, options);
			var $this = this;
		},
		/**
		 * Reloads the Table content
		 */
		reload: function() {
			var $this = this,
				oSettings = $this.oTable.fnSettings();

			// set vars
			oSettings.bReloading = true;

			// reload
			$this.oTable.fnReloadAjax(oSettings.sAjaxSource);
		},
		/**
		 * Push a Message specific to the object and manage old ones
		 */
		pushMessageToObject: function($object, message) {
			var $this = this;

			// wrap if message is plain text
			if (typeof(message) == 'string') {
				message = $('<div>' + message + '</div>')
			}

			// if more than one message wrap in separate divs
			else if (message.length > 1) {
				$.each(message, function(i, v){
					message[i] = $('<div>' + v + '</div>');
				})
			}

			// get current siblings
			var siblings = $('.zlux-x-msg', $object.dom),

			// prepare message wrapper
			msg = $('<div class="zlux-x-details-content zlux-x-msg" />').hide()

			.append(
				// append message content
				message,

				// append remove feature
				$('<i class="zlux-x-msg-remove icon-remove" />').on('click', function(){
					msg.fadeOut();
				})
			)

			// add it to DOM
			.prependTo($('.zlux-x-details', $object.dom))

			// show it with effect
			.slideDown('fast', function(){

				// remove any msg sibling
				siblings.fadeOut('slow', function(){
					$(this).remove();
				});
			})

			return msg;
		},
		/**
		 * Push the necesary storage DATA
		 */
		pushStorageData: function(aoData) {
			var $this = this;

			// if S3 storage
			if($this.options.storage == 's3') {
				aoData.push({ "name": "storage", "value": "s3" });
				aoData.push({ "name": "accesskey", "value": $this.options.storage_params.accesskey });
				aoData.push({ "name": "key", "value": $this.options.storage_params.secretkey });
				aoData.push({ "name": "bucket", "value": $this.options.storage_params.bucket });
			}

			return aoData;
		}
	});
	// Don't touch
	$.fn[Plugin.prototype.name] = function() {
		if (this.data(Plugin.prototype.name)) return; // standart check to avoid duplicate inits
		var args   = arguments;
		var method = args[0] ? args[0] : null;
		return this.each(function() {
			var element = $(this);
			if (Plugin.prototype[method] && element.data(Plugin.prototype.name) && method != 'initialize') {
				element.data(Plugin.prototype.name)[method].apply(element.data(Plugin.prototype.name), Array.prototype.slice.call(args, 1));
			} else if (!method || $.isPlainObject(method)) {
				var plugin = new Plugin();
				if (Plugin.prototype['initialize']) {
					plugin.initialize.apply(plugin, $.merge([element], args));
				}
				element.data(Plugin.prototype.name, plugin);
			} else {
				$.error('Method ' +  method + ' does not exist on jQuery.' + Plugin.name);
			}
		});
	};
	// save the plugin for global use
	$.fn[Plugin.prototype.name] = Plugin;
})(jQuery);


/* ===================================================
 * ZLUX SaveElement
 * https://zoolanders.com/extensions/zl-framework
 * ===================================================
 * Copyright (C) JOOlanders SL 
 * http://www.gnu.org/licenses/gpl-2.0.html GNU/GPLv2 only
 * ========================================================== */
(function ($) {
	var Plugin = function(){};
	Plugin.prototype = $.extend(Plugin.prototype, {
		name: 'zluxSaveElement',
		options: {
			msgSaveElement: 'Save Element',
			item_id: 0,
			elm_id: ''
		},
		initialize: function(element, options) {
			this.options = $.extend({}, this.options, options);
			var $this = this;

			// append the button
			$('<a class="btn btn-small save" href="javascript:void(0);" />')
			.append('<i class="icon-ok-sign"></i> '+$this.options.msgSaveElement)
			.on('click', function()
			{
				var button = $(this).addClass('btn-working'),
					postData = button.closest('.element').find('input, textarea').serializeArray();

				$.post(
					$this.AjaxUrl + '&task=saveelement&item_id=' + $this.options.item_id + '&elm_id=' + $this.options.elm_id, 
					postData, function(data) {
					button.removeClass('btn-working');
				});
			}
			).appendTo(element.find('.btn-toolbar'));
		}
	});
	// Don't touch
	$.fn[Plugin.prototype.name] = function() {
		var args   = arguments;
		var method = args[0] ? args[0] : null;
		return this.each(function() {
			var element = $(this);
			if (Plugin.prototype[method] && element.data(Plugin.prototype.name) && method != 'initialize') {
				element.data(Plugin.prototype.name)[method].apply(element.data(Plugin.prototype.name), Array.prototype.slice.call(args, 1));
			} else if (!method || $.isPlainObject(method)) {
				var plugin = new Plugin();
				if (Plugin.prototype['initialize']) {
					plugin.initialize.apply(plugin, $.merge([element], args));
				}
				element.data(Plugin.prototype.name, plugin);
			} else {
				$.error('Method ' +  method + ' does not exist on jQuery.' + Plugin.name);
			}
		});
	};
})(jQuery);

/* ===================================================
 * ZLUX Example
 * https://zoolanders.com/extensions/zl-framework
 * ===================================================
 * Copyright (C) JOOlanders SL 
 * http://www.gnu.org/licenses/gpl-2.0.html GNU/GPLv2 only
 * ========================================================== */
(function ($) {
	var Plugin = function(options){
		this.options = $.extend({}, this.options, options);
		this.events = {};
	};
	Plugin.prototype = $.extend(Plugin.prototype, $.fn.zluxMain.prototype, {
		name: 'zluxExample',
		options: {
			"param": ''
		},
		events: {},
		initialize: function(input, options) {
			this.options = $.extend({}, $.fn.zluxMain.prototype.options, this.options, options);
			var $this = this;

			// code
		},
		some_function: function() {
			var $this = this;

			// code
		}
	});
	// Don't touch
	$.fn[Plugin.prototype.name] = function() {
		var args   = arguments;
		var method = args[0] ? args[0] : null;
		return this.each(function() {
			var element = $(this);
			if (Plugin.prototype[method] && element.data(Plugin.prototype.name) && method != 'initialize') {
				element.data(Plugin.prototype.name)[method].apply(element.data(Plugin.prototype.name), Array.prototype.slice.call(args, 1));
			} else if (!method || $.isPlainObject(method)) {
				var plugin = new Plugin();
				if (Plugin.prototype['initialize']) {
					plugin.initialize.apply(plugin, $.merge([element], args));
				}
				element.data(Plugin.prototype.name, plugin);
			} else {
				$.error('Method ' +  method + ' does not exist on jQuery.' + Plugin.name);
			}
		});
	};
})(jQuery);