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
  };

  // Collection Functions
  // 集合方法
  // 需要注意的是 {length:4} 会被当成 长度为4的类数组，从而iteratee会执行4次，JQ也一样。
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

  // 使用 iteratee 对每一个集合里的元素进行操作,返回一个数组，该数组保存了每次操作的返回值
  // 同_.each一样 {length:4} 也会使 iteratee 执行4次
  _.map = _.collect = function (obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
      length = (keys || obj).length,
      results = Array(length);
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      results[index] = iteratee(obj[currentKey], currentKey, obj)
    }
    return results;
  };

  var createReduce = function (dir) {
    var reducer = function (obj, iteratee, memo, initial) {
      var keys = !isArrayLike(obj) & _.keys(obj),
        length = (keys || obj).length,
        index = dir > 0 ? 0 : length - 1;
      if (!initial) {
        memo = obj[keys ? keys[index] : index];
        index += dir;
      }
      for (; index >= 0 && index < length; index += dir) {
        var currentKey = keys ? keys[index] : index;
        memo = iteratee(memo, obj[currentKey], currentKey, obj);
      }
      return memo;
    }

    // 参数: 集合，迭代器，[初始化]，[上下文]
    // 未传入初始化，以集合第一个元素为初始化值
    return function (obj, iteratee, memo, context) {
      var initial = arguments.length >= 3;
      return reducer(obj, optimizeCb(iteratee, context, 4), memo, initial);
    }
  };


  // 从左到右
  _.reduce = _.foldl = _.injet = createReduce(1);
  // 从右到左
  _.reduceRight = _.forlr = createReduce(-1);

  _.find = _.detect = function (obj, predicate, context) {
    var keyFinder = isArrayLike(obj) ? _.findIndex : _.findKey;
    var key = keyFinder(obj, predicate, context);
    if (key !== void 0 && key !== -1) return obj[key];
  };


  // 构造一个函数，根据 predicate 寻找某个元素出现的位置
  var createPredicateIndexFinder = function (dir) {
    return function (array, predicate, context) {
      predicate = cb(predicate, context);
      var length = getLength(array);
      var index = dir > 0 ? 0 : length - 1;
      for (; index > 0 && index < length; index += dir) {
        if (predicate(array[index], index, array)) return index;
      }
      return -1;
    }
  };


  _.findIndex = createPredicateIndexFinder(1);
  _.findLastIndex = createPredicateIndexFinder(-1);

  // 返回 对象第一个中通过 predicate 函数的元素的 key
  _.findKey = function (obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = _.keys(obj),
      length = keys.length,
      i = 0,
      key;
    for (; i < length; i++) {
      key = keys[i];
      if (predicate(obj[key], key, obj)) return key;
    }
  };

  // 返回通过 predicate 的元素
  _.filter = _.select = function (obj, predicate, context) {
    var results = [];
    predicate = cb(predicate, context);
    _.each(obj, function (value, index, list) {
      if (predicate(value, index, list)) results.push(value);
    });
    return results;
  };

  // 返回不通过 predicate 的元素
  _.reject = function (obj, predicate, context) {
    return _.filter(obj, _.negate(cb(predicate)), context);
  };

  // 判断是否所有的元素都通过了 predicate
  _.every = _.all = function (obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
      length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (!predicate(obj[currentKey], currentKey, obj)) return false;
    }
    return true;
  };


  // 判断集合中是否存在特定的元素(使用 '===')
  _.contains = _.includes = _.include = function (obj, item, fromIndex, guard) {
    if (!isArrayLike(obj)) obj = _.values(obj);
    if (typeof fromIndex != 'number' || guard) fromIndex = 0;
    return _.indexOf(obj, item, fromIndex) >= 0;
  };


  // 向一个有序数组插入一个元素，获取应该插入的位置，使用二分法
  _.sortedIndex = function (array, obj, iteratee, context) {
    iteratee = cb(iteratee, context, 1);
    var value = iteratee(obj);
    var low = 0, high = getLength(array);
    while (low < high) {
      var mid = Math.floor((low + high) / 2);
      if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
    }
    return low;
  };

  var createIndexFinder = function (dir, predicateFind, sortedIndex) {
    return function (array, item, idx) {
      var i = 0, length = getLength(array);
      if (typeof idx == 'number') { // 第三个参数为 boolean（是否已有序） 或者为 number（起始位置）
        if (dir > 0) {
          i = idx >= 0 ? idx : Math.max(idx + length, i); // 正向 起始位置 i 加上 idx
        } else {
          length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
        }
      } else if (sortedIndex && idx && length) {
        idx = sortedIndex(array, item); // 如果把元素插入集合，应该放到什么位置
        // 该位置是不是该元素本身
        // 是 返回该位置
        // 否 表示该元素不在集合中
        return array[idx] === item ? idx : -1;
      }
      // 元素不等于自身则是 NaN
      if (item !== item) {
        idx = predicateFind(slice.call(array, i, length), _.isNaN); // slice 后 从 i 起，所以后面返回要再加上 i
        return idx >= 0 ? idx + i : -1;
      }
      for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
        if (array[idx] === item) return idx;
      }
      return -1;
    }
  }

  _.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex);
  _.lastIndexOf = createIndexFinder(-1, _.findIndex);


  // 返回集合所有元素的值
  _.values = function (obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };
  _.negate = function (predicate) {
    return function () {
      return !predicate.apply(this, arguments);
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


  // 返回对象自身的属性(不是在原型上的)
  // ES 5 Object.keys 方法
  _.keys = function (obj) {
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


  // 判断一个属性是否是每个对象的自有属性（即该属性不是在原型上的）
  _.has = function (obj, path) {
    if (!_.isArray(path)) {
      return obj != null && hasOwnProprety.call(obj, path);
    }
    else {
      var length = path.length;
      for (var i = 0; i < length; i++) {
        var key = path[i];
        if (obj == null || !hasOwnProprety.call(obj, key)) {
          return false;
        }
        else {
          obj = obj[key];
        }
      }
      return !!length; // 为什么这么写
      // 为了第二个参数为空数组 [] 时也能正确判断，已添加测试
      // return true;
    }
  }


  // 判断是否是一个数组, 优先使用 ES5 的 Array.isArray 方法
  _.isArray = nativeIsArray || function (obj) {
    return toString.call(obj) == '[object Array]';
  }
  _.isNaN = function (obj) {
    return _.isNumber(obj) && isNaN(obj);
  }

  // 判断输入的参数是不是一个对象
  _.isObject = function (obj) {
    var type = typeof obj;
    // typeof null 也是 object，!!null 返回false
    return type === 'function' || type === 'object' && !!obj;
  }

  // 一些判断方法
  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error', 'Symbol', 'Map', 'WeakMap', 'Set', 'WeakSet'], function (name) {
    _['is' + name] = function (obj) {
      return toString.call(obj) === '[object +' + name + ']';
    }
  });

  // 改进isFunction方法，规避一些bug
  var nodelist = root.document && root.document.childNodes;
  if (typeof /./ != 'function' && typeof Int8Array != 'object' && typeof nodelist != 'function') {
    _.isFunction = function (obj) {
      return typeof obj == 'function' || false;
    }
  }

}());
