/**
 * Created by Kimi on 2017/9/11.
 */

(function () {

  // use root as global
  var root = typeof self == 'object' && self.self === self && self ||
    typeof global == 'object' && global.global === global && global ||
    this ||
    {};

  //save previousUnderscore
  var previousUnderscore = root._;

  //save prototype
  var ArrayProto = Array.prototype, ObjProto = Object.prototype;
  var SymbolProtp = typeof Symbol !== 'undefined' ? Symbol.prototype : null;

  //quick access to some prototype function
  var push = ArrayProto.push,
    slice = ArrayProto.slice,
    toString = ObjProto.slice,
    hasOwnProprety = ObjProto.hasOwnProperty;

  // save es5 function
  var nativeIsArray = Array.isArray,
    nativeKeys = Object.keys,
    nativeCreate = Object.create;

  // 供继承使用的空方法
  // /*Naked function reference for surrogate-prototype-swapping.*/
  var Ctor = function () {
  };

  var _ = function (obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  }

  if (typeof exports != 'undefined' && !exports.nodeType) {
    if (typeof module != 'undefined' && !module.nodeType && module.exports) {
      exports = modle.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  //version
  _.version = '1.0.0';

  var optimizeCb = function (func, context, argCount) {
    if (context === void 0) return func;
    switch (argCount) {
      case 1:
        return function (value) {
          return func.call(context, value);
        }
      case null:
      case 3:
        return function (value, index, collection) {
          return func.call(context, value, index, collection);
        }
      case 4:
        return function (accumulator, value, index, collection) {
          return func.call(context, accumulator, value, index, collection);
        }
    }
    return function () {
      return func.apply(context, arguments);
    }
  }
  var builtinIteratee;

  var cb = function (value, context, argCount) {
    if (_.iteratee !== builtinIteratee) return _.iteratee(value, context);
    if (value == null) return _.iteratee;
    if (_.isFunction(value)) return optimizeCb(value, context, argCount);
    if (_.isObject(value) && !_.isArray(value)) return _.matcher(value);
    return _.property(value);
  }

  _.iteratee = builtinIteratee = function (value, context) {
    return cb(value, context, Infinity);
  }

  var restArgs = function (func, startIndex) {
    startIndex = startIndex == null ? func.length - 1 : +startIndex;
    return function () {
      var length = Math.max(arguments.length - startIndex, 0),
        rest = Array(length),
        index = 0;
      for (; index < length; index++) {
        rest[index] = arguments[index + startIndex];
      }
      switch (startIndex) {
        case 0:
          return func.call(this, rest);
        case 1:
          return func.call(this, arguments[0], rest);
        case  2:
          return func.call(this, arguments[0], arguments[1], rest);
      }
      var args = Array(startIndex + 1);
      for (index = 0; index < startIndex; index++) {
        args[index] = arguments[index];
      }
      args[startIndex] = rest;
      return func.apply(this, args);
    }
  }

  // 继承(inherit)
  // 当 prototype 不是对象时 返回空对象
  // 否则返回一个以 prototype 为 原型的实例对象
  var baseCreate = function (prototype) {
    if (!_.isObject(prototype)) return {};
    if (nativeCreate) return nativeCreate(prototype);
    Ctor.prototype = prototype;
    var restult = new Ctor();
    Ctor.prototype = null;
    return restult;
  }

  var shallowProperty = function (key) {
    return function (obj) {
      return obj == null ? void 0 : obj[key];
    }
  }


  // 根据 path 从一层层向对象深处读取
  var deepGet = function (obj, path) {
    var length = path.length;
    for (var i = 0; i < length; i++) {
      if (obj == null) return void 0;
      obj = obj[path[i]];
    }
    return length ? obj : void 0;
  }

  // https://github.com/jquery/jquery/issues/2145
  // iOS 8 Safari 64位 bug，只有数字属性的对象如 foo = { 1: 'a', 2: 'b', 3: 'c' }
  // foo.length 可能会返回4
  // 使用 foo['length'] 规避

  var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
  var getLength = shallowProperty('length');
  var isArrayLike = function (collection) {
    var length = getLength(collection);
    return typeof length == 'number' && length >= 0 && length < MAX_ARRAY_INDEX;
  }


  // Collection Functions
  // 集合方法

  _.each = _.forEach = function (obj, iteratee, context) {
    iteratee = optimizeCb(iteratee, context);
    var i, length;
    if (isArrayLike(obj)) {
      for (i = 0, length = obj.length; i < length; i++) {
        iteratee(obj[i], i, obj);
      }
    } else {
      var keys = _.keys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee(obj[keys[i]], keys[i], obj);
      }
    }
  };

  // Object Functions
  // 对象方法


  // IE < 9, 以下属性不会被 for key in 访问到
  var hasEnumBug = !{ toString: null }.propertyIsEnumerable('toString');
  var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString', 'propertyIsEnumerable', 'hasOwnProperty', 'toLocalString'];

  var collectNonEnumProps = function (obj, keys) {
    var nonEnumIdx = nonEnumerableProps.length;
    var constructor = obj.constructor;
    var proto = _.isFunction(constructor) && constructor.prototype || ObjProto;

    var prop = 'constructor';
    if (_.has(obj, prop) && !_.contains(keys, prop)) {
      keys.push(prop);
    }

    while (nonEnumIdx--) {
      prop = nonEnumIdx[nonEnumIdx];
      if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
        keys.push(prop);
      }
    }
  }

  _.key = function (obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) {
      if (_.has(obj, key)) {
        keys.push(key);
      }
    }
    if (hasEnumBug) {
      collectNonEnumProps(obj, keys);
    }
    return keys;
  }
}());
