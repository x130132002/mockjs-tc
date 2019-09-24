(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["Mock"] = factory();
	else
		root["Mock"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

	/* global require, module, window */
	var Handler = __webpack_require__(1)
	var Util = __webpack_require__(3)
	var Random = __webpack_require__(5)
	var RE = __webpack_require__(20)
	var toJSONSchema = __webpack_require__(23)
	var valid = __webpack_require__(25)

	var XHR
	if (typeof window !== 'undefined') XHR = __webpack_require__(27)

	/*!
	    Mock - 模擬請求 & 模擬數據
	    https://github.com/nuysoft/Mock
	    墨智 mozhi.gyy@taobao.com nuysoft@gmail.com
	*/
	var Mock = {
	    Handler: Handler,
	    Random: Random,
	    Util: Util,
	    XHR: XHR,
	    RE: RE,
	    toJSONSchema: toJSONSchema,
	    valid: valid,
	    heredoc: Util.heredoc,
	    setup: function (settings) {
	        return XHR.setup(settings)
	    },
	    _mocked: {}
	}

	Mock.version = '1.0.1-beta3'

	// 避免循環依賴
	if (XHR) XHR.Mock = Mock

	/*
	    * Mock.mock( template )
	    * Mock.mock( function() )
	    * Mock.mock( rurl, template )
	    * Mock.mock( rurl, function(options) )
	    * Mock.mock( rurl, rtype, template )
	    * Mock.mock( rurl, rtype, function(options) )

	    根據數據模板生成模擬數據。
	*/
	Mock.mock = function (rurl, rtype, template) {
	    // Mock.mock(template)
	    if (arguments.length === 1) {
	        return Handler.gen(rurl)
	    }
	    // Mock.mock(rurl, template)
	    if (arguments.length === 2) {
	        template = rtype
	        rtype = undefined
	    }
	    // 攔截 XHR
	    if (XHR) window.XMLHttpRequest = XHR
	    Mock._mocked[rurl + (rtype || '')] = {
	        rurl: rurl,
	        rtype: rtype,
	        template: template
	    }
	    return Mock
	}

	module.exports = Mock

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

	/* 
	    ## Handler

	    處理數據模板。
	    
	    * Handler.gen( template, name?, context? )

	        入口方法。

	    * Data Template Definition, DTD
	        
	        處理數據模板定義。

	        * Handler.array( options )
	        * Handler.object( options )
	        * Handler.number( options )
	        * Handler.boolean( options )
	        * Handler.string( options )
	        * Handler.function( options )
	        * Handler.regexp( options )
	        
	        處理路徑（相對和絕對）。

	        * Handler.getValueByKeyPath( key, options )

	    * Data Placeholder Definition, DPD

	        處理數據占位符定義

	        * Handler.placeholder( placeholder, context, templateContext, options )

	*/

	var Constant = __webpack_require__(2)
	var Util = __webpack_require__(3)
	var Parser = __webpack_require__(4)
	var Random = __webpack_require__(5)
	var RE = __webpack_require__(20)

	var Handler = {
	    extend: Util.extend
	}

	/*
	    template        屬性值（即數據模板）
	    name            屬性名
	    context         數據上下文，生成後的數據
	    templateContext 模板上下文，

	    Handle.gen(template, name, options)
	    context
	        currentContext, templateCurrentContext, 
	        path, templatePath
	        root, templateRoot
	*/
	Handler.gen = function (template, name, context) {
	    /* jshint -W041 */
	    name = name == undefined ? '' : (name + '')

	    context = context || {}
	    context = {
	        // 當前訪問路徑，只有屬性名，不包括生成規則
	        path: context.path || [Constant.GUID],
	        templatePath: context.templatePath || [Constant.GUID++],
	        // 最終屬性值的上下文
	        currentContext: context.currentContext,
	        // 屬性值模板的上下文
	        templateCurrentContext: context.templateCurrentContext || template,
	        // 最終值的根
	        root: context.root || context.currentContext,
	        // 模板的根
	        templateRoot: context.templateRoot || context.templateCurrentContext || template
	    }
	    // console.log('path:', context.path.join('.'), template)

	    var rule = Parser.parse(name)
	    var type = Util.type(template)
	    var data

	    if (Handler[type]) {
	        data = Handler[type]({
	            // 屬性值類型
	            type: type,
	            // 屬性值模板
	            template: template,
	            // 屬性名 + 生成規則
	            name: name,
	            // 屬性名
	            parsedName: name ? name.replace(Constant.RE_KEY, '$1') : name,

	            // 解析後的生成規則
	            rule: rule,
	            // 相關上下文
	            context: context
	        })

	        if (!context.root) context.root = data
	        return data
	    }

	    return template
	}

	Handler.extend({
	    array: function (options) {
	        var result = [],
	            i, ii;

	        // 'name|1': []
	        // 'name|count': []
	        // 'name|min-max': []
	        if (options.template.length === 0) return result

	        // 'arr': [{ 'email': '@EMAIL' }, { 'email': '@EMAIL' }]
	        if (!options.rule.parameters) {
	            for (i = 0; i < options.template.length; i++) {
	                options.context.path.push(i)
	                options.context.templatePath.push(i)
	                result.push(
	                    Handler.gen(options.template[i], i, {
	                        path: options.context.path,
	                        templatePath: options.context.templatePath,
	                        currentContext: result,
	                        templateCurrentContext: options.template,
	                        root: options.context.root || result,
	                        templateRoot: options.context.templateRoot || options.template
	                    })
	                )
	                options.context.path.pop()
	                options.context.templatePath.pop()
	            }
	        } else {
	            // 'method|1': ['GET', 'POST', 'HEAD', 'DELETE']
	            if (options.rule.min === 1 && options.rule.max === undefined) {
	                // fix #17
	                options.context.path.push(options.name)
	                options.context.templatePath.push(options.name)
	                result = Random.pick(
	                    Handler.gen(options.template, undefined, {
	                        path: options.context.path,
	                        templatePath: options.context.templatePath,
	                        currentContext: result,
	                        templateCurrentContext: options.template,
	                        root: options.context.root || result,
	                        templateRoot: options.context.templateRoot || options.template
	                    })
	                )
	                options.context.path.pop()
	                options.context.templatePath.pop()
	            } else {
	                // 'data|+1': [{}, {}]
	                if (options.rule.parameters[2]) {
	                    options.template.__order_index = options.template.__order_index || 0

	                    options.context.path.push(options.name)
	                    options.context.templatePath.push(options.name)
	                    result = Handler.gen(options.template, undefined, {
	                        path: options.context.path,
	                        templatePath: options.context.templatePath,
	                        currentContext: result,
	                        templateCurrentContext: options.template,
	                        root: options.context.root || result,
	                        templateRoot: options.context.templateRoot || options.template
	                    })[
	                        options.template.__order_index % options.template.length
	                    ]

	                    options.template.__order_index += +options.rule.parameters[2]

	                    options.context.path.pop()
	                    options.context.templatePath.pop()

	                } else {
	                    // 'data|1-10': [{}]
	                    for (i = 0; i < options.rule.count; i++) {
	                        // 'data|1-10': [{}, {}]
	                        for (ii = 0; ii < options.template.length; ii++) {
	                            options.context.path.push(result.length)
	                            options.context.templatePath.push(ii)
	                            result.push(
	                                Handler.gen(options.template[ii], result.length, {
	                                    path: options.context.path,
	                                    templatePath: options.context.templatePath,
	                                    currentContext: result,
	                                    templateCurrentContext: options.template,
	                                    root: options.context.root || result,
	                                    templateRoot: options.context.templateRoot || options.template
	                                })
	                            )
	                            options.context.path.pop()
	                            options.context.templatePath.pop()
	                        }
	                    }
	                }
	            }
	        }
	        return result
	    },
	    object: function (options) {
	        var result = {},
	            keys, fnKeys, key, parsedKey, inc, i;

	        // 'obj|min-max': {}
	        /* jshint -W041 */
	        if (options.rule.min != undefined) {
	            keys = Util.keys(options.template)
	            keys = Random.shuffle(keys)
	            keys = keys.slice(0, options.rule.count)
	            for (i = 0; i < keys.length; i++) {
	                key = keys[i]
	                parsedKey = key.replace(Constant.RE_KEY, '$1')
	                options.context.path.push(parsedKey)
	                options.context.templatePath.push(key)
	                result[parsedKey] = Handler.gen(options.template[key], key, {
	                    path: options.context.path,
	                    templatePath: options.context.templatePath,
	                    currentContext: result,
	                    templateCurrentContext: options.template,
	                    root: options.context.root || result,
	                    templateRoot: options.context.templateRoot || options.template
	                })
	                options.context.path.pop()
	                options.context.templatePath.pop()
	            }

	        } else {
	            // 'obj': {}
	            keys = []
	            fnKeys = [] // #25 改變了非函數屬性的順序，查找起來不方便
	            for (key in options.template) {
	                (typeof options.template[key] === 'function' ? fnKeys : keys).push(key)
	            }
	            keys = keys.concat(fnKeys)

	            /*
	                會改變非函數屬性的順序
	                keys = Util.keys(options.template)
	                keys.sort(function(a, b) {
	                    var afn = typeof options.template[a] === 'function'
	                    var bfn = typeof options.template[b] === 'function'
	                    if (afn === bfn) return 0
	                    if (afn && !bfn) return 1
	                    if (!afn && bfn) return -1
	                })
	            */

	            for (i = 0; i < keys.length; i++) {
	                key = keys[i]
	                parsedKey = key.replace(Constant.RE_KEY, '$1')
	                options.context.path.push(parsedKey)
	                options.context.templatePath.push(key)
	                result[parsedKey] = Handler.gen(options.template[key], key, {
	                    path: options.context.path,
	                    templatePath: options.context.templatePath,
	                    currentContext: result,
	                    templateCurrentContext: options.template,
	                    root: options.context.root || result,
	                    templateRoot: options.context.templateRoot || options.template
	                })
	                options.context.path.pop()
	                options.context.templatePath.pop()
	                // 'id|+1': 1
	                inc = key.match(Constant.RE_KEY)
	                if (inc && inc[2] && Util.type(options.template[key]) === 'number') {
	                    options.template[key] += parseInt(inc[2], 10)
	                }
	            }
	        }
	        return result
	    },
	    number: function (options) {
	        var result, parts;
	        if (options.rule.decimal) { // float
	            options.template += ''
	            parts = options.template.split('.')
	            // 'float1|.1-10': 10,
	            // 'float2|1-100.1-10': 1,
	            // 'float3|999.1-10': 1,
	            // 'float4|.3-10': 123.123,
	            parts[0] = options.rule.range ? options.rule.count : parts[0]
	            parts[1] = (parts[1] || '').slice(0, options.rule.dcount)
	            while (parts[1].length < options.rule.dcount) {
	                parts[1] += (
	                    // 最後一位不能為 0：如果最後一位為 0，會被 JS 引擎忽略掉。
	                    (parts[1].length < options.rule.dcount - 1) ? Random.character('number') : Random.character('123456789')
	                )
	            }
	            result = parseFloat(parts.join('.'), 10)
	        } else { // integer
	            // 'grade1|1-100': 1,
	            result = options.rule.range && !options.rule.parameters[2] ? options.rule.count : options.template
	        }
	        return result
	    },
	    boolean: function (options) {
	        var result;
	        // 'prop|multiple': false, 當前值是相反值的概率倍數
	        // 'prop|probability-probability': false, 當前值與相反值的概率
	        result = options.rule.parameters ? Random.bool(options.rule.min, options.rule.max, options.template) : options.template
	        return result
	    },
	    string: function (options) {
	        var result = '',
	            i, placeholders, ph, phed;
	        if (options.template.length) {

	            //  'foo': '★',
	            /* jshint -W041 */
	            if (options.rule.count == undefined) {
	                result += options.template
	            }

	            // 'star|1-5': '★',
	            for (i = 0; i < options.rule.count; i++) {
	                result += options.template
	            }
	            // 'email|1-10': '@EMAIL, ',
	            placeholders = result.match(Constant.RE_PLACEHOLDER) || [] // A-Z_0-9 > \w_
	            for (i = 0; i < placeholders.length; i++) {
	                ph = placeholders[i]

	                // 遇到轉義斜杠，不需要解析占位符
	                if (/^\\/.test(ph)) {
	                    placeholders.splice(i--, 1)
	                    continue
	                }

	                phed = Handler.placeholder(ph, options.context.currentContext, options.context.templateCurrentContext, options)

	                // 只有一個占位符，並且沒有其他字符
	                if (placeholders.length === 1 && ph === result && typeof phed !== typeof result) { // 
	                    result = phed
	                    break

	                    if (Util.isNumeric(phed)) {
	                        result = parseFloat(phed, 10)
	                        break
	                    }
	                    if (/^(true|false)$/.test(phed)) {
	                        result = phed === 'true' ? true :
	                            phed === 'false' ? false :
	                                phed // 已經是布爾值
	                        break
	                    }
	                }
	                result = result.replace(ph, phed)
	            }

	        } else {
	            // 'ASCII|1-10': '',
	            // 'ASCII': '',
	            result = options.rule.range ? Random.string(options.rule.count) : options.template
	        }
	        return result
	    },
	    'function': function (options) {
	        // ( context, options )
	        return options.template.call(options.context.currentContext, options)
	    },
	    'regexp': function (options) {
	        var source = ''

	        // 'name': /regexp/,
	        /* jshint -W041 */
	        if (options.rule.count == undefined) {
	            source += options.template.source // regexp.source
	        }

	        // 'name|1-5': /regexp/,
	        for (var i = 0; i < options.rule.count; i++) {
	            source += options.template.source
	        }

	        return RE.Handler.gen(
	            RE.Parser.parse(
	                source
	            )
	        )
	    }
	})

	Handler.extend({
	    _all: function () {
	        var re = {};
	        for (var key in Random) re[key.toLowerCase()] = key
	        return re
	    },
	    // 處理占位符，轉換為最終值
	    placeholder: function (placeholder, obj, templateContext, options) {
	        // console.log(options.context.path)
	        // 1 key, 2 params
	        Constant.RE_PLACEHOLDER.exec('')
	        var parts = Constant.RE_PLACEHOLDER.exec(placeholder),
	            key = parts && parts[1],
	            lkey = key && key.toLowerCase(),
	            okey = this._all()[lkey],
	            params = parts && parts[2] || ''
	        var pathParts = this.splitPathToArray(key)

	        // 解析占位符的參數
	        try {
	            // 1. 嘗試保持參數的類型
	            /*
	                #24 [Window Firefox 30.0 引用 占位符 拋錯](https://github.com/nuysoft/Mock/issues/24)
	                [BX9056: 各瀏覽器下 window.eval 方法的執行上下文存在差異](http://www.w3help.org/zh-cn/causes/BX9056)
	                應該屬於 Window Firefox 30.0 的 BUG
	            */
	            /* jshint -W061 */
	            params = eval('(function(){ return [].splice.call(arguments, 0 ) })(' + params + ')')
	        } catch (error) {
	            // 2. 如果失敗，只能解析為字符串
	            // console.error(error)
	            // if (error instanceof ReferenceError) params = parts[2].split(/,\s*/);
	            // else throw error
	            params = parts[2].split(/,\s*/)
	        }

	        // 占位符優先引用數據模板中的屬性
	        if (obj && (key in obj)) return obj[key]

	        // @index @key
	        // if (Constant.RE_INDEX.test(key)) return +options.name
	        // if (Constant.RE_KEY.test(key)) return options.name

	        // 絕對路徑 or 相對路徑
	        if (
	            key.charAt(0) === '/' ||
	            pathParts.length > 1
	        ) return this.getValueByKeyPath(key, options)

	        // 遞歸引用數據模板中的屬性
	        if (templateContext &&
	            (typeof templateContext === 'object') &&
	            (key in templateContext) &&
	            (placeholder !== templateContext[key]) // fix #15 避免自己依賴自己
	        ) {
	            // 先計算被引用的屬性值
	            templateContext[key] = Handler.gen(templateContext[key], key, {
	                currentContext: obj,
	                templateCurrentContext: templateContext
	            })
	            return templateContext[key]
	        }

	        // 如果未找到，則原樣返回
	        if (!(key in Random) && !(lkey in Random) && !(okey in Random)) return placeholder

	        // 遞歸解析參數中的占位符
	        for (var i = 0; i < params.length; i++) {
	            Constant.RE_PLACEHOLDER.exec('')
	            if (Constant.RE_PLACEHOLDER.test(params[i])) {
	                params[i] = Handler.placeholder(params[i], obj, templateContext, options)
	            }
	        }

	        var handle = Random[key] || Random[lkey] || Random[okey]
	        switch (Util.type(handle)) {
	            case 'array':
	                // 自動從數組中取一個，例如 @areas
	                return Random.pick(handle)
	            case 'function':
	                // 執行占位符方法（大多數情況）
	                handle.options = options
	                var re = handle.apply(Random, params)
	                if (re === undefined) re = '' // 因為是在字符串中，所以默認為空字符串。
	                delete handle.options
	                return re
	        }
	    },
	    getValueByKeyPath: function (key, options) {
	        var originalKey = key
	        var keyPathParts = this.splitPathToArray(key)
	        var absolutePathParts = []

	        // 絕對路徑
	        if (key.charAt(0) === '/') {
	            absolutePathParts = [options.context.path[0]].concat(
	                this.normalizePath(keyPathParts)
	            )
	        } else {
	            // 相對路徑
	            if (keyPathParts.length > 1) {
	                absolutePathParts = options.context.path.slice(0)
	                absolutePathParts.pop()
	                absolutePathParts = this.normalizePath(
	                    absolutePathParts.concat(keyPathParts)
	                )

	            }
	        }

	        key = keyPathParts[keyPathParts.length - 1]
	        var currentContext = options.context.root
	        var templateCurrentContext = options.context.templateRoot
	        for (var i = 1; i < absolutePathParts.length - 1; i++) {
	            currentContext = currentContext[absolutePathParts[i]]
	            templateCurrentContext = templateCurrentContext[absolutePathParts[i]]
	        }
	        // 引用的值已經計算好
	        if (currentContext && (key in currentContext)) return currentContext[key]

	        // 尚未計算，遞歸引用數據模板中的屬性
	        if (templateCurrentContext &&
	            (typeof templateCurrentContext === 'object') &&
	            (key in templateCurrentContext) &&
	            (originalKey !== templateCurrentContext[key]) // fix #15 避免自己依賴自己
	        ) {
	            // 先計算被引用的屬性值
	            templateCurrentContext[key] = Handler.gen(templateCurrentContext[key], key, {
	                currentContext: currentContext,
	                templateCurrentContext: templateCurrentContext
	            })
	            return templateCurrentContext[key]
	        }
	    },
	    // https://github.com/kissyteam/kissy/blob/master/src/path/src/path.js
	    normalizePath: function (pathParts) {
	        var newPathParts = []
	        for (var i = 0; i < pathParts.length; i++) {
	            switch (pathParts[i]) {
	                case '..':
	                    newPathParts.pop()
	                    break
	                case '.':
	                    break
	                default:
	                    newPathParts.push(pathParts[i])
	            }
	        }
	        return newPathParts
	    },
	    splitPathToArray: function (path) {
	        var parts = path.split(/\/+/);
	        if (!parts[parts.length - 1]) parts = parts.slice(0, -1)
	        if (!parts[0]) parts = parts.slice(1)
	        return parts;
	    }
	})

	module.exports = Handler

/***/ }),
/* 2 */
/***/ (function(module, exports) {

	/*
	    ## Constant

	    常量集合。
	 */
	/*
	    RE_KEY
	        'name|min-max': value
	        'name|count': value
	        'name|min-max.dmin-dmax': value
	        'name|min-max.dcount': value
	        'name|count.dmin-dmax': value
	        'name|count.dcount': value
	        'name|+step': value

	        1 name, 2 step, 3 range [ min, max ], 4 drange [ dmin, dmax ]

	    RE_PLACEHOLDER
	        placeholder(*)

	    [正則查看工具](http://www.regexper.com/)

	    #26 生成規則 支持 負數，例如 number|-100-100
	*/
	module.exports = {
	    GUID: 1,
	    RE_KEY: /(.+)\|(?:\+(\d+)|([\+\-]?\d+-?[\+\-]?\d*)?(?:\.(\d+-?\d*))?)/,
	    RE_RANGE: /([\+\-]?\d+)-?([\+\-]?\d+)?/,
	    RE_PLACEHOLDER: /\\*@([^@#%&()\?\s]+)(?:\((.*?)\))?/g
	    // /\\*@([^@#%&()\?\s\/\.]+)(?:\((.*?)\))?/g
	    // RE_INDEX: /^index$/,
	    // RE_KEY: /^key$/
	}

/***/ }),
/* 3 */
/***/ (function(module, exports) {

	/*
	    ## Utilities
	*/
	var Util = {}

	Util.extend = function extend() {
	    var target = arguments[0] || {},
	        i = 1,
	        length = arguments.length,
	        options, name, src, copy, clone

	    if (length === 1) {
	        target = this
	        i = 0
	    }

	    for (; i < length; i++) {
	        options = arguments[i]
	        if (!options) continue

	        for (name in options) {
	            src = target[name]
	            copy = options[name]

	            if (target === copy) continue
	            if (copy === undefined) continue

	            if (Util.isArray(copy) || Util.isObject(copy)) {
	                if (Util.isArray(copy)) clone = src && Util.isArray(src) ? src : []
	                if (Util.isObject(copy)) clone = src && Util.isObject(src) ? src : {}

	                target[name] = Util.extend(clone, copy)
	            } else {
	                target[name] = copy
	            }
	        }
	    }

	    return target
	}

	Util.each = function each(obj, iterator, context) {
	    var i, key
	    if (this.type(obj) === 'number') {
	        for (i = 0; i < obj; i++) {
	            iterator(i, i)
	        }
	    } else if (obj.length === +obj.length) {
	        for (i = 0; i < obj.length; i++) {
	            if (iterator.call(context, obj[i], i, obj) === false) break
	        }
	    } else {
	        for (key in obj) {
	            if (iterator.call(context, obj[key], key, obj) === false) break
	        }
	    }
	}

	Util.type = function type(obj) {
	    return (obj === null || obj === undefined) ? String(obj) : Object.prototype.toString.call(obj).match(/\[object (\w+)\]/)[1].toLowerCase()
	}

	Util.each('String Object Array RegExp Function'.split(' '), function (value) {
	    Util['is' + value] = function (obj) {
	        return Util.type(obj) === value.toLowerCase()
	    }
	})

	Util.isObjectOrArray = function (value) {
	    return Util.isObject(value) || Util.isArray(value)
	}

	Util.isNumeric = function (value) {
	    return !isNaN(parseFloat(value)) && isFinite(value)
	}

	Util.keys = function (obj) {
	    var keys = [];
	    for (var key in obj) {
	        if (obj.hasOwnProperty(key)) keys.push(key)
	    }
	    return keys;
	}
	Util.values = function (obj) {
	    var values = [];
	    for (var key in obj) {
	        if (obj.hasOwnProperty(key)) values.push(obj[key])
	    }
	    return values;
	}

	/*
	    ### Mock.heredoc(fn)

	    * Mock.heredoc(fn)

	    以直觀、安全的方式書寫（多行）HTML 模板。

	    **使用示例**如下所示：

	        var tpl = Mock.heredoc(function() {
	            /*!
	        {{email}}{{age}}
	        <!-- Mock { 
	            email: '@EMAIL',
	            age: '@INT(1,100)'
	        } -->
	            *\/
	        })
	    
	    **相關閱讀**
	    * [Creating multiline strings in JavaScript](http://stackoverflow.com/questions/805107/creating-multiline-strings-in-javascript)、
	*/
	Util.heredoc = function heredoc(fn) {
	    // 1. 移除起始的 function(){ /*!
	    // 2. 移除末尾的 */ }
	    // 3. 移除起始和末尾的空格
	    return fn.toString()
	        .replace(/^[^\/]+\/\*!?/, '')
	        .replace(/\*\/[^\/]+$/, '')
	        .replace(/^[\s\xA0]+/, '').replace(/[\s\xA0]+$/, '') // .trim()
	}

	Util.noop = function () { }

	module.exports = Util

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

	/*
		## Parser

		解析數據模板（屬性名部分）。

		* Parser.parse( name )
			
			```json
			{
				parameters: [ name, inc, range, decimal ],
				rnage: [ min , max ],

				min: min,
				max: max,
				count : count,

				decimal: decimal,
				dmin: dmin,
				dmax: dmax,
				dcount: dcount
			}
			```
	 */

	var Constant = __webpack_require__(2)
	var Random = __webpack_require__(5)

	/* jshint -W041 */
	module.exports = {
		parse: function (name) {
			name = name == undefined ? '' : (name + '')

			var parameters = (name || '').match(Constant.RE_KEY)

			var range = parameters && parameters[3] && parameters[3].match(Constant.RE_RANGE)
			var min = range && range[1] && parseInt(range[1], 10) // || 1
			var max = range && range[2] && parseInt(range[2], 10) // || 1
			// repeat || min-max || 1
			// var count = range ? !range[2] && parseInt(range[1], 10) || Random.integer(min, max) : 1
			var count = range ? !range[2] ? parseInt(range[1], 10) : Random.integer(min, max) : undefined

			var decimal = parameters && parameters[4] && parameters[4].match(Constant.RE_RANGE)
			var dmin = decimal && decimal[1] && parseInt(decimal[1], 10) // || 0,
			var dmax = decimal && decimal[2] && parseInt(decimal[2], 10) // || 0,
			// int || dmin-dmax || 0
			var dcount = decimal ? !decimal[2] && parseInt(decimal[1], 10) || Random.integer(dmin, dmax) : undefined

			var result = {
				// 1 name, 2 inc, 3 range, 4 decimal
				parameters: parameters,
				// 1 min, 2 max
				range: range,
				min: min,
				max: max,
				// min-max
				count: count,
				// 是否有 decimal
				decimal: decimal,
				dmin: dmin,
				dmax: dmax,
				// dmin-dimax
				dcount: dcount
			}

			for (var r in result) {
				if (result[r] != undefined) return result
			}

			return {}
		}
	}

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

	/*
	    ## Mock.Random
	    
	    工具類，用於生成各種隨機數據。
	*/

	var Util = __webpack_require__(3)

	var Random = {
	    extend: Util.extend
	}

	Random.extend(__webpack_require__(6))
	Random.extend(__webpack_require__(7))
	Random.extend(__webpack_require__(8))
	Random.extend(__webpack_require__(10))
	Random.extend(__webpack_require__(13))
	Random.extend(__webpack_require__(15))
	Random.extend(__webpack_require__(16))
	Random.extend(__webpack_require__(17))
	Random.extend(__webpack_require__(14))
	Random.extend(__webpack_require__(19))

	module.exports = Random

/***/ }),
/* 6 */
/***/ (function(module, exports) {

	/*
	    ## Basics
	*/
	module.exports = {
	    // 返回一個隨機的布爾值。
	    boolean: function (min, max, cur) {
	        if (cur !== undefined) {
	            min = typeof min !== 'undefined' && !isNaN(min) ? parseInt(min, 10) : 1
	            max = typeof max !== 'undefined' && !isNaN(max) ? parseInt(max, 10) : 1
	            return Math.random() > 1.0 / (min + max) * min ? !cur : cur
	        }

	        return Math.random() >= 0.5
	    },
	    bool: function (min, max, cur) {
	        return this.boolean(min, max, cur)
	    },
	    // 返回一個隨機的自然數（大於等於 0 的整數）。
	    natural: function (min, max) {
	        min = typeof min !== 'undefined' ? parseInt(min, 10) : 0
	        max = typeof max !== 'undefined' ? parseInt(max, 10) : 9007199254740992 // 2^53
	        return Math.round(Math.random() * (max - min)) + min
	    },
	    // 返回一個隨機的整數。
	    integer: function (min, max) {
	        min = typeof min !== 'undefined' ? parseInt(min, 10) : -9007199254740992
	        max = typeof max !== 'undefined' ? parseInt(max, 10) : 9007199254740992 // 2^53
	        return Math.round(Math.random() * (max - min)) + min
	    },
	    int: function (min, max) {
	        return this.integer(min, max)
	    },
	    // 返回一個隨機的浮點數。
	    float: function (min, max, dmin, dmax) {
	        dmin = dmin === undefined ? 0 : dmin
	        dmin = Math.max(Math.min(dmin, 17), 0)
	        dmax = dmax === undefined ? 17 : dmax
	        dmax = Math.max(Math.min(dmax, 17), 0)
	        var ret = this.integer(min, max) + '.';
	        for (var i = 0, dcount = this.natural(dmin, dmax); i < dcount; i++) {
	            ret += (
	                // 最後一位不能為 0：如果最後一位為 0，會被 JS 引擎忽略掉。
	                (i < dcount - 1) ? this.character('number') : this.character('123456789')
	            )
	        }
	        return parseFloat(ret, 10)
	    },
	    // 返回一個隨機字符。
	    character: function (pool) {
	        var pools = {
	            lower: 'abcdefghijklmnopqrstuvwxyz',
	            upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
	            number: '0123456789',
	            symbol: '!@#$%^&*()[]'
	        }
	        pools.alpha = pools.lower + pools.upper
	        pools['undefined'] = pools.lower + pools.upper + pools.number + pools.symbol

	        pool = pools[('' + pool).toLowerCase()] || pool
	        return pool.charAt(this.natural(0, pool.length - 1))
	    },
	    char: function (pool) {
	        return this.character(pool)
	    },
	    // 返回一個隨機字符串。
	    string: function (pool, min, max) {
	        var len
	        switch (arguments.length) {
	            case 0: // ()
	                len = this.natural(3, 7)
	                break
	            case 1: // ( length )
	                len = pool
	                pool = undefined
	                break
	            case 2:
	                // ( pool, length )
	                if (typeof arguments[0] === 'string') {
	                    len = min
	                } else {
	                    // ( min, max )
	                    len = this.natural(pool, min)
	                    pool = undefined
	                }
	                break
	            case 3:
	                len = this.natural(min, max)
	                break
	        }

	        var text = ''
	        for (var i = 0; i < len; i++) {
	            text += this.character(pool)
	        }

	        return text
	    },
	    str: function ( /*pool, min, max*/) {
	        return this.string.apply(this, arguments)
	    },
	    // 返回一個整型數組。
	    range: function (start, stop, step) {
	        // range( stop )
	        if (arguments.length <= 1) {
	            stop = start || 0;
	            start = 0;
	        }
	        // range( start, stop )
	        step = arguments[2] || 1;

	        start = +start
	        stop = +stop
	        step = +step

	        var len = Math.max(Math.ceil((stop - start) / step), 0);
	        var idx = 0;
	        var range = new Array(len);

	        while (idx < len) {
	            range[idx++] = start;
	            start += step;
	        }

	        return range;
	    }
	}

/***/ }),
/* 7 */
/***/ (function(module, exports) {

	/*
	    ## Date
	*/
	var patternLetters = {
	    yyyy: 'getFullYear',
	    yy: function (date) {
	        return ('' + date.getFullYear()).slice(2)
	    },
	    y: 'yy',

	    MM: function (date) {
	        var m = date.getMonth() + 1
	        return m < 10 ? '0' + m : m
	    },
	    M: function (date) {
	        return date.getMonth() + 1
	    },

	    dd: function (date) {
	        var d = date.getDate()
	        return d < 10 ? '0' + d : d
	    },
	    d: 'getDate',

	    HH: function (date) {
	        var h = date.getHours()
	        return h < 10 ? '0' + h : h
	    },
	    H: 'getHours',
	    hh: function (date) {
	        var h = date.getHours() % 12
	        return h < 10 ? '0' + h : h
	    },
	    h: function (date) {
	        return date.getHours() % 12
	    },

	    mm: function (date) {
	        var m = date.getMinutes()
	        return m < 10 ? '0' + m : m
	    },
	    m: 'getMinutes',

	    ss: function (date) {
	        var s = date.getSeconds()
	        return s < 10 ? '0' + s : s
	    },
	    s: 'getSeconds',

	    SS: function (date) {
	        var ms = date.getMilliseconds()
	        return ms < 10 && '00' + ms || ms < 100 && '0' + ms || ms
	    },
	    S: 'getMilliseconds',

	    A: function (date) {
	        return date.getHours() < 12 ? 'AM' : 'PM'
	    },
	    a: function (date) {
	        return date.getHours() < 12 ? 'am' : 'pm'
	    },
	    T: 'getTime'
	}
	module.exports = {
	    // 日期占位符集合。
	    _patternLetters: patternLetters,
	    // 日期占位符正則。
	    _rformat: new RegExp((function () {
	        var re = []
	        for (var i in patternLetters) re.push(i)
	        return '(' + re.join('|') + ')'
	    })(), 'g'),
	    // 格式化日期。
	    _formatDate: function (date, format) {
	        return format.replace(this._rformat, function creatNewSubString($0, flag) {
	            return typeof patternLetters[flag] === 'function' ? patternLetters[flag](date) :
	                patternLetters[flag] in patternLetters ? creatNewSubString($0, patternLetters[flag]) :
	                    date[patternLetters[flag]]()
	        })
	    },
	    // 生成一個隨機的 Date 對象。
	    _randomDate: function (min, max) { // min, max
	        min = min === undefined ? new Date(0) : min
	        max = max === undefined ? new Date() : max
	        return new Date(Math.random() * (max.getTime() - min.getTime()))
	    },
	    // 返回一個隨機的日期字符串。
	    date: function (format) {
	        format = format || 'yyyy-MM-dd'
	        return this._formatDate(this._randomDate(), format)
	    },
	    // 返回一個隨機的時間字符串。
	    time: function (format) {
	        format = format || 'HH:mm:ss'
	        return this._formatDate(this._randomDate(), format)
	    },
	    // 返回一個隨機的日期和時間字符串。
	    datetime: function (format) {
	        format = format || 'yyyy-MM-dd HH:mm:ss'
	        return this._formatDate(this._randomDate(), format)
	    },
	    // 返回當前的日期和時間字符串。
	    now: function (unit, format) {
	        // now(unit) now(format)
	        if (arguments.length === 1) {
	            // now(format)
	            if (!/year|month|day|hour|minute|second|week/.test(unit)) {
	                format = unit
	                unit = ''
	            }
	        }
	        unit = (unit || '').toLowerCase()
	        format = format || 'yyyy-MM-dd HH:mm:ss'

	        var date = new Date()

	        /* jshint -W086 */
	        // 參考自 http://momentjs.cn/docs/#/manipulating/start-of/
	        switch (unit) {
	            case 'year':
	                date.setMonth(0)
	            case 'month':
	                date.setDate(1)
	            case 'week':
	            case 'day':
	                date.setHours(0)
	            case 'hour':
	                date.setMinutes(0)
	            case 'minute':
	                date.setSeconds(0)
	            case 'second':
	                date.setMilliseconds(0)
	        }
	        switch (unit) {
	            case 'week':
	                date.setDate(date.getDate() - date.getDay())
	        }

	        return this._formatDate(date, format)
	    }
	}

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(module) {/* global document  */
	/*
	    ## Image
	*/
	module.exports = {
	    // 常見的廣告寬高
	    _adSize: [
	        '300x250', '250x250', '240x400', '336x280', '180x150',
	        '720x300', '468x60', '234x60', '88x31', '120x90',
	        '120x60', '120x240', '125x125', '728x90', '160x600',
	        '120x600', '300x600'
	    ],
	    // 常見的屏幕寬高
	    _screenSize: [
	        '320x200', '320x240', '640x480', '800x480', '800x480',
	        '1024x600', '1024x768', '1280x800', '1440x900', '1920x1200',
	        '2560x1600'
	    ],
	    // 常見的視頻寬高
	    _videoSize: ['720x480', '768x576', '1280x720', '1920x1080'],
	    /*
	        生成一個隨機的圖片地址。

	        替代圖片源
	            http://fpoimg.com/
	        參考自 
	            http://rensanning.iteye.com/blog/1933310
	            http://code.tutsplus.com/articles/the-top-8-placeholders-for-web-designers--net-19485
	    */
	    image: function (size, background, foreground, format, text) {
	        // Random.image( size, background, foreground, text )
	        if (arguments.length === 4) {
	            text = format
	            format = undefined
	        }
	        // Random.image( size, background, text )
	        if (arguments.length === 3) {
	            text = foreground
	            foreground = undefined
	        }
	        // Random.image()
	        if (!size) size = this.pick(this._adSize)

	        if (background && ~background.indexOf('#')) background = background.slice(1)
	        if (foreground && ~foreground.indexOf('#')) foreground = foreground.slice(1)

	        // http://dummyimage.com/600x400/cc00cc/470047.png&text=hello
	        return 'http://dummyimage.com/' + size +
	            (background ? '/' + background : '') +
	            (foreground ? '/' + foreground : '') +
	            (format ? '.' + format : '') +
	            (text ? '&text=' + text : '')
	    },
	    img: function () {
	        return this.image.apply(this, arguments)
	    },

	    /*
	        BrandColors
	        http://brandcolors.net/
	        A collection of major brand color codes curated by Galen Gidman.
	        大牌公司的顏色集合

	        // 獲取品牌和顏色
	        $('h2').each(function(index, item){
	            item = $(item)
	            console.log('\'' + item.text() + '\'', ':', '\'' + item.next().text() + '\'', ',')
	        })
	    */
	    _brandColors: {
	        '4ormat': '#fb0a2a',
	        '500px': '#02adea',
	        'About.me (blue)': '#00405d',
	        'About.me (yellow)': '#ffcc33',
	        'Addvocate': '#ff6138',
	        'Adobe': '#ff0000',
	        'Aim': '#fcd20b',
	        'Amazon': '#e47911',
	        'Android': '#a4c639',
	        'Angie\'s List': '#7fbb00',
	        'AOL': '#0060a3',
	        'Atlassian': '#003366',
	        'Behance': '#053eff',
	        'Big Cartel': '#97b538',
	        'bitly': '#ee6123',
	        'Blogger': '#fc4f08',
	        'Boeing': '#0039a6',
	        'Booking.com': '#003580',
	        'Carbonmade': '#613854',
	        'Cheddar': '#ff7243',
	        'Code School': '#3d4944',
	        'Delicious': '#205cc0',
	        'Dell': '#3287c1',
	        'Designmoo': '#e54a4f',
	        'Deviantart': '#4e6252',
	        'Designer News': '#2d72da',
	        'Devour': '#fd0001',
	        'DEWALT': '#febd17',
	        'Disqus (blue)': '#59a3fc',
	        'Disqus (orange)': '#db7132',
	        'Dribbble': '#ea4c89',
	        'Dropbox': '#3d9ae8',
	        'Drupal': '#0c76ab',
	        'Dunked': '#2a323a',
	        'eBay': '#89c507',
	        'Ember': '#f05e1b',
	        'Engadget': '#00bdf6',
	        'Envato': '#528036',
	        'Etsy': '#eb6d20',
	        'Evernote': '#5ba525',
	        'Fab.com': '#dd0017',
	        'Facebook': '#3b5998',
	        'Firefox': '#e66000',
	        'Flickr (blue)': '#0063dc',
	        'Flickr (pink)': '#ff0084',
	        'Forrst': '#5b9a68',
	        'Foursquare': '#25a0ca',
	        'Garmin': '#007cc3',
	        'GetGlue': '#2d75a2',
	        'Gimmebar': '#f70078',
	        'GitHub': '#171515',
	        'Google Blue': '#0140ca',
	        'Google Green': '#16a61e',
	        'Google Red': '#dd1812',
	        'Google Yellow': '#fcca03',
	        'Google+': '#dd4b39',
	        'Grooveshark': '#f77f00',
	        'Groupon': '#82b548',
	        'Hacker News': '#ff6600',
	        'HelloWallet': '#0085ca',
	        'Heroku (light)': '#c7c5e6',
	        'Heroku (dark)': '#6567a5',
	        'HootSuite': '#003366',
	        'Houzz': '#73ba37',
	        'HTML5': '#ec6231',
	        'IKEA': '#ffcc33',
	        'IMDb': '#f3ce13',
	        'Instagram': '#3f729b',
	        'Intel': '#0071c5',
	        'Intuit': '#365ebf',
	        'Kickstarter': '#76cc1e',
	        'kippt': '#e03500',
	        'Kodery': '#00af81',
	        'LastFM': '#c3000d',
	        'LinkedIn': '#0e76a8',
	        'Livestream': '#cf0005',
	        'Lumo': '#576396',
	        'Mixpanel': '#a086d3',
	        'Meetup': '#e51937',
	        'Nokia': '#183693',
	        'NVIDIA': '#76b900',
	        'Opera': '#cc0f16',
	        'Path': '#e41f11',
	        'PayPal (dark)': '#1e477a',
	        'PayPal (light)': '#3b7bbf',
	        'Pinboard': '#0000e6',
	        'Pinterest': '#c8232c',
	        'PlayStation': '#665cbe',
	        'Pocket': '#ee4056',
	        'Prezi': '#318bff',
	        'Pusha': '#0f71b4',
	        'Quora': '#a82400',
	        'QUOTE.fm': '#66ceff',
	        'Rdio': '#008fd5',
	        'Readability': '#9c0000',
	        'Red Hat': '#cc0000',
	        'Resource': '#7eb400',
	        'Rockpack': '#0ba6ab',
	        'Roon': '#62b0d9',
	        'RSS': '#ee802f',
	        'Salesforce': '#1798c1',
	        'Samsung': '#0c4da2',
	        'Shopify': '#96bf48',
	        'Skype': '#00aff0',
	        'Snagajob': '#f47a20',
	        'Softonic': '#008ace',
	        'SoundCloud': '#ff7700',
	        'Space Box': '#f86960',
	        'Spotify': '#81b71a',
	        'Sprint': '#fee100',
	        'Squarespace': '#121212',
	        'StackOverflow': '#ef8236',
	        'Staples': '#cc0000',
	        'Status Chart': '#d7584f',
	        'Stripe': '#008cdd',
	        'StudyBlue': '#00afe1',
	        'StumbleUpon': '#f74425',
	        'T-Mobile': '#ea0a8e',
	        'Technorati': '#40a800',
	        'The Next Web': '#ef4423',
	        'Treehouse': '#5cb868',
	        'Trulia': '#5eab1f',
	        'Tumblr': '#34526f',
	        'Twitch.tv': '#6441a5',
	        'Twitter': '#00acee',
	        'TYPO3': '#ff8700',
	        'Ubuntu': '#dd4814',
	        'Ustream': '#3388ff',
	        'Verizon': '#ef1d1d',
	        'Vimeo': '#86c9ef',
	        'Vine': '#00a478',
	        'Virb': '#06afd8',
	        'Virgin Media': '#cc0000',
	        'Wooga': '#5b009c',
	        'WordPress (blue)': '#21759b',
	        'WordPress (orange)': '#d54e21',
	        'WordPress (grey)': '#464646',
	        'Wunderlist': '#2b88d9',
	        'XBOX': '#9bc848',
	        'XING': '#126567',
	        'Yahoo!': '#720e9e',
	        'Yandex': '#ffcc00',
	        'Yelp': '#c41200',
	        'YouTube': '#c4302b',
	        'Zalongo': '#5498dc',
	        'Zendesk': '#78a300',
	        'Zerply': '#9dcc7a',
	        'Zootool': '#5e8b1d'
	    },
	    _brandNames: function () {
	        var brands = [];
	        for (var b in this._brandColors) {
	            brands.push(b)
	        }
	        return brands
	    },
	    /*
	        生成一段隨機的 Base64 圖片編碼。

	        https://github.com/imsky/holder
	        Holder renders image placeholders entirely on the client side.

	        dataImageHolder: function(size) {
	            return 'holder.js/' + size
	        },
	    */
	    dataImage: function (size, text) {
	        var canvas
	        if (typeof document !== 'undefined') {
	            canvas = document.createElement('canvas')
	        } else {
	            /*
	                https://github.com/Automattic/node-canvas
	                    npm install canvas --save
	                安裝問題：
	                * http://stackoverflow.com/questions/22953206/gulp-issues-with-cario-install-command-not-found-when-trying-to-installing-canva
	                * https://github.com/Automattic/node-canvas/issues/415
	                * https://github.com/Automattic/node-canvas/wiki/_pages

	                PS：node-canvas 的安裝過程實在是太繁瑣了，所以不放入 package.json 的 dependencies。
	             */
	            var Canvas = module.require('canvas')
	            canvas = new Canvas()
	        }

	        var ctx = canvas && canvas.getContext && canvas.getContext("2d")
	        if (!canvas || !ctx) return ''

	        if (!size) size = this.pick(this._adSize)
	        text = text !== undefined ? text : size

	        size = size.split('x')

	        var width = parseInt(size[0], 10),
	            height = parseInt(size[1], 10),
	            background = this._brandColors[this.pick(this._brandNames())],
	            foreground = '#FFF',
	            text_height = 14,
	            font = 'sans-serif';

	        canvas.width = width
	        canvas.height = height
	        ctx.textAlign = 'center'
	        ctx.textBaseline = 'middle'
	        ctx.fillStyle = background
	        ctx.fillRect(0, 0, width, height)
	        ctx.fillStyle = foreground
	        ctx.font = 'bold ' + text_height + 'px ' + font
	        ctx.fillText(text, (width / 2), (height / 2), width)
	        return canvas.toDataURL('image/png')
	    }
	}
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(9)(module)))

/***/ }),
/* 9 */
/***/ (function(module, exports) {

	module.exports = function(module) {
		if(!module.webpackPolyfill) {
			module.deprecate = function() {};
			module.paths = [];
			// module.parent = undefined by default
			module.children = [];
			module.webpackPolyfill = 1;
		}
		return module;
	}


/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

	/*
	    ## Color

	    http://llllll.li/randomColor/
	        A color generator for JavaScript.
	        randomColor generates attractive colors by default. More specifically, randomColor produces bright colors with a reasonably high saturation. This makes randomColor particularly useful for data visualizations and generative art.

	    http://randomcolour.com/
	        var bg_colour = Math.floor(Math.random() * 16777215).toString(16);
	        bg_colour = "#" + ("000000" + bg_colour).slice(-6);
	        document.bgColor = bg_colour;
	    
	    http://martin.ankerl.com/2009/12/09/how-to-create-random-colors-programmatically/
	        Creating random colors is actually more difficult than it seems. The randomness itself is easy, but aesthetically pleasing randomness is more difficult.
	        https://github.com/devongovett/color-generator

	    http://www.paulirish.com/2009/random-hex-color-code-snippets/
	        Random Hex Color Code Generator in JavaScript

	    http://chancejs.com/#color
	        chance.color()
	        // => '#79c157'
	        chance.color({format: 'hex'})
	        // => '#d67118'
	        chance.color({format: 'shorthex'})
	        // => '#60f'
	        chance.color({format: 'rgb'})
	        // => 'rgb(110,52,164)'

	    http://tool.c7sky.com/webcolor
	        網頁設計常用色彩搭配表
	    
	    https://github.com/One-com/one-color
	        An OO-based JavaScript color parser/computation toolkit with support for RGB, HSV, HSL, CMYK, and alpha channels.
	        API 很讚

	    https://github.com/harthur/color
	        JavaScript color conversion and manipulation library

	    https://github.com/leaverou/css-colors
	        Share & convert CSS colors
	    http://leaverou.github.io/css-colors/#slategray
	        Type a CSS color keyword, #hex, hsl(), rgba(), whatever:

	    色調 hue
	        http://baike.baidu.com/view/23368.htm
	        色調指的是一幅畫中畫面色彩的總體傾向，是大的色彩效果。
	    飽和度 saturation
	        http://baike.baidu.com/view/189644.htm
	        飽和度是指色彩的鮮艷程度，也稱色彩的純度。飽和度取決於該色中含色成分和消色成分（灰色）的比例。含色成分越大，飽和度越大；消色成分越大，飽和度越小。
	    亮度 brightness
	        http://baike.baidu.com/view/34773.htm
	        亮度是指發光體（反光體）表面發光（反光）強弱的物理量。
	    照度 luminosity
	        物體被照亮的程度,采用單位面積所接受的光通量來表示,表示單位為勒[克斯](Lux,lx) ,即 1m / m2 。

	    http://stackoverflow.com/questions/1484506/random-color-generator-in-javascript
	        var letters = '0123456789ABCDEF'.split('')
	        var color = '#'
	        for (var i = 0; i < 6; i++) {
	            color += letters[Math.floor(Math.random() * 16)]
	        }
	        return color
	    
	        // 隨機生成一個無腦的顏色，格式為 '#RRGGBB'。
	        // _brainlessColor()
	        var color = Math.floor(
	            Math.random() *
	            (16 * 16 * 16 * 16 * 16 * 16 - 1)
	        ).toString(16)
	        color = "#" + ("000000" + color).slice(-6)
	        return color.toUpperCase()
	*/

	var Convert = __webpack_require__(11)
	var DICT = __webpack_require__(12)

	module.exports = {
	    // 隨機生成一個有吸引力的顏色，格式為 '#RRGGBB'。
	    color: function (name) {
	        if (name || DICT[name]) return DICT[name].nicer
	        return this.hex()
	    },
	    // #DAC0DE
	    hex: function () {
	        var hsv = this._goldenRatioColor()
	        var rgb = Convert.hsv2rgb(hsv)
	        var hex = Convert.rgb2hex(rgb[0], rgb[1], rgb[2])
	        return hex
	    },
	    // rgb(128,255,255)
	    rgb: function () {
	        var hsv = this._goldenRatioColor()
	        var rgb = Convert.hsv2rgb(hsv)
	        return 'rgb(' +
	            parseInt(rgb[0], 10) + ', ' +
	            parseInt(rgb[1], 10) + ', ' +
	            parseInt(rgb[2], 10) + ')'
	    },
	    // rgba(128,255,255,0.3)
	    rgba: function () {
	        var hsv = this._goldenRatioColor()
	        var rgb = Convert.hsv2rgb(hsv)
	        return 'rgba(' +
	            parseInt(rgb[0], 10) + ', ' +
	            parseInt(rgb[1], 10) + ', ' +
	            parseInt(rgb[2], 10) + ', ' +
	            Math.random().toFixed(2) + ')'
	    },
	    // hsl(300,80%,90%)
	    hsl: function () {
	        var hsv = this._goldenRatioColor()
	        var hsl = Convert.hsv2hsl(hsv)
	        return 'hsl(' +
	            parseInt(hsl[0], 10) + ', ' +
	            parseInt(hsl[1], 10) + ', ' +
	            parseInt(hsl[2], 10) + ')'
	    },
	    // http://martin.ankerl.com/2009/12/09/how-to-create-random-colors-programmatically/
	    // https://github.com/devongovett/color-generator/blob/master/index.js
	    // 隨機生成一個有吸引力的顏色。
	    _goldenRatioColor: function (saturation, value) {
	        this._goldenRatio = 0.618033988749895
	        this._hue = this._hue || Math.random()
	        this._hue += this._goldenRatio
	        this._hue %= 1

	        if (typeof saturation !== "number") saturation = 0.5;
	        if (typeof value !== "number") value = 0.95;

	        return [
	            this._hue * 360,
	            saturation * 100,
	            value * 100
	        ]
	    }
	}

/***/ }),
/* 11 */
/***/ (function(module, exports) {

	/*
	    ## Color Convert

	    http://blog.csdn.net/idfaya/article/details/6770414
	        顏色空間RGB與HSV(HSL)的轉換
	*/
	// https://github.com/harthur/color-convert/blob/master/conversions.js
	module.exports = {
		rgb2hsl: function rgb2hsl(rgb) {
			var r = rgb[0] / 255,
				g = rgb[1] / 255,
				b = rgb[2] / 255,
				min = Math.min(r, g, b),
				max = Math.max(r, g, b),
				delta = max - min,
				h, s, l;

			if (max == min)
				h = 0;
			else if (r == max)
				h = (g - b) / delta;
			else if (g == max)
				h = 2 + (b - r) / delta;
			else if (b == max)
				h = 4 + (r - g) / delta;

			h = Math.min(h * 60, 360);

			if (h < 0)
				h += 360;

			l = (min + max) / 2;

			if (max == min)
				s = 0;
			else if (l <= 0.5)
				s = delta / (max + min);
			else
				s = delta / (2 - max - min);

			return [h, s * 100, l * 100];
		},
		rgb2hsv: function rgb2hsv(rgb) {
			var r = rgb[0],
				g = rgb[1],
				b = rgb[2],
				min = Math.min(r, g, b),
				max = Math.max(r, g, b),
				delta = max - min,
				h, s, v;

			if (max === 0)
				s = 0;
			else
				s = (delta / max * 1000) / 10;

			if (max == min)
				h = 0;
			else if (r == max)
				h = (g - b) / delta;
			else if (g == max)
				h = 2 + (b - r) / delta;
			else if (b == max)
				h = 4 + (r - g) / delta;

			h = Math.min(h * 60, 360);

			if (h < 0)
				h += 360;

			v = ((max / 255) * 1000) / 10;

			return [h, s, v];
		},
		hsl2rgb: function hsl2rgb(hsl) {
			var h = hsl[0] / 360,
				s = hsl[1] / 100,
				l = hsl[2] / 100,
				t1, t2, t3, rgb, val;

			if (s === 0) {
				val = l * 255;
				return [val, val, val];
			}

			if (l < 0.5)
				t2 = l * (1 + s);
			else
				t2 = l + s - l * s;
			t1 = 2 * l - t2;

			rgb = [0, 0, 0];
			for (var i = 0; i < 3; i++) {
				t3 = h + 1 / 3 * -(i - 1);
				if (t3 < 0) t3++;
				if (t3 > 1) t3--;

				if (6 * t3 < 1)
					val = t1 + (t2 - t1) * 6 * t3;
				else if (2 * t3 < 1)
					val = t2;
				else if (3 * t3 < 2)
					val = t1 + (t2 - t1) * (2 / 3 - t3) * 6;
				else
					val = t1;

				rgb[i] = val * 255;
			}

			return rgb;
		},
		hsl2hsv: function hsl2hsv(hsl) {
			var h = hsl[0],
				s = hsl[1] / 100,
				l = hsl[2] / 100,
				sv, v;
			l *= 2;
			s *= (l <= 1) ? l : 2 - l;
			v = (l + s) / 2;
			sv = (2 * s) / (l + s);
			return [h, sv * 100, v * 100];
		},
		hsv2rgb: function hsv2rgb(hsv) {
			var h = hsv[0] / 60
			var s = hsv[1] / 100
			var v = hsv[2] / 100
			var hi = Math.floor(h) % 6

			var f = h - Math.floor(h)
			var p = 255 * v * (1 - s)
			var q = 255 * v * (1 - (s * f))
			var t = 255 * v * (1 - (s * (1 - f)))

			v = 255 * v

			switch (hi) {
				case 0:
					return [v, t, p]
				case 1:
					return [q, v, p]
				case 2:
					return [p, v, t]
				case 3:
					return [p, q, v]
				case 4:
					return [t, p, v]
				case 5:
					return [v, p, q]
			}
		},
		hsv2hsl: function hsv2hsl(hsv) {
			var h = hsv[0],
				s = hsv[1] / 100,
				v = hsv[2] / 100,
				sl, l;

			l = (2 - s) * v;
			sl = s * v;
			sl /= (l <= 1) ? l : 2 - l;
			l /= 2;
			return [h, sl * 100, l * 100];
		},
		// http://www.140byt.es/keywords/color
		rgb2hex: function (
			a, // red, as a number from 0 to 255
			b, // green, as a number from 0 to 255
			c // blue, as a number from 0 to 255
		) {
			return "#" + ((256 + a << 8 | b) << 8 | c).toString(16).slice(1)
		},
		hex2rgb: function (
			a // take a "#xxxxxx" hex string,
		) {
			a = '0x' + a.slice(1).replace(a.length > 4 ? a : /./g, '$&$&') | 0;
			return [a >> 16, a >> 8 & 255, a & 255]
		}
	}

/***/ }),
/* 12 */
/***/ (function(module, exports) {

	/*
	    ## Color 字典數據

	    字典數據來源 [A nicer color palette for the web](http://clrs.cc/)
	*/
	module.exports = {
	    // name value nicer
	    navy: {
	        value: '#000080',
	        nicer: '#001F3F'
	    },
	    blue: {
	        value: '#0000ff',
	        nicer: '#0074D9'
	    },
	    aqua: {
	        value: '#00ffff',
	        nicer: '#7FDBFF'
	    },
	    teal: {
	        value: '#008080',
	        nicer: '#39CCCC'
	    },
	    olive: {
	        value: '#008000',
	        nicer: '#3D9970'
	    },
	    green: {
	        value: '#008000',
	        nicer: '#2ECC40'
	    },
	    lime: {
	        value: '#00ff00',
	        nicer: '#01FF70'
	    },
	    yellow: {
	        value: '#ffff00',
	        nicer: '#FFDC00'
	    },
	    orange: {
	        value: '#ffa500',
	        nicer: '#FF851B'
	    },
	    red: {
	        value: '#ff0000',
	        nicer: '#FF4136'
	    },
	    maroon: {
	        value: '#800000',
	        nicer: '#85144B'
	    },
	    fuchsia: {
	        value: '#ff00ff',
	        nicer: '#F012BE'
	    },
	    purple: {
	        value: '#800080',
	        nicer: '#B10DC9'
	    },
	    silver: {
	        value: '#c0c0c0',
	        nicer: '#DDDDDD'
	    },
	    gray: {
	        value: '#808080',
	        nicer: '#AAAAAA'
	    },
	    black: {
	        value: '#000000',
	        nicer: '#111111'
	    },
	    white: {
	        value: '#FFFFFF',
	        nicer: '#FFFFFF'
	    }
	}

/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

	/*
	    ## Text

	    http://www.lipsum.com/
	*/
	var Basic = __webpack_require__(6)
	var Helper = __webpack_require__(14)

	function range(defaultMin, defaultMax, min, max) {
	    return min === undefined ? Basic.natural(defaultMin, defaultMax) : // ()
	        max === undefined ? min : // ( len )
	            Basic.natural(parseInt(min, 10), parseInt(max, 10)) // ( min, max )
	}

	module.exports = {
	    // 隨機生成一段文本。
	    paragraph: function (min, max) {
	        var len = range(3, 7, min, max)
	        var result = []
	        for (var i = 0; i < len; i++) {
	            result.push(this.sentence())
	        }
	        return result.join(' ')
	    },
	    // 
	    cparagraph: function (min, max) {
	        var len = range(3, 7, min, max)
	        var result = []
	        for (var i = 0; i < len; i++) {
	            result.push(this.csentence())
	        }
	        return result.join('')
	    },
	    // 隨機生成一個句子，第一個單詞的首字母大寫。
	    sentence: function (min, max) {
	        var len = range(12, 18, min, max)
	        var result = []
	        for (var i = 0; i < len; i++) {
	            result.push(this.word())
	        }
	        return Helper.capitalize(result.join(' ')) + '.'
	    },
	    // 隨機生成一個中文句子。
	    csentence: function (min, max) {
	        var len = range(12, 18, min, max)
	        var result = []
	        for (var i = 0; i < len; i++) {
	            result.push(this.cword())
	        }

	        return result.join('') + '。'
	    },
	    // 隨機生成一個單詞。
	    word: function (min, max) {
	        var len = range(3, 10, min, max)
	        var result = '';
	        for (var i = 0; i < len; i++) {
	            result += Basic.character('lower')
	        }
	        return result
	    },
	    // 隨機生成一個或多個漢字。
	    cword: function (pool, min, max) {
	        // 最常用的 500 個漢字 http://baike.baidu.com/view/568436.htm
	        var DICT_KANZI = '的一是在不了有和人這中大為上個國我以要他時來用們生到作地於出就分對成會可主發年動同工也能下過子說產種面而方後多定行學法所民得經十三之進著等部度家電力裏如水化高自二理起小物現實加量都兩體制機當使點從業本去把性好應開它合還因由其些然前外天政四日那社義事平形相全表間樣與關各重新線內數正心反你明看原又麽利比或但質氣第向道命此變條只沒結解問意建月公無系軍很情者最立代想已通並提直題黨程展五果料象員革位入常文總次品式活設及管特件長求老頭基資邊流路級少圖山統接知較將組見計別她手角期根論運農指幾九區強放決西被幹做必戰先回則任取據處隊南給色光門即保治北造百規熱領七海口東導器壓志世金增爭濟階油思術極交受聯什認六共權收證改清己美再采轉更單風切打白教速花帶安場身車例真務具萬每目至達走積示議聲報鬥完類八離華名確才科張信馬節話米整空元況今集溫傳土許步群廣石記需段研界拉林律叫且究觀越織裝影算低持音眾書布覆容兒須際商非驗連斷深難近礦千周委素技備半辦青省列習響約支般史感勞便團往酸歷市克何除消構府稱太準精值號率族維劃選標寫存候毛親快效斯院查江型眼王按格養易置派層片始卻專狀育廠京識適屬圓包火住調滿縣局照參紅細引聽該鐵價嚴龍飛'

	        var len
	        switch (arguments.length) {
	            case 0: // ()
	                pool = DICT_KANZI
	                len = 1
	                break
	            case 1: // ( pool )
	                if (typeof arguments[0] === 'string') {
	                    len = 1
	                } else {
	                    // ( length )
	                    len = pool
	                    pool = DICT_KANZI
	                }
	                break
	            case 2:
	                // ( pool, length )
	                if (typeof arguments[0] === 'string') {
	                    len = min
	                } else {
	                    // ( min, max )
	                    len = this.natural(pool, min)
	                    pool = DICT_KANZI
	                }
	                break
	            case 3:
	                len = this.natural(min, max)
	                break
	        }

	        var result = ''
	        for (var i = 0; i < len; i++) {
	            result += pool.charAt(this.natural(0, pool.length - 1))
	        }
	        return result
	    },
	    // 隨機生成一句標題，其中每個單詞的首字母大寫。
	    title: function (min, max) {
	        var len = range(3, 7, min, max)
	        var result = []
	        for (var i = 0; i < len; i++) {
	            result.push(this.capitalize(this.word()))
	        }
	        return result.join(' ')
	    },
	    // 隨機生成一句中文標題。
	    ctitle: function (min, max) {
	        var len = range(3, 7, min, max)
	        var result = []
	        for (var i = 0; i < len; i++) {
	            result.push(this.cword())
	        }
	        return result.join('')
	    }
	}

/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

	/*
	    ## Helpers
	*/

	var Util = __webpack_require__(3)

	module.exports = {
		// 把字符串的第一個字母轉換為大寫。
		capitalize: function (word) {
			return (word + '').charAt(0).toUpperCase() + (word + '').substr(1)
		},
		// 把字符串轉換為大寫。
		upper: function (str) {
			return (str + '').toUpperCase()
		},
		// 把字符串轉換為小寫。
		lower: function (str) {
			return (str + '').toLowerCase()
		},
		// 從數組中隨機選取一個元素，並返回。
		pick: function pick(arr, min, max) {
			// pick( item1, item2 ... )
			if (!Util.isArray(arr)) {
				arr = [].slice.call(arguments)
				min = 1
				max = 1
			} else {
				// pick( [ item1, item2 ... ] )
				if (min === undefined) min = 1

				// pick( [ item1, item2 ... ], count )
				if (max === undefined) max = min
			}

			if (min === 1 && max === 1) return arr[this.natural(0, arr.length - 1)]

			// pick( [ item1, item2 ... ], min, max )
			return this.shuffle(arr, min, max)

			// 通過參數個數判斷方法簽名，擴展性太差！#90
			// switch (arguments.length) {
			// 	case 1:
			// 		// pick( [ item1, item2 ... ] )
			// 		return arr[this.natural(0, arr.length - 1)]
			// 	case 2:
			// 		// pick( [ item1, item2 ... ], count )
			// 		max = min
			// 			/* falls through */
			// 	case 3:
			// 		// pick( [ item1, item2 ... ], min, max )
			// 		return this.shuffle(arr, min, max)
			// }
		},
		/*
		    打亂數組中元素的順序，並返回。
		    Given an array, scramble the order and return it.

		    其他的實現思路：
		        // https://code.google.com/p/jslibs/wiki/JavascriptTips
		        result = result.sort(function() {
		            return Math.random() - 0.5
		        })
		*/
		shuffle: function shuffle(arr, min, max) {
			arr = arr || []
			var old = arr.slice(0),
				result = [],
				index = 0,
				length = old.length;
			for (var i = 0; i < length; i++) {
				index = this.natural(0, old.length - 1)
				result.push(old[index])
				old.splice(index, 1)
			}
			switch (arguments.length) {
				case 0:
				case 1:
					return result
				case 2:
					max = min
				/* falls through */
				case 3:
					min = parseInt(min, 10)
					max = parseInt(max, 10)
					return result.slice(0, this.natural(min, max))
			}
		},
		/*
		    * Random.order(item, item)
		    * Random.order([item, item ...])

		    順序獲取數組中的元素

		    [JSON導入數組支持數組數據錄入](https://github.com/thx/RAP/issues/22)

		    不支持單獨調用！
		*/
		order: function order(array) {
			order.cache = order.cache || {}

			if (arguments.length > 1) array = [].slice.call(arguments, 0)

			// options.context.path/templatePath
			var options = order.options
			var templatePath = options.context.templatePath.join('.')

			var cache = (
				order.cache[templatePath] = order.cache[templatePath] || {
					index: 0,
					array: array
				}
			)

			return cache.array[cache.index++ % cache.array.length]
		}
	}

/***/ }),
/* 15 */
/***/ (function(module, exports) {

	/*
	    ## Name

	    [Beyond the Top 1000 Names](http://www.ssa.gov/oact/babynames/limits.html)
	*/
	module.exports = {
		// 隨機生成一個常見的英文名。
		first: function () {
			var names = [
				// male
				"James", "John", "Robert", "Michael", "William",
				"David", "Richard", "Charles", "Joseph", "Thomas",
				"Christopher", "Daniel", "Paul", "Mark", "Donald",
				"George", "Kenneth", "Steven", "Edward", "Brian",
				"Ronald", "Anthony", "Kevin", "Jason", "Matthew",
				"Gary", "Timothy", "Jose", "Larry", "Jeffrey",
				"Frank", "Scott", "Eric"
			].concat([
				// female
				"Mary", "Patricia", "Linda", "Barbara", "Elizabeth",
				"Jennifer", "Maria", "Susan", "Margaret", "Dorothy",
				"Lisa", "Nancy", "Karen", "Betty", "Helen",
				"Sandra", "Donna", "Carol", "Ruth", "Sharon",
				"Michelle", "Laura", "Sarah", "Kimberly", "Deborah",
				"Jessica", "Shirley", "Cynthia", "Angela", "Melissa",
				"Brenda", "Amy", "Anna"
			])
			return this.pick(names)
			// or this.capitalize(this.word())
		},
		// 隨機生成一個常見的英文姓。
		last: function () {
			var names = [
				"Smith", "Johnson", "Williams", "Brown", "Jones",
				"Miller", "Davis", "Garcia", "Rodriguez", "Wilson",
				"Martinez", "Anderson", "Taylor", "Thomas", "Hernandez",
				"Moore", "Martin", "Jackson", "Thompson", "White",
				"Lopez", "Lee", "Gonzalez", "Harris", "Clark",
				"Lewis", "Robinson", "Walker", "Perez", "Hall",
				"Young", "Allen"
			]
			return this.pick(names)
			// or this.capitalize(this.word())
		},
		// 隨機生成一個常見的英文姓名。
		name: function (middle) {
			return this.first() + ' ' +
				(middle ? this.first() + ' ' : '') +
				this.last()
		},
		/*
		    隨機生成一個常見的中文姓。
		    [世界常用姓氏排行](http://baike.baidu.com/view/1719115.htm)
		    [玄派網 - 網絡小說創作輔助平台](http://xuanpai.sinaapp.com/)
		 */
		cfirst: function () {
			var names = (
				'王 李 張 劉 陳 楊 趙 黃 周 吳 ' +
				'徐 孫 胡 朱 高 林 何 郭 馬 羅 ' +
				'梁 宋 鄭 謝 韓 唐 馮 於 董 蕭 ' +
				'程 曹 袁 鄧 許 傅 沈 曾 彭 呂 ' +
				'蘇 盧 蔣 蔡 賈 丁 魏 薛 葉 閻 ' +
				'余 潘 杜 戴 夏 鍾 汪 田 任 姜 ' +
				'範 方 石 姚 譚 廖 鄒 熊 金 陸 ' +
				'郝 孔 白 崔 康 毛 邱 秦 江 史 ' +
				'顧 侯 邵 孟 龍 萬 段 雷 錢 湯 ' +
				'尹 黎 易 常 武 喬 賀 賴 龔 文'
			).split(' ')
			return this.pick(names)
		},
		/*
		    隨機生成一個常見的中文名。
		    [中國最常見名字前50名_三九算命網](http://www.name999.net/xingming/xingshi/20131004/48.html)
		 */
		clast: function () {
			var names = (
				'家豪 淑芬 承恩 秀英 宥廷 詠晴 俊傑 強 磊 建宏 ' +
				'俊宏 志強 美玲 喬 娟 雅婷 美惠 超 秀蘭 霞 ' +
				'羽 怡君 麗華 語彤 柏翰 欣妤 品睿 品妍 思妤 宇翔'
			).split(' ')
			return this.pick(names)
		},
		// 隨機生成一個常見的中文姓名。
		cname: function () {
			return this.cfirst() + this.clast()
		}
	}

/***/ }),
/* 16 */
/***/ (function(module, exports) {

	/*
	    ## Web
	*/
	module.exports = {
	    /*
	        隨機生成一個 URL。

	        [URL 規範](http://www.w3.org/Addressing/URL/url-spec.txt)
	            http                    Hypertext Transfer Protocol 
	            ftp                     File Transfer protocol 
	            gopher                  The Gopher protocol 
	            mailto                  Electronic mail address 
	            mid                     Message identifiers for electronic mail 
	            cid                     Content identifiers for MIME body part 
	            news                    Usenet news 
	            nntp                    Usenet news for local NNTP access only 
	            prospero                Access using the prospero protocols 
	            telnet rlogin tn3270    Reference to interactive sessions
	            wais                    Wide Area Information Servers 
	    */
	    url: function (protocol, host) {
	        return (protocol || this.protocol()) + '://' + // protocol?
	            (host || this.domain()) + // host?
	            '/' + this.word()
	    },
	    // 隨機生成一個 URL 協議。
	    protocol: function () {
	        return this.pick(
	            // 協議簇
	            'http ftp gopher mailto mid cid news nntp prospero telnet rlogin tn3270 wais'.split(' ')
	        )
	    },
	    // 隨機生成一個域名。
	    domain: function (tld) {
	        return this.word() + '.' + (tld || this.tld())
	    },
	    /*
	        隨機生成一個頂級域名。
	        國際頂級域名 international top-level domain-names, iTLDs
	        國家頂級域名 national top-level domainnames, nTLDs
	        [域名後綴大全](http://www.163ns.com/zixun/post/4417.html)
	    */
	    tld: function () { // Top Level Domain
	        return this.pick(
	            (
	                // 域名後綴
	                'com net org edu gov int mil cn ' +
	                // 國內域名
	                'com.cn net.cn gov.cn org.cn ' +
	                // 中文國內域名
	                '中國 中國互聯.公司 中國互聯.網絡 ' +
	                // 新國際域名
	                'tel biz cc tv info name hk mobi asia cd travel pro museum coop aero ' +
	                // 世界各國域名後綴
	                'ad ae af ag ai al am an ao aq ar as at au aw az ba bb bd be bf bg bh bi bj bm bn bo br bs bt bv bw by bz ca cc cf cg ch ci ck cl cm cn co cq cr cu cv cx cy cz de dj dk dm do dz ec ee eg eh es et ev fi fj fk fm fo fr ga gb gd ge gf gh gi gl gm gn gp gr gt gu gw gy hk hm hn hr ht hu id ie il in io iq ir is it jm jo jp ke kg kh ki km kn kp kr kw ky kz la lb lc li lk lr ls lt lu lv ly ma mc md mg mh ml mm mn mo mp mq mr ms mt mv mw mx my mz na nc ne nf ng ni nl no np nr nt nu nz om qa pa pe pf pg ph pk pl pm pn pr pt pw py re ro ru rw sa sb sc sd se sg sh si sj sk sl sm sn so sr st su sy sz tc td tf tg th tj tk tm tn to tp tr tt tv tw tz ua ug uk us uy va vc ve vg vn vu wf ws ye yu za zm zr zw'
	            ).split(' ')
	        )
	    },
	    // 隨機生成一個郵件地址。
	    email: function (domain) {
	        return this.character('lower') + '.' + this.word() + '@' +
	            (
	                domain ||
	                (this.word() + '.' + this.tld())
	            )
	        // return this.character('lower') + '.' + this.last().toLowerCase() + '@' + this.last().toLowerCase() + '.' + this.tld()
	        // return this.word() + '@' + (domain || this.domain())
	    },
	    // 隨機生成一個 IP 地址。
	    ip: function () {
	        return this.natural(0, 255) + '.' +
	            this.natural(0, 255) + '.' +
	            this.natural(0, 255) + '.' +
	            this.natural(0, 255)
	    }
	}

/***/ }),
/* 17 */
/***/ (function(module, exports, __webpack_require__) {

	/*
	    ## Address
	*/

	var DICT = __webpack_require__(18)
	var REGION = ['東北', '華北', '華東', '華中', '華南', '西南', '西北']

	module.exports = {
	    // 隨機生成一個大區。
	    region: function () {
	        return this.pick(REGION)
	    },
	    // 隨機生成一個（中國）省（或直轄市、自治區、特別行政區）。
	    province: function () {
	        return this.pick(DICT).name
	    },
	    // 隨機生成一個（中國）市。
	    city: function (prefix) {
	        var province = this.pick(DICT)
	        var city = this.pick(province.children)
	        return prefix ? [province.name, city.name].join(' ') : city.name
	    },
	    // 隨機生成一個（中國）縣。
	    county: function (prefix) {
	        var province = this.pick(DICT)
	        var city = this.pick(province.children)
	        var county = this.pick(city.children) || {
	            name: '-'
	        }
	        return prefix ? [province.name, city.name, county.name].join(' ') : county.name
	    },
	    // 隨機生成一個郵政編碼（六位數字）。
	    zip: function (len) {
	        var zip = ''
	        for (var i = 0; i < (len || 6); i++) zip += this.natural(0, 9)
	        return zip
	    }

	    // address: function() {},
	    // phone: function() {},
	    // areacode: function() {},
	    // street: function() {},
	    // street_suffixes: function() {},
	    // street_suffix: function() {},
	    // states: function() {},
	    // state: function() {},
	}

/***/ }),
/* 18 */
/***/ (function(module, exports) {

	/*
	    ## Address 字典數據

	    字典數據來源 http://www.atatech.org/articles/30028?rnd=254259856

	    國標 省（市）級行政區劃碼表

	    華北   北京市 天津市 河北省 山西省 內蒙古自治區
	    東北   遼寧省 吉林省 黑龍江省
	    華東   上海市 江蘇省 浙江省 安徽省 福建省 江西省 山東省
	    華南   廣東省 廣西壯族自治區 海南省
	    華中   河南省 湖北省 湖南省
	    西南   重慶市 四川省 貴州省 雲南省 西藏自治區
	    西北   陜西省 甘肅省 青海省 寧夏回族自治區 新疆維吾爾自治區
	    港澳台 香港特別行政區 澳門特別行政區 台灣省
	    
	    **排序**
	    
	    ```js
	    var map = {}
	    _.each(_.keys(REGIONS),function(id){
	      map[id] = REGIONS[ID]
	    })
	    JSON.stringify(map)
	    ```
	*/
	var DICT = {
	    "110000": "北京",
	    "110100": "北京市",
	    "110101": "東城區",
	    "110102": "西城區",
	    "110105": "朝陽區",
	    "110106": "豐台區",
	    "110107": "石景山區",
	    "110108": "海澱區",
	    "110109": "門頭溝區",
	    "110111": "房山區",
	    "110112": "通州區",
	    "110113": "順義區",
	    "110114": "昌平區",
	    "110115": "大興區",
	    "110116": "懷柔區",
	    "110117": "平谷區",
	    "110228": "密雲縣",
	    "110229": "延慶縣",
	    "110230": "其它區",
	    "120000": "天津",
	    "120100": "天津市",
	    "120101": "和平區",
	    "120102": "河東區",
	    "120103": "河西區",
	    "120104": "南開區",
	    "120105": "河北區",
	    "120106": "紅橋區",
	    "120110": "東麗區",
	    "120111": "西青區",
	    "120112": "津南區",
	    "120113": "北辰區",
	    "120114": "武清區",
	    "120115": "寶坻區",
	    "120116": "濱海新區",
	    "120221": "寧河縣",
	    "120223": "靜海縣",
	    "120225": "薊縣",
	    "120226": "其它區",
	    "130000": "河北省",
	    "130100": "石家莊市",
	    "130102": "長安區",
	    "130103": "橋東區",
	    "130104": "橋西區",
	    "130105": "新華區",
	    "130107": "井陘礦區",
	    "130108": "裕華區",
	    "130121": "井陘縣",
	    "130123": "正定縣",
	    "130124": "欒城縣",
	    "130125": "行唐縣",
	    "130126": "靈壽縣",
	    "130127": "高邑縣",
	    "130128": "深澤縣",
	    "130129": "讚皇縣",
	    "130130": "無極縣",
	    "130131": "平山縣",
	    "130132": "元氏縣",
	    "130133": "趙縣",
	    "130181": "辛集市",
	    "130182": "槁城市",
	    "130183": "晉州市",
	    "130184": "新樂市",
	    "130185": "鹿泉市",
	    "130186": "其它區",
	    "130200": "唐山市",
	    "130202": "路南區",
	    "130203": "路北區",
	    "130204": "古冶區",
	    "130205": "開平區",
	    "130207": "豐南區",
	    "130208": "豐潤區",
	    "130223": "灤縣",
	    "130224": "灤南縣",
	    "130225": "樂亭縣",
	    "130227": "遷西縣",
	    "130229": "玉田縣",
	    "130230": "曹妃甸區",
	    "130281": "遵化市",
	    "130283": "遷安市",
	    "130284": "其它區",
	    "130300": "秦皇島市",
	    "130302": "海港區",
	    "130303": "山海關區",
	    "130304": "北戴河區",
	    "130321": "青龍滿族自治縣",
	    "130322": "昌黎縣",
	    "130323": "撫寧縣",
	    "130324": "盧龍縣",
	    "130398": "其它區",
	    "130400": "邯鄲市",
	    "130402": "邯山區",
	    "130403": "叢台區",
	    "130404": "覆興區",
	    "130406": "峰峰礦區",
	    "130421": "邯鄲縣",
	    "130423": "臨漳縣",
	    "130424": "成安縣",
	    "130425": "大名縣",
	    "130426": "涉縣",
	    "130427": "磁縣",
	    "130428": "肥鄉縣",
	    "130429": "永年縣",
	    "130430": "邱縣",
	    "130431": "雞澤縣",
	    "130432": "廣平縣",
	    "130433": "館陶縣",
	    "130434": "魏縣",
	    "130435": "曲周縣",
	    "130481": "武安市",
	    "130482": "其它區",
	    "130500": "邢台市",
	    "130502": "橋東區",
	    "130503": "橋西區",
	    "130521": "邢台縣",
	    "130522": "臨城縣",
	    "130523": "內丘縣",
	    "130524": "柏鄉縣",
	    "130525": "隆堯縣",
	    "130526": "任縣",
	    "130527": "南和縣",
	    "130528": "寧晉縣",
	    "130529": "巨鹿縣",
	    "130530": "新河縣",
	    "130531": "廣宗縣",
	    "130532": "平鄉縣",
	    "130533": "威縣",
	    "130534": "清河縣",
	    "130535": "臨西縣",
	    "130581": "南宮市",
	    "130582": "沙河市",
	    "130583": "其它區",
	    "130600": "保定市",
	    "130602": "新市區",
	    "130603": "北市區",
	    "130604": "南市區",
	    "130621": "滿城縣",
	    "130622": "清苑縣",
	    "130623": "淶水縣",
	    "130624": "阜平縣",
	    "130625": "徐水縣",
	    "130626": "定興縣",
	    "130627": "唐縣",
	    "130628": "高陽縣",
	    "130629": "容城縣",
	    "130630": "淶源縣",
	    "130631": "望都縣",
	    "130632": "安新縣",
	    "130633": "易縣",
	    "130634": "曲陽縣",
	    "130635": "蠡縣",
	    "130636": "順平縣",
	    "130637": "博野縣",
	    "130638": "雄縣",
	    "130681": "涿州市",
	    "130682": "定州市",
	    "130683": "安國市",
	    "130684": "高碑店市",
	    "130699": "其它區",
	    "130700": "張家口市",
	    "130702": "橋東區",
	    "130703": "橋西區",
	    "130705": "宣化區",
	    "130706": "下花園區",
	    "130721": "宣化縣",
	    "130722": "張北縣",
	    "130723": "康保縣",
	    "130724": "沽源縣",
	    "130725": "尚義縣",
	    "130726": "蔚縣",
	    "130727": "陽原縣",
	    "130728": "懷安縣",
	    "130729": "萬全縣",
	    "130730": "懷來縣",
	    "130731": "涿鹿縣",
	    "130732": "赤城縣",
	    "130733": "崇禮縣",
	    "130734": "其它區",
	    "130800": "承德市",
	    "130802": "雙橋區",
	    "130803": "雙灤區",
	    "130804": "鷹手營子礦區",
	    "130821": "承德縣",
	    "130822": "興隆縣",
	    "130823": "平泉縣",
	    "130824": "灤平縣",
	    "130825": "隆化縣",
	    "130826": "豐寧滿族自治縣",
	    "130827": "寬城滿族自治縣",
	    "130828": "圍場滿族蒙古族自治縣",
	    "130829": "其它區",
	    "130900": "滄州市",
	    "130902": "新華區",
	    "130903": "運河區",
	    "130921": "滄縣",
	    "130922": "青縣",
	    "130923": "東光縣",
	    "130924": "海興縣",
	    "130925": "鹽山縣",
	    "130926": "肅寧縣",
	    "130927": "南皮縣",
	    "130928": "吳橋縣",
	    "130929": "獻縣",
	    "130930": "孟村回族自治縣",
	    "130981": "泊頭市",
	    "130982": "任丘市",
	    "130983": "黃驊市",
	    "130984": "河間市",
	    "130985": "其它區",
	    "131000": "廊坊市",
	    "131002": "安次區",
	    "131003": "廣陽區",
	    "131022": "固安縣",
	    "131023": "永清縣",
	    "131024": "香河縣",
	    "131025": "大城縣",
	    "131026": "文安縣",
	    "131028": "大廠回族自治縣",
	    "131081": "霸州市",
	    "131082": "三河市",
	    "131083": "其它區",
	    "131100": "衡水市",
	    "131102": "桃城區",
	    "131121": "棗強縣",
	    "131122": "武邑縣",
	    "131123": "武強縣",
	    "131124": "饒陽縣",
	    "131125": "安平縣",
	    "131126": "故城縣",
	    "131127": "景縣",
	    "131128": "阜城縣",
	    "131181": "冀州市",
	    "131182": "深州市",
	    "131183": "其它區",
	    "140000": "山西省",
	    "140100": "太原市",
	    "140105": "小店區",
	    "140106": "迎澤區",
	    "140107": "杏花嶺區",
	    "140108": "尖草坪區",
	    "140109": "萬柏林區",
	    "140110": "晉源區",
	    "140121": "清徐縣",
	    "140122": "陽曲縣",
	    "140123": "婁煩縣",
	    "140181": "古交市",
	    "140182": "其它區",
	    "140200": "大同市",
	    "140202": "城區",
	    "140203": "礦區",
	    "140211": "南郊區",
	    "140212": "新榮區",
	    "140221": "陽高縣",
	    "140222": "天鎮縣",
	    "140223": "廣靈縣",
	    "140224": "靈丘縣",
	    "140225": "渾源縣",
	    "140226": "左雲縣",
	    "140227": "大同縣",
	    "140228": "其它區",
	    "140300": "陽泉市",
	    "140302": "城區",
	    "140303": "礦區",
	    "140311": "郊區",
	    "140321": "平定縣",
	    "140322": "盂縣",
	    "140323": "其它區",
	    "140400": "長治市",
	    "140421": "長治縣",
	    "140423": "襄垣縣",
	    "140424": "屯留縣",
	    "140425": "平順縣",
	    "140426": "黎城縣",
	    "140427": "壺關縣",
	    "140428": "長子縣",
	    "140429": "武鄉縣",
	    "140430": "沁縣",
	    "140431": "沁源縣",
	    "140481": "潞城市",
	    "140482": "城區",
	    "140483": "郊區",
	    "140485": "其它區",
	    "140500": "晉城市",
	    "140502": "城區",
	    "140521": "沁水縣",
	    "140522": "陽城縣",
	    "140524": "陵川縣",
	    "140525": "澤州縣",
	    "140581": "高平市",
	    "140582": "其它區",
	    "140600": "朔州市",
	    "140602": "朔城區",
	    "140603": "平魯區",
	    "140621": "山陰縣",
	    "140622": "應縣",
	    "140623": "右玉縣",
	    "140624": "懷仁縣",
	    "140625": "其它區",
	    "140700": "晉中市",
	    "140702": "榆次區",
	    "140721": "榆社縣",
	    "140722": "左權縣",
	    "140723": "和順縣",
	    "140724": "昔陽縣",
	    "140725": "壽陽縣",
	    "140726": "太谷縣",
	    "140727": "祁縣",
	    "140728": "平遙縣",
	    "140729": "靈石縣",
	    "140781": "介休市",
	    "140782": "其它區",
	    "140800": "運城市",
	    "140802": "鹽湖區",
	    "140821": "臨猗縣",
	    "140822": "萬榮縣",
	    "140823": "聞喜縣",
	    "140824": "稷山縣",
	    "140825": "新絳縣",
	    "140826": "絳縣",
	    "140827": "垣曲縣",
	    "140828": "夏縣",
	    "140829": "平陸縣",
	    "140830": "芮城縣",
	    "140881": "永濟市",
	    "140882": "河津市",
	    "140883": "其它區",
	    "140900": "忻州市",
	    "140902": "忻府區",
	    "140921": "定襄縣",
	    "140922": "五台縣",
	    "140923": "代縣",
	    "140924": "繁峙縣",
	    "140925": "寧武縣",
	    "140926": "靜樂縣",
	    "140927": "神池縣",
	    "140928": "五寨縣",
	    "140929": "岢嵐縣",
	    "140930": "河曲縣",
	    "140931": "保德縣",
	    "140932": "偏關縣",
	    "140981": "原平市",
	    "140982": "其它區",
	    "141000": "臨汾市",
	    "141002": "堯都區",
	    "141021": "曲沃縣",
	    "141022": "翼城縣",
	    "141023": "襄汾縣",
	    "141024": "洪洞縣",
	    "141025": "古縣",
	    "141026": "安澤縣",
	    "141027": "浮山縣",
	    "141028": "吉縣",
	    "141029": "鄉寧縣",
	    "141030": "大寧縣",
	    "141031": "隰縣",
	    "141032": "永和縣",
	    "141033": "蒲縣",
	    "141034": "汾西縣",
	    "141081": "侯馬市",
	    "141082": "霍州市",
	    "141083": "其它區",
	    "141100": "呂梁市",
	    "141102": "離石區",
	    "141121": "文水縣",
	    "141122": "交城縣",
	    "141123": "興縣",
	    "141124": "臨縣",
	    "141125": "柳林縣",
	    "141126": "石樓縣",
	    "141127": "嵐縣",
	    "141128": "方山縣",
	    "141129": "中陽縣",
	    "141130": "交口縣",
	    "141181": "孝義市",
	    "141182": "汾陽市",
	    "141183": "其它區",
	    "150000": "內蒙古自治區",
	    "150100": "呼和浩特市",
	    "150102": "新城區",
	    "150103": "回民區",
	    "150104": "玉泉區",
	    "150105": "賽罕區",
	    "150121": "土默特左旗",
	    "150122": "托克托縣",
	    "150123": "和林格爾縣",
	    "150124": "清水河縣",
	    "150125": "武川縣",
	    "150126": "其它區",
	    "150200": "包頭市",
	    "150202": "東河區",
	    "150203": "昆都侖區",
	    "150204": "青山區",
	    "150205": "石拐區",
	    "150206": "白雲鄂博礦區",
	    "150207": "九原區",
	    "150221": "土默特右旗",
	    "150222": "固陽縣",
	    "150223": "達爾罕茂明安聯合旗",
	    "150224": "其它區",
	    "150300": "烏海市",
	    "150302": "海勃灣區",
	    "150303": "海南區",
	    "150304": "烏達區",
	    "150305": "其它區",
	    "150400": "赤峰市",
	    "150402": "紅山區",
	    "150403": "元寶山區",
	    "150404": "松山區",
	    "150421": "阿魯科爾沁旗",
	    "150422": "巴林左旗",
	    "150423": "巴林右旗",
	    "150424": "林西縣",
	    "150425": "克什克騰旗",
	    "150426": "翁牛特旗",
	    "150428": "喀喇沁旗",
	    "150429": "寧城縣",
	    "150430": "敖漢旗",
	    "150431": "其它區",
	    "150500": "通遼市",
	    "150502": "科爾沁區",
	    "150521": "科爾沁左翼中旗",
	    "150522": "科爾沁左翼後旗",
	    "150523": "開魯縣",
	    "150524": "庫倫旗",
	    "150525": "奈曼旗",
	    "150526": "紮魯特旗",
	    "150581": "霍林郭勒市",
	    "150582": "其它區",
	    "150600": "鄂爾多斯市",
	    "150602": "東勝區",
	    "150621": "達拉特旗",
	    "150622": "準格爾旗",
	    "150623": "鄂托克前旗",
	    "150624": "鄂托克旗",
	    "150625": "杭錦旗",
	    "150626": "烏審旗",
	    "150627": "伊金霍洛旗",
	    "150628": "其它區",
	    "150700": "呼倫貝爾市",
	    "150702": "海拉爾區",
	    "150703": "紮賚諾爾區",
	    "150721": "阿榮旗",
	    "150722": "莫力達瓦達斡爾族自治旗",
	    "150723": "鄂倫春自治旗",
	    "150724": "鄂溫克族自治旗",
	    "150725": "陳巴爾虎旗",
	    "150726": "新巴爾虎左旗",
	    "150727": "新巴爾虎右旗",
	    "150781": "滿洲裏市",
	    "150782": "牙克石市",
	    "150783": "紮蘭屯市",
	    "150784": "額爾古納市",
	    "150785": "根河市",
	    "150786": "其它區",
	    "150800": "巴彥淖爾市",
	    "150802": "臨河區",
	    "150821": "五原縣",
	    "150822": "磴口縣",
	    "150823": "烏拉特前旗",
	    "150824": "烏拉特中旗",
	    "150825": "烏拉特後旗",
	    "150826": "杭錦後旗",
	    "150827": "其它區",
	    "150900": "烏蘭察布市",
	    "150902": "集寧區",
	    "150921": "卓資縣",
	    "150922": "化德縣",
	    "150923": "商都縣",
	    "150924": "興和縣",
	    "150925": "涼城縣",
	    "150926": "察哈爾右翼前旗",
	    "150927": "察哈爾右翼中旗",
	    "150928": "察哈爾右翼後旗",
	    "150929": "四子王旗",
	    "150981": "豐鎮市",
	    "150982": "其它區",
	    "152200": "興安盟",
	    "152201": "烏蘭浩特市",
	    "152202": "阿爾山市",
	    "152221": "科爾沁右翼前旗",
	    "152222": "科爾沁右翼中旗",
	    "152223": "紮賚特旗",
	    "152224": "突泉縣",
	    "152225": "其它區",
	    "152500": "錫林郭勒盟",
	    "152501": "二連浩特市",
	    "152502": "錫林浩特市",
	    "152522": "阿巴嘎旗",
	    "152523": "蘇尼特左旗",
	    "152524": "蘇尼特右旗",
	    "152525": "東烏珠穆沁旗",
	    "152526": "西烏珠穆沁旗",
	    "152527": "太仆寺旗",
	    "152528": "鑲黃旗",
	    "152529": "正鑲白旗",
	    "152530": "正藍旗",
	    "152531": "多倫縣",
	    "152532": "其它區",
	    "152900": "阿拉善盟",
	    "152921": "阿拉善左旗",
	    "152922": "阿拉善右旗",
	    "152923": "額濟納旗",
	    "152924": "其它區",
	    "210000": "遼寧省",
	    "210100": "沈陽市",
	    "210102": "和平區",
	    "210103": "沈河區",
	    "210104": "大東區",
	    "210105": "皇姑區",
	    "210106": "鐵西區",
	    "210111": "蘇家屯區",
	    "210112": "東陵區",
	    "210113": "新城子區",
	    "210114": "於洪區",
	    "210122": "遼中縣",
	    "210123": "康平縣",
	    "210124": "法庫縣",
	    "210181": "新民市",
	    "210184": "沈北新區",
	    "210185": "其它區",
	    "210200": "大連市",
	    "210202": "中山區",
	    "210203": "西崗區",
	    "210204": "沙河口區",
	    "210211": "甘井子區",
	    "210212": "旅順口區",
	    "210213": "金州區",
	    "210224": "長海縣",
	    "210281": "瓦房店市",
	    "210282": "普蘭店市",
	    "210283": "莊河市",
	    "210298": "其它區",
	    "210300": "鞍山市",
	    "210302": "鐵東區",
	    "210303": "鐵西區",
	    "210304": "立山區",
	    "210311": "千山區",
	    "210321": "台安縣",
	    "210323": "岫巖滿族自治縣",
	    "210381": "海城市",
	    "210382": "其它區",
	    "210400": "撫順市",
	    "210402": "新撫區",
	    "210403": "東洲區",
	    "210404": "望花區",
	    "210411": "順城區",
	    "210421": "撫順縣",
	    "210422": "新賓滿族自治縣",
	    "210423": "清原滿族自治縣",
	    "210424": "其它區",
	    "210500": "本溪市",
	    "210502": "平山區",
	    "210503": "溪湖區",
	    "210504": "明山區",
	    "210505": "南芬區",
	    "210521": "本溪滿族自治縣",
	    "210522": "桓仁滿族自治縣",
	    "210523": "其它區",
	    "210600": "丹東市",
	    "210602": "元寶區",
	    "210603": "振興區",
	    "210604": "振安區",
	    "210624": "寬甸滿族自治縣",
	    "210681": "東港市",
	    "210682": "鳳城市",
	    "210683": "其它區",
	    "210700": "錦州市",
	    "210702": "古塔區",
	    "210703": "淩河區",
	    "210711": "太和區",
	    "210726": "黑山縣",
	    "210727": "義縣",
	    "210781": "淩海市",
	    "210782": "北鎮市",
	    "210783": "其它區",
	    "210800": "營口市",
	    "210802": "站前區",
	    "210803": "西市區",
	    "210804": "鮁魚圈區",
	    "210811": "老邊區",
	    "210881": "蓋州市",
	    "210882": "大石橋市",
	    "210883": "其它區",
	    "210900": "阜新市",
	    "210902": "海州區",
	    "210903": "新邱區",
	    "210904": "太平區",
	    "210905": "清河門區",
	    "210911": "細河區",
	    "210921": "阜新蒙古族自治縣",
	    "210922": "彰武縣",
	    "210923": "其它區",
	    "211000": "遼陽市",
	    "211002": "白塔區",
	    "211003": "文聖區",
	    "211004": "宏偉區",
	    "211005": "弓長嶺區",
	    "211011": "太子河區",
	    "211021": "遼陽縣",
	    "211081": "燈塔市",
	    "211082": "其它區",
	    "211100": "盤錦市",
	    "211102": "雙台子區",
	    "211103": "興隆台區",
	    "211121": "大窪縣",
	    "211122": "盤山縣",
	    "211123": "其它區",
	    "211200": "鐵嶺市",
	    "211202": "銀州區",
	    "211204": "清河區",
	    "211221": "鐵嶺縣",
	    "211223": "西豐縣",
	    "211224": "昌圖縣",
	    "211281": "調兵山市",
	    "211282": "開原市",
	    "211283": "其它區",
	    "211300": "朝陽市",
	    "211302": "雙塔區",
	    "211303": "龍城區",
	    "211321": "朝陽縣",
	    "211322": "建平縣",
	    "211324": "喀喇沁左翼蒙古族自治縣",
	    "211381": "北票市",
	    "211382": "淩源市",
	    "211383": "其它區",
	    "211400": "葫蘆島市",
	    "211402": "連山區",
	    "211403": "龍港區",
	    "211404": "南票區",
	    "211421": "綏中縣",
	    "211422": "建昌縣",
	    "211481": "興城市",
	    "211482": "其它區",
	    "220000": "吉林省",
	    "220100": "長春市",
	    "220102": "南關區",
	    "220103": "寬城區",
	    "220104": "朝陽區",
	    "220105": "二道區",
	    "220106": "綠園區",
	    "220112": "雙陽區",
	    "220122": "農安縣",
	    "220181": "九台市",
	    "220182": "榆樹市",
	    "220183": "德惠市",
	    "220188": "其它區",
	    "220200": "吉林市",
	    "220202": "昌邑區",
	    "220203": "龍潭區",
	    "220204": "船營區",
	    "220211": "豐滿區",
	    "220221": "永吉縣",
	    "220281": "蛟河市",
	    "220282": "樺甸市",
	    "220283": "舒蘭市",
	    "220284": "磐石市",
	    "220285": "其它區",
	    "220300": "四平市",
	    "220302": "鐵西區",
	    "220303": "鐵東區",
	    "220322": "梨樹縣",
	    "220323": "伊通滿族自治縣",
	    "220381": "公主嶺市",
	    "220382": "雙遼市",
	    "220383": "其它區",
	    "220400": "遼源市",
	    "220402": "龍山區",
	    "220403": "西安區",
	    "220421": "東豐縣",
	    "220422": "東遼縣",
	    "220423": "其它區",
	    "220500": "通化市",
	    "220502": "東昌區",
	    "220503": "二道江區",
	    "220521": "通化縣",
	    "220523": "輝南縣",
	    "220524": "柳河縣",
	    "220581": "梅河口市",
	    "220582": "集安市",
	    "220583": "其它區",
	    "220600": "白山市",
	    "220602": "渾江區",
	    "220621": "撫松縣",
	    "220622": "靖宇縣",
	    "220623": "長白朝鮮族自治縣",
	    "220625": "江源區",
	    "220681": "臨江市",
	    "220682": "其它區",
	    "220700": "松原市",
	    "220702": "寧江區",
	    "220721": "前郭爾羅斯蒙古族自治縣",
	    "220722": "長嶺縣",
	    "220723": "乾安縣",
	    "220724": "扶余市",
	    "220725": "其它區",
	    "220800": "白城市",
	    "220802": "洮北區",
	    "220821": "鎮賚縣",
	    "220822": "通榆縣",
	    "220881": "洮南市",
	    "220882": "大安市",
	    "220883": "其它區",
	    "222400": "延邊朝鮮族自治州",
	    "222401": "延吉市",
	    "222402": "圖們市",
	    "222403": "敦化市",
	    "222404": "琿春市",
	    "222405": "龍井市",
	    "222406": "和龍市",
	    "222424": "汪清縣",
	    "222426": "安圖縣",
	    "222427": "其它區",
	    "230000": "黑龍江省",
	    "230100": "哈爾濱市",
	    "230102": "道裏區",
	    "230103": "南崗區",
	    "230104": "道外區",
	    "230106": "香坊區",
	    "230108": "平房區",
	    "230109": "松北區",
	    "230111": "呼蘭區",
	    "230123": "依蘭縣",
	    "230124": "方正縣",
	    "230125": "賓縣",
	    "230126": "巴彥縣",
	    "230127": "木蘭縣",
	    "230128": "通河縣",
	    "230129": "延壽縣",
	    "230181": "阿城區",
	    "230182": "雙城市",
	    "230183": "尚志市",
	    "230184": "五常市",
	    "230186": "其它區",
	    "230200": "齊齊哈爾市",
	    "230202": "龍沙區",
	    "230203": "建華區",
	    "230204": "鐵鋒區",
	    "230205": "昂昂溪區",
	    "230206": "富拉爾基區",
	    "230207": "碾子山區",
	    "230208": "梅裏斯達斡爾族區",
	    "230221": "龍江縣",
	    "230223": "依安縣",
	    "230224": "泰來縣",
	    "230225": "甘南縣",
	    "230227": "富裕縣",
	    "230229": "克山縣",
	    "230230": "克東縣",
	    "230231": "拜泉縣",
	    "230281": "訥河市",
	    "230282": "其它區",
	    "230300": "雞西市",
	    "230302": "雞冠區",
	    "230303": "恒山區",
	    "230304": "滴道區",
	    "230305": "梨樹區",
	    "230306": "城子河區",
	    "230307": "麻山區",
	    "230321": "雞東縣",
	    "230381": "虎林市",
	    "230382": "密山市",
	    "230383": "其它區",
	    "230400": "鶴崗市",
	    "230402": "向陽區",
	    "230403": "工農區",
	    "230404": "南山區",
	    "230405": "興安區",
	    "230406": "東山區",
	    "230407": "興山區",
	    "230421": "蘿北縣",
	    "230422": "綏濱縣",
	    "230423": "其它區",
	    "230500": "雙鴨山市",
	    "230502": "尖山區",
	    "230503": "嶺東區",
	    "230505": "四方台區",
	    "230506": "寶山區",
	    "230521": "集賢縣",
	    "230522": "友誼縣",
	    "230523": "寶清縣",
	    "230524": "饒河縣",
	    "230525": "其它區",
	    "230600": "大慶市",
	    "230602": "薩爾圖區",
	    "230603": "龍鳳區",
	    "230604": "讓胡路區",
	    "230605": "紅崗區",
	    "230606": "大同區",
	    "230621": "肇州縣",
	    "230622": "肇源縣",
	    "230623": "林甸縣",
	    "230624": "杜爾伯特蒙古族自治縣",
	    "230625": "其它區",
	    "230700": "伊春市",
	    "230702": "伊春區",
	    "230703": "南岔區",
	    "230704": "友好區",
	    "230705": "西林區",
	    "230706": "翠巒區",
	    "230707": "新青區",
	    "230708": "美溪區",
	    "230709": "金山屯區",
	    "230710": "五營區",
	    "230711": "烏馬河區",
	    "230712": "湯旺河區",
	    "230713": "帶嶺區",
	    "230714": "烏伊嶺區",
	    "230715": "紅星區",
	    "230716": "上甘嶺區",
	    "230722": "嘉蔭縣",
	    "230781": "鐵力市",
	    "230782": "其它區",
	    "230800": "佳木斯市",
	    "230803": "向陽區",
	    "230804": "前進區",
	    "230805": "東風區",
	    "230811": "郊區",
	    "230822": "樺南縣",
	    "230826": "樺川縣",
	    "230828": "湯原縣",
	    "230833": "撫遠縣",
	    "230881": "同江市",
	    "230882": "富錦市",
	    "230883": "其它區",
	    "230900": "七台河市",
	    "230902": "新興區",
	    "230903": "桃山區",
	    "230904": "茄子河區",
	    "230921": "勃利縣",
	    "230922": "其它區",
	    "231000": "牡丹江市",
	    "231002": "東安區",
	    "231003": "陽明區",
	    "231004": "愛民區",
	    "231005": "西安區",
	    "231024": "東寧縣",
	    "231025": "林口縣",
	    "231081": "綏芬河市",
	    "231083": "海林市",
	    "231084": "寧安市",
	    "231085": "穆棱市",
	    "231086": "其它區",
	    "231100": "黑河市",
	    "231102": "愛輝區",
	    "231121": "嫩江縣",
	    "231123": "遜克縣",
	    "231124": "孫吳縣",
	    "231181": "北安市",
	    "231182": "五大連池市",
	    "231183": "其它區",
	    "231200": "綏化市",
	    "231202": "北林區",
	    "231221": "望奎縣",
	    "231222": "蘭西縣",
	    "231223": "青岡縣",
	    "231224": "慶安縣",
	    "231225": "明水縣",
	    "231226": "綏棱縣",
	    "231281": "安達市",
	    "231282": "肇東市",
	    "231283": "海倫市",
	    "231284": "其它區",
	    "232700": "大興安嶺地區",
	    "232702": "松嶺區",
	    "232703": "新林區",
	    "232704": "呼中區",
	    "232721": "呼瑪縣",
	    "232722": "塔河縣",
	    "232723": "漠河縣",
	    "232724": "加格達奇區",
	    "232725": "其它區",
	    "310000": "上海",
	    "310100": "上海市",
	    "310101": "黃浦區",
	    "310104": "徐匯區",
	    "310105": "長寧區",
	    "310106": "靜安區",
	    "310107": "普陀區",
	    "310108": "閘北區",
	    "310109": "虹口區",
	    "310110": "楊浦區",
	    "310112": "閔行區",
	    "310113": "寶山區",
	    "310114": "嘉定區",
	    "310115": "浦東新區",
	    "310116": "金山區",
	    "310117": "松江區",
	    "310118": "青浦區",
	    "310120": "奉賢區",
	    "310230": "崇明縣",
	    "310231": "其它區",
	    "320000": "江蘇省",
	    "320100": "南京市",
	    "320102": "玄武區",
	    "320104": "秦淮區",
	    "320105": "建鄴區",
	    "320106": "鼓樓區",
	    "320111": "浦口區",
	    "320113": "棲霞區",
	    "320114": "雨花台區",
	    "320115": "江寧區",
	    "320116": "六合區",
	    "320124": "溧水區",
	    "320125": "高淳區",
	    "320126": "其它區",
	    "320200": "無錫市",
	    "320202": "崇安區",
	    "320203": "南長區",
	    "320204": "北塘區",
	    "320205": "錫山區",
	    "320206": "惠山區",
	    "320211": "濱湖區",
	    "320281": "江陰市",
	    "320282": "宜興市",
	    "320297": "其它區",
	    "320300": "徐州市",
	    "320302": "鼓樓區",
	    "320303": "雲龍區",
	    "320305": "賈汪區",
	    "320311": "泉山區",
	    "320321": "豐縣",
	    "320322": "沛縣",
	    "320323": "銅山區",
	    "320324": "睢寧縣",
	    "320381": "新沂市",
	    "320382": "邳州市",
	    "320383": "其它區",
	    "320400": "常州市",
	    "320402": "天寧區",
	    "320404": "鐘樓區",
	    "320405": "戚墅堰區",
	    "320411": "新北區",
	    "320412": "武進區",
	    "320481": "溧陽市",
	    "320482": "金壇市",
	    "320483": "其它區",
	    "320500": "蘇州市",
	    "320505": "虎丘區",
	    "320506": "吳中區",
	    "320507": "相城區",
	    "320508": "姑蘇區",
	    "320581": "常熟市",
	    "320582": "張家港市",
	    "320583": "昆山市",
	    "320584": "吳江區",
	    "320585": "太倉市",
	    "320596": "其它區",
	    "320600": "南通市",
	    "320602": "崇川區",
	    "320611": "港閘區",
	    "320612": "通州區",
	    "320621": "海安縣",
	    "320623": "如東縣",
	    "320681": "啟東市",
	    "320682": "如臯市",
	    "320684": "海門市",
	    "320694": "其它區",
	    "320700": "連雲港市",
	    "320703": "連雲區",
	    "320705": "新浦區",
	    "320706": "海州區",
	    "320721": "贛榆縣",
	    "320722": "東海縣",
	    "320723": "灌雲縣",
	    "320724": "灌南縣",
	    "320725": "其它區",
	    "320800": "淮安市",
	    "320802": "清河區",
	    "320803": "淮安區",
	    "320804": "淮陰區",
	    "320811": "清浦區",
	    "320826": "漣水縣",
	    "320829": "洪澤縣",
	    "320830": "盱眙縣",
	    "320831": "金湖縣",
	    "320832": "其它區",
	    "320900": "鹽城市",
	    "320902": "亭湖區",
	    "320903": "鹽都區",
	    "320921": "響水縣",
	    "320922": "濱海縣",
	    "320923": "阜寧縣",
	    "320924": "射陽縣",
	    "320925": "建湖縣",
	    "320981": "東台市",
	    "320982": "大豐市",
	    "320983": "其它區",
	    "321000": "揚州市",
	    "321002": "廣陵區",
	    "321003": "邗江區",
	    "321023": "寶應縣",
	    "321081": "儀征市",
	    "321084": "高郵市",
	    "321088": "江都區",
	    "321093": "其它區",
	    "321100": "鎮江市",
	    "321102": "京口區",
	    "321111": "潤州區",
	    "321112": "丹徒區",
	    "321181": "丹陽市",
	    "321182": "揚中市",
	    "321183": "句容市",
	    "321184": "其它區",
	    "321200": "泰州市",
	    "321202": "海陵區",
	    "321203": "高港區",
	    "321281": "興化市",
	    "321282": "靖江市",
	    "321283": "泰興市",
	    "321284": "姜堰區",
	    "321285": "其它區",
	    "321300": "宿遷市",
	    "321302": "宿城區",
	    "321311": "宿豫區",
	    "321322": "沭陽縣",
	    "321323": "泗陽縣",
	    "321324": "泗洪縣",
	    "321325": "其它區",
	    "330000": "浙江省",
	    "330100": "杭州市",
	    "330102": "上城區",
	    "330103": "下城區",
	    "330104": "江幹區",
	    "330105": "拱墅區",
	    "330106": "西湖區",
	    "330108": "濱江區",
	    "330109": "蕭山區",
	    "330110": "余杭區",
	    "330122": "桐廬縣",
	    "330127": "淳安縣",
	    "330182": "建德市",
	    "330183": "富陽市",
	    "330185": "臨安市",
	    "330186": "其它區",
	    "330200": "寧波市",
	    "330203": "海曙區",
	    "330204": "江東區",
	    "330205": "江北區",
	    "330206": "北侖區",
	    "330211": "鎮海區",
	    "330212": "鄞州區",
	    "330225": "象山縣",
	    "330226": "寧海縣",
	    "330281": "余姚市",
	    "330282": "慈溪市",
	    "330283": "奉化市",
	    "330284": "其它區",
	    "330300": "溫州市",
	    "330302": "鹿城區",
	    "330303": "龍灣區",
	    "330304": "甌海區",
	    "330322": "洞頭縣",
	    "330324": "永嘉縣",
	    "330326": "平陽縣",
	    "330327": "蒼南縣",
	    "330328": "文成縣",
	    "330329": "泰順縣",
	    "330381": "瑞安市",
	    "330382": "樂清市",
	    "330383": "其它區",
	    "330400": "嘉興市",
	    "330402": "南湖區",
	    "330411": "秀洲區",
	    "330421": "嘉善縣",
	    "330424": "海鹽縣",
	    "330481": "海寧市",
	    "330482": "平湖市",
	    "330483": "桐鄉市",
	    "330484": "其它區",
	    "330500": "湖州市",
	    "330502": "吳興區",
	    "330503": "南潯區",
	    "330521": "德清縣",
	    "330522": "長興縣",
	    "330523": "安吉縣",
	    "330524": "其它區",
	    "330600": "紹興市",
	    "330602": "越城區",
	    "330621": "紹興縣",
	    "330624": "新昌縣",
	    "330681": "諸暨市",
	    "330682": "上虞市",
	    "330683": "嵊州市",
	    "330684": "其它區",
	    "330700": "金華市",
	    "330702": "婺城區",
	    "330703": "金東區",
	    "330723": "武義縣",
	    "330726": "浦江縣",
	    "330727": "磐安縣",
	    "330781": "蘭溪市",
	    "330782": "義烏市",
	    "330783": "東陽市",
	    "330784": "永康市",
	    "330785": "其它區",
	    "330800": "衢州市",
	    "330802": "柯城區",
	    "330803": "衢江區",
	    "330822": "常山縣",
	    "330824": "開化縣",
	    "330825": "龍遊縣",
	    "330881": "江山市",
	    "330882": "其它區",
	    "330900": "舟山市",
	    "330902": "定海區",
	    "330903": "普陀區",
	    "330921": "岱山縣",
	    "330922": "嵊泗縣",
	    "330923": "其它區",
	    "331000": "台州市",
	    "331002": "椒江區",
	    "331003": "黃巖區",
	    "331004": "路橋區",
	    "331021": "玉環縣",
	    "331022": "三門縣",
	    "331023": "天台縣",
	    "331024": "仙居縣",
	    "331081": "溫嶺市",
	    "331082": "臨海市",
	    "331083": "其它區",
	    "331100": "麗水市",
	    "331102": "蓮都區",
	    "331121": "青田縣",
	    "331122": "縉雲縣",
	    "331123": "遂昌縣",
	    "331124": "松陽縣",
	    "331125": "雲和縣",
	    "331126": "慶元縣",
	    "331127": "景寧畬族自治縣",
	    "331181": "龍泉市",
	    "331182": "其它區",
	    "340000": "安徽省",
	    "340100": "合肥市",
	    "340102": "瑤海區",
	    "340103": "廬陽區",
	    "340104": "蜀山區",
	    "340111": "包河區",
	    "340121": "長豐縣",
	    "340122": "肥東縣",
	    "340123": "肥西縣",
	    "340192": "其它區",
	    "340200": "蕪湖市",
	    "340202": "鏡湖區",
	    "340203": "弋江區",
	    "340207": "鳩江區",
	    "340208": "三山區",
	    "340221": "蕪湖縣",
	    "340222": "繁昌縣",
	    "340223": "南陵縣",
	    "340224": "其它區",
	    "340300": "蚌埠市",
	    "340302": "龍子湖區",
	    "340303": "蚌山區",
	    "340304": "禹會區",
	    "340311": "淮上區",
	    "340321": "懷遠縣",
	    "340322": "五河縣",
	    "340323": "固鎮縣",
	    "340324": "其它區",
	    "340400": "淮南市",
	    "340402": "大通區",
	    "340403": "田家庵區",
	    "340404": "謝家集區",
	    "340405": "八公山區",
	    "340406": "潘集區",
	    "340421": "鳳台縣",
	    "340422": "其它區",
	    "340500": "馬鞍山市",
	    "340503": "花山區",
	    "340504": "雨山區",
	    "340506": "博望區",
	    "340521": "當塗縣",
	    "340522": "其它區",
	    "340600": "淮北市",
	    "340602": "杜集區",
	    "340603": "相山區",
	    "340604": "烈山區",
	    "340621": "濉溪縣",
	    "340622": "其它區",
	    "340700": "銅陵市",
	    "340702": "銅官山區",
	    "340703": "獅子山區",
	    "340711": "郊區",
	    "340721": "銅陵縣",
	    "340722": "其它區",
	    "340800": "安慶市",
	    "340802": "迎江區",
	    "340803": "大觀區",
	    "340811": "宜秀區",
	    "340822": "懷寧縣",
	    "340823": "樅陽縣",
	    "340824": "潛山縣",
	    "340825": "太湖縣",
	    "340826": "宿松縣",
	    "340827": "望江縣",
	    "340828": "岳西縣",
	    "340881": "桐城市",
	    "340882": "其它區",
	    "341000": "黃山市",
	    "341002": "屯溪區",
	    "341003": "黃山區",
	    "341004": "徽州區",
	    "341021": "歙縣",
	    "341022": "休寧縣",
	    "341023": "黟縣",
	    "341024": "祁門縣",
	    "341025": "其它區",
	    "341100": "滁州市",
	    "341102": "瑯琊區",
	    "341103": "南譙區",
	    "341122": "來安縣",
	    "341124": "全椒縣",
	    "341125": "定遠縣",
	    "341126": "鳳陽縣",
	    "341181": "天長市",
	    "341182": "明光市",
	    "341183": "其它區",
	    "341200": "阜陽市",
	    "341202": "潁州區",
	    "341203": "潁東區",
	    "341204": "潁泉區",
	    "341221": "臨泉縣",
	    "341222": "太和縣",
	    "341225": "阜南縣",
	    "341226": "潁上縣",
	    "341282": "界首市",
	    "341283": "其它區",
	    "341300": "宿州市",
	    "341302": "埇橋區",
	    "341321": "碭山縣",
	    "341322": "蕭縣",
	    "341323": "靈璧縣",
	    "341324": "泗縣",
	    "341325": "其它區",
	    "341400": "巢湖市",
	    "341421": "廬江縣",
	    "341422": "無為縣",
	    "341423": "含山縣",
	    "341424": "和縣",
	    "341500": "六安市",
	    "341502": "金安區",
	    "341503": "裕安區",
	    "341521": "壽縣",
	    "341522": "霍邱縣",
	    "341523": "舒城縣",
	    "341524": "金寨縣",
	    "341525": "霍山縣",
	    "341526": "其它區",
	    "341600": "亳州市",
	    "341602": "譙城區",
	    "341621": "渦陽縣",
	    "341622": "蒙城縣",
	    "341623": "利辛縣",
	    "341624": "其它區",
	    "341700": "池州市",
	    "341702": "貴池區",
	    "341721": "東至縣",
	    "341722": "石台縣",
	    "341723": "青陽縣",
	    "341724": "其它區",
	    "341800": "宣城市",
	    "341802": "宣州區",
	    "341821": "郎溪縣",
	    "341822": "廣德縣",
	    "341823": "涇縣",
	    "341824": "績溪縣",
	    "341825": "旌德縣",
	    "341881": "寧國市",
	    "341882": "其它區",
	    "350000": "福建省",
	    "350100": "福州市",
	    "350102": "鼓樓區",
	    "350103": "台江區",
	    "350104": "倉山區",
	    "350105": "馬尾區",
	    "350111": "晉安區",
	    "350121": "閩侯縣",
	    "350122": "連江縣",
	    "350123": "羅源縣",
	    "350124": "閩清縣",
	    "350125": "永泰縣",
	    "350128": "平潭縣",
	    "350181": "福清市",
	    "350182": "長樂市",
	    "350183": "其它區",
	    "350200": "廈門市",
	    "350203": "思明區",
	    "350205": "海滄區",
	    "350206": "湖裏區",
	    "350211": "集美區",
	    "350212": "同安區",
	    "350213": "翔安區",
	    "350214": "其它區",
	    "350300": "莆田市",
	    "350302": "城廂區",
	    "350303": "涵江區",
	    "350304": "荔城區",
	    "350305": "秀嶼區",
	    "350322": "仙遊縣",
	    "350323": "其它區",
	    "350400": "三明市",
	    "350402": "梅列區",
	    "350403": "三元區",
	    "350421": "明溪縣",
	    "350423": "清流縣",
	    "350424": "寧化縣",
	    "350425": "大田縣",
	    "350426": "尤溪縣",
	    "350427": "沙縣",
	    "350428": "將樂縣",
	    "350429": "泰寧縣",
	    "350430": "建寧縣",
	    "350481": "永安市",
	    "350482": "其它區",
	    "350500": "泉州市",
	    "350502": "鯉城區",
	    "350503": "豐澤區",
	    "350504": "洛江區",
	    "350505": "泉港區",
	    "350521": "惠安縣",
	    "350524": "安溪縣",
	    "350525": "永春縣",
	    "350526": "德化縣",
	    "350527": "金門縣",
	    "350581": "石獅市",
	    "350582": "晉江市",
	    "350583": "南安市",
	    "350584": "其它區",
	    "350600": "漳州市",
	    "350602": "薌城區",
	    "350603": "龍文區",
	    "350622": "雲霄縣",
	    "350623": "漳浦縣",
	    "350624": "詔安縣",
	    "350625": "長泰縣",
	    "350626": "東山縣",
	    "350627": "南靖縣",
	    "350628": "平和縣",
	    "350629": "華安縣",
	    "350681": "龍海市",
	    "350682": "其它區",
	    "350700": "南平市",
	    "350702": "延平區",
	    "350721": "順昌縣",
	    "350722": "浦城縣",
	    "350723": "光澤縣",
	    "350724": "松溪縣",
	    "350725": "政和縣",
	    "350781": "邵武市",
	    "350782": "武夷山市",
	    "350783": "建甌市",
	    "350784": "建陽市",
	    "350785": "其它區",
	    "350800": "龍巖市",
	    "350802": "新羅區",
	    "350821": "長汀縣",
	    "350822": "永定縣",
	    "350823": "上杭縣",
	    "350824": "武平縣",
	    "350825": "連城縣",
	    "350881": "漳平市",
	    "350882": "其它區",
	    "350900": "寧德市",
	    "350902": "蕉城區",
	    "350921": "霞浦縣",
	    "350922": "古田縣",
	    "350923": "屏南縣",
	    "350924": "壽寧縣",
	    "350925": "周寧縣",
	    "350926": "柘榮縣",
	    "350981": "福安市",
	    "350982": "福鼎市",
	    "350983": "其它區",
	    "360000": "江西省",
	    "360100": "南昌市",
	    "360102": "東湖區",
	    "360103": "西湖區",
	    "360104": "青雲譜區",
	    "360105": "灣裏區",
	    "360111": "青山湖區",
	    "360121": "南昌縣",
	    "360122": "新建縣",
	    "360123": "安義縣",
	    "360124": "進賢縣",
	    "360128": "其它區",
	    "360200": "景德鎮市",
	    "360202": "昌江區",
	    "360203": "珠山區",
	    "360222": "浮梁縣",
	    "360281": "樂平市",
	    "360282": "其它區",
	    "360300": "萍鄉市",
	    "360302": "安源區",
	    "360313": "湘東區",
	    "360321": "蓮花縣",
	    "360322": "上栗縣",
	    "360323": "蘆溪縣",
	    "360324": "其它區",
	    "360400": "九江市",
	    "360402": "廬山區",
	    "360403": "潯陽區",
	    "360421": "九江縣",
	    "360423": "武寧縣",
	    "360424": "修水縣",
	    "360425": "永修縣",
	    "360426": "德安縣",
	    "360427": "星子縣",
	    "360428": "都昌縣",
	    "360429": "湖口縣",
	    "360430": "彭澤縣",
	    "360481": "瑞昌市",
	    "360482": "其它區",
	    "360483": "共青城市",
	    "360500": "新余市",
	    "360502": "渝水區",
	    "360521": "分宜縣",
	    "360522": "其它區",
	    "360600": "鷹潭市",
	    "360602": "月湖區",
	    "360622": "余江縣",
	    "360681": "貴溪市",
	    "360682": "其它區",
	    "360700": "贛州市",
	    "360702": "章貢區",
	    "360721": "贛縣",
	    "360722": "信豐縣",
	    "360723": "大余縣",
	    "360724": "上猶縣",
	    "360725": "崇義縣",
	    "360726": "安遠縣",
	    "360727": "龍南縣",
	    "360728": "定南縣",
	    "360729": "全南縣",
	    "360730": "寧都縣",
	    "360731": "於都縣",
	    "360732": "興國縣",
	    "360733": "會昌縣",
	    "360734": "尋烏縣",
	    "360735": "石城縣",
	    "360781": "瑞金市",
	    "360782": "南康市",
	    "360783": "其它區",
	    "360800": "吉安市",
	    "360802": "吉州區",
	    "360803": "青原區",
	    "360821": "吉安縣",
	    "360822": "吉水縣",
	    "360823": "峽江縣",
	    "360824": "新幹縣",
	    "360825": "永豐縣",
	    "360826": "泰和縣",
	    "360827": "遂川縣",
	    "360828": "萬安縣",
	    "360829": "安福縣",
	    "360830": "永新縣",
	    "360881": "井岡山市",
	    "360882": "其它區",
	    "360900": "宜春市",
	    "360902": "袁州區",
	    "360921": "奉新縣",
	    "360922": "萬載縣",
	    "360923": "上高縣",
	    "360924": "宜豐縣",
	    "360925": "靖安縣",
	    "360926": "銅鼓縣",
	    "360981": "豐城市",
	    "360982": "樟樹市",
	    "360983": "高安市",
	    "360984": "其它區",
	    "361000": "撫州市",
	    "361002": "臨川區",
	    "361021": "南城縣",
	    "361022": "黎川縣",
	    "361023": "南豐縣",
	    "361024": "崇仁縣",
	    "361025": "樂安縣",
	    "361026": "宜黃縣",
	    "361027": "金溪縣",
	    "361028": "資溪縣",
	    "361029": "東鄉縣",
	    "361030": "廣昌縣",
	    "361031": "其它區",
	    "361100": "上饒市",
	    "361102": "信州區",
	    "361121": "上饒縣",
	    "361122": "廣豐縣",
	    "361123": "玉山縣",
	    "361124": "鉛山縣",
	    "361125": "橫峰縣",
	    "361126": "弋陽縣",
	    "361127": "余幹縣",
	    "361128": "鄱陽縣",
	    "361129": "萬年縣",
	    "361130": "婺源縣",
	    "361181": "德興市",
	    "361182": "其它區",
	    "370000": "山東省",
	    "370100": "濟南市",
	    "370102": "歷下區",
	    "370103": "市中區",
	    "370104": "槐蔭區",
	    "370105": "天橋區",
	    "370112": "歷城區",
	    "370113": "長清區",
	    "370124": "平陰縣",
	    "370125": "濟陽縣",
	    "370126": "商河縣",
	    "370181": "章丘市",
	    "370182": "其它區",
	    "370200": "青島市",
	    "370202": "市南區",
	    "370203": "市北區",
	    "370211": "黃島區",
	    "370212": "嶗山區",
	    "370213": "李滄區",
	    "370214": "城陽區",
	    "370281": "膠州市",
	    "370282": "即墨市",
	    "370283": "平度市",
	    "370285": "萊西市",
	    "370286": "其它區",
	    "370300": "淄博市",
	    "370302": "淄川區",
	    "370303": "張店區",
	    "370304": "博山區",
	    "370305": "臨淄區",
	    "370306": "周村區",
	    "370321": "桓台縣",
	    "370322": "高青縣",
	    "370323": "沂源縣",
	    "370324": "其它區",
	    "370400": "棗莊市",
	    "370402": "市中區",
	    "370403": "薛城區",
	    "370404": "嶧城區",
	    "370405": "台兒莊區",
	    "370406": "山亭區",
	    "370481": "滕州市",
	    "370482": "其它區",
	    "370500": "東營市",
	    "370502": "東營區",
	    "370503": "河口區",
	    "370521": "墾利縣",
	    "370522": "利津縣",
	    "370523": "廣饒縣",
	    "370591": "其它區",
	    "370600": "煙台市",
	    "370602": "芝罘區",
	    "370611": "福山區",
	    "370612": "牟平區",
	    "370613": "萊山區",
	    "370634": "長島縣",
	    "370681": "龍口市",
	    "370682": "萊陽市",
	    "370683": "萊州市",
	    "370684": "蓬萊市",
	    "370685": "招遠市",
	    "370686": "棲霞市",
	    "370687": "海陽市",
	    "370688": "其它區",
	    "370700": "濰坊市",
	    "370702": "濰城區",
	    "370703": "寒亭區",
	    "370704": "坊子區",
	    "370705": "奎文區",
	    "370724": "臨朐縣",
	    "370725": "昌樂縣",
	    "370781": "青州市",
	    "370782": "諸城市",
	    "370783": "壽光市",
	    "370784": "安丘市",
	    "370785": "高密市",
	    "370786": "昌邑市",
	    "370787": "其它區",
	    "370800": "濟寧市",
	    "370802": "市中區",
	    "370811": "任城區",
	    "370826": "微山縣",
	    "370827": "魚台縣",
	    "370828": "金鄉縣",
	    "370829": "嘉祥縣",
	    "370830": "汶上縣",
	    "370831": "泗水縣",
	    "370832": "梁山縣",
	    "370881": "曲阜市",
	    "370882": "兗州市",
	    "370883": "鄒城市",
	    "370884": "其它區",
	    "370900": "泰安市",
	    "370902": "泰山區",
	    "370903": "岱岳區",
	    "370921": "寧陽縣",
	    "370923": "東平縣",
	    "370982": "新泰市",
	    "370983": "肥城市",
	    "370984": "其它區",
	    "371000": "威海市",
	    "371002": "環翠區",
	    "371081": "文登市",
	    "371082": "榮成市",
	    "371083": "乳山市",
	    "371084": "其它區",
	    "371100": "日照市",
	    "371102": "東港區",
	    "371103": "嵐山區",
	    "371121": "五蓮縣",
	    "371122": "莒縣",
	    "371123": "其它區",
	    "371200": "萊蕪市",
	    "371202": "萊城區",
	    "371203": "鋼城區",
	    "371204": "其它區",
	    "371300": "臨沂市",
	    "371302": "蘭山區",
	    "371311": "羅莊區",
	    "371312": "河東區",
	    "371321": "沂南縣",
	    "371322": "郯城縣",
	    "371323": "沂水縣",
	    "371324": "蒼山縣",
	    "371325": "費縣",
	    "371326": "平邑縣",
	    "371327": "莒南縣",
	    "371328": "蒙陰縣",
	    "371329": "臨沭縣",
	    "371330": "其它區",
	    "371400": "德州市",
	    "371402": "德城區",
	    "371421": "陵縣",
	    "371422": "寧津縣",
	    "371423": "慶雲縣",
	    "371424": "臨邑縣",
	    "371425": "齊河縣",
	    "371426": "平原縣",
	    "371427": "夏津縣",
	    "371428": "武城縣",
	    "371481": "樂陵市",
	    "371482": "禹城市",
	    "371483": "其它區",
	    "371500": "聊城市",
	    "371502": "東昌府區",
	    "371521": "陽谷縣",
	    "371522": "莘縣",
	    "371523": "茌平縣",
	    "371524": "東阿縣",
	    "371525": "冠縣",
	    "371526": "高唐縣",
	    "371581": "臨清市",
	    "371582": "其它區",
	    "371600": "濱州市",
	    "371602": "濱城區",
	    "371621": "惠民縣",
	    "371622": "陽信縣",
	    "371623": "無棣縣",
	    "371624": "沾化縣",
	    "371625": "博興縣",
	    "371626": "鄒平縣",
	    "371627": "其它區",
	    "371700": "菏澤市",
	    "371702": "牡丹區",
	    "371721": "曹縣",
	    "371722": "單縣",
	    "371723": "成武縣",
	    "371724": "巨野縣",
	    "371725": "鄆城縣",
	    "371726": "鄄城縣",
	    "371727": "定陶縣",
	    "371728": "東明縣",
	    "371729": "其它區",
	    "410000": "河南省",
	    "410100": "鄭州市",
	    "410102": "中原區",
	    "410103": "二七區",
	    "410104": "管城回族區",
	    "410105": "金水區",
	    "410106": "上街區",
	    "410108": "惠濟區",
	    "410122": "中牟縣",
	    "410181": "鞏義市",
	    "410182": "滎陽市",
	    "410183": "新密市",
	    "410184": "新鄭市",
	    "410185": "登封市",
	    "410188": "其它區",
	    "410200": "開封市",
	    "410202": "龍亭區",
	    "410203": "順河回族區",
	    "410204": "鼓樓區",
	    "410205": "禹王台區",
	    "410211": "金明區",
	    "410221": "杞縣",
	    "410222": "通許縣",
	    "410223": "尉氏縣",
	    "410224": "開封縣",
	    "410225": "蘭考縣",
	    "410226": "其它區",
	    "410300": "洛陽市",
	    "410302": "老城區",
	    "410303": "西工區",
	    "410304": "瀍河回族區",
	    "410305": "澗西區",
	    "410306": "吉利區",
	    "410307": "洛龍區",
	    "410322": "孟津縣",
	    "410323": "新安縣",
	    "410324": "欒川縣",
	    "410325": "嵩縣",
	    "410326": "汝陽縣",
	    "410327": "宜陽縣",
	    "410328": "洛寧縣",
	    "410329": "伊川縣",
	    "410381": "偃師市",
	    "410400": "平頂山市",
	    "410402": "新華區",
	    "410403": "衛東區",
	    "410404": "石龍區",
	    "410411": "湛河區",
	    "410421": "寶豐縣",
	    "410422": "葉縣",
	    "410423": "魯山縣",
	    "410425": "郟縣",
	    "410481": "舞鋼市",
	    "410482": "汝州市",
	    "410483": "其它區",
	    "410500": "安陽市",
	    "410502": "文峰區",
	    "410503": "北關區",
	    "410505": "殷都區",
	    "410506": "龍安區",
	    "410522": "安陽縣",
	    "410523": "湯陰縣",
	    "410526": "滑縣",
	    "410527": "內黃縣",
	    "410581": "林州市",
	    "410582": "其它區",
	    "410600": "鶴壁市",
	    "410602": "鶴山區",
	    "410603": "山城區",
	    "410611": "淇濱區",
	    "410621": "浚縣",
	    "410622": "淇縣",
	    "410623": "其它區",
	    "410700": "新鄉市",
	    "410702": "紅旗區",
	    "410703": "衛濱區",
	    "410704": "鳳泉區",
	    "410711": "牧野區",
	    "410721": "新鄉縣",
	    "410724": "獲嘉縣",
	    "410725": "原陽縣",
	    "410726": "延津縣",
	    "410727": "封丘縣",
	    "410728": "長垣縣",
	    "410781": "衛輝市",
	    "410782": "輝縣市",
	    "410783": "其它區",
	    "410800": "焦作市",
	    "410802": "解放區",
	    "410803": "中站區",
	    "410804": "馬村區",
	    "410811": "山陽區",
	    "410821": "修武縣",
	    "410822": "博愛縣",
	    "410823": "武陟縣",
	    "410825": "溫縣",
	    "410881": "濟源市",
	    "410882": "沁陽市",
	    "410883": "孟州市",
	    "410884": "其它區",
	    "410900": "濮陽市",
	    "410902": "華龍區",
	    "410922": "清豐縣",
	    "410923": "南樂縣",
	    "410926": "範縣",
	    "410927": "台前縣",
	    "410928": "濮陽縣",
	    "410929": "其它區",
	    "411000": "許昌市",
	    "411002": "魏都區",
	    "411023": "許昌縣",
	    "411024": "鄢陵縣",
	    "411025": "襄城縣",
	    "411081": "禹州市",
	    "411082": "長葛市",
	    "411083": "其它區",
	    "411100": "漯河市",
	    "411102": "源匯區",
	    "411103": "郾城區",
	    "411104": "召陵區",
	    "411121": "舞陽縣",
	    "411122": "臨潁縣",
	    "411123": "其它區",
	    "411200": "三門峽市",
	    "411202": "湖濱區",
	    "411221": "澠池縣",
	    "411222": "陜縣",
	    "411224": "盧氏縣",
	    "411281": "義馬市",
	    "411282": "靈寶市",
	    "411283": "其它區",
	    "411300": "南陽市",
	    "411302": "宛城區",
	    "411303": "臥龍區",
	    "411321": "南召縣",
	    "411322": "方城縣",
	    "411323": "西峽縣",
	    "411324": "鎮平縣",
	    "411325": "內鄉縣",
	    "411326": "淅川縣",
	    "411327": "社旗縣",
	    "411328": "唐河縣",
	    "411329": "新野縣",
	    "411330": "桐柏縣",
	    "411381": "鄧州市",
	    "411382": "其它區",
	    "411400": "商丘市",
	    "411402": "梁園區",
	    "411403": "睢陽區",
	    "411421": "民權縣",
	    "411422": "睢縣",
	    "411423": "寧陵縣",
	    "411424": "柘城縣",
	    "411425": "虞城縣",
	    "411426": "夏邑縣",
	    "411481": "永城市",
	    "411482": "其它區",
	    "411500": "信陽市",
	    "411502": "浉河區",
	    "411503": "平橋區",
	    "411521": "羅山縣",
	    "411522": "光山縣",
	    "411523": "新縣",
	    "411524": "商城縣",
	    "411525": "固始縣",
	    "411526": "潢川縣",
	    "411527": "淮濱縣",
	    "411528": "息縣",
	    "411529": "其它區",
	    "411600": "周口市",
	    "411602": "川匯區",
	    "411621": "扶溝縣",
	    "411622": "西華縣",
	    "411623": "商水縣",
	    "411624": "沈丘縣",
	    "411625": "鄲城縣",
	    "411626": "淮陽縣",
	    "411627": "太康縣",
	    "411628": "鹿邑縣",
	    "411681": "項城市",
	    "411682": "其它區",
	    "411700": "駐馬店市",
	    "411702": "驛城區",
	    "411721": "西平縣",
	    "411722": "上蔡縣",
	    "411723": "平輿縣",
	    "411724": "正陽縣",
	    "411725": "確山縣",
	    "411726": "泌陽縣",
	    "411727": "汝南縣",
	    "411728": "遂平縣",
	    "411729": "新蔡縣",
	    "411730": "其它區",
	    "420000": "湖北省",
	    "420100": "武漢市",
	    "420102": "江岸區",
	    "420103": "江漢區",
	    "420104": "硚口區",
	    "420105": "漢陽區",
	    "420106": "武昌區",
	    "420107": "青山區",
	    "420111": "洪山區",
	    "420112": "東西湖區",
	    "420113": "漢南區",
	    "420114": "蔡甸區",
	    "420115": "江夏區",
	    "420116": "黃陂區",
	    "420117": "新洲區",
	    "420118": "其它區",
	    "420200": "黃石市",
	    "420202": "黃石港區",
	    "420203": "西塞山區",
	    "420204": "下陸區",
	    "420205": "鐵山區",
	    "420222": "陽新縣",
	    "420281": "大冶市",
	    "420282": "其它區",
	    "420300": "十堰市",
	    "420302": "茅箭區",
	    "420303": "張灣區",
	    "420321": "鄖縣",
	    "420322": "鄖西縣",
	    "420323": "竹山縣",
	    "420324": "竹溪縣",
	    "420325": "房縣",
	    "420381": "丹江口市",
	    "420383": "其它區",
	    "420500": "宜昌市",
	    "420502": "西陵區",
	    "420503": "伍家崗區",
	    "420504": "點軍區",
	    "420505": "猇亭區",
	    "420506": "夷陵區",
	    "420525": "遠安縣",
	    "420526": "興山縣",
	    "420527": "秭歸縣",
	    "420528": "長陽土家族自治縣",
	    "420529": "五峰土家族自治縣",
	    "420581": "宜都市",
	    "420582": "當陽市",
	    "420583": "枝江市",
	    "420584": "其它區",
	    "420600": "襄陽市",
	    "420602": "襄城區",
	    "420606": "樊城區",
	    "420607": "襄州區",
	    "420624": "南漳縣",
	    "420625": "谷城縣",
	    "420626": "保康縣",
	    "420682": "老河口市",
	    "420683": "棗陽市",
	    "420684": "宜城市",
	    "420685": "其它區",
	    "420700": "鄂州市",
	    "420702": "梁子湖區",
	    "420703": "華容區",
	    "420704": "鄂城區",
	    "420705": "其它區",
	    "420800": "荊門市",
	    "420802": "東寶區",
	    "420804": "掇刀區",
	    "420821": "京山縣",
	    "420822": "沙洋縣",
	    "420881": "鐘祥市",
	    "420882": "其它區",
	    "420900": "孝感市",
	    "420902": "孝南區",
	    "420921": "孝昌縣",
	    "420922": "大悟縣",
	    "420923": "雲夢縣",
	    "420981": "應城市",
	    "420982": "安陸市",
	    "420984": "漢川市",
	    "420985": "其它區",
	    "421000": "荊州市",
	    "421002": "沙市區",
	    "421003": "荊州區",
	    "421022": "公安縣",
	    "421023": "監利縣",
	    "421024": "江陵縣",
	    "421081": "石首市",
	    "421083": "洪湖市",
	    "421087": "松滋市",
	    "421088": "其它區",
	    "421100": "黃岡市",
	    "421102": "黃州區",
	    "421121": "團風縣",
	    "421122": "紅安縣",
	    "421123": "羅田縣",
	    "421124": "英山縣",
	    "421125": "浠水縣",
	    "421126": "蘄春縣",
	    "421127": "黃梅縣",
	    "421181": "麻城市",
	    "421182": "武穴市",
	    "421183": "其它區",
	    "421200": "鹹寧市",
	    "421202": "鹹安區",
	    "421221": "嘉魚縣",
	    "421222": "通城縣",
	    "421223": "崇陽縣",
	    "421224": "通山縣",
	    "421281": "赤壁市",
	    "421283": "其它區",
	    "421300": "隨州市",
	    "421302": "曾都區",
	    "421321": "隨縣",
	    "421381": "廣水市",
	    "421382": "其它區",
	    "422800": "恩施土家族苗族自治州",
	    "422801": "恩施市",
	    "422802": "利川市",
	    "422822": "建始縣",
	    "422823": "巴東縣",
	    "422825": "宣恩縣",
	    "422826": "鹹豐縣",
	    "422827": "來鳳縣",
	    "422828": "鶴峰縣",
	    "422829": "其它區",
	    "429004": "仙桃市",
	    "429005": "潛江市",
	    "429006": "天門市",
	    "429021": "神農架林區",
	    "430000": "湖南省",
	    "430100": "長沙市",
	    "430102": "芙蓉區",
	    "430103": "天心區",
	    "430104": "岳麓區",
	    "430105": "開福區",
	    "430111": "雨花區",
	    "430121": "長沙縣",
	    "430122": "望城區",
	    "430124": "寧鄉縣",
	    "430181": "瀏陽市",
	    "430182": "其它區",
	    "430200": "株洲市",
	    "430202": "荷塘區",
	    "430203": "蘆淞區",
	    "430204": "石峰區",
	    "430211": "天元區",
	    "430221": "株洲縣",
	    "430223": "攸縣",
	    "430224": "茶陵縣",
	    "430225": "炎陵縣",
	    "430281": "醴陵市",
	    "430282": "其它區",
	    "430300": "湘潭市",
	    "430302": "雨湖區",
	    "430304": "岳塘區",
	    "430321": "湘潭縣",
	    "430381": "湘鄉市",
	    "430382": "韶山市",
	    "430383": "其它區",
	    "430400": "衡陽市",
	    "430405": "珠暉區",
	    "430406": "雁峰區",
	    "430407": "石鼓區",
	    "430408": "蒸湘區",
	    "430412": "南岳區",
	    "430421": "衡陽縣",
	    "430422": "衡南縣",
	    "430423": "衡山縣",
	    "430424": "衡東縣",
	    "430426": "祁東縣",
	    "430481": "耒陽市",
	    "430482": "常寧市",
	    "430483": "其它區",
	    "430500": "邵陽市",
	    "430502": "雙清區",
	    "430503": "大祥區",
	    "430511": "北塔區",
	    "430521": "邵東縣",
	    "430522": "新邵縣",
	    "430523": "邵陽縣",
	    "430524": "隆回縣",
	    "430525": "洞口縣",
	    "430527": "綏寧縣",
	    "430528": "新寧縣",
	    "430529": "城步苗族自治縣",
	    "430581": "武岡市",
	    "430582": "其它區",
	    "430600": "岳陽市",
	    "430602": "岳陽樓區",
	    "430603": "雲溪區",
	    "430611": "君山區",
	    "430621": "岳陽縣",
	    "430623": "華容縣",
	    "430624": "湘陰縣",
	    "430626": "平江縣",
	    "430681": "汨羅市",
	    "430682": "臨湘市",
	    "430683": "其它區",
	    "430700": "常德市",
	    "430702": "武陵區",
	    "430703": "鼎城區",
	    "430721": "安鄉縣",
	    "430722": "漢壽縣",
	    "430723": "澧縣",
	    "430724": "臨澧縣",
	    "430725": "桃源縣",
	    "430726": "石門縣",
	    "430781": "津市市",
	    "430782": "其它區",
	    "430800": "張家界市",
	    "430802": "永定區",
	    "430811": "武陵源區",
	    "430821": "慈利縣",
	    "430822": "桑植縣",
	    "430823": "其它區",
	    "430900": "益陽市",
	    "430902": "資陽區",
	    "430903": "赫山區",
	    "430921": "南縣",
	    "430922": "桃江縣",
	    "430923": "安化縣",
	    "430981": "沅江市",
	    "430982": "其它區",
	    "431000": "郴州市",
	    "431002": "北湖區",
	    "431003": "蘇仙區",
	    "431021": "桂陽縣",
	    "431022": "宜章縣",
	    "431023": "永興縣",
	    "431024": "嘉禾縣",
	    "431025": "臨武縣",
	    "431026": "汝城縣",
	    "431027": "桂東縣",
	    "431028": "安仁縣",
	    "431081": "資興市",
	    "431082": "其它區",
	    "431100": "永州市",
	    "431102": "零陵區",
	    "431103": "冷水灘區",
	    "431121": "祁陽縣",
	    "431122": "東安縣",
	    "431123": "雙牌縣",
	    "431124": "道縣",
	    "431125": "江永縣",
	    "431126": "寧遠縣",
	    "431127": "藍山縣",
	    "431128": "新田縣",
	    "431129": "江華瑤族自治縣",
	    "431130": "其它區",
	    "431200": "懷化市",
	    "431202": "鶴城區",
	    "431221": "中方縣",
	    "431222": "沅陵縣",
	    "431223": "辰溪縣",
	    "431224": "漵浦縣",
	    "431225": "會同縣",
	    "431226": "麻陽苗族自治縣",
	    "431227": "新晃侗族自治縣",
	    "431228": "芷江侗族自治縣",
	    "431229": "靖州苗族侗族自治縣",
	    "431230": "通道侗族自治縣",
	    "431281": "洪江市",
	    "431282": "其它區",
	    "431300": "婁底市",
	    "431302": "婁星區",
	    "431321": "雙峰縣",
	    "431322": "新化縣",
	    "431381": "冷水江市",
	    "431382": "漣源市",
	    "431383": "其它區",
	    "433100": "湘西土家族苗族自治州",
	    "433101": "吉首市",
	    "433122": "瀘溪縣",
	    "433123": "鳳凰縣",
	    "433124": "花垣縣",
	    "433125": "保靖縣",
	    "433126": "古丈縣",
	    "433127": "永順縣",
	    "433130": "龍山縣",
	    "433131": "其它區",
	    "440000": "廣東省",
	    "440100": "廣州市",
	    "440103": "荔灣區",
	    "440104": "越秀區",
	    "440105": "海珠區",
	    "440106": "天河區",
	    "440111": "白雲區",
	    "440112": "黃埔區",
	    "440113": "番禺區",
	    "440114": "花都區",
	    "440115": "南沙區",
	    "440116": "蘿崗區",
	    "440183": "增城市",
	    "440184": "從化市",
	    "440189": "其它區",
	    "440200": "韶關市",
	    "440203": "武江區",
	    "440204": "湞江區",
	    "440205": "曲江區",
	    "440222": "始興縣",
	    "440224": "仁化縣",
	    "440229": "翁源縣",
	    "440232": "乳源瑤族自治縣",
	    "440233": "新豐縣",
	    "440281": "樂昌市",
	    "440282": "南雄市",
	    "440283": "其它區",
	    "440300": "深圳市",
	    "440303": "羅湖區",
	    "440304": "福田區",
	    "440305": "南山區",
	    "440306": "寶安區",
	    "440307": "龍崗區",
	    "440308": "鹽田區",
	    "440309": "其它區",
	    "440320": "光明新區",
	    "440321": "坪山新區",
	    "440322": "大鵬新區",
	    "440323": "龍華新區",
	    "440400": "珠海市",
	    "440402": "香洲區",
	    "440403": "鬥門區",
	    "440404": "金灣區",
	    "440488": "其它區",
	    "440500": "汕頭市",
	    "440507": "龍湖區",
	    "440511": "金平區",
	    "440512": "濠江區",
	    "440513": "潮陽區",
	    "440514": "潮南區",
	    "440515": "澄海區",
	    "440523": "南澳縣",
	    "440524": "其它區",
	    "440600": "佛山市",
	    "440604": "禪城區",
	    "440605": "南海區",
	    "440606": "順德區",
	    "440607": "三水區",
	    "440608": "高明區",
	    "440609": "其它區",
	    "440700": "江門市",
	    "440703": "蓬江區",
	    "440704": "江海區",
	    "440705": "新會區",
	    "440781": "台山市",
	    "440783": "開平市",
	    "440784": "鶴山市",
	    "440785": "恩平市",
	    "440786": "其它區",
	    "440800": "湛江市",
	    "440802": "赤坎區",
	    "440803": "霞山區",
	    "440804": "坡頭區",
	    "440811": "麻章區",
	    "440823": "遂溪縣",
	    "440825": "徐聞縣",
	    "440881": "廉江市",
	    "440882": "雷州市",
	    "440883": "吳川市",
	    "440884": "其它區",
	    "440900": "茂名市",
	    "440902": "茂南區",
	    "440903": "茂港區",
	    "440923": "電白縣",
	    "440981": "高州市",
	    "440982": "化州市",
	    "440983": "信宜市",
	    "440984": "其它區",
	    "441200": "肇慶市",
	    "441202": "端州區",
	    "441203": "鼎湖區",
	    "441223": "廣寧縣",
	    "441224": "懷集縣",
	    "441225": "封開縣",
	    "441226": "德慶縣",
	    "441283": "高要市",
	    "441284": "四會市",
	    "441285": "其它區",
	    "441300": "惠州市",
	    "441302": "惠城區",
	    "441303": "惠陽區",
	    "441322": "博羅縣",
	    "441323": "惠東縣",
	    "441324": "龍門縣",
	    "441325": "其它區",
	    "441400": "梅州市",
	    "441402": "梅江區",
	    "441421": "梅縣",
	    "441422": "大埔縣",
	    "441423": "豐順縣",
	    "441424": "五華縣",
	    "441426": "平遠縣",
	    "441427": "蕉嶺縣",
	    "441481": "興寧市",
	    "441482": "其它區",
	    "441500": "汕尾市",
	    "441502": "城區",
	    "441521": "海豐縣",
	    "441523": "陸河縣",
	    "441581": "陸豐市",
	    "441582": "其它區",
	    "441600": "河源市",
	    "441602": "源城區",
	    "441621": "紫金縣",
	    "441622": "龍川縣",
	    "441623": "連平縣",
	    "441624": "和平縣",
	    "441625": "東源縣",
	    "441626": "其它區",
	    "441700": "陽江市",
	    "441702": "江城區",
	    "441721": "陽西縣",
	    "441723": "陽東縣",
	    "441781": "陽春市",
	    "441782": "其它區",
	    "441800": "清遠市",
	    "441802": "清城區",
	    "441821": "佛岡縣",
	    "441823": "陽山縣",
	    "441825": "連山壯族瑤族自治縣",
	    "441826": "連南瑤族自治縣",
	    "441827": "清新區",
	    "441881": "英德市",
	    "441882": "連州市",
	    "441883": "其它區",
	    "441900": "東莞市",
	    "442000": "中山市",
	    "442101": "東沙群島",
	    "445100": "潮州市",
	    "445102": "湘橋區",
	    "445121": "潮安區",
	    "445122": "饒平縣",
	    "445186": "其它區",
	    "445200": "揭陽市",
	    "445202": "榕城區",
	    "445221": "揭東區",
	    "445222": "揭西縣",
	    "445224": "惠來縣",
	    "445281": "普寧市",
	    "445285": "其它區",
	    "445300": "雲浮市",
	    "445302": "雲城區",
	    "445321": "新興縣",
	    "445322": "郁南縣",
	    "445323": "雲安縣",
	    "445381": "羅定市",
	    "445382": "其它區",
	    "450000": "廣西壯族自治區",
	    "450100": "南寧市",
	    "450102": "興寧區",
	    "450103": "青秀區",
	    "450105": "江南區",
	    "450107": "西鄉塘區",
	    "450108": "良慶區",
	    "450109": "邕寧區",
	    "450122": "武鳴縣",
	    "450123": "隆安縣",
	    "450124": "馬山縣",
	    "450125": "上林縣",
	    "450126": "賓陽縣",
	    "450127": "橫縣",
	    "450128": "其它區",
	    "450200": "柳州市",
	    "450202": "城中區",
	    "450203": "魚峰區",
	    "450204": "柳南區",
	    "450205": "柳北區",
	    "450221": "柳江縣",
	    "450222": "柳城縣",
	    "450223": "鹿寨縣",
	    "450224": "融安縣",
	    "450225": "融水苗族自治縣",
	    "450226": "三江侗族自治縣",
	    "450227": "其它區",
	    "450300": "桂林市",
	    "450302": "秀峰區",
	    "450303": "疊彩區",
	    "450304": "象山區",
	    "450305": "七星區",
	    "450311": "雁山區",
	    "450321": "陽朔縣",
	    "450322": "臨桂區",
	    "450323": "靈川縣",
	    "450324": "全州縣",
	    "450325": "興安縣",
	    "450326": "永福縣",
	    "450327": "灌陽縣",
	    "450328": "龍勝各族自治縣",
	    "450329": "資源縣",
	    "450330": "平樂縣",
	    "450331": "荔浦縣",
	    "450332": "恭城瑤族自治縣",
	    "450333": "其它區",
	    "450400": "梧州市",
	    "450403": "萬秀區",
	    "450405": "長洲區",
	    "450406": "龍圩區",
	    "450421": "蒼梧縣",
	    "450422": "藤縣",
	    "450423": "蒙山縣",
	    "450481": "岑溪市",
	    "450482": "其它區",
	    "450500": "北海市",
	    "450502": "海城區",
	    "450503": "銀海區",
	    "450512": "鐵山港區",
	    "450521": "合浦縣",
	    "450522": "其它區",
	    "450600": "防城港市",
	    "450602": "港口區",
	    "450603": "防城區",
	    "450621": "上思縣",
	    "450681": "東興市",
	    "450682": "其它區",
	    "450700": "欽州市",
	    "450702": "欽南區",
	    "450703": "欽北區",
	    "450721": "靈山縣",
	    "450722": "浦北縣",
	    "450723": "其它區",
	    "450800": "貴港市",
	    "450802": "港北區",
	    "450803": "港南區",
	    "450804": "覃塘區",
	    "450821": "平南縣",
	    "450881": "桂平市",
	    "450882": "其它區",
	    "450900": "玉林市",
	    "450902": "玉州區",
	    "450903": "福綿區",
	    "450921": "容縣",
	    "450922": "陸川縣",
	    "450923": "博白縣",
	    "450924": "興業縣",
	    "450981": "北流市",
	    "450982": "其它區",
	    "451000": "百色市",
	    "451002": "右江區",
	    "451021": "田陽縣",
	    "451022": "田東縣",
	    "451023": "平果縣",
	    "451024": "德保縣",
	    "451025": "靖西縣",
	    "451026": "那坡縣",
	    "451027": "淩雲縣",
	    "451028": "樂業縣",
	    "451029": "田林縣",
	    "451030": "西林縣",
	    "451031": "隆林各族自治縣",
	    "451032": "其它區",
	    "451100": "賀州市",
	    "451102": "八步區",
	    "451119": "平桂管理區",
	    "451121": "昭平縣",
	    "451122": "鐘山縣",
	    "451123": "富川瑤族自治縣",
	    "451124": "其它區",
	    "451200": "河池市",
	    "451202": "金城江區",
	    "451221": "南丹縣",
	    "451222": "天峨縣",
	    "451223": "鳳山縣",
	    "451224": "東蘭縣",
	    "451225": "羅城仫佬族自治縣",
	    "451226": "環江毛南族自治縣",
	    "451227": "巴馬瑤族自治縣",
	    "451228": "都安瑤族自治縣",
	    "451229": "大化瑤族自治縣",
	    "451281": "宜州市",
	    "451282": "其它區",
	    "451300": "來賓市",
	    "451302": "興賓區",
	    "451321": "忻城縣",
	    "451322": "象州縣",
	    "451323": "武宣縣",
	    "451324": "金秀瑤族自治縣",
	    "451381": "合山市",
	    "451382": "其它區",
	    "451400": "崇左市",
	    "451402": "江州區",
	    "451421": "扶綏縣",
	    "451422": "寧明縣",
	    "451423": "龍州縣",
	    "451424": "大新縣",
	    "451425": "天等縣",
	    "451481": "憑祥市",
	    "451482": "其它區",
	    "460000": "海南省",
	    "460100": "海口市",
	    "460105": "秀英區",
	    "460106": "龍華區",
	    "460107": "瓊山區",
	    "460108": "美蘭區",
	    "460109": "其它區",
	    "460200": "三亞市",
	    "460300": "三沙市",
	    "460321": "西沙群島",
	    "460322": "南沙群島",
	    "460323": "中沙群島的島礁及其海域",
	    "469001": "五指山市",
	    "469002": "瓊海市",
	    "469003": "儋州市",
	    "469005": "文昌市",
	    "469006": "萬寧市",
	    "469007": "東方市",
	    "469025": "定安縣",
	    "469026": "屯昌縣",
	    "469027": "澄邁縣",
	    "469028": "臨高縣",
	    "469030": "白沙黎族自治縣",
	    "469031": "昌江黎族自治縣",
	    "469033": "樂東黎族自治縣",
	    "469034": "陵水黎族自治縣",
	    "469035": "保亭黎族苗族自治縣",
	    "469036": "瓊中黎族苗族自治縣",
	    "471005": "其它區",
	    "500000": "重慶",
	    "500100": "重慶市",
	    "500101": "萬州區",
	    "500102": "涪陵區",
	    "500103": "渝中區",
	    "500104": "大渡口區",
	    "500105": "江北區",
	    "500106": "沙坪壩區",
	    "500107": "九龍坡區",
	    "500108": "南岸區",
	    "500109": "北碚區",
	    "500110": "萬盛區",
	    "500111": "雙橋區",
	    "500112": "渝北區",
	    "500113": "巴南區",
	    "500114": "黔江區",
	    "500115": "長壽區",
	    "500222": "綦江區",
	    "500223": "潼南縣",
	    "500224": "銅梁縣",
	    "500225": "大足區",
	    "500226": "榮昌縣",
	    "500227": "璧山縣",
	    "500228": "梁平縣",
	    "500229": "城口縣",
	    "500230": "豐都縣",
	    "500231": "墊江縣",
	    "500232": "武隆縣",
	    "500233": "忠縣",
	    "500234": "開縣",
	    "500235": "雲陽縣",
	    "500236": "奉節縣",
	    "500237": "巫山縣",
	    "500238": "巫溪縣",
	    "500240": "石柱土家族自治縣",
	    "500241": "秀山土家族苗族自治縣",
	    "500242": "酉陽土家族苗族自治縣",
	    "500243": "彭水苗族土家族自治縣",
	    "500381": "江津區",
	    "500382": "合川區",
	    "500383": "永川區",
	    "500384": "南川區",
	    "500385": "其它區",
	    "510000": "四川省",
	    "510100": "成都市",
	    "510104": "錦江區",
	    "510105": "青羊區",
	    "510106": "金牛區",
	    "510107": "武侯區",
	    "510108": "成華區",
	    "510112": "龍泉驛區",
	    "510113": "青白江區",
	    "510114": "新都區",
	    "510115": "溫江區",
	    "510121": "金堂縣",
	    "510122": "雙流縣",
	    "510124": "郫縣",
	    "510129": "大邑縣",
	    "510131": "蒲江縣",
	    "510132": "新津縣",
	    "510181": "都江堰市",
	    "510182": "彭州市",
	    "510183": "邛崍市",
	    "510184": "崇州市",
	    "510185": "其它區",
	    "510300": "自貢市",
	    "510302": "自流井區",
	    "510303": "貢井區",
	    "510304": "大安區",
	    "510311": "沿灘區",
	    "510321": "榮縣",
	    "510322": "富順縣",
	    "510323": "其它區",
	    "510400": "攀枝花市",
	    "510402": "東區",
	    "510403": "西區",
	    "510411": "仁和區",
	    "510421": "米易縣",
	    "510422": "鹽邊縣",
	    "510423": "其它區",
	    "510500": "瀘州市",
	    "510502": "江陽區",
	    "510503": "納溪區",
	    "510504": "龍馬潭區",
	    "510521": "瀘縣",
	    "510522": "合江縣",
	    "510524": "敘永縣",
	    "510525": "古藺縣",
	    "510526": "其它區",
	    "510600": "德陽市",
	    "510603": "旌陽區",
	    "510623": "中江縣",
	    "510626": "羅江縣",
	    "510681": "廣漢市",
	    "510682": "什邡市",
	    "510683": "綿竹市",
	    "510684": "其它區",
	    "510700": "綿陽市",
	    "510703": "涪城區",
	    "510704": "遊仙區",
	    "510722": "三台縣",
	    "510723": "鹽亭縣",
	    "510724": "安縣",
	    "510725": "梓潼縣",
	    "510726": "北川羌族自治縣",
	    "510727": "平武縣",
	    "510781": "江油市",
	    "510782": "其它區",
	    "510800": "廣元市",
	    "510802": "利州區",
	    "510811": "昭化區",
	    "510812": "朝天區",
	    "510821": "旺蒼縣",
	    "510822": "青川縣",
	    "510823": "劍閣縣",
	    "510824": "蒼溪縣",
	    "510825": "其它區",
	    "510900": "遂寧市",
	    "510903": "船山區",
	    "510904": "安居區",
	    "510921": "蓬溪縣",
	    "510922": "射洪縣",
	    "510923": "大英縣",
	    "510924": "其它區",
	    "511000": "內江市",
	    "511002": "市中區",
	    "511011": "東興區",
	    "511024": "威遠縣",
	    "511025": "資中縣",
	    "511028": "隆昌縣",
	    "511029": "其它區",
	    "511100": "樂山市",
	    "511102": "市中區",
	    "511111": "沙灣區",
	    "511112": "五通橋區",
	    "511113": "金口河區",
	    "511123": "犍為縣",
	    "511124": "井研縣",
	    "511126": "夾江縣",
	    "511129": "沐川縣",
	    "511132": "峨邊彜族自治縣",
	    "511133": "馬邊彜族自治縣",
	    "511181": "峨眉山市",
	    "511182": "其它區",
	    "511300": "南充市",
	    "511302": "順慶區",
	    "511303": "高坪區",
	    "511304": "嘉陵區",
	    "511321": "南部縣",
	    "511322": "營山縣",
	    "511323": "蓬安縣",
	    "511324": "儀隴縣",
	    "511325": "西充縣",
	    "511381": "閬中市",
	    "511382": "其它區",
	    "511400": "眉山市",
	    "511402": "東坡區",
	    "511421": "仁壽縣",
	    "511422": "彭山縣",
	    "511423": "洪雅縣",
	    "511424": "丹棱縣",
	    "511425": "青神縣",
	    "511426": "其它區",
	    "511500": "宜賓市",
	    "511502": "翠屏區",
	    "511521": "宜賓縣",
	    "511522": "南溪區",
	    "511523": "江安縣",
	    "511524": "長寧縣",
	    "511525": "高縣",
	    "511526": "珙縣",
	    "511527": "筠連縣",
	    "511528": "興文縣",
	    "511529": "屏山縣",
	    "511530": "其它區",
	    "511600": "廣安市",
	    "511602": "廣安區",
	    "511603": "前鋒區",
	    "511621": "岳池縣",
	    "511622": "武勝縣",
	    "511623": "鄰水縣",
	    "511681": "華鎣市",
	    "511683": "其它區",
	    "511700": "達州市",
	    "511702": "通川區",
	    "511721": "達川區",
	    "511722": "宣漢縣",
	    "511723": "開江縣",
	    "511724": "大竹縣",
	    "511725": "渠縣",
	    "511781": "萬源市",
	    "511782": "其它區",
	    "511800": "雅安市",
	    "511802": "雨城區",
	    "511821": "名山區",
	    "511822": "滎經縣",
	    "511823": "漢源縣",
	    "511824": "石棉縣",
	    "511825": "天全縣",
	    "511826": "蘆山縣",
	    "511827": "寶興縣",
	    "511828": "其它區",
	    "511900": "巴中市",
	    "511902": "巴州區",
	    "511903": "恩陽區",
	    "511921": "通江縣",
	    "511922": "南江縣",
	    "511923": "平昌縣",
	    "511924": "其它區",
	    "512000": "資陽市",
	    "512002": "雁江區",
	    "512021": "安岳縣",
	    "512022": "樂至縣",
	    "512081": "簡陽市",
	    "512082": "其它區",
	    "513200": "阿壩藏族羌族自治州",
	    "513221": "汶川縣",
	    "513222": "理縣",
	    "513223": "茂縣",
	    "513224": "松潘縣",
	    "513225": "九寨溝縣",
	    "513226": "金川縣",
	    "513227": "小金縣",
	    "513228": "黑水縣",
	    "513229": "馬爾康縣",
	    "513230": "壤塘縣",
	    "513231": "阿壩縣",
	    "513232": "若爾蓋縣",
	    "513233": "紅原縣",
	    "513234": "其它區",
	    "513300": "甘孜藏族自治州",
	    "513321": "康定縣",
	    "513322": "瀘定縣",
	    "513323": "丹巴縣",
	    "513324": "九龍縣",
	    "513325": "雅江縣",
	    "513326": "道孚縣",
	    "513327": "爐霍縣",
	    "513328": "甘孜縣",
	    "513329": "新龍縣",
	    "513330": "德格縣",
	    "513331": "白玉縣",
	    "513332": "石渠縣",
	    "513333": "色達縣",
	    "513334": "理塘縣",
	    "513335": "巴塘縣",
	    "513336": "鄉城縣",
	    "513337": "稻城縣",
	    "513338": "得榮縣",
	    "513339": "其它區",
	    "513400": "涼山彜族自治州",
	    "513401": "西昌市",
	    "513422": "木裏藏族自治縣",
	    "513423": "鹽源縣",
	    "513424": "德昌縣",
	    "513425": "會理縣",
	    "513426": "會東縣",
	    "513427": "寧南縣",
	    "513428": "普格縣",
	    "513429": "布拖縣",
	    "513430": "金陽縣",
	    "513431": "昭覺縣",
	    "513432": "喜德縣",
	    "513433": "冕寧縣",
	    "513434": "越西縣",
	    "513435": "甘洛縣",
	    "513436": "美姑縣",
	    "513437": "雷波縣",
	    "513438": "其它區",
	    "520000": "貴州省",
	    "520100": "貴陽市",
	    "520102": "南明區",
	    "520103": "雲巖區",
	    "520111": "花溪區",
	    "520112": "烏當區",
	    "520113": "白雲區",
	    "520121": "開陽縣",
	    "520122": "息烽縣",
	    "520123": "修文縣",
	    "520151": "觀山湖區",
	    "520181": "清鎮市",
	    "520182": "其它區",
	    "520200": "六盤水市",
	    "520201": "鐘山區",
	    "520203": "六枝特區",
	    "520221": "水城縣",
	    "520222": "盤縣",
	    "520223": "其它區",
	    "520300": "遵義市",
	    "520302": "紅花崗區",
	    "520303": "匯川區",
	    "520321": "遵義縣",
	    "520322": "桐梓縣",
	    "520323": "綏陽縣",
	    "520324": "正安縣",
	    "520325": "道真仡佬族苗族自治縣",
	    "520326": "務川仡佬族苗族自治縣",
	    "520327": "鳳岡縣",
	    "520328": "湄潭縣",
	    "520329": "余慶縣",
	    "520330": "習水縣",
	    "520381": "赤水市",
	    "520382": "仁懷市",
	    "520383": "其它區",
	    "520400": "安順市",
	    "520402": "西秀區",
	    "520421": "平壩縣",
	    "520422": "普定縣",
	    "520423": "鎮寧布依族苗族自治縣",
	    "520424": "關嶺布依族苗族自治縣",
	    "520425": "紫雲苗族布依族自治縣",
	    "520426": "其它區",
	    "522200": "銅仁市",
	    "522201": "碧江區",
	    "522222": "江口縣",
	    "522223": "玉屏侗族自治縣",
	    "522224": "石阡縣",
	    "522225": "思南縣",
	    "522226": "印江土家族苗族自治縣",
	    "522227": "德江縣",
	    "522228": "沿河土家族自治縣",
	    "522229": "松桃苗族自治縣",
	    "522230": "萬山區",
	    "522231": "其它區",
	    "522300": "黔西南布依族苗族自治州",
	    "522301": "興義市",
	    "522322": "興仁縣",
	    "522323": "普安縣",
	    "522324": "晴隆縣",
	    "522325": "貞豐縣",
	    "522326": "望謨縣",
	    "522327": "冊亨縣",
	    "522328": "安龍縣",
	    "522329": "其它區",
	    "522400": "畢節市",
	    "522401": "七星關區",
	    "522422": "大方縣",
	    "522423": "黔西縣",
	    "522424": "金沙縣",
	    "522425": "織金縣",
	    "522426": "納雍縣",
	    "522427": "威寧彜族回族苗族自治縣",
	    "522428": "赫章縣",
	    "522429": "其它區",
	    "522600": "黔東南苗族侗族自治州",
	    "522601": "凱裏市",
	    "522622": "黃平縣",
	    "522623": "施秉縣",
	    "522624": "三穗縣",
	    "522625": "鎮遠縣",
	    "522626": "岑鞏縣",
	    "522627": "天柱縣",
	    "522628": "錦屏縣",
	    "522629": "劍河縣",
	    "522630": "台江縣",
	    "522631": "黎平縣",
	    "522632": "榕江縣",
	    "522633": "從江縣",
	    "522634": "雷山縣",
	    "522635": "麻江縣",
	    "522636": "丹寨縣",
	    "522637": "其它區",
	    "522700": "黔南布依族苗族自治州",
	    "522701": "都勻市",
	    "522702": "福泉市",
	    "522722": "荔波縣",
	    "522723": "貴定縣",
	    "522725": "甕安縣",
	    "522726": "獨山縣",
	    "522727": "平塘縣",
	    "522728": "羅甸縣",
	    "522729": "長順縣",
	    "522730": "龍裏縣",
	    "522731": "惠水縣",
	    "522732": "三都水族自治縣",
	    "522733": "其它區",
	    "530000": "雲南省",
	    "530100": "昆明市",
	    "530102": "五華區",
	    "530103": "盤龍區",
	    "530111": "官渡區",
	    "530112": "西山區",
	    "530113": "東川區",
	    "530121": "呈貢區",
	    "530122": "晉寧縣",
	    "530124": "富民縣",
	    "530125": "宜良縣",
	    "530126": "石林彜族自治縣",
	    "530127": "嵩明縣",
	    "530128": "祿勸彜族苗族自治縣",
	    "530129": "尋甸回族彜族自治縣",
	    "530181": "安寧市",
	    "530182": "其它區",
	    "530300": "曲靖市",
	    "530302": "麒麟區",
	    "530321": "馬龍縣",
	    "530322": "陸良縣",
	    "530323": "師宗縣",
	    "530324": "羅平縣",
	    "530325": "富源縣",
	    "530326": "會澤縣",
	    "530328": "沾益縣",
	    "530381": "宣威市",
	    "530382": "其它區",
	    "530400": "玉溪市",
	    "530402": "紅塔區",
	    "530421": "江川縣",
	    "530422": "澄江縣",
	    "530423": "通海縣",
	    "530424": "華寧縣",
	    "530425": "易門縣",
	    "530426": "峨山彜族自治縣",
	    "530427": "新平彜族傣族自治縣",
	    "530428": "元江哈尼族彜族傣族自治縣",
	    "530429": "其它區",
	    "530500": "保山市",
	    "530502": "隆陽區",
	    "530521": "施甸縣",
	    "530522": "騰沖縣",
	    "530523": "龍陵縣",
	    "530524": "昌寧縣",
	    "530525": "其它區",
	    "530600": "昭通市",
	    "530602": "昭陽區",
	    "530621": "魯甸縣",
	    "530622": "巧家縣",
	    "530623": "鹽津縣",
	    "530624": "大關縣",
	    "530625": "永善縣",
	    "530626": "綏江縣",
	    "530627": "鎮雄縣",
	    "530628": "彜良縣",
	    "530629": "威信縣",
	    "530630": "水富縣",
	    "530631": "其它區",
	    "530700": "麗江市",
	    "530702": "古城區",
	    "530721": "玉龍納西族自治縣",
	    "530722": "永勝縣",
	    "530723": "華坪縣",
	    "530724": "寧蒗彜族自治縣",
	    "530725": "其它區",
	    "530800": "普洱市",
	    "530802": "思茅區",
	    "530821": "寧洱哈尼族彜族自治縣",
	    "530822": "墨江哈尼族自治縣",
	    "530823": "景東彜族自治縣",
	    "530824": "景谷傣族彜族自治縣",
	    "530825": "鎮沅彜族哈尼族拉祜族自治縣",
	    "530826": "江城哈尼族彜族自治縣",
	    "530827": "孟連傣族拉祜族佤族自治縣",
	    "530828": "瀾滄拉祜族自治縣",
	    "530829": "西盟佤族自治縣",
	    "530830": "其它區",
	    "530900": "臨滄市",
	    "530902": "臨翔區",
	    "530921": "鳳慶縣",
	    "530922": "雲縣",
	    "530923": "永德縣",
	    "530924": "鎮康縣",
	    "530925": "雙江拉祜族佤族布朗族傣族自治縣",
	    "530926": "耿馬傣族佤族自治縣",
	    "530927": "滄源佤族自治縣",
	    "530928": "其它區",
	    "532300": "楚雄彜族自治州",
	    "532301": "楚雄市",
	    "532322": "雙柏縣",
	    "532323": "牟定縣",
	    "532324": "南華縣",
	    "532325": "姚安縣",
	    "532326": "大姚縣",
	    "532327": "永仁縣",
	    "532328": "元謀縣",
	    "532329": "武定縣",
	    "532331": "祿豐縣",
	    "532332": "其它區",
	    "532500": "紅河哈尼族彜族自治州",
	    "532501": "個舊市",
	    "532502": "開遠市",
	    "532522": "蒙自市",
	    "532523": "屏邊苗族自治縣",
	    "532524": "建水縣",
	    "532525": "石屏縣",
	    "532526": "彌勒市",
	    "532527": "瀘西縣",
	    "532528": "元陽縣",
	    "532529": "紅河縣",
	    "532530": "金平苗族瑤族傣族自治縣",
	    "532531": "綠春縣",
	    "532532": "河口瑤族自治縣",
	    "532533": "其它區",
	    "532600": "文山壯族苗族自治州",
	    "532621": "文山市",
	    "532622": "硯山縣",
	    "532623": "西疇縣",
	    "532624": "麻栗坡縣",
	    "532625": "馬關縣",
	    "532626": "丘北縣",
	    "532627": "廣南縣",
	    "532628": "富寧縣",
	    "532629": "其它區",
	    "532800": "西雙版納傣族自治州",
	    "532801": "景洪市",
	    "532822": "猛海縣",
	    "532823": "猛臘縣",
	    "532824": "其它區",
	    "532900": "大理白族自治州",
	    "532901": "大理市",
	    "532922": "漾濞彜族自治縣",
	    "532923": "祥雲縣",
	    "532924": "賓川縣",
	    "532925": "彌渡縣",
	    "532926": "南澗彜族自治縣",
	    "532927": "巍山彜族回族自治縣",
	    "532928": "永平縣",
	    "532929": "雲龍縣",
	    "532930": "洱源縣",
	    "532931": "劍川縣",
	    "532932": "鶴慶縣",
	    "532933": "其它區",
	    "533100": "德宏傣族景頗族自治州",
	    "533102": "瑞麗市",
	    "533103": "芒市",
	    "533122": "梁河縣",
	    "533123": "盈江縣",
	    "533124": "隴川縣",
	    "533125": "其它區",
	    "533300": "怒江傈僳族自治州",
	    "533321": "瀘水縣",
	    "533323": "福貢縣",
	    "533324": "貢山獨龍族怒族自治縣",
	    "533325": "蘭坪白族普米族自治縣",
	    "533326": "其它區",
	    "533400": "迪慶藏族自治州",
	    "533421": "香格裏拉縣",
	    "533422": "德欽縣",
	    "533423": "維西傈僳族自治縣",
	    "533424": "其它區",
	    "540000": "西藏自治區",
	    "540100": "拉薩市",
	    "540102": "城關區",
	    "540121": "林周縣",
	    "540122": "當雄縣",
	    "540123": "尼木縣",
	    "540124": "曲水縣",
	    "540125": "堆龍德慶縣",
	    "540126": "達孜縣",
	    "540127": "墨竹工卡縣",
	    "540128": "其它區",
	    "542100": "昌都地區",
	    "542121": "昌都縣",
	    "542122": "江達縣",
	    "542123": "貢覺縣",
	    "542124": "類烏齊縣",
	    "542125": "丁青縣",
	    "542126": "察雅縣",
	    "542127": "八宿縣",
	    "542128": "左貢縣",
	    "542129": "芒康縣",
	    "542132": "洛隆縣",
	    "542133": "邊壩縣",
	    "542134": "其它區",
	    "542200": "山南地區",
	    "542221": "乃東縣",
	    "542222": "紮囊縣",
	    "542223": "貢嘎縣",
	    "542224": "桑日縣",
	    "542225": "瓊結縣",
	    "542226": "曲松縣",
	    "542227": "措美縣",
	    "542228": "洛紮縣",
	    "542229": "加查縣",
	    "542231": "隆子縣",
	    "542232": "錯那縣",
	    "542233": "浪卡子縣",
	    "542234": "其它區",
	    "542300": "日喀則地區",
	    "542301": "日喀則市",
	    "542322": "南木林縣",
	    "542323": "江孜縣",
	    "542324": "定日縣",
	    "542325": "薩迦縣",
	    "542326": "拉孜縣",
	    "542327": "昂仁縣",
	    "542328": "謝通門縣",
	    "542329": "白朗縣",
	    "542330": "仁布縣",
	    "542331": "康馬縣",
	    "542332": "定結縣",
	    "542333": "仲巴縣",
	    "542334": "亞東縣",
	    "542335": "吉隆縣",
	    "542336": "聶拉木縣",
	    "542337": "薩嘎縣",
	    "542338": "崗巴縣",
	    "542339": "其它區",
	    "542400": "那曲地區",
	    "542421": "那曲縣",
	    "542422": "嘉黎縣",
	    "542423": "比如縣",
	    "542424": "聶榮縣",
	    "542425": "安多縣",
	    "542426": "申紮縣",
	    "542427": "索縣",
	    "542428": "班戈縣",
	    "542429": "巴青縣",
	    "542430": "尼瑪縣",
	    "542431": "其它區",
	    "542432": "雙湖縣",
	    "542500": "阿裏地區",
	    "542521": "普蘭縣",
	    "542522": "劄達縣",
	    "542523": "噶爾縣",
	    "542524": "日土縣",
	    "542525": "革吉縣",
	    "542526": "改則縣",
	    "542527": "措勤縣",
	    "542528": "其它區",
	    "542600": "林芝地區",
	    "542621": "林芝縣",
	    "542622": "工布江達縣",
	    "542623": "米林縣",
	    "542624": "墨脫縣",
	    "542625": "波密縣",
	    "542626": "察隅縣",
	    "542627": "朗縣",
	    "542628": "其它區",
	    "610000": "陜西省",
	    "610100": "西安市",
	    "610102": "新城區",
	    "610103": "碑林區",
	    "610104": "蓮湖區",
	    "610111": "灞橋區",
	    "610112": "未央區",
	    "610113": "雁塔區",
	    "610114": "閻良區",
	    "610115": "臨潼區",
	    "610116": "長安區",
	    "610122": "藍田縣",
	    "610124": "周至縣",
	    "610125": "戶縣",
	    "610126": "高陵縣",
	    "610127": "其它區",
	    "610200": "銅川市",
	    "610202": "王益區",
	    "610203": "印台區",
	    "610204": "耀州區",
	    "610222": "宜君縣",
	    "610223": "其它區",
	    "610300": "寶雞市",
	    "610302": "渭濱區",
	    "610303": "金台區",
	    "610304": "陳倉區",
	    "610322": "鳳翔縣",
	    "610323": "岐山縣",
	    "610324": "扶風縣",
	    "610326": "眉縣",
	    "610327": "隴縣",
	    "610328": "千陽縣",
	    "610329": "麟遊縣",
	    "610330": "鳳縣",
	    "610331": "太白縣",
	    "610332": "其它區",
	    "610400": "鹹陽市",
	    "610402": "秦都區",
	    "610403": "楊陵區",
	    "610404": "渭城區",
	    "610422": "三原縣",
	    "610423": "涇陽縣",
	    "610424": "乾縣",
	    "610425": "禮泉縣",
	    "610426": "永壽縣",
	    "610427": "彬縣",
	    "610428": "長武縣",
	    "610429": "旬邑縣",
	    "610430": "淳化縣",
	    "610431": "武功縣",
	    "610481": "興平市",
	    "610482": "其它區",
	    "610500": "渭南市",
	    "610502": "臨渭區",
	    "610521": "華縣",
	    "610522": "潼關縣",
	    "610523": "大荔縣",
	    "610524": "合陽縣",
	    "610525": "澄城縣",
	    "610526": "蒲城縣",
	    "610527": "白水縣",
	    "610528": "富平縣",
	    "610581": "韓城市",
	    "610582": "華陰市",
	    "610583": "其它區",
	    "610600": "延安市",
	    "610602": "寶塔區",
	    "610621": "延長縣",
	    "610622": "延川縣",
	    "610623": "子長縣",
	    "610624": "安塞縣",
	    "610625": "志丹縣",
	    "610626": "吳起縣",
	    "610627": "甘泉縣",
	    "610628": "富縣",
	    "610629": "洛川縣",
	    "610630": "宜川縣",
	    "610631": "黃龍縣",
	    "610632": "黃陵縣",
	    "610633": "其它區",
	    "610700": "漢中市",
	    "610702": "漢台區",
	    "610721": "南鄭縣",
	    "610722": "城固縣",
	    "610723": "洋縣",
	    "610724": "西鄉縣",
	    "610725": "勉縣",
	    "610726": "寧強縣",
	    "610727": "略陽縣",
	    "610728": "鎮巴縣",
	    "610729": "留壩縣",
	    "610730": "佛坪縣",
	    "610731": "其它區",
	    "610800": "榆林市",
	    "610802": "榆陽區",
	    "610821": "神木縣",
	    "610822": "府谷縣",
	    "610823": "橫山縣",
	    "610824": "靖邊縣",
	    "610825": "定邊縣",
	    "610826": "綏德縣",
	    "610827": "米脂縣",
	    "610828": "佳縣",
	    "610829": "吳堡縣",
	    "610830": "清澗縣",
	    "610831": "子洲縣",
	    "610832": "其它區",
	    "610900": "安康市",
	    "610902": "漢濱區",
	    "610921": "漢陰縣",
	    "610922": "石泉縣",
	    "610923": "寧陜縣",
	    "610924": "紫陽縣",
	    "610925": "嵐臯縣",
	    "610926": "平利縣",
	    "610927": "鎮坪縣",
	    "610928": "旬陽縣",
	    "610929": "白河縣",
	    "610930": "其它區",
	    "611000": "商洛市",
	    "611002": "商州區",
	    "611021": "洛南縣",
	    "611022": "丹鳳縣",
	    "611023": "商南縣",
	    "611024": "山陽縣",
	    "611025": "鎮安縣",
	    "611026": "柞水縣",
	    "611027": "其它區",
	    "620000": "甘肅省",
	    "620100": "蘭州市",
	    "620102": "城關區",
	    "620103": "七裏河區",
	    "620104": "西固區",
	    "620105": "安寧區",
	    "620111": "紅古區",
	    "620121": "永登縣",
	    "620122": "臯蘭縣",
	    "620123": "榆中縣",
	    "620124": "其它區",
	    "620200": "嘉峪關市",
	    "620300": "金昌市",
	    "620302": "金川區",
	    "620321": "永昌縣",
	    "620322": "其它區",
	    "620400": "白銀市",
	    "620402": "白銀區",
	    "620403": "平川區",
	    "620421": "靖遠縣",
	    "620422": "會寧縣",
	    "620423": "景泰縣",
	    "620424": "其它區",
	    "620500": "天水市",
	    "620502": "秦州區",
	    "620503": "麥積區",
	    "620521": "清水縣",
	    "620522": "秦安縣",
	    "620523": "甘谷縣",
	    "620524": "武山縣",
	    "620525": "張家川回族自治縣",
	    "620526": "其它區",
	    "620600": "武威市",
	    "620602": "涼州區",
	    "620621": "民勤縣",
	    "620622": "古浪縣",
	    "620623": "天祝藏族自治縣",
	    "620624": "其它區",
	    "620700": "張掖市",
	    "620702": "甘州區",
	    "620721": "肅南裕固族自治縣",
	    "620722": "民樂縣",
	    "620723": "臨澤縣",
	    "620724": "高台縣",
	    "620725": "山丹縣",
	    "620726": "其它區",
	    "620800": "平涼市",
	    "620802": "崆峒區",
	    "620821": "涇川縣",
	    "620822": "靈台縣",
	    "620823": "崇信縣",
	    "620824": "華亭縣",
	    "620825": "莊浪縣",
	    "620826": "靜寧縣",
	    "620827": "其它區",
	    "620900": "酒泉市",
	    "620902": "肅州區",
	    "620921": "金塔縣",
	    "620922": "瓜州縣",
	    "620923": "肅北蒙古族自治縣",
	    "620924": "阿克塞哈薩克族自治縣",
	    "620981": "玉門市",
	    "620982": "敦煌市",
	    "620983": "其它區",
	    "621000": "慶陽市",
	    "621002": "西峰區",
	    "621021": "慶城縣",
	    "621022": "環縣",
	    "621023": "華池縣",
	    "621024": "合水縣",
	    "621025": "正寧縣",
	    "621026": "寧縣",
	    "621027": "鎮原縣",
	    "621028": "其它區",
	    "621100": "定西市",
	    "621102": "安定區",
	    "621121": "通渭縣",
	    "621122": "隴西縣",
	    "621123": "渭源縣",
	    "621124": "臨洮縣",
	    "621125": "漳縣",
	    "621126": "岷縣",
	    "621127": "其它區",
	    "621200": "隴南市",
	    "621202": "武都區",
	    "621221": "成縣",
	    "621222": "文縣",
	    "621223": "宕昌縣",
	    "621224": "康縣",
	    "621225": "西和縣",
	    "621226": "禮縣",
	    "621227": "徽縣",
	    "621228": "兩當縣",
	    "621229": "其它區",
	    "622900": "臨夏回族自治州",
	    "622901": "臨夏市",
	    "622921": "臨夏縣",
	    "622922": "康樂縣",
	    "622923": "永靖縣",
	    "622924": "廣河縣",
	    "622925": "和政縣",
	    "622926": "東鄉族自治縣",
	    "622927": "積石山保安族東鄉族撒拉族自治縣",
	    "622928": "其它區",
	    "623000": "甘南藏族自治州",
	    "623001": "合作市",
	    "623021": "臨潭縣",
	    "623022": "卓尼縣",
	    "623023": "舟曲縣",
	    "623024": "叠部縣",
	    "623025": "瑪曲縣",
	    "623026": "碌曲縣",
	    "623027": "夏河縣",
	    "623028": "其它區",
	    "630000": "青海省",
	    "630100": "西寧市",
	    "630102": "城東區",
	    "630103": "城中區",
	    "630104": "城西區",
	    "630105": "城北區",
	    "630121": "大通回族土族自治縣",
	    "630122": "湟中縣",
	    "630123": "湟源縣",
	    "630124": "其它區",
	    "632100": "海東市",
	    "632121": "平安縣",
	    "632122": "民和回族土族自治縣",
	    "632123": "樂都區",
	    "632126": "互助土族自治縣",
	    "632127": "化隆回族自治縣",
	    "632128": "循化撒拉族自治縣",
	    "632129": "其它區",
	    "632200": "海北藏族自治州",
	    "632221": "門源回族自治縣",
	    "632222": "祁連縣",
	    "632223": "海晏縣",
	    "632224": "剛察縣",
	    "632225": "其它區",
	    "632300": "黃南藏族自治州",
	    "632321": "同仁縣",
	    "632322": "尖紮縣",
	    "632323": "澤庫縣",
	    "632324": "河南蒙古族自治縣",
	    "632325": "其它區",
	    "632500": "海南藏族自治州",
	    "632521": "共和縣",
	    "632522": "同德縣",
	    "632523": "貴德縣",
	    "632524": "興海縣",
	    "632525": "貴南縣",
	    "632526": "其它區",
	    "632600": "果洛藏族自治州",
	    "632621": "瑪沁縣",
	    "632622": "班瑪縣",
	    "632623": "甘德縣",
	    "632624": "達日縣",
	    "632625": "久治縣",
	    "632626": "瑪多縣",
	    "632627": "其它區",
	    "632700": "玉樹藏族自治州",
	    "632721": "玉樹市",
	    "632722": "雜多縣",
	    "632723": "稱多縣",
	    "632724": "治多縣",
	    "632725": "囊謙縣",
	    "632726": "曲麻萊縣",
	    "632727": "其它區",
	    "632800": "海西蒙古族藏族自治州",
	    "632801": "格爾木市",
	    "632802": "德令哈市",
	    "632821": "烏蘭縣",
	    "632822": "都蘭縣",
	    "632823": "天峻縣",
	    "632824": "其它區",
	    "640000": "寧夏回族自治區",
	    "640100": "銀川市",
	    "640104": "興慶區",
	    "640105": "西夏區",
	    "640106": "金鳳區",
	    "640121": "永寧縣",
	    "640122": "賀蘭縣",
	    "640181": "靈武市",
	    "640182": "其它區",
	    "640200": "石嘴山市",
	    "640202": "大武口區",
	    "640205": "惠農區",
	    "640221": "平羅縣",
	    "640222": "其它區",
	    "640300": "吳忠市",
	    "640302": "利通區",
	    "640303": "紅寺堡區",
	    "640323": "鹽池縣",
	    "640324": "同心縣",
	    "640381": "青銅峽市",
	    "640382": "其它區",
	    "640400": "固原市",
	    "640402": "原州區",
	    "640422": "西吉縣",
	    "640423": "隆德縣",
	    "640424": "涇源縣",
	    "640425": "彭陽縣",
	    "640426": "其它區",
	    "640500": "中衛市",
	    "640502": "沙坡頭區",
	    "640521": "中寧縣",
	    "640522": "海原縣",
	    "640523": "其它區",
	    "650000": "新疆維吾爾自治區",
	    "650100": "烏魯木齊市",
	    "650102": "天山區",
	    "650103": "沙依巴克區",
	    "650104": "新市區",
	    "650105": "水磨溝區",
	    "650106": "頭屯河區",
	    "650107": "達阪城區",
	    "650109": "米東區",
	    "650121": "烏魯木齊縣",
	    "650122": "其它區",
	    "650200": "克拉瑪依市",
	    "650202": "獨山子區",
	    "650203": "克拉瑪依區",
	    "650204": "白堿灘區",
	    "650205": "烏爾禾區",
	    "650206": "其它區",
	    "652100": "吐魯番地區",
	    "652101": "吐魯番市",
	    "652122": "鄯善縣",
	    "652123": "托克遜縣",
	    "652124": "其它區",
	    "652200": "哈密地區",
	    "652201": "哈密市",
	    "652222": "巴裏坤哈薩克自治縣",
	    "652223": "伊吾縣",
	    "652224": "其它區",
	    "652300": "昌吉回族自治州",
	    "652301": "昌吉市",
	    "652302": "阜康市",
	    "652323": "呼圖壁縣",
	    "652324": "瑪納斯縣",
	    "652325": "奇台縣",
	    "652327": "吉木薩爾縣",
	    "652328": "木壘哈薩克自治縣",
	    "652329": "其它區",
	    "652700": "博爾塔拉蒙古自治州",
	    "652701": "博樂市",
	    "652702": "阿拉山口市",
	    "652722": "精河縣",
	    "652723": "溫泉縣",
	    "652724": "其它區",
	    "652800": "巴音郭楞蒙古自治州",
	    "652801": "庫爾勒市",
	    "652822": "輪台縣",
	    "652823": "尉犁縣",
	    "652824": "若羌縣",
	    "652825": "且末縣",
	    "652826": "焉耆回族自治縣",
	    "652827": "和靜縣",
	    "652828": "和碩縣",
	    "652829": "博湖縣",
	    "652830": "其它區",
	    "652900": "阿克蘇地區",
	    "652901": "阿克蘇市",
	    "652922": "溫宿縣",
	    "652923": "庫車縣",
	    "652924": "沙雅縣",
	    "652925": "新和縣",
	    "652926": "拜城縣",
	    "652927": "烏什縣",
	    "652928": "阿瓦提縣",
	    "652929": "柯坪縣",
	    "652930": "其它區",
	    "653000": "克孜勒蘇柯爾克孜自治州",
	    "653001": "阿圖什市",
	    "653022": "阿克陶縣",
	    "653023": "阿合奇縣",
	    "653024": "烏恰縣",
	    "653025": "其它區",
	    "653100": "喀什地區",
	    "653101": "喀什市",
	    "653121": "疏附縣",
	    "653122": "疏勒縣",
	    "653123": "英吉沙縣",
	    "653124": "澤普縣",
	    "653125": "莎車縣",
	    "653126": "葉城縣",
	    "653127": "麥蓋提縣",
	    "653128": "岳普湖縣",
	    "653129": "伽師縣",
	    "653130": "巴楚縣",
	    "653131": "塔什庫爾幹塔吉克自治縣",
	    "653132": "其它區",
	    "653200": "和田地區",
	    "653201": "和田市",
	    "653221": "和田縣",
	    "653222": "墨玉縣",
	    "653223": "皮山縣",
	    "653224": "洛浦縣",
	    "653225": "策勒縣",
	    "653226": "於田縣",
	    "653227": "民豐縣",
	    "653228": "其它區",
	    "654000": "伊犁哈薩克自治州",
	    "654002": "伊寧市",
	    "654003": "奎屯市",
	    "654021": "伊寧縣",
	    "654022": "察布查爾錫伯自治縣",
	    "654023": "霍城縣",
	    "654024": "鞏留縣",
	    "654025": "新源縣",
	    "654026": "昭蘇縣",
	    "654027": "特克斯縣",
	    "654028": "尼勒克縣",
	    "654029": "其它區",
	    "654200": "塔城地區",
	    "654201": "塔城市",
	    "654202": "烏蘇市",
	    "654221": "額敏縣",
	    "654223": "沙灣縣",
	    "654224": "托裏縣",
	    "654225": "裕民縣",
	    "654226": "和布克賽爾蒙古自治縣",
	    "654227": "其它區",
	    "654300": "阿勒泰地區",
	    "654301": "阿勒泰市",
	    "654321": "布爾津縣",
	    "654322": "富蘊縣",
	    "654323": "福海縣",
	    "654324": "哈巴河縣",
	    "654325": "青河縣",
	    "654326": "吉木乃縣",
	    "654327": "其它區",
	    "659001": "石河子市",
	    "659002": "阿拉爾市",
	    "659003": "圖木舒克市",
	    "659004": "五家渠市",
	    "710000": "台灣",
	    "710100": "台北市",
	    "710101": "中正區",
	    "710102": "大同區",
	    "710103": "中山區",
	    "710104": "松山區",
	    "710105": "大安區",
	    "710106": "萬華區",
	    "710107": "信義區",
	    "710108": "士林區",
	    "710109": "北投區",
	    "710110": "內湖區",
	    "710111": "南港區",
	    "710112": "文山區",
	    "710113": "其它區",
	    "710200": "高雄市",
	    "710201": "新興區",
	    "710202": "前金區",
	    "710203": "芩雅區",
	    "710204": "鹽埕區",
	    "710205": "鼓山區",
	    "710206": "旗津區",
	    "710207": "前鎮區",
	    "710208": "三民區",
	    "710209": "左營區",
	    "710210": "楠梓區",
	    "710211": "小港區",
	    "710212": "其它區",
	    "710241": "苓雅區",
	    "710242": "仁武區",
	    "710243": "大社區",
	    "710244": "岡山區",
	    "710245": "路竹區",
	    "710246": "阿蓮區",
	    "710247": "田寮區",
	    "710248": "燕巢區",
	    "710249": "橋頭區",
	    "710250": "梓官區",
	    "710251": "彌陀區",
	    "710252": "永安區",
	    "710253": "湖內區",
	    "710254": "鳳山區",
	    "710255": "大寮區",
	    "710256": "林園區",
	    "710257": "鳥松區",
	    "710258": "大樹區",
	    "710259": "旗山區",
	    "710260": "美濃區",
	    "710261": "六龜區",
	    "710262": "內門區",
	    "710263": "杉林區",
	    "710264": "甲仙區",
	    "710265": "桃源區",
	    "710266": "那瑪夏區",
	    "710267": "茂林區",
	    "710268": "茄萣區",
	    "710300": "台南市",
	    "710301": "中西區",
	    "710302": "東區",
	    "710303": "南區",
	    "710304": "北區",
	    "710305": "安平區",
	    "710306": "安南區",
	    "710307": "其它區",
	    "710339": "永康區",
	    "710340": "歸仁區",
	    "710341": "新化區",
	    "710342": "左鎮區",
	    "710343": "玉井區",
	    "710344": "楠西區",
	    "710345": "南化區",
	    "710346": "仁德區",
	    "710347": "關廟區",
	    "710348": "龍崎區",
	    "710349": "官田區",
	    "710350": "麻豆區",
	    "710351": "佳裏區",
	    "710352": "西港區",
	    "710353": "七股區",
	    "710354": "將軍區",
	    "710355": "學甲區",
	    "710356": "北門區",
	    "710357": "新營區",
	    "710358": "後壁區",
	    "710359": "白河區",
	    "710360": "東山區",
	    "710361": "六甲區",
	    "710362": "下營區",
	    "710363": "柳營區",
	    "710364": "鹽水區",
	    "710365": "善化區",
	    "710366": "大內區",
	    "710367": "山上區",
	    "710368": "新市區",
	    "710369": "安定區",
	    "710400": "台中市",
	    "710401": "中區",
	    "710402": "東區",
	    "710403": "南區",
	    "710404": "西區",
	    "710405": "北區",
	    "710406": "北屯區",
	    "710407": "西屯區",
	    "710408": "南屯區",
	    "710409": "其它區",
	    "710431": "太平區",
	    "710432": "大裏區",
	    "710433": "霧峰區",
	    "710434": "烏日區",
	    "710435": "豐原區",
	    "710436": "後裏區",
	    "710437": "石岡區",
	    "710438": "東勢區",
	    "710439": "和平區",
	    "710440": "新社區",
	    "710441": "潭子區",
	    "710442": "大雅區",
	    "710443": "神岡區",
	    "710444": "大肚區",
	    "710445": "沙鹿區",
	    "710446": "龍井區",
	    "710447": "梧棲區",
	    "710448": "清水區",
	    "710449": "大甲區",
	    "710450": "外埔區",
	    "710451": "大安區",
	    "710500": "金門縣",
	    "710507": "金沙鎮",
	    "710508": "金湖鎮",
	    "710509": "金寧鄉",
	    "710510": "金城鎮",
	    "710511": "烈嶼鄉",
	    "710512": "烏坵鄉",
	    "710600": "南投縣",
	    "710614": "南投市",
	    "710615": "中寮鄉",
	    "710616": "草屯鎮",
	    "710617": "國姓鄉",
	    "710618": "埔裏鎮",
	    "710619": "仁愛鄉",
	    "710620": "名間鄉",
	    "710621": "集集鎮",
	    "710622": "水裏鄉",
	    "710623": "魚池鄉",
	    "710624": "信義鄉",
	    "710625": "竹山鎮",
	    "710626": "鹿谷鄉",
	    "710700": "基隆市",
	    "710701": "仁愛區",
	    "710702": "信義區",
	    "710703": "中正區",
	    "710704": "中山區",
	    "710705": "安樂區",
	    "710706": "暖暖區",
	    "710707": "七堵區",
	    "710708": "其它區",
	    "710800": "新竹市",
	    "710801": "東區",
	    "710802": "北區",
	    "710803": "香山區",
	    "710804": "其它區",
	    "710900": "嘉義市",
	    "710901": "東區",
	    "710902": "西區",
	    "710903": "其它區",
	    "711100": "新北市",
	    "711130": "萬裏區",
	    "711131": "金山區",
	    "711132": "板橋區",
	    "711133": "汐止區",
	    "711134": "深坑區",
	    "711135": "石碇區",
	    "711136": "瑞芳區",
	    "711137": "平溪區",
	    "711138": "雙溪區",
	    "711139": "貢寮區",
	    "711140": "新店區",
	    "711141": "坪林區",
	    "711142": "烏來區",
	    "711143": "永和區",
	    "711144": "中和區",
	    "711145": "土城區",
	    "711146": "三峽區",
	    "711147": "樹林區",
	    "711148": "鶯歌區",
	    "711149": "三重區",
	    "711150": "新莊區",
	    "711151": "泰山區",
	    "711152": "林口區",
	    "711153": "蘆洲區",
	    "711154": "五股區",
	    "711155": "八裏區",
	    "711156": "淡水區",
	    "711157": "三芝區",
	    "711158": "石門區",
	    "711200": "宜蘭縣",
	    "711214": "宜蘭市",
	    "711215": "頭城鎮",
	    "711216": "礁溪鄉",
	    "711217": "壯圍鄉",
	    "711218": "員山鄉",
	    "711219": "羅東鎮",
	    "711220": "三星鄉",
	    "711221": "大同鄉",
	    "711222": "五結鄉",
	    "711223": "冬山鄉",
	    "711224": "蘇澳鎮",
	    "711225": "南澳鄉",
	    "711226": "釣魚台",
	    "711300": "新竹縣",
	    "711314": "竹北市",
	    "711315": "湖口鄉",
	    "711316": "新豐鄉",
	    "711317": "新埔鎮",
	    "711318": "關西鎮",
	    "711319": "芎林鄉",
	    "711320": "寶山鄉",
	    "711321": "竹東鎮",
	    "711322": "五峰鄉",
	    "711323": "橫山鄉",
	    "711324": "尖石鄉",
	    "711325": "北埔鄉",
	    "711326": "峨眉鄉",
	    "711400": "桃園縣",
	    "711414": "中壢市",
	    "711415": "平鎮市",
	    "711416": "龍潭鄉",
	    "711417": "楊梅市",
	    "711418": "新屋鄉",
	    "711419": "觀音鄉",
	    "711420": "桃園市",
	    "711421": "龜山鄉",
	    "711422": "八德市",
	    "711423": "大溪鎮",
	    "711424": "覆興鄉",
	    "711425": "大園鄉",
	    "711426": "蘆竹鄉",
	    "711500": "苗栗縣",
	    "711519": "竹南鎮",
	    "711520": "頭份鎮",
	    "711521": "三灣鄉",
	    "711522": "南莊鄉",
	    "711523": "獅潭鄉",
	    "711524": "後龍鎮",
	    "711525": "通霄鎮",
	    "711526": "苑裏鎮",
	    "711527": "苗栗市",
	    "711528": "造橋鄉",
	    "711529": "頭屋鄉",
	    "711530": "公館鄉",
	    "711531": "大湖鄉",
	    "711532": "泰安鄉",
	    "711533": "銅鑼鄉",
	    "711534": "三義鄉",
	    "711535": "西湖鄉",
	    "711536": "卓蘭鎮",
	    "711700": "彰化縣",
	    "711727": "彰化市",
	    "711728": "芬園鄉",
	    "711729": "花壇鄉",
	    "711730": "秀水鄉",
	    "711731": "鹿港鎮",
	    "711732": "福興鄉",
	    "711733": "線西鄉",
	    "711734": "和美鎮",
	    "711735": "伸港鄉",
	    "711736": "員林鎮",
	    "711737": "社頭鄉",
	    "711738": "永靖鄉",
	    "711739": "埔心鄉",
	    "711740": "溪湖鎮",
	    "711741": "大村鄉",
	    "711742": "埔鹽鄉",
	    "711743": "田中鎮",
	    "711744": "北鬥鎮",
	    "711745": "田尾鄉",
	    "711746": "埤頭鄉",
	    "711747": "溪州鄉",
	    "711748": "竹塘鄉",
	    "711749": "二林鎮",
	    "711750": "大城鄉",
	    "711751": "芳苑鄉",
	    "711752": "二水鄉",
	    "711900": "嘉義縣",
	    "711919": "番路鄉",
	    "711920": "梅山鄉",
	    "711921": "竹崎鄉",
	    "711922": "阿裏山鄉",
	    "711923": "中埔鄉",
	    "711924": "大埔鄉",
	    "711925": "水上鄉",
	    "711926": "鹿草鄉",
	    "711927": "太保市",
	    "711928": "樸子市",
	    "711929": "東石鄉",
	    "711930": "六腳鄉",
	    "711931": "新港鄉",
	    "711932": "民雄鄉",
	    "711933": "大林鎮",
	    "711934": "溪口鄉",
	    "711935": "義竹鄉",
	    "711936": "布袋鎮",
	    "712100": "雲林縣",
	    "712121": "鬥南鎮",
	    "712122": "大埤鄉",
	    "712123": "虎尾鎮",
	    "712124": "土庫鎮",
	    "712125": "褒忠鄉",
	    "712126": "東勢鄉",
	    "712127": "台西鄉",
	    "712128": "侖背鄉",
	    "712129": "麥寮鄉",
	    "712130": "鬥六市",
	    "712131": "林內鄉",
	    "712132": "古坑鄉",
	    "712133": "莿桐鄉",
	    "712134": "西螺鎮",
	    "712135": "二侖鄉",
	    "712136": "北港鎮",
	    "712137": "水林鄉",
	    "712138": "口湖鄉",
	    "712139": "四湖鄉",
	    "712140": "元長鄉",
	    "712400": "屏東縣",
	    "712434": "屏東市",
	    "712435": "三地門鄉",
	    "712436": "霧台鄉",
	    "712437": "瑪家鄉",
	    "712438": "九如鄉",
	    "712439": "裏港鄉",
	    "712440": "高樹鄉",
	    "712441": "鹽埔鄉",
	    "712442": "長治鄉",
	    "712443": "麟洛鄉",
	    "712444": "竹田鄉",
	    "712445": "內埔鄉",
	    "712446": "萬丹鄉",
	    "712447": "潮州鎮",
	    "712448": "泰武鄉",
	    "712449": "來義鄉",
	    "712450": "萬巒鄉",
	    "712451": "崁頂鄉",
	    "712452": "新埤鄉",
	    "712453": "南州鄉",
	    "712454": "林邊鄉",
	    "712455": "東港鎮",
	    "712456": "琉球鄉",
	    "712457": "佳冬鄉",
	    "712458": "新園鄉",
	    "712459": "枋寮鄉",
	    "712460": "枋山鄉",
	    "712461": "春日鄉",
	    "712462": "獅子鄉",
	    "712463": "車城鄉",
	    "712464": "牡丹鄉",
	    "712465": "恒春鎮",
	    "712466": "滿州鄉",
	    "712500": "台東縣",
	    "712517": "台東市",
	    "712518": "綠島鄉",
	    "712519": "蘭嶼鄉",
	    "712520": "延平鄉",
	    "712521": "卑南鄉",
	    "712522": "鹿野鄉",
	    "712523": "關山鎮",
	    "712524": "海端鄉",
	    "712525": "池上鄉",
	    "712526": "東河鄉",
	    "712527": "成功鎮",
	    "712528": "長濱鄉",
	    "712529": "金峰鄉",
	    "712530": "大武鄉",
	    "712531": "達仁鄉",
	    "712532": "太麻裏鄉",
	    "712600": "花蓮縣",
	    "712615": "花蓮市",
	    "712616": "新城鄉",
	    "712617": "太魯閣",
	    "712618": "秀林鄉",
	    "712619": "吉安鄉",
	    "712620": "壽豐鄉",
	    "712621": "鳳林鎮",
	    "712622": "光覆鄉",
	    "712623": "豐濱鄉",
	    "712624": "瑞穗鄉",
	    "712625": "萬榮鄉",
	    "712626": "玉裏鎮",
	    "712627": "卓溪鄉",
	    "712628": "富裏鄉",
	    "712700": "澎湖縣",
	    "712707": "馬公市",
	    "712708": "西嶼鄉",
	    "712709": "望安鄉",
	    "712710": "七美鄉",
	    "712711": "白沙鄉",
	    "712712": "湖西鄉",
	    "712800": "連江縣",
	    "712805": "南竿鄉",
	    "712806": "北竿鄉",
	    "712807": "莒光鄉",
	    "712808": "東引鄉",
	    "810000": "香港特別行政區",
	    "810100": "香港島",
	    "810101": "中西區",
	    "810102": "灣仔",
	    "810103": "東區",
	    "810104": "南區",
	    "810200": "九龍",
	    "810201": "九龍城區",
	    "810202": "油尖旺區",
	    "810203": "深水埗區",
	    "810204": "黃大仙區",
	    "810205": "觀塘區",
	    "810300": "新界",
	    "810301": "北區",
	    "810302": "大埔區",
	    "810303": "沙田區",
	    "810304": "西貢區",
	    "810305": "元朗區",
	    "810306": "屯門區",
	    "810307": "荃灣區",
	    "810308": "葵青區",
	    "810309": "離島區",
	    "820000": "澳門特別行政區",
	    "820100": "澳門半島",
	    "820200": "離島",
	    "990000": "海外",
	    "990100": "海外"
	}

	// id pid/parentId name children
	function tree(list) {
	    var mapped = {}
	    for (var i = 0, item; i < list.length; i++) {
	        item = list[i]
	        if (!item || !item.id) continue
	        mapped[item.id] = item
	    }

	    var result = []
	    for (var ii = 0; ii < list.length; ii++) {
	        item = list[ii]

	        if (!item) continue
	        /* jshint -W041 */
	        if (item.pid == undefined && item.parentId == undefined) {
	            result.push(item)
	            continue
	        }
	        var parent = mapped[item.pid] || mapped[item.parentId]
	        if (!parent) continue
	        if (!parent.children) parent.children = []
	        parent.children.push(item)
	    }
	    return result
	}

	var DICT_FIXED = function () {
	    var fixed = []
	    for (var id in DICT) {
	        var pid = id.slice(2, 6) === '0000' ? undefined :
	            id.slice(4, 6) == '00' ? (id.slice(0, 2) + '0000') :
	                id.slice(0, 4) + '00'
	        fixed.push({
	            id: id,
	            pid: pid,
	            name: DICT[id]
	        })
	    }
	    return tree(fixed)
	}()

	module.exports = DICT_FIXED

/***/ }),
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

	/*
	    ## Miscellaneous
	*/
	var DICT = __webpack_require__(18)
	module.exports = {
		// Dice
		d4: function () {
			return this.natural(1, 4)
		},
		d6: function () {
			return this.natural(1, 6)
		},
		d8: function () {
			return this.natural(1, 8)
		},
		d12: function () {
			return this.natural(1, 12)
		},
		d20: function () {
			return this.natural(1, 20)
		},
		d100: function () {
			return this.natural(1, 100)
		},
		/*
		    隨機生成一個 GUID。

		    http://www.broofa.com/2008/09/javascript-uuid-function/
		    [UUID 規範](http://www.ietf.org/rfc/rfc4122.txt)
		        UUIDs (Universally Unique IDentifier)
		        GUIDs (Globally Unique IDentifier)
		        The formal definition of the UUID string representation is provided by the following ABNF [7]:
		            UUID                   = time-low "-" time-mid "-"
		                                   time-high-and-version "-"
		                                   clock-seq-and-reserved
		                                   clock-seq-low "-" node
		            time-low               = 4hexOctet
		            time-mid               = 2hexOctet
		            time-high-and-version  = 2hexOctet
		            clock-seq-and-reserved = hexOctet
		            clock-seq-low          = hexOctet
		            node                   = 6hexOctet
		            hexOctet               = hexDigit hexDigit
		            hexDigit =
		                "0" / "1" / "2" / "3" / "4" / "5" / "6" / "7" / "8" / "9" /
		                "a" / "b" / "c" / "d" / "e" / "f" /
		                "A" / "B" / "C" / "D" / "E" / "F"
		    
		    https://github.com/victorquinn/chancejs/blob/develop/chance.js#L1349
		*/
		guid: function () {
			var pool = "abcdefABCDEF1234567890",
				guid = this.string(pool, 8) + '-' +
					this.string(pool, 4) + '-' +
					this.string(pool, 4) + '-' +
					this.string(pool, 4) + '-' +
					this.string(pool, 12);
			return guid
		},
		uuid: function () {
			return this.guid()
		},
		/*
		    隨機生成一個 18 位身份證。

		    [身份證](http://baike.baidu.com/view/1697.htm#4)
		        地址碼 6 + 出生日期碼 8 + 順序碼 3 + 校驗碼 1
		    [《中華人民共和國行政區劃代碼》國家標準(GB/T2260)](http://zhidao.baidu.com/question/1954561.html)
		*/
		id: function () {
			var id,
				sum = 0,
				rank = [
					"7", "9", "10", "5", "8", "4", "2", "1", "6", "3", "7", "9", "10", "5", "8", "4", "2"
				],
				last = [
					"1", "0", "X", "9", "8", "7", "6", "5", "4", "3", "2"
				]

			id = this.pick(DICT).id +
				this.date('yyyyMMdd') +
				this.string('number', 3)

			for (var i = 0; i < id.length; i++) {
				sum += id[i] * rank[i];
			}
			id += last[sum % 11];

			return id
		},

		/*
		    生成一個全局的自增整數。
		    類似自增主鍵（auto increment primary key）。
		*/
		increment: function () {
			var key = 0
			return function (step) {
				return key += (+step || 1) // step?
			}
		}(),
		inc: function (step) {
			return this.increment(step)
		}
	}

/***/ }),
/* 20 */
/***/ (function(module, exports, __webpack_require__) {

	var Parser = __webpack_require__(21)
	var Handler = __webpack_require__(22)
	module.exports = {
		Parser: Parser,
		Handler: Handler
	}

/***/ }),
/* 21 */
/***/ (function(module, exports) {

	// https://github.com/nuysoft/regexp
	// forked from https://github.com/ForbesLindesay/regexp

	function parse(n) {
	    if ("string" != typeof n) {
	        var l = new TypeError("The regexp to parse must be represented as a string.");
	        throw l;
	    }
	    return index = 1, cgs = {}, parser.parse(n);
	}

	function Token(n) {
	    this.type = n, this.offset = Token.offset(), this.text = Token.text();
	}

	function Alternate(n, l) {
	    Token.call(this, "alternate"), this.left = n, this.right = l;
	}

	function Match(n) {
	    Token.call(this, "match"), this.body = n.filter(Boolean);
	}

	function Group(n, l) {
	    Token.call(this, n), this.body = l;
	}

	function CaptureGroup(n) {
	    Group.call(this, "capture-group"), this.index = cgs[this.offset] || (cgs[this.offset] = index++),
	        this.body = n;
	}

	function Quantified(n, l) {
	    Token.call(this, "quantified"), this.body = n, this.quantifier = l;
	}

	function Quantifier(n, l) {
	    Token.call(this, "quantifier"), this.min = n, this.max = l, this.greedy = !0;
	}

	function CharSet(n, l) {
	    Token.call(this, "charset"), this.invert = n, this.body = l;
	}

	function CharacterRange(n, l) {
	    Token.call(this, "range"), this.start = n, this.end = l;
	}

	function Literal(n) {
	    Token.call(this, "literal"), this.body = n, this.escaped = this.body != this.text;
	}

	function Unicode(n) {
	    Token.call(this, "unicode"), this.code = n.toUpperCase();
	}

	function Hex(n) {
	    Token.call(this, "hex"), this.code = n.toUpperCase();
	}

	function Octal(n) {
	    Token.call(this, "octal"), this.code = n.toUpperCase();
	}

	function BackReference(n) {
	    Token.call(this, "back-reference"), this.code = n.toUpperCase();
	}

	function ControlCharacter(n) {
	    Token.call(this, "control-character"), this.code = n.toUpperCase();
	}

	var parser = function () {
	    function n(n, l) {
	        function u() {
	            this.constructor = n;
	        }
	        u.prototype = l.prototype, n.prototype = new u();
	    }
	    function l(n, l, u, t, r) {
	        function e(n, l) {
	            function u(n) {
	                function l(n) {
	                    return n.charCodeAt(0).toString(16).toUpperCase();
	                }
	                return n.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\x08/g, "\\b").replace(/\t/g, "\\t").replace(/\n/g, "\\n").replace(/\f/g, "\\f").replace(/\r/g, "\\r").replace(/[\x00-\x07\x0B\x0E\x0F]/g, function (n) {
	                    return "\\x0" + l(n);
	                }).replace(/[\x10-\x1F\x80-\xFF]/g, function (n) {
	                    return "\\x" + l(n);
	                }).replace(/[\u0180-\u0FFF]/g, function (n) {
	                    return "\\u0" + l(n);
	                }).replace(/[\u1080-\uFFFF]/g, function (n) {
	                    return "\\u" + l(n);
	                });
	            }
	            var t, r;
	            switch (n.length) {
	                case 0:
	                    t = "end of input";
	                    break;

	                case 1:
	                    t = n[0];
	                    break;

	                default:
	                    t = n.slice(0, -1).join(", ") + " or " + n[n.length - 1];
	            }
	            return r = l ? '"' + u(l) + '"' : "end of input", "Expected " + t + " but " + r + " found.";
	        }
	        this.expected = n, this.found = l, this.offset = u, this.line = t, this.column = r,
	            this.name = "SyntaxError", this.message = e(n, l);
	    }
	    function u(n) {
	        function u() {
	            return n.substring(Lt, qt);
	        }
	        function t() {
	            return Lt;
	        }
	        function r(l) {
	            function u(l, u, t) {
	                var r, e;
	                for (r = u; t > r; r++) e = n.charAt(r), "\n" === e ? (l.seenCR || l.line++ , l.column = 1,
	                    l.seenCR = !1) : "\r" === e || "\u2028" === e || "\u2029" === e ? (l.line++ , l.column = 1,
	                        l.seenCR = !0) : (l.column++ , l.seenCR = !1);
	            }
	            return Mt !== l && (Mt > l && (Mt = 0, Dt = {
	                line: 1,
	                column: 1,
	                seenCR: !1
	            }), u(Dt, Mt, l), Mt = l), Dt;
	        }
	        function e(n) {
	            Ht > qt || (qt > Ht && (Ht = qt, Ot = []), Ot.push(n));
	        }
	        function o(n) {
	            var l = 0;
	            for (n.sort(); l < n.length;) n[l - 1] === n[l] ? n.splice(l, 1) : l++;
	        }
	        function c() {
	            var l, u, t, r, o;
	            return l = qt, u = i(), null !== u ? (t = qt, 124 === n.charCodeAt(qt) ? (r = fl,
	                qt++) : (r = null, 0 === Wt && e(sl)), null !== r ? (o = c(), null !== o ? (r = [r, o],
	                    t = r) : (qt = t, t = il)) : (qt = t, t = il), null === t && (t = al), null !== t ? (Lt = l,
	                        u = hl(u, t), null === u ? (qt = l, l = u) : l = u) : (qt = l, l = il)) : (qt = l,
	                            l = il), l;
	        }
	        function i() {
	            var n, l, u, t, r;
	            if (n = qt, l = f(), null === l && (l = al), null !== l) if (u = qt, Wt++ , t = d(),
	                Wt-- , null === t ? u = al : (qt = u, u = il), null !== u) {
	                for (t = [], r = h(), null === r && (r = a()); null !== r;) t.push(r), r = h(),
	                    null === r && (r = a());
	                null !== t ? (r = s(), null === r && (r = al), null !== r ? (Lt = n, l = dl(l, t, r),
	                    null === l ? (qt = n, n = l) : n = l) : (qt = n, n = il)) : (qt = n, n = il);
	            } else qt = n, n = il; else qt = n, n = il;
	            return n;
	        }
	        function a() {
	            var n;
	            return n = x(), null === n && (n = Q(), null === n && (n = B())), n;
	        }
	        function f() {
	            var l, u;
	            return l = qt, 94 === n.charCodeAt(qt) ? (u = pl, qt++) : (u = null, 0 === Wt && e(vl)),
	                null !== u && (Lt = l, u = wl()), null === u ? (qt = l, l = u) : l = u, l;
	        }
	        function s() {
	            var l, u;
	            return l = qt, 36 === n.charCodeAt(qt) ? (u = Al, qt++) : (u = null, 0 === Wt && e(Cl)),
	                null !== u && (Lt = l, u = gl()), null === u ? (qt = l, l = u) : l = u, l;
	        }
	        function h() {
	            var n, l, u;
	            return n = qt, l = a(), null !== l ? (u = d(), null !== u ? (Lt = n, l = bl(l, u),
	                null === l ? (qt = n, n = l) : n = l) : (qt = n, n = il)) : (qt = n, n = il), n;
	        }
	        function d() {
	            var n, l, u;
	            return Wt++ , n = qt, l = p(), null !== l ? (u = k(), null === u && (u = al), null !== u ? (Lt = n,
	                l = Tl(l, u), null === l ? (qt = n, n = l) : n = l) : (qt = n, n = il)) : (qt = n,
	                    n = il), Wt-- , null === n && (l = null, 0 === Wt && e(kl)), n;
	        }
	        function p() {
	            var n;
	            return n = v(), null === n && (n = w(), null === n && (n = A(), null === n && (n = C(),
	                null === n && (n = g(), null === n && (n = b()))))), n;
	        }
	        function v() {
	            var l, u, t, r, o, c;
	            return l = qt, 123 === n.charCodeAt(qt) ? (u = xl, qt++) : (u = null, 0 === Wt && e(yl)),
	                null !== u ? (t = T(), null !== t ? (44 === n.charCodeAt(qt) ? (r = ml, qt++) : (r = null,
	                    0 === Wt && e(Rl)), null !== r ? (o = T(), null !== o ? (125 === n.charCodeAt(qt) ? (c = Fl,
	                        qt++) : (c = null, 0 === Wt && e(Ql)), null !== c ? (Lt = l, u = Sl(t, o), null === u ? (qt = l,
	                            l = u) : l = u) : (qt = l, l = il)) : (qt = l, l = il)) : (qt = l, l = il)) : (qt = l,
	                                l = il)) : (qt = l, l = il), l;
	        }
	        function w() {
	            var l, u, t, r;
	            return l = qt, 123 === n.charCodeAt(qt) ? (u = xl, qt++) : (u = null, 0 === Wt && e(yl)),
	                null !== u ? (t = T(), null !== t ? (n.substr(qt, 2) === Ul ? (r = Ul, qt += 2) : (r = null,
	                    0 === Wt && e(El)), null !== r ? (Lt = l, u = Gl(t), null === u ? (qt = l, l = u) : l = u) : (qt = l,
	                        l = il)) : (qt = l, l = il)) : (qt = l, l = il), l;
	        }
	        function A() {
	            var l, u, t, r;
	            return l = qt, 123 === n.charCodeAt(qt) ? (u = xl, qt++) : (u = null, 0 === Wt && e(yl)),
	                null !== u ? (t = T(), null !== t ? (125 === n.charCodeAt(qt) ? (r = Fl, qt++) : (r = null,
	                    0 === Wt && e(Ql)), null !== r ? (Lt = l, u = Bl(t), null === u ? (qt = l, l = u) : l = u) : (qt = l,
	                        l = il)) : (qt = l, l = il)) : (qt = l, l = il), l;
	        }
	        function C() {
	            var l, u;
	            return l = qt, 43 === n.charCodeAt(qt) ? (u = jl, qt++) : (u = null, 0 === Wt && e($l)),
	                null !== u && (Lt = l, u = ql()), null === u ? (qt = l, l = u) : l = u, l;
	        }
	        function g() {
	            var l, u;
	            return l = qt, 42 === n.charCodeAt(qt) ? (u = Ll, qt++) : (u = null, 0 === Wt && e(Ml)),
	                null !== u && (Lt = l, u = Dl()), null === u ? (qt = l, l = u) : l = u, l;
	        }
	        function b() {
	            var l, u;
	            return l = qt, 63 === n.charCodeAt(qt) ? (u = Hl, qt++) : (u = null, 0 === Wt && e(Ol)),
	                null !== u && (Lt = l, u = Wl()), null === u ? (qt = l, l = u) : l = u, l;
	        }
	        function k() {
	            var l;
	            return 63 === n.charCodeAt(qt) ? (l = Hl, qt++) : (l = null, 0 === Wt && e(Ol)),
	                l;
	        }
	        function T() {
	            var l, u, t;
	            if (l = qt, u = [], zl.test(n.charAt(qt)) ? (t = n.charAt(qt), qt++) : (t = null,
	                0 === Wt && e(Il)), null !== t) for (; null !== t;) u.push(t), zl.test(n.charAt(qt)) ? (t = n.charAt(qt),
	                    qt++) : (t = null, 0 === Wt && e(Il)); else u = il;
	            return null !== u && (Lt = l, u = Jl(u)), null === u ? (qt = l, l = u) : l = u,
	                l;
	        }
	        function x() {
	            var l, u, t, r;
	            return l = qt, 40 === n.charCodeAt(qt) ? (u = Kl, qt++) : (u = null, 0 === Wt && e(Nl)),
	                null !== u ? (t = R(), null === t && (t = F(), null === t && (t = m(), null === t && (t = y()))),
	                    null !== t ? (41 === n.charCodeAt(qt) ? (r = Pl, qt++) : (r = null, 0 === Wt && e(Vl)),
	                        null !== r ? (Lt = l, u = Xl(t), null === u ? (qt = l, l = u) : l = u) : (qt = l,
	                            l = il)) : (qt = l, l = il)) : (qt = l, l = il), l;
	        }
	        function y() {
	            var n, l;
	            return n = qt, l = c(), null !== l && (Lt = n, l = Yl(l)), null === l ? (qt = n,
	                n = l) : n = l, n;
	        }
	        function m() {
	            var l, u, t;
	            return l = qt, n.substr(qt, 2) === Zl ? (u = Zl, qt += 2) : (u = null, 0 === Wt && e(_l)),
	                null !== u ? (t = c(), null !== t ? (Lt = l, u = nu(t), null === u ? (qt = l, l = u) : l = u) : (qt = l,
	                    l = il)) : (qt = l, l = il), l;
	        }
	        function R() {
	            var l, u, t;
	            return l = qt, n.substr(qt, 2) === lu ? (u = lu, qt += 2) : (u = null, 0 === Wt && e(uu)),
	                null !== u ? (t = c(), null !== t ? (Lt = l, u = tu(t), null === u ? (qt = l, l = u) : l = u) : (qt = l,
	                    l = il)) : (qt = l, l = il), l;
	        }
	        function F() {
	            var l, u, t;
	            return l = qt, n.substr(qt, 2) === ru ? (u = ru, qt += 2) : (u = null, 0 === Wt && e(eu)),
	                null !== u ? (t = c(), null !== t ? (Lt = l, u = ou(t), null === u ? (qt = l, l = u) : l = u) : (qt = l,
	                    l = il)) : (qt = l, l = il), l;
	        }
	        function Q() {
	            var l, u, t, r, o;
	            if (Wt++ , l = qt, 91 === n.charCodeAt(qt) ? (u = iu, qt++) : (u = null, 0 === Wt && e(au)),
	                null !== u) if (94 === n.charCodeAt(qt) ? (t = pl, qt++) : (t = null, 0 === Wt && e(vl)),
	                    null === t && (t = al), null !== t) {
	                    for (r = [], o = S(), null === o && (o = U()); null !== o;) r.push(o), o = S(),
	                        null === o && (o = U());
	                    null !== r ? (93 === n.charCodeAt(qt) ? (o = fu, qt++) : (o = null, 0 === Wt && e(su)),
	                        null !== o ? (Lt = l, u = hu(t, r), null === u ? (qt = l, l = u) : l = u) : (qt = l,
	                            l = il)) : (qt = l, l = il);
	                } else qt = l, l = il; else qt = l, l = il;
	            return Wt-- , null === l && (u = null, 0 === Wt && e(cu)), l;
	        }
	        function S() {
	            var l, u, t, r;
	            return Wt++ , l = qt, u = U(), null !== u ? (45 === n.charCodeAt(qt) ? (t = pu, qt++) : (t = null,
	                0 === Wt && e(vu)), null !== t ? (r = U(), null !== r ? (Lt = l, u = wu(u, r), null === u ? (qt = l,
	                    l = u) : l = u) : (qt = l, l = il)) : (qt = l, l = il)) : (qt = l, l = il), Wt-- ,
	                null === l && (u = null, 0 === Wt && e(du)), l;
	        }
	        function U() {
	            var n, l;
	            return Wt++ , n = G(), null === n && (n = E()), Wt-- , null === n && (l = null, 0 === Wt && e(Au)),
	                n;
	        }
	        function E() {
	            var l, u;
	            return l = qt, Cu.test(n.charAt(qt)) ? (u = n.charAt(qt), qt++) : (u = null, 0 === Wt && e(gu)),
	                null !== u && (Lt = l, u = bu(u)), null === u ? (qt = l, l = u) : l = u, l;
	        }
	        function G() {
	            var n;
	            return n = L(), null === n && (n = Y(), null === n && (n = H(), null === n && (n = O(),
	                null === n && (n = W(), null === n && (n = z(), null === n && (n = I(), null === n && (n = J(),
	                    null === n && (n = K(), null === n && (n = N(), null === n && (n = P(), null === n && (n = V(),
	                        null === n && (n = X(), null === n && (n = _(), null === n && (n = nl(), null === n && (n = ll(),
	                            null === n && (n = ul(), null === n && (n = tl()))))))))))))))))), n;
	        }
	        function B() {
	            var n;
	            return n = j(), null === n && (n = q(), null === n && (n = $())), n;
	        }
	        function j() {
	            var l, u;
	            return l = qt, 46 === n.charCodeAt(qt) ? (u = ku, qt++) : (u = null, 0 === Wt && e(Tu)),
	                null !== u && (Lt = l, u = xu()), null === u ? (qt = l, l = u) : l = u, l;
	        }
	        function $() {
	            var l, u;
	            return Wt++ , l = qt, mu.test(n.charAt(qt)) ? (u = n.charAt(qt), qt++) : (u = null,
	                0 === Wt && e(Ru)), null !== u && (Lt = l, u = bu(u)), null === u ? (qt = l, l = u) : l = u,
	                Wt-- , null === l && (u = null, 0 === Wt && e(yu)), l;
	        }
	        function q() {
	            var n;
	            return n = M(), null === n && (n = D(), null === n && (n = Y(), null === n && (n = H(),
	                null === n && (n = O(), null === n && (n = W(), null === n && (n = z(), null === n && (n = I(),
	                    null === n && (n = J(), null === n && (n = K(), null === n && (n = N(), null === n && (n = P(),
	                        null === n && (n = V(), null === n && (n = X(), null === n && (n = Z(), null === n && (n = _(),
	                            null === n && (n = nl(), null === n && (n = ll(), null === n && (n = ul(), null === n && (n = tl()))))))))))))))))))),
	                n;
	        }
	        function L() {
	            var l, u;
	            return l = qt, n.substr(qt, 2) === Fu ? (u = Fu, qt += 2) : (u = null, 0 === Wt && e(Qu)),
	                null !== u && (Lt = l, u = Su()), null === u ? (qt = l, l = u) : l = u, l;
	        }
	        function M() {
	            var l, u;
	            return l = qt, n.substr(qt, 2) === Fu ? (u = Fu, qt += 2) : (u = null, 0 === Wt && e(Qu)),
	                null !== u && (Lt = l, u = Uu()), null === u ? (qt = l, l = u) : l = u, l;
	        }
	        function D() {
	            var l, u;
	            return l = qt, n.substr(qt, 2) === Eu ? (u = Eu, qt += 2) : (u = null, 0 === Wt && e(Gu)),
	                null !== u && (Lt = l, u = Bu()), null === u ? (qt = l, l = u) : l = u, l;
	        }
	        function H() {
	            var l, u;
	            return l = qt, n.substr(qt, 2) === ju ? (u = ju, qt += 2) : (u = null, 0 === Wt && e($u)),
	                null !== u && (Lt = l, u = qu()), null === u ? (qt = l, l = u) : l = u, l;
	        }
	        function O() {
	            var l, u;
	            return l = qt, n.substr(qt, 2) === Lu ? (u = Lu, qt += 2) : (u = null, 0 === Wt && e(Mu)),
	                null !== u && (Lt = l, u = Du()), null === u ? (qt = l, l = u) : l = u, l;
	        }
	        function W() {
	            var l, u;
	            return l = qt, n.substr(qt, 2) === Hu ? (u = Hu, qt += 2) : (u = null, 0 === Wt && e(Ou)),
	                null !== u && (Lt = l, u = Wu()), null === u ? (qt = l, l = u) : l = u, l;
	        }
	        function z() {
	            var l, u;
	            return l = qt, n.substr(qt, 2) === zu ? (u = zu, qt += 2) : (u = null, 0 === Wt && e(Iu)),
	                null !== u && (Lt = l, u = Ju()), null === u ? (qt = l, l = u) : l = u, l;
	        }
	        function I() {
	            var l, u;
	            return l = qt, n.substr(qt, 2) === Ku ? (u = Ku, qt += 2) : (u = null, 0 === Wt && e(Nu)),
	                null !== u && (Lt = l, u = Pu()), null === u ? (qt = l, l = u) : l = u, l;
	        }
	        function J() {
	            var l, u;
	            return l = qt, n.substr(qt, 2) === Vu ? (u = Vu, qt += 2) : (u = null, 0 === Wt && e(Xu)),
	                null !== u && (Lt = l, u = Yu()), null === u ? (qt = l, l = u) : l = u, l;
	        }
	        function K() {
	            var l, u;
	            return l = qt, n.substr(qt, 2) === Zu ? (u = Zu, qt += 2) : (u = null, 0 === Wt && e(_u)),
	                null !== u && (Lt = l, u = nt()), null === u ? (qt = l, l = u) : l = u, l;
	        }
	        function N() {
	            var l, u;
	            return l = qt, n.substr(qt, 2) === lt ? (u = lt, qt += 2) : (u = null, 0 === Wt && e(ut)),
	                null !== u && (Lt = l, u = tt()), null === u ? (qt = l, l = u) : l = u, l;
	        }
	        function P() {
	            var l, u;
	            return l = qt, n.substr(qt, 2) === rt ? (u = rt, qt += 2) : (u = null, 0 === Wt && e(et)),
	                null !== u && (Lt = l, u = ot()), null === u ? (qt = l, l = u) : l = u, l;
	        }
	        function V() {
	            var l, u;
	            return l = qt, n.substr(qt, 2) === ct ? (u = ct, qt += 2) : (u = null, 0 === Wt && e(it)),
	                null !== u && (Lt = l, u = at()), null === u ? (qt = l, l = u) : l = u, l;
	        }
	        function X() {
	            var l, u;
	            return l = qt, n.substr(qt, 2) === ft ? (u = ft, qt += 2) : (u = null, 0 === Wt && e(st)),
	                null !== u && (Lt = l, u = ht()), null === u ? (qt = l, l = u) : l = u, l;
	        }
	        function Y() {
	            var l, u, t;
	            return l = qt, n.substr(qt, 2) === dt ? (u = dt, qt += 2) : (u = null, 0 === Wt && e(pt)),
	                null !== u ? (n.length > qt ? (t = n.charAt(qt), qt++) : (t = null, 0 === Wt && e(vt)),
	                    null !== t ? (Lt = l, u = wt(t), null === u ? (qt = l, l = u) : l = u) : (qt = l,
	                        l = il)) : (qt = l, l = il), l;
	        }
	        function Z() {
	            var l, u, t;
	            return l = qt, 92 === n.charCodeAt(qt) ? (u = At, qt++) : (u = null, 0 === Wt && e(Ct)),
	                null !== u ? (gt.test(n.charAt(qt)) ? (t = n.charAt(qt), qt++) : (t = null, 0 === Wt && e(bt)),
	                    null !== t ? (Lt = l, u = kt(t), null === u ? (qt = l, l = u) : l = u) : (qt = l,
	                        l = il)) : (qt = l, l = il), l;
	        }
	        function _() {
	            var l, u, t, r;
	            if (l = qt, n.substr(qt, 2) === Tt ? (u = Tt, qt += 2) : (u = null, 0 === Wt && e(xt)),
	                null !== u) {
	                if (t = [], yt.test(n.charAt(qt)) ? (r = n.charAt(qt), qt++) : (r = null, 0 === Wt && e(mt)),
	                    null !== r) for (; null !== r;) t.push(r), yt.test(n.charAt(qt)) ? (r = n.charAt(qt),
	                        qt++) : (r = null, 0 === Wt && e(mt)); else t = il;
	                null !== t ? (Lt = l, u = Rt(t), null === u ? (qt = l, l = u) : l = u) : (qt = l,
	                    l = il);
	            } else qt = l, l = il;
	            return l;
	        }
	        function nl() {
	            var l, u, t, r;
	            if (l = qt, n.substr(qt, 2) === Ft ? (u = Ft, qt += 2) : (u = null, 0 === Wt && e(Qt)),
	                null !== u) {
	                if (t = [], St.test(n.charAt(qt)) ? (r = n.charAt(qt), qt++) : (r = null, 0 === Wt && e(Ut)),
	                    null !== r) for (; null !== r;) t.push(r), St.test(n.charAt(qt)) ? (r = n.charAt(qt),
	                        qt++) : (r = null, 0 === Wt && e(Ut)); else t = il;
	                null !== t ? (Lt = l, u = Et(t), null === u ? (qt = l, l = u) : l = u) : (qt = l,
	                    l = il);
	            } else qt = l, l = il;
	            return l;
	        }
	        function ll() {
	            var l, u, t, r;
	            if (l = qt, n.substr(qt, 2) === Gt ? (u = Gt, qt += 2) : (u = null, 0 === Wt && e(Bt)),
	                null !== u) {
	                if (t = [], St.test(n.charAt(qt)) ? (r = n.charAt(qt), qt++) : (r = null, 0 === Wt && e(Ut)),
	                    null !== r) for (; null !== r;) t.push(r), St.test(n.charAt(qt)) ? (r = n.charAt(qt),
	                        qt++) : (r = null, 0 === Wt && e(Ut)); else t = il;
	                null !== t ? (Lt = l, u = jt(t), null === u ? (qt = l, l = u) : l = u) : (qt = l,
	                    l = il);
	            } else qt = l, l = il;
	            return l;
	        }
	        function ul() {
	            var l, u;
	            return l = qt, n.substr(qt, 2) === Tt ? (u = Tt, qt += 2) : (u = null, 0 === Wt && e(xt)),
	                null !== u && (Lt = l, u = $t()), null === u ? (qt = l, l = u) : l = u, l;
	        }
	        function tl() {
	            var l, u, t;
	            return l = qt, 92 === n.charCodeAt(qt) ? (u = At, qt++) : (u = null, 0 === Wt && e(Ct)),
	                null !== u ? (n.length > qt ? (t = n.charAt(qt), qt++) : (t = null, 0 === Wt && e(vt)),
	                    null !== t ? (Lt = l, u = bu(t), null === u ? (qt = l, l = u) : l = u) : (qt = l,
	                        l = il)) : (qt = l, l = il), l;
	        }
	        var rl, el = arguments.length > 1 ? arguments[1] : {}, ol = {
	            regexp: c
	        }, cl = c, il = null, al = "", fl = "|", sl = '"|"', hl = function (n, l) {
	            return l ? new Alternate(n, l[1]) : n;
	        }, dl = function (n, l, u) {
	            return new Match([n].concat(l).concat([u]));
	        }, pl = "^", vl = '"^"', wl = function () {
	            return new Token("start");
	        }, Al = "$", Cl = '"$"', gl = function () {
	            return new Token("end");
	        }, bl = function (n, l) {
	            return new Quantified(n, l);
	        }, kl = "Quantifier", Tl = function (n, l) {
	            return l && (n.greedy = !1), n;
	        }, xl = "{", yl = '"{"', ml = ",", Rl = '","', Fl = "}", Ql = '"}"', Sl = function (n, l) {
	            return new Quantifier(n, l);
	        }, Ul = ",}", El = '",}"', Gl = function (n) {
	            return new Quantifier(n, 1 / 0);
	        }, Bl = function (n) {
	            return new Quantifier(n, n);
	        }, jl = "+", $l = '"+"', ql = function () {
	            return new Quantifier(1, 1 / 0);
	        }, Ll = "*", Ml = '"*"', Dl = function () {
	            return new Quantifier(0, 1 / 0);
	        }, Hl = "?", Ol = '"?"', Wl = function () {
	            return new Quantifier(0, 1);
	        }, zl = /^[0-9]/, Il = "[0-9]", Jl = function (n) {
	            return +n.join("");
	        }, Kl = "(", Nl = '"("', Pl = ")", Vl = '")"', Xl = function (n) {
	            return n;
	        }, Yl = function (n) {
	            return new CaptureGroup(n);
	        }, Zl = "?:", _l = '"?:"', nu = function (n) {
	            return new Group("non-capture-group", n);
	        }, lu = "?=", uu = '"?="', tu = function (n) {
	            return new Group("positive-lookahead", n);
	        }, ru = "?!", eu = '"?!"', ou = function (n) {
	            return new Group("negative-lookahead", n);
	        }, cu = "CharacterSet", iu = "[", au = '"["', fu = "]", su = '"]"', hu = function (n, l) {
	            return new CharSet(!!n, l);
	        }, du = "CharacterRange", pu = "-", vu = '"-"', wu = function (n, l) {
	            return new CharacterRange(n, l);
	        }, Au = "Character", Cu = /^[^\\\]]/, gu = "[^\\\\\\]]", bu = function (n) {
	            return new Literal(n);
	        }, ku = ".", Tu = '"."', xu = function () {
	            return new Token("any-character");
	        }, yu = "Literal", mu = /^[^|\\\/.[()?+*$\^]/, Ru = "[^|\\\\\\/.[()?+*$\\^]", Fu = "\\b", Qu = '"\\\\b"', Su = function () {
	            return new Token("backspace");
	        }, Uu = function () {
	            return new Token("word-boundary");
	        }, Eu = "\\B", Gu = '"\\\\B"', Bu = function () {
	            return new Token("non-word-boundary");
	        }, ju = "\\d", $u = '"\\\\d"', qu = function () {
	            return new Token("digit");
	        }, Lu = "\\D", Mu = '"\\\\D"', Du = function () {
	            return new Token("non-digit");
	        }, Hu = "\\f", Ou = '"\\\\f"', Wu = function () {
	            return new Token("form-feed");
	        }, zu = "\\n", Iu = '"\\\\n"', Ju = function () {
	            return new Token("line-feed");
	        }, Ku = "\\r", Nu = '"\\\\r"', Pu = function () {
	            return new Token("carriage-return");
	        }, Vu = "\\s", Xu = '"\\\\s"', Yu = function () {
	            return new Token("white-space");
	        }, Zu = "\\S", _u = '"\\\\S"', nt = function () {
	            return new Token("non-white-space");
	        }, lt = "\\t", ut = '"\\\\t"', tt = function () {
	            return new Token("tab");
	        }, rt = "\\v", et = '"\\\\v"', ot = function () {
	            return new Token("vertical-tab");
	        }, ct = "\\w", it = '"\\\\w"', at = function () {
	            return new Token("word");
	        }, ft = "\\W", st = '"\\\\W"', ht = function () {
	            return new Token("non-word");
	        }, dt = "\\c", pt = '"\\\\c"', vt = "any character", wt = function (n) {
	            return new ControlCharacter(n);
	        }, At = "\\", Ct = '"\\\\"', gt = /^[1-9]/, bt = "[1-9]", kt = function (n) {
	            return new BackReference(n);
	        }, Tt = "\\0", xt = '"\\\\0"', yt = /^[0-7]/, mt = "[0-7]", Rt = function (n) {
	            return new Octal(n.join(""));
	        }, Ft = "\\x", Qt = '"\\\\x"', St = /^[0-9a-fA-F]/, Ut = "[0-9a-fA-F]", Et = function (n) {
	            return new Hex(n.join(""));
	        }, Gt = "\\u", Bt = '"\\\\u"', jt = function (n) {
	            return new Unicode(n.join(""));
	        }, $t = function () {
	            return new Token("null-character");
	        }, qt = 0, Lt = 0, Mt = 0, Dt = {
	            line: 1,
	            column: 1,
	            seenCR: !1
	        }, Ht = 0, Ot = [], Wt = 0;
	        if ("startRule" in el) {
	            if (!(el.startRule in ol)) throw new Error("Can't start parsing from rule \"" + el.startRule + '".');
	            cl = ol[el.startRule];
	        }
	        if (Token.offset = t, Token.text = u, rl = cl(), null !== rl && qt === n.length) return rl;
	        throw o(Ot), Lt = Math.max(qt, Ht), new l(Ot, Lt < n.length ? n.charAt(Lt) : null, Lt, r(Lt).line, r(Lt).column);
	    }
	    return n(l, Error), {
	        SyntaxError: l,
	        parse: u
	    };
	}(), index = 1, cgs = {};

	module.exports = parser

/***/ }),
/* 22 */
/***/ (function(module, exports, __webpack_require__) {

	/*
	    ## RegExp Handler

	    https://github.com/ForbesLindesay/regexp
	    https://github.com/dmajda/pegjs
	    http://www.regexper.com/

	    每個節點的結構
	        {
	            type: '',
	            offset: number,
	            text: '',
	            body: {},
	            escaped: true/false
	        }

	    type 可選值
	        alternate             |         選擇
	        match                 匹配
	        capture-group         ()        捕獲組
	        non-capture-group     (?:...)   非捕獲組
	        positive-lookahead    (?=p)     零寬正向先行斷言
	        negative-lookahead    (?!p)     零寬負向先行斷言
	        quantified            a*        重覆節點
	        quantifier            *         量詞
	        charset               []        字符集
	        range                 {m, n}    範圍
	        literal               a         直接量字符
	        unicode               \uxxxx    Unicode
	        hex                   \x        十六進制
	        octal                 八進制
	        back-reference        \n        反向引用
	        control-character     \cX       控制字符

	        // Token
	        start               ^       開頭
	        end                 $       結尾
	        any-character       .       任意字符
	        backspace           [\b]    退格直接量
	        word-boundary       \b      單詞邊界
	        non-word-boundary   \B      非單詞邊界
	        digit               \d      ASCII 數字，[0-9]
	        non-digit           \D      非 ASCII 數字，[^0-9]
	        form-feed           \f      換頁符
	        line-feed           \n      換行符
	        carriage-return     \r      回車符
	        white-space         \s      空白符
	        non-white-space     \S      非空白符
	        tab                 \t      制表符
	        vertical-tab        \v      垂直制表符
	        word                \w      ASCII 字符，[a-zA-Z0-9]
	        non-word            \W      非 ASCII 字符，[^a-zA-Z0-9]
	        null-character      \o      NUL 字符
	 */

	var Util = __webpack_require__(3)
	var Random = __webpack_require__(5)
	/*
	    
	*/
	var Handler = {
	    extend: Util.extend
	}

	// http://en.wikipedia.org/wiki/ASCII#ASCII_printable_code_chart
	/*var ASCII_CONTROL_CODE_CHART = {
	    '@': ['\u0000'],
	    A: ['\u0001'],
	    B: ['\u0002'],
	    C: ['\u0003'],
	    D: ['\u0004'],
	    E: ['\u0005'],
	    F: ['\u0006'],
	    G: ['\u0007', '\a'],
	    H: ['\u0008', '\b'],
	    I: ['\u0009', '\t'],
	    J: ['\u000A', '\n'],
	    K: ['\u000B', '\v'],
	    L: ['\u000C', '\f'],
	    M: ['\u000D', '\r'],
	    N: ['\u000E'],
	    O: ['\u000F'],
	    P: ['\u0010'],
	    Q: ['\u0011'],
	    R: ['\u0012'],
	    S: ['\u0013'],
	    T: ['\u0014'],
	    U: ['\u0015'],
	    V: ['\u0016'],
	    W: ['\u0017'],
	    X: ['\u0018'],
	    Y: ['\u0019'],
	    Z: ['\u001A'],
	    '[': ['\u001B', '\e'],
	    '\\': ['\u001C'],
	    ']': ['\u001D'],
	    '^': ['\u001E'],
	    '_': ['\u001F']
	}*/

	// ASCII printable code chart
	// var LOWER = 'abcdefghijklmnopqrstuvwxyz'
	// var UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
	// var NUMBER = '0123456789'
	// var SYMBOL = ' !"#$%&\'()*+,-./' + ':;<=>?@' + '[\\]^_`' + '{|}~'
	var LOWER = ascii(97, 122)
	var UPPER = ascii(65, 90)
	var NUMBER = ascii(48, 57)
	var OTHER = ascii(32, 47) + ascii(58, 64) + ascii(91, 96) + ascii(123, 126) // 排除 95 _ ascii(91, 94) + ascii(96, 96)
	var PRINTABLE = ascii(32, 126)
	var SPACE = ' \f\n\r\t\v\u00A0\u2028\u2029'
	var CHARACTER_CLASSES = {
	    '\\w': LOWER + UPPER + NUMBER + '_', // ascii(95, 95)
	    '\\W': OTHER.replace('_', ''),
	    '\\s': SPACE,
	    '\\S': function () {
	        var result = PRINTABLE
	        for (var i = 0; i < SPACE.length; i++) {
	            result = result.replace(SPACE[i], '')
	        }
	        return result
	    }(),
	    '\\d': NUMBER,
	    '\\D': LOWER + UPPER + OTHER
	}

	function ascii(from, to) {
	    var result = ''
	    for (var i = from; i <= to; i++) {
	        result += String.fromCharCode(i)
	    }
	    return result
	}

	// var ast = RegExpParser.parse(regexp.source)
	Handler.gen = function (node, result, cache) {
	    cache = cache || {
	        guid: 1
	    }
	    return Handler[node.type] ? Handler[node.type](node, result, cache) :
	        Handler.token(node, result, cache)
	}

	Handler.extend({
	    /* jshint unused:false */
	    token: function (node, result, cache) {
	        switch (node.type) {
	            case 'start':
	            case 'end':
	                return ''
	            case 'any-character':
	                return Random.character()
	            case 'backspace':
	                return ''
	            case 'word-boundary': // TODO
	                return ''
	            case 'non-word-boundary': // TODO
	                break
	            case 'digit':
	                return Random.pick(
	                    NUMBER.split('')
	                )
	            case 'non-digit':
	                return Random.pick(
	                    (LOWER + UPPER + OTHER).split('')
	                )
	            case 'form-feed':
	                break
	            case 'line-feed':
	                return node.body || node.text
	            case 'carriage-return':
	                break
	            case 'white-space':
	                return Random.pick(
	                    SPACE.split('')
	                )
	            case 'non-white-space':
	                return Random.pick(
	                    (LOWER + UPPER + NUMBER).split('')
	                )
	            case 'tab':
	                break
	            case 'vertical-tab':
	                break
	            case 'word': // \w [a-zA-Z0-9]
	                return Random.pick(
	                    (LOWER + UPPER + NUMBER).split('')
	                )
	            case 'non-word': // \W [^a-zA-Z0-9]
	                return Random.pick(
	                    OTHER.replace('_', '').split('')
	                )
	            case 'null-character':
	                break
	        }
	        return node.body || node.text
	    },
	    /*
	        {
	            type: 'alternate',
	            offset: 0,
	            text: '',
	            left: {
	                boyd: []
	            },
	            right: {
	                boyd: []
	            }
	        }
	    */
	    alternate: function (node, result, cache) {
	        // node.left/right {}
	        return this.gen(
	            Random.boolean() ? node.left : node.right,
	            result,
	            cache
	        )
	    },
	    /*
	        {
	            type: 'match',
	            offset: 0,
	            text: '',
	            body: []
	        }
	    */
	    match: function (node, result, cache) {
	        result = ''
	        // node.body []
	        for (var i = 0; i < node.body.length; i++) {
	            result += this.gen(node.body[i], result, cache)
	        }
	        return result
	    },
	    // ()
	    'capture-group': function (node, result, cache) {
	        // node.body {}
	        result = this.gen(node.body, result, cache)
	        cache[cache.guid++] = result
	        return result
	    },
	    // (?:...)
	    'non-capture-group': function (node, result, cache) {
	        // node.body {}
	        return this.gen(node.body, result, cache)
	    },
	    // (?=p)
	    'positive-lookahead': function (node, result, cache) {
	        // node.body
	        return this.gen(node.body, result, cache)
	    },
	    // (?!p)
	    'negative-lookahead': function (node, result, cache) {
	        // node.body
	        return ''
	    },
	    /*
	        {
	            type: 'quantified',
	            offset: 3,
	            text: 'c*',
	            body: {
	                type: 'literal',
	                offset: 3,
	                text: 'c',
	                body: 'c',
	                escaped: false
	            },
	            quantifier: {
	                type: 'quantifier',
	                offset: 4,
	                text: '*',
	                min: 0,
	                max: Infinity,
	                greedy: true
	            }
	        }
	    */
	    quantified: function (node, result, cache) {
	        result = ''
	        // node.quantifier {}
	        var count = this.quantifier(node.quantifier);
	        // node.body {}
	        for (var i = 0; i < count; i++) {
	            result += this.gen(node.body, result, cache)
	        }
	        return result
	    },
	    /*
	        quantifier: {
	            type: 'quantifier',
	            offset: 4,
	            text: '*',
	            min: 0,
	            max: Infinity,
	            greedy: true
	        }
	    */
	    quantifier: function (node, result, cache) {
	        var min = Math.max(node.min, 0)
	        var max = isFinite(node.max) ? node.max :
	            min + Random.integer(3, 7)
	        return Random.integer(min, max)
	    },
	    /*
	        
	    */
	    charset: function (node, result, cache) {
	        // node.invert
	        if (node.invert) return this['invert-charset'](node, result, cache)

	        // node.body []
	        var literal = Random.pick(node.body)
	        return this.gen(literal, result, cache)
	    },
	    'invert-charset': function (node, result, cache) {
	        var pool = PRINTABLE
	        for (var i = 0, item; i < node.body.length; i++) {
	            item = node.body[i]
	            switch (item.type) {
	                case 'literal':
	                    pool = pool.replace(item.body, '')
	                    break
	                case 'range':
	                    var min = this.gen(item.start, result, cache).charCodeAt()
	                    var max = this.gen(item.end, result, cache).charCodeAt()
	                    for (var ii = min; ii <= max; ii++) {
	                        pool = pool.replace(String.fromCharCode(ii), '')
	                    }
	                /* falls through */
	                default:
	                    var characters = CHARACTER_CLASSES[item.text]
	                    if (characters) {
	                        for (var iii = 0; iii <= characters.length; iii++) {
	                            pool = pool.replace(characters[iii], '')
	                        }
	                    }
	            }
	        }
	        return Random.pick(pool.split(''))
	    },
	    range: function (node, result, cache) {
	        // node.start, node.end
	        var min = this.gen(node.start, result, cache).charCodeAt()
	        var max = this.gen(node.end, result, cache).charCodeAt()
	        return String.fromCharCode(
	            Random.integer(min, max)
	        )
	    },
	    literal: function (node, result, cache) {
	        return node.escaped ? node.body : node.text
	    },
	    // Unicode \u
	    unicode: function (node, result, cache) {
	        return String.fromCharCode(
	            parseInt(node.code, 16)
	        )
	    },
	    // 十六進制 \xFF
	    hex: function (node, result, cache) {
	        return String.fromCharCode(
	            parseInt(node.code, 16)
	        )
	    },
	    // 八進制 \0
	    octal: function (node, result, cache) {
	        return String.fromCharCode(
	            parseInt(node.code, 8)
	        )
	    },
	    // 反向引用
	    'back-reference': function (node, result, cache) {
	        return cache[node.code] || ''
	    },
	    /*
	        http://en.wikipedia.org/wiki/C0_and_C1_control_codes
	    */
	    CONTROL_CHARACTER_MAP: function () {
	        var CONTROL_CHARACTER = '@ A B C D E F G H I J K L M N O P Q R S T U V W X Y Z [ \\ ] ^ _'.split(' ')
	        var CONTROL_CHARACTER_UNICODE = '\u0000 \u0001 \u0002 \u0003 \u0004 \u0005 \u0006 \u0007 \u0008 \u0009 \u000A \u000B \u000C \u000D \u000E \u000F \u0010 \u0011 \u0012 \u0013 \u0014 \u0015 \u0016 \u0017 \u0018 \u0019 \u001A \u001B \u001C \u001D \u001E \u001F'.split(' ')
	        var map = {}
	        for (var i = 0; i < CONTROL_CHARACTER.length; i++) {
	            map[CONTROL_CHARACTER[i]] = CONTROL_CHARACTER_UNICODE[i]
	        }
	        return map
	    }(),
	    'control-character': function (node, result, cache) {
	        return this.CONTROL_CHARACTER_MAP[node.code]
	    }
	})

	module.exports = Handler

/***/ }),
/* 23 */
/***/ (function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(24)

/***/ }),
/* 24 */
/***/ (function(module, exports, __webpack_require__) {

	/*
	    ## toJSONSchema

	    把 Mock.js 風格的數據模板轉換成 JSON Schema。

	    > [JSON Schema](http://json-schema.org/)
	 */
	var Constant = __webpack_require__(2)
	var Util = __webpack_require__(3)
	var Parser = __webpack_require__(4)

	function toJSONSchema(template, name, path /* Internal Use Only */) {
	    // type rule properties items
	    path = path || []
	    var result = {
	        name: typeof name === 'string' ? name.replace(Constant.RE_KEY, '$1') : name,
	        template: template,
	        type: Util.type(template), // 可能不準確，例如 { 'name|1': [{}, {} ...] }
	        rule: Parser.parse(name)
	    }
	    result.path = path.slice(0)
	    result.path.push(name === undefined ? 'ROOT' : result.name)

	    switch (result.type) {
	        case 'array':
	            result.items = []
	            Util.each(template, function (value, index) {
	                result.items.push(
	                    toJSONSchema(value, index, result.path)
	                )
	            })
	            break
	        case 'object':
	            result.properties = []
	            Util.each(template, function (value, name) {
	                result.properties.push(
	                    toJSONSchema(value, name, result.path)
	                )
	            })
	            break
	    }

	    return result

	}

	module.exports = toJSONSchema


/***/ }),
/* 25 */
/***/ (function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(26)

/***/ }),
/* 26 */
/***/ (function(module, exports, __webpack_require__) {

	/*
	    ## valid(template, data)

	    校驗真實數據 data 是否與數據模板 template 匹配。
	    
	    實現思路：
	    1. 解析規則。
	        先把數據模板 template 解析為更方便機器解析的 JSON-Schame
	        name               屬性名 
	        type               屬性值類型
	        template           屬性值模板
	        properties         對象屬性數組
	        items              數組元素數組
	        rule               屬性值生成規則
	    2. 遞歸驗證規則。
	        然後用 JSON-Schema 校驗真實數據，校驗項包括屬性名、值類型、值、值生成規則。

	    提示信息 
	    https://github.com/fge/json-schema-validator/blob/master/src/main/resources/com/github/fge/jsonschema/validator/validation.properties
	    [JSON-Schama validator](http://json-schema-validator.herokuapp.com/)
	    [Regexp Demo](http://demos.forbeslindesay.co.uk/regexp/)
	*/
	var Constant = __webpack_require__(2)
	var Util = __webpack_require__(3)
	var toJSONSchema = __webpack_require__(23)

	function valid(template, data) {
	    var schema = toJSONSchema(template)
	    var result = Diff.diff(schema, data)
	    for (var i = 0; i < result.length; i++) {
	        // console.log(template, data)
	        // console.warn(Assert.message(result[i]))
	    }
	    return result
	}

	/*
	    ## name
	        有生成規則：比較解析後的 name
	        無生成規則：直接比較
	    ## type
	        無類型轉換：直接比較
	        有類型轉換：先試著解析 template，然後再檢查？
	    ## value vs. template
	        基本類型
	            無生成規則：直接比較
	            有生成規則：
	                number
	                    min-max.dmin-dmax
	                    min-max.dcount
	                    count.dmin-dmax
	                    count.dcount
	                    +step
	                    整數部分
	                    小數部分
	                boolean 
	                string  
	                    min-max
	                    count
	    ## properties
	        對象
	            有生成規則：檢測期望的屬性個數，繼續遞歸
	            無生成規則：檢測全部的屬性個數，繼續遞歸
	    ## items
	        數組
	            有生成規則：
	                `'name|1': [{}, {} ...]`            其中之一，繼續遞歸
	                `'name|+1': [{}, {} ...]`           順序檢測，繼續遞歸
	                `'name|min-max': [{}, {} ...]`      檢測個數，繼續遞歸
	                `'name|count': [{}, {} ...]`        檢測個數，繼續遞歸
	            無生成規則：檢測全部的元素個數，繼續遞歸
	*/
	var Diff = {
	    diff: function diff(schema, data, name /* Internal Use Only */) {
	        var result = []

	        // 先檢測名稱 name 和類型 type，如果匹配，才有必要繼續檢測
	        if (
	            this.name(schema, data, name, result) &&
	            this.type(schema, data, name, result)
	        ) {
	            this.value(schema, data, name, result)
	            this.properties(schema, data, name, result)
	            this.items(schema, data, name, result)
	        }

	        return result
	    },
	    /* jshint unused:false */
	    name: function (schema, data, name, result) {
	        var length = result.length

	        Assert.equal('name', schema.path, name + '', schema.name + '', result)

	        return result.length === length
	    },
	    type: function (schema, data, name, result) {
	        var length = result.length

	        switch (schema.type) {
	            case 'string':
	                // 跳過含有『占位符』的屬性值，因為『占位符』返回值的類型可能和模板不一致，例如 '@int' 會返回一個整形值
	                if (schema.template.match(Constant.RE_PLACEHOLDER)) return true
	                break
	            case 'array':
	                if (schema.rule.parameters) {
	                    // name|count: array
	                    if (schema.rule.min !== undefined && schema.rule.max === undefined) {
	                        // 跳過 name|1: array，因為最終值的類型（很可能）不是數組，也不一定與 `array` 中的類型一致
	                        if (schema.rule.count === 1) return true
	                    }
	                    // 跳過 name|+inc: array
	                    if (schema.rule.parameters[2]) return true
	                }
	                break
	            case 'function':
	                // 跳過 `'name': function`，因為函數可以返回任何類型的值。
	                return true
	        }

	        Assert.equal('type', schema.path, Util.type(data), schema.type, result)

	        return result.length === length
	    },
	    value: function (schema, data, name, result) {
	        var length = result.length

	        var rule = schema.rule
	        var templateType = schema.type
	        if (templateType === 'object' || templateType === 'array' || templateType === 'function') return true

	        // 無生成規則
	        if (!rule.parameters) {
	            switch (templateType) {
	                case 'regexp':
	                    Assert.match('value', schema.path, data, schema.template, result)
	                    return result.length === length
	                case 'string':
	                    // 同樣跳過含有『占位符』的屬性值，因為『占位符』的返回值會通常會與模板不一致
	                    if (schema.template.match(Constant.RE_PLACEHOLDER)) return result.length === length
	                    break
	            }
	            Assert.equal('value', schema.path, data, schema.template, result)
	            return result.length === length
	        }

	        // 有生成規則
	        var actualRepeatCount
	        switch (templateType) {
	            case 'number':
	                var parts = (data + '').split('.')
	                parts[0] = +parts[0]

	                // 整數部分
	                // |min-max
	                if (rule.min !== undefined && rule.max !== undefined) {
	                    Assert.greaterThanOrEqualTo('value', schema.path, parts[0], Math.min(rule.min, rule.max), result)
	                    // , 'numeric instance is lower than the required minimum (minimum: {expected}, found: {actual})')
	                    Assert.lessThanOrEqualTo('value', schema.path, parts[0], Math.max(rule.min, rule.max), result)
	                }
	                // |count
	                if (rule.min !== undefined && rule.max === undefined) {
	                    Assert.equal('value', schema.path, parts[0], rule.min, result, '[value] ' + name)
	                }

	                // 小數部分
	                if (rule.decimal) {
	                    // |dmin-dmax
	                    if (rule.dmin !== undefined && rule.dmax !== undefined) {
	                        Assert.greaterThanOrEqualTo('value', schema.path, parts[1].length, rule.dmin, result)
	                        Assert.lessThanOrEqualTo('value', schema.path, parts[1].length, rule.dmax, result)
	                    }
	                    // |dcount
	                    if (rule.dmin !== undefined && rule.dmax === undefined) {
	                        Assert.equal('value', schema.path, parts[1].length, rule.dmin, result)
	                    }
	                }

	                break

	            case 'boolean':
	                break

	            case 'string':
	                // 'aaa'.match(/a/g)
	                actualRepeatCount = data.match(new RegExp(schema.template, 'g'))
	                actualRepeatCount = actualRepeatCount ? actualRepeatCount.length : 0

	                // |min-max
	                if (rule.min !== undefined && rule.max !== undefined) {
	                    Assert.greaterThanOrEqualTo('repeat count', schema.path, actualRepeatCount, rule.min, result)
	                    Assert.lessThanOrEqualTo('repeat count', schema.path, actualRepeatCount, rule.max, result)
	                }
	                // |count
	                if (rule.min !== undefined && rule.max === undefined) {
	                    Assert.equal('repeat count', schema.path, actualRepeatCount, rule.min, result)
	                }

	                break

	            case 'regexp':
	                actualRepeatCount = data.match(new RegExp(schema.template.source.replace(/^\^|\$$/g, ''), 'g'))
	                actualRepeatCount = actualRepeatCount ? actualRepeatCount.length : 0

	                // |min-max
	                if (rule.min !== undefined && rule.max !== undefined) {
	                    Assert.greaterThanOrEqualTo('repeat count', schema.path, actualRepeatCount, rule.min, result)
	                    Assert.lessThanOrEqualTo('repeat count', schema.path, actualRepeatCount, rule.max, result)
	                }
	                // |count
	                if (rule.min !== undefined && rule.max === undefined) {
	                    Assert.equal('repeat count', schema.path, actualRepeatCount, rule.min, result)
	                }
	                break
	        }

	        return result.length === length
	    },
	    properties: function (schema, data, name, result) {
	        var length = result.length

	        var rule = schema.rule
	        var keys = Util.keys(data)
	        if (!schema.properties) return

	        // 無生成規則
	        if (!schema.rule.parameters) {
	            Assert.equal('properties length', schema.path, keys.length, schema.properties.length, result)
	        } else {
	            // 有生成規則
	            // |min-max
	            if (rule.min !== undefined && rule.max !== undefined) {
	                Assert.greaterThanOrEqualTo('properties length', schema.path, keys.length, Math.min(rule.min, rule.max), result)
	                Assert.lessThanOrEqualTo('properties length', schema.path, keys.length, Math.max(rule.min, rule.max), result)
	            }
	            // |count
	            if (rule.min !== undefined && rule.max === undefined) {
	                // |1, |>1
	                if (rule.count !== 1) Assert.equal('properties length', schema.path, keys.length, rule.min, result)
	            }
	        }

	        if (result.length !== length) return false

	        for (var i = 0; i < keys.length; i++) {
	            result.push.apply(
	                result,
	                this.diff(
	                    function () {
	                        var property
	                        Util.each(schema.properties, function (item /*, index*/) {
	                            if (item.name === keys[i]) property = item
	                        })
	                        return property || schema.properties[i]
	                    }(),
	                    data[keys[i]],
	                    keys[i]
	                )
	            )
	        }

	        return result.length === length
	    },
	    items: function (schema, data, name, result) {
	        var length = result.length

	        if (!schema.items) return

	        var rule = schema.rule

	        // 無生成規則
	        if (!schema.rule.parameters) {
	            Assert.equal('items length', schema.path, data.length, schema.items.length, result)
	        } else {
	            // 有生成規則
	            // |min-max
	            if (rule.min !== undefined && rule.max !== undefined) {
	                Assert.greaterThanOrEqualTo('items', schema.path, data.length, (Math.min(rule.min, rule.max) * schema.items.length), result,
	                    '[{utype}] array is too short: {path} must have at least {expected} elements but instance has {actual} elements')
	                Assert.lessThanOrEqualTo('items', schema.path, data.length, (Math.max(rule.min, rule.max) * schema.items.length), result,
	                    '[{utype}] array is too long: {path} must have at most {expected} elements but instance has {actual} elements')
	            }
	            // |count
	            if (rule.min !== undefined && rule.max === undefined) {
	                // |1, |>1
	                if (rule.count === 1) return result.length === length
	                else Assert.equal('items length', schema.path, data.length, (rule.min * schema.items.length), result)
	            }
	            // |+inc
	            if (rule.parameters[2]) return result.length === length
	        }

	        if (result.length !== length) return false

	        for (var i = 0; i < data.length; i++) {
	            result.push.apply(
	                result,
	                this.diff(
	                    schema.items[i % schema.items.length],
	                    data[i],
	                    i % schema.items.length
	                )
	            )
	        }

	        return result.length === length
	    }
	}

	/*
	    完善、友好的提示信息
	    
	    Equal, not equal to, greater than, less than, greater than or equal to, less than or equal to
	    路徑 驗證類型 描述 

	    Expect path.name is less than or equal to expected, but path.name is actual.

	    Expect path.name is less than or equal to expected, but path.name is actual.
	    Expect path.name is greater than or equal to expected, but path.name is actual.

	*/
	var Assert = {
	    message: function (item) {
	        return (item.message ||
	            '[{utype}] Expect {path}\'{ltype} {action} {expected}, but is {actual}')
	            .replace('{utype}', item.type.toUpperCase())
	            .replace('{ltype}', item.type.toLowerCase())
	            .replace('{path}', Util.isArray(item.path) && item.path.join('.') || item.path)
	            .replace('{action}', item.action)
	            .replace('{expected}', item.expected)
	            .replace('{actual}', item.actual)
	    },
	    equal: function (type, path, actual, expected, result, message) {
	        if (actual === expected) return true
	        switch (type) {
	            case 'type':
	                // 正則模板 === 字符串最終值
	                if (expected === 'regexp' && actual === 'string') return true
	                break
	        }

	        var item = {
	            path: path,
	            type: type,
	            actual: actual,
	            expected: expected,
	            action: 'is equal to',
	            message: message
	        }
	        item.message = Assert.message(item)
	        result.push(item)
	        return false
	    },
	    // actual matches expected
	    match: function (type, path, actual, expected, result, message) {
	        if (expected.test(actual)) return true

	        var item = {
	            path: path,
	            type: type,
	            actual: actual,
	            expected: expected,
	            action: 'matches',
	            message: message
	        }
	        item.message = Assert.message(item)
	        result.push(item)
	        return false
	    },
	    notEqual: function (type, path, actual, expected, result, message) {
	        if (actual !== expected) return true
	        var item = {
	            path: path,
	            type: type,
	            actual: actual,
	            expected: expected,
	            action: 'is not equal to',
	            message: message
	        }
	        item.message = Assert.message(item)
	        result.push(item)
	        return false
	    },
	    greaterThan: function (type, path, actual, expected, result, message) {
	        if (actual > expected) return true
	        var item = {
	            path: path,
	            type: type,
	            actual: actual,
	            expected: expected,
	            action: 'is greater than',
	            message: message
	        }
	        item.message = Assert.message(item)
	        result.push(item)
	        return false
	    },
	    lessThan: function (type, path, actual, expected, result, message) {
	        if (actual < expected) return true
	        var item = {
	            path: path,
	            type: type,
	            actual: actual,
	            expected: expected,
	            action: 'is less to',
	            message: message
	        }
	        item.message = Assert.message(item)
	        result.push(item)
	        return false
	    },
	    greaterThanOrEqualTo: function (type, path, actual, expected, result, message) {
	        if (actual >= expected) return true
	        var item = {
	            path: path,
	            type: type,
	            actual: actual,
	            expected: expected,
	            action: 'is greater than or equal to',
	            message: message
	        }
	        item.message = Assert.message(item)
	        result.push(item)
	        return false
	    },
	    lessThanOrEqualTo: function (type, path, actual, expected, result, message) {
	        if (actual <= expected) return true
	        var item = {
	            path: path,
	            type: type,
	            actual: actual,
	            expected: expected,
	            action: 'is less than or equal to',
	            message: message
	        }
	        item.message = Assert.message(item)
	        result.push(item)
	        return false
	    }
	}

	valid.Diff = Diff
	valid.Assert = Assert

	module.exports = valid

/***/ }),
/* 27 */
/***/ (function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(28)

/***/ }),
/* 28 */
/***/ (function(module, exports, __webpack_require__) {

	/* global window, document, location, Event, setTimeout */
	/*
	    ## MockXMLHttpRequest

	    期望的功能：
	    1. 完整地覆蓋原生 XHR 的行為
	    2. 完整地模擬原生 XHR 的行為
	    3. 在發起請求時，自動檢測是否需要攔截
	    4. 如果不必攔截，則執行原生 XHR 的行為
	    5. 如果需要攔截，則執行虛擬 XHR 的行為
	    6. 兼容 XMLHttpRequest 和 ActiveXObject
	        new window.XMLHttpRequest()
	        new window.ActiveXObject("Microsoft.XMLHTTP")

	    關鍵方法的邏輯：
	    * new   此時尚無法確定是否需要攔截，所以創建原生 XHR 對象是必須的。
	    * open  此時可以取到 URL，可以決定是否進行攔截。
	    * send  此時已經確定了請求方式。

	    規範：
	    http://xhr.spec.whatwg.org/
	    http://www.w3.org/TR/XMLHttpRequest2/

	    參考實現：
	    https://github.com/philikon/MockHttpRequest/blob/master/lib/mock.js
	    https://github.com/trek/FakeXMLHttpRequest/blob/master/fake_xml_http_request.js
	    https://github.com/ilinsky/xmlhttprequest/blob/master/XMLHttpRequest.js
	    https://github.com/firebug/firebug-lite/blob/master/content/lite/xhr.js
	    https://github.com/thx/RAP/blob/master/lab/rap.plugin.xinglie.js

	    **需不需要全面重寫 XMLHttpRequest？**
	        http://xhr.spec.whatwg.org/#interface-xmlhttprequest
	        關鍵屬性 readyState、status、statusText、response、responseText、responseXML 是 readonly，所以，試圖通過修改這些狀態，來模擬響應是不可行的。
	        因此，唯一的辦法是模擬整個 XMLHttpRequest，就像 jQuery 對事件模型的封裝。

	    // Event handlers
	    onloadstart         loadstart
	    onprogress          progress
	    onabort             abort
	    onerror             error
	    onload              load
	    ontimeout           timeout
	    onloadend           loadend
	    onreadystatechange  readystatechange
	 */

	var Util = __webpack_require__(3)

	// 備份原生 XMLHttpRequest
	window._XMLHttpRequest = window.XMLHttpRequest
	window._ActiveXObject = window.ActiveXObject

	/*
	    PhantomJS
	    TypeError: '[object EventConstructor]' is not a constructor (evaluating 'new Event("readystatechange")')

	    https://github.com/bluerail/twitter-bootstrap-rails-confirm/issues/18
	    https://github.com/ariya/phantomjs/issues/11289
	*/
	try {
	    new window.Event('custom')
	} catch (exception) {
	    window.Event = function (type, bubbles, cancelable, detail) {
	        var event = document.createEvent('CustomEvent') // MUST be 'CustomEvent'
	        event.initCustomEvent(type, bubbles, cancelable, detail)
	        return event
	    }
	}

	var XHR_STATES = {
	    // The object has been constructed.
	    UNSENT: 0,
	    // The open() method has been successfully invoked.
	    OPENED: 1,
	    // All redirects (if any) have been followed and all HTTP headers of the response have been received.
	    HEADERS_RECEIVED: 2,
	    // The response's body is being received.
	    LOADING: 3,
	    // The data transfer has been completed or something went wrong during the transfer (e.g. infinite redirects).
	    DONE: 4
	}

	var XHR_EVENTS = 'readystatechange loadstart progress abort error load timeout loadend'.split(' ')
	var XHR_REQUEST_PROPERTIES = 'timeout withCredentials'.split(' ')
	var XHR_RESPONSE_PROPERTIES = 'readyState responseURL status statusText responseType response responseText responseXML'.split(' ')

	// https://github.com/trek/FakeXMLHttpRequest/blob/master/fake_xml_http_request.js#L32
	var HTTP_STATUS_CODES = {
	    100: "Continue",
	    101: "Switching Protocols",
	    200: "OK",
	    201: "Created",
	    202: "Accepted",
	    203: "Non-Authoritative Information",
	    204: "No Content",
	    205: "Reset Content",
	    206: "Partial Content",
	    300: "Multiple Choice",
	    301: "Moved Permanently",
	    302: "Found",
	    303: "See Other",
	    304: "Not Modified",
	    305: "Use Proxy",
	    307: "Temporary Redirect",
	    400: "Bad Request",
	    401: "Unauthorized",
	    402: "Payment Required",
	    403: "Forbidden",
	    404: "Not Found",
	    405: "Method Not Allowed",
	    406: "Not Acceptable",
	    407: "Proxy Authentication Required",
	    408: "Request Timeout",
	    409: "Conflict",
	    410: "Gone",
	    411: "Length Required",
	    412: "Precondition Failed",
	    413: "Request Entity Too Large",
	    414: "Request-URI Too Long",
	    415: "Unsupported Media Type",
	    416: "Requested Range Not Satisfiable",
	    417: "Expectation Failed",
	    422: "Unprocessable Entity",
	    500: "Internal Server Error",
	    501: "Not Implemented",
	    502: "Bad Gateway",
	    503: "Service Unavailable",
	    504: "Gateway Timeout",
	    505: "HTTP Version Not Supported"
	}

	/*
	    MockXMLHttpRequest
	*/

	function MockXMLHttpRequest() {
	    // 初始化 custom 對象，用於存儲自定義屬性
	    this.custom = {
	        events: {},
	        requestHeaders: {},
	        responseHeaders: {}
	    }
	}

	MockXMLHttpRequest._settings = {
	    timeout: '10-100',
	    /*
	        timeout: 50,
	        timeout: '10-100',
	     */
	}

	MockXMLHttpRequest.setup = function (settings) {
	    Util.extend(MockXMLHttpRequest._settings, settings)
	    return MockXMLHttpRequest._settings
	}

	Util.extend(MockXMLHttpRequest, XHR_STATES)
	Util.extend(MockXMLHttpRequest.prototype, XHR_STATES)

	// 標記當前對象為 MockXMLHttpRequest
	MockXMLHttpRequest.prototype.mock = true

	// 是否攔截 Ajax 請求
	MockXMLHttpRequest.prototype.match = false

	// 初始化 Request 相關的屬性和方法
	Util.extend(MockXMLHttpRequest.prototype, {
	    // https://xhr.spec.whatwg.org/#the-open()-method
	    // Sets the request method, request URL, and synchronous flag.
	    open: function (method, url, async, username, password) {
	        var that = this

	        Util.extend(this.custom, {
	            method: method,
	            url: url,
	            async: typeof async === 'boolean' ? async : true,
	            username: username,
	            password: password,
	            options: {
	                url: url,
	                type: method
	            }
	        })

	        this.custom.timeout = function (timeout) {
	            if (typeof timeout === 'number') return timeout
	            if (typeof timeout === 'string' && !~timeout.indexOf('-')) return parseInt(timeout, 10)
	            if (typeof timeout === 'string' && ~timeout.indexOf('-')) {
	                var tmp = timeout.split('-')
	                var min = parseInt(tmp[0], 10)
	                var max = parseInt(tmp[1], 10)
	                return Math.round(Math.random() * (max - min)) + min
	            }
	        }(MockXMLHttpRequest._settings.timeout)

	        // 查找與請求參數匹配的數據模板
	        var item = find(this.custom.options)

	        function handle(event) {
	            // 同步屬性 NativeXMLHttpRequest => MockXMLHttpRequest
	            for (var i = 0; i < XHR_RESPONSE_PROPERTIES.length; i++) {
	                try {
	                    that[XHR_RESPONSE_PROPERTIES[i]] = xhr[XHR_RESPONSE_PROPERTIES[i]]
	                } catch (e) { }
	            }
	            // 觸發 MockXMLHttpRequest 上的同名事件
	            that.dispatchEvent(new Event(event.type /*, false, false, that*/))
	        }

	        // 如果未找到匹配的數據模板，則采用原生 XHR 發送請求。
	        if (!item) {
	            // 創建原生 XHR 對象，調用原生 open()，監聽所有原生事件
	            var xhr = createNativeXMLHttpRequest()
	            this.custom.xhr = xhr

	            // 初始化所有事件，用於監聽原生 XHR 對象的事件
	            for (var i = 0; i < XHR_EVENTS.length; i++) {
	                xhr.addEventListener(XHR_EVENTS[i], handle)
	            }

	            // xhr.open()
	            if (username) xhr.open(method, url, async, username, password)
	            else xhr.open(method, url, async)

	            // 同步屬性 MockXMLHttpRequest => NativeXMLHttpRequest
	            for (var j = 0; j < XHR_REQUEST_PROPERTIES.length; j++) {
	                try {
	                    xhr[XHR_REQUEST_PROPERTIES[j]] = that[XHR_REQUEST_PROPERTIES[j]]
	                } catch (e) { }
	            }

	            return
	        }

	        // 找到了匹配的數據模板，開始攔截 XHR 請求
	        this.match = true
	        this.custom.template = item
	        this.readyState = MockXMLHttpRequest.OPENED
	        this.dispatchEvent(new Event('readystatechange' /*, false, false, this*/))
	    },
	    // https://xhr.spec.whatwg.org/#the-setrequestheader()-method
	    // Combines a header in author request headers.
	    setRequestHeader: function (name, value) {
	        // 原生 XHR
	        if (!this.match) {
	            this.custom.xhr.setRequestHeader(name, value)
	            return
	        }

	        // 攔截 XHR
	        var requestHeaders = this.custom.requestHeaders
	        if (requestHeaders[name]) requestHeaders[name] += ',' + value
	        else requestHeaders[name] = value
	    },
	    timeout: 0,
	    withCredentials: false,
	    upload: {},
	    // https://xhr.spec.whatwg.org/#the-send()-method
	    // Initiates the request.
	    send: function send(data) {
	        var that = this
	        this.custom.options.body = data

	        // 原生 XHR
	        if (!this.match) {
	            this.custom.xhr.send(data)
	            return
	        }

	        // 攔截 XHR

	        // X-Requested-With header
	        this.setRequestHeader('X-Requested-With', 'MockXMLHttpRequest')

	        // loadstart The fetch initiates.
	        this.dispatchEvent(new Event('loadstart' /*, false, false, this*/))

	        if (this.custom.async) setTimeout(done, this.custom.timeout) // 異步
	        else done() // 同步

	        function done() {
	            that.readyState = MockXMLHttpRequest.HEADERS_RECEIVED
	            that.dispatchEvent(new Event('readystatechange' /*, false, false, that*/))
	            that.readyState = MockXMLHttpRequest.LOADING
	            that.dispatchEvent(new Event('readystatechange' /*, false, false, that*/))

	            that.status = 200
	            that.statusText = HTTP_STATUS_CODES[200]

	            // fix #92 #93 by @qddegtya
	            that.response = that.responseText = JSON.stringify(
	                convert(that.custom.template, that.custom.options),
	                null, 4
	            )

	            that.readyState = MockXMLHttpRequest.DONE
	            that.dispatchEvent(new Event('readystatechange' /*, false, false, that*/))
	            that.dispatchEvent(new Event('load' /*, false, false, that*/));
	            that.dispatchEvent(new Event('loadend' /*, false, false, that*/));
	        }
	    },
	    // https://xhr.spec.whatwg.org/#the-abort()-method
	    // Cancels any network activity.
	    abort: function abort() {
	        // 原生 XHR
	        if (!this.match) {
	            this.custom.xhr.abort()
	            return
	        }

	        // 攔截 XHR
	        this.readyState = MockXMLHttpRequest.UNSENT
	        this.dispatchEvent(new Event('abort', false, false, this))
	        this.dispatchEvent(new Event('error', false, false, this))
	    }
	})

	// 初始化 Response 相關的屬性和方法
	Util.extend(MockXMLHttpRequest.prototype, {
	    responseURL: '',
	    status: MockXMLHttpRequest.UNSENT,
	    statusText: '',
	    // https://xhr.spec.whatwg.org/#the-getresponseheader()-method
	    getResponseHeader: function (name) {
	        // 原生 XHR
	        if (!this.match) {
	            return this.custom.xhr.getResponseHeader(name)
	        }

	        // 攔截 XHR
	        return this.custom.responseHeaders[name.toLowerCase()]
	    },
	    // https://xhr.spec.whatwg.org/#the-getallresponseheaders()-method
	    // http://www.utf8-chartable.de/
	    getAllResponseHeaders: function () {
	        // 原生 XHR
	        if (!this.match) {
	            return this.custom.xhr.getAllResponseHeaders()
	        }

	        // 攔截 XHR
	        var responseHeaders = this.custom.responseHeaders
	        var headers = ''
	        for (var h in responseHeaders) {
	            if (!responseHeaders.hasOwnProperty(h)) continue
	            headers += h + ': ' + responseHeaders[h] + '\r\n'
	        }
	        return headers
	    },
	    overrideMimeType: function ( /*mime*/) { },
	    responseType: '', // '', 'text', 'arraybuffer', 'blob', 'document', 'json'
	    response: null,
	    responseText: '',
	    responseXML: null
	})

	// EventTarget
	Util.extend(MockXMLHttpRequest.prototype, {
	    addEventListener: function addEventListener(type, handle) {
	        var events = this.custom.events
	        if (!events[type]) events[type] = []
	        events[type].push(handle)
	    },
	    removeEventListener: function removeEventListener(type, handle) {
	        var handles = this.custom.events[type] || []
	        for (var i = 0; i < handles.length; i++) {
	            if (handles[i] === handle) {
	                handles.splice(i--, 1)
	            }
	        }
	    },
	    dispatchEvent: function dispatchEvent(event) {
	        var handles = this.custom.events[event.type] || []
	        for (var i = 0; i < handles.length; i++) {
	            handles[i].call(this, event)
	        }

	        var ontype = 'on' + event.type
	        if (this[ontype]) this[ontype](event)
	    }
	})

	// Inspired by jQuery
	function createNativeXMLHttpRequest() {
	    var isLocal = function () {
	        var rlocalProtocol = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/
	        var rurl = /^([\w.+-]+:)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/
	        var ajaxLocation = location.href
	        var ajaxLocParts = rurl.exec(ajaxLocation.toLowerCase()) || []
	        return rlocalProtocol.test(ajaxLocParts[1])
	    }()

	    return window.ActiveXObject ?
	        (!isLocal && createStandardXHR() || createActiveXHR()) : createStandardXHR()

	    function createStandardXHR() {
	        try {
	            return new window._XMLHttpRequest();
	        } catch (e) { }
	    }

	    function createActiveXHR() {
	        try {
	            return new window._ActiveXObject("Microsoft.XMLHTTP");
	        } catch (e) { }
	    }
	}


	// 查找與請求參數匹配的數據模板：URL，Type
	function find(options) {

	    for (var sUrlType in MockXMLHttpRequest.Mock._mocked) {
	        var item = MockXMLHttpRequest.Mock._mocked[sUrlType]
	        if (
	            (!item.rurl || match(item.rurl, options.url)) &&
	            (!item.rtype || match(item.rtype, options.type.toLowerCase()))
	        ) {
	            // console.log('[mock]', options.url, '>', item.rurl)
	            return item
	        }
	    }

	    function match(expected, actual) {
	        if (Util.type(expected) === 'string') {
	            return expected === actual
	        }
	        if (Util.type(expected) === 'regexp') {
	            return expected.test(actual)
	        }
	    }

	}

	// 數據模板 ＝> 響應數據
	function convert(item, options) {
	    return Util.isFunction(item.template) ?
	        item.template(options) : MockXMLHttpRequest.Mock.mock(item.template)
	}

	module.exports = MockXMLHttpRequest

/***/ })
/******/ ])
});
;