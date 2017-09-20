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
  };

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
        };
      case null:
      case 3:
        return function (value, index, collection) {
          return func.call(context, value, index, collection);
        };
      case 4:
        return function (accumulator, value, index, collection) {
          return func.call(context, accumulator, value, index, collection);
        }
    }
    return function () {
      return func.apply(context, arguments);
    }
  };
  var builtinIteratee;

  var cb = function (value, context, argCount) {
    if (_.iteratee !== builtinIteratee) return _.iteratee(value, context);
    if (value == null) return _.iteratee;
    if (_.isFunction(value)) return optimizeCb(value, context, argCount);
    if (_.isObject(value) && !_.isArray(value)) return _.matcher(value);
    return _.property(value);
  };

  _.iteratee = builtinIteratee = function (value, context) {
    return cb(value, context, Infinity);
  };

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
  };

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
  };

  var shallowProperty = function (key) {
    return function (obj) {
      return obj == null ? void 0 : obj[key];
    }
  };


  // 根据 path 从一层层向对象深处读取
  var deepGet = function (obj, path) {
    var length = path.length;
    for (var i = 0; i < length; i++) {
      if (obj == null) return void 0;
      obj = obj[path[i]];
    }
    return length ? obj : void 0;
  };

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
    };

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

  // 判断集合中是否有任意一个元素通过了 predicate
  _.some = _.any = function (obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) & _.keys(obj),
      length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj)) return true
    }
    return false;
  };

  // 判断集合中是否存在特定的元素(使用 '===')
  _.contains = _.includes = _.include = function (obj, item, fromIndex, guard) {
    if (!isArrayLike(obj)) obj = _.values(obj);
    if (typeof fromIndex != 'number' || guard) fromIndex = 0;
    return _.indexOf(obj, item, fromIndex) >= 0;
  };

  // https://github.com/KableShow/front-end-notes/issues/1
  // 第二个参数可以是
  // 1 字符串 集合的每个元素调用该字符串对应的方法
  // 2 方法 集合的每个元素调用该方法
  // 3 数组 集合的每个元素根据该数组深层调用方法
  // 例如 _.invoke({ a: { getArray: [4, 2] }, b: { getArray: [3, 1] } }, ['getArray', 'sort']); 会返回
  // [a.getArray.sort(), b.getArray.sort]
  _.invoke = restArgs(function (obj, path, args) {
    var contextPath, func;
    if (_.isFunction(path)) {
      func = path;
    } else if (_.isArray(path)) {
      contextPath = path.slice(0, -1);
      path = path[path.length - 1];
    }
    return _.map(obj, function (context) {
      var method = func;
      if (!method) {
        if (contextPath && contextPath.length) {
          context = deepGet(context, contextPath);
        }
        if (context == null) return void 0;
        method = context[path];
      }
      return method == null ? method : method.apply(context, args);
    })
  });

  // 简化map的使用
  // 返回集合中每个元素的某个属性
  _.pluck = function (obj, key) {
    return _.map(obj, _.property(key));
  };

  // 简化filter的使用
  // 返回包含特定键值对的元素
  _.where = function (obj, attrs) {
    return _.filter(obj, _.matcher(attrs));
  };

  // 简化find的使用
  // 返回第一个包含特定键值对的元素
  _.findWhere = function (obj, attrs) {
    return _.find(obj, _.matcher(attrs));
  };

  // 集合中的最大的元素，如果提供了 iteratee 则返回某元素，该元素经过 iteratee 处理后的返回值最大 。
  _.max = function (obj, iteratee, context) {
    var result = -Infinity, lastcomputed = -Infinity,
      value, computed;
    if (iteratee == null || (typeof iteratee == 'number' && typeof obj[0] != 'object') && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value != null && value > result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function (v, index, list) {
        computed = iteratee(v, index, list);
        if (computed > lastcomputed || computed === -Infinity && result === -Infinity) {
          result = v;
          lastcomputed = computed;
        }
      })
    }
    return result;
  };
  // 返回最小的元素
  _.min = function (obj, iteratee, context) {
    var result = Infinity, lastcomputed = Infinity,
      value, computed;
    if (iteratee == null || (typeof iteratee == 'number' && typeof obj[0] != 'object') && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value != null && value > result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function (v, index, list) {
        computed = iteratee(v, index, list);
        if (computed > lastcomputed || computed === Infinity && result === Infinity) {
          result = v;
          lastcomputed = computed;
        }
      })
    }
    return result;
  };

  // 打乱一个集合的顺序
  _.shuffle = function (obj) {
    return _.sample(obj, Infinity);
  };


  // 返回一个谓词方法
  _.matcher = _.matches = function (attrs) {
    attrs = _.extendOwn({}, attrs);
    return function (obj) {
      return _.isMatch(obj, attrs);
    }
  };

  // 在集合中随机取出 n 个元素，guard 用于保证在 map 中使用时进入正确的分支(与 n 为0一样，仅返回一个元素)，因为 map 会传入第三个参数。
  // 使用 Fisher-Yates 算法
  _.sample = function (obj, n, guard) {
    if (n == null || guard) {
      if (!isArrayLike(obj)) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    var sample = isArrayLike(obj) ? _.clone(obj) : _.values(obj);
    var length = getLength(sample);
    n = Math.max(Math.min(n, length), 0);
    var last = length - 1;
    for (var index = 0; index < n; index++) {
      var rand = _.random(index, last);
      var temp = sample[index];
      sample[index] = sample[rand];
      sample[rand] = temp;
    }
    return sample.slice(0, n);
  };

  // 对集合进行排序
  _.sortBy = function (obj, iteratee, context) {
    var index = 0;
    iteratee = cb(iteratee, context); // iteratee 为字符串时是取元素对应的属性
    // _.map 将每个元素通过 iteratee 运算 返回 由原始值、索引和计算值组成的对象
    // 上一步的对象数组 经过 sort 排序
    // 最终由 _.pluck 从排序后的数组里取出原始值数组
    return _.pluck(_.max(obj, function (value, key, list) {
        return {
          value: value,
          index: index++,
          criteria: iteratee(value, key, list)
        };
      }).sort(function (left, right) {
        var a = left.criteria;
        var b = right.criteria;
        if (a !== b) {
          if (a > b || a === void 0) return 1;
          if (a < b || b === void 0) return -1;
        }
        return left.index - right.index; // 两数相同，根据出现的先后返回，该算法是稳定的
      })
      , 'value')
  };

  var group = function (behavior, partition) {
    return function (obj, iteratee, context) {
      var result = partition ? [[], []] : {};// partition 为 _.partition 所使用
      iteratee = cb(iteratee, context);
      _.each(obj, function (value, index) {
        var key = iteratee(value, index, obj); // 传入的集合里每一个元素都结果 iteratee 处理
        behavior(result, value, key); // 不同的结果处理方法
      });
      return result;
    }
  };

  // 将一个集合经过 iteratee 处理（为字符串时读取对应属性）
  // 返回一个以处理结果作为属性的对象
  _.groupBy = group(function (result, value, key) {
    if (_.has(result, key)) result[key].push(value); else result[key] = [value];
  });

  // 每个组包含唯一元素的 _.groupBy
  // 当你知道迭代方法返回的分组索引仅对应一个元素时使用
  _.indexBy = group(function (result, value, key) {
    result[key] = value;
  });

  // 为每个分组计数
  _.countBy = group(function (result, value, key) {
    if (_.has(result, key)) result[key]++; else result[key] = 1;
  });

  // 处理四字节字符
  // JS 使用的 UCS-2 为 UTF-16 子集，只支持双字节字符
  // [\ud800-\udfff] 是空的
  // [^\ud800-\udfff] 为双字节字符
  // [\ud800-\udbff] 高位在这个范围 说明是四字节字符 还要继续读接下来的两字节
  var reStrSymbol = /[^\ud800-\udfff]|[\ud800-\udbff][\udc00-\udfff]|[\ud800-\udfff]/g;

  _.toArray = function (obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj); // slice 用于拷贝数组
    if (_.isString(obj)) {
      // 保证正确读取四字节字符
      return obj.match(reStrSymbol);
    }
    if (isArrayLike(obj)) return _.map(obj, _.identity); // 类数组
    return _.values(obj); // 对象 返回所有属性组成的数组
  };

  // 什么也不做，返回原值
  _.identity = function (value) {
    return value;
  };
  // 返回 [min, max] 之间的一个随机数
  _.random = function (min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // 创建扩展方法的内部方法，keysFunc 用于获取属性，传入 _.keys 获取原对象的自有（实例）方法，_.allKeys 获取包括继承（原型）方法在内的所有方法。
  var createAssigner = function (keysFunc, defaults) {
    return function (obj) {
      var length = arguments.length;
      if (defaults) obj = Object(obj);
      if (length < 2 || obj == null) return obj;
      for (var index = 1; index < length; index++) {
        var source = arguments[index],
          keys = keysFunc(source),
          l = keys.length;
        for (var i = 0; i < l; i++) {
          var key = keys[i];
          if (!defaults || obj[key] === void 0) obj[key] = source[key];// 浅复制
        }
      }
      return obj;
    }
  };

  _.extend = createAssigner(_.allKeys);

  // ES 6 Object.assign
  _.extendOwn = _.assign = createAssigner(_.keys);

  // 判断对象是否含有某些键值对
  _.isMatch = function (object, attrs) {
    var keys = _.keys(attrs), length = keys.length;
    if (object == null) return !length;
    var obj = Object(object);
    for (var i = 0; i < length; i++) {
      var key = keys[i];
      if (attrs[key] !== obj[key] || !(key in obj)) return false;
    }
    return true;
  };

  // 返回一个读取对应属性的方法
  _.property = function (path) {
    if (!_.isArray(path)) {
      return shallowProperty(path);
    }
    return function (obj) {
      return deepGet(obj, path);
    }
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
  };

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
  };


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
  };

  // 返回所有属性（包括继承（原型）属性）
  _.allKeys = function (obj) {
    if (!_.isObject(obj)) return [];
    var keys = [];
    for (var key in obj) keys.push(key);
    // Ahem, IE < 9
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

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
  };


  // 判断是否是一个数组, 优先使用 ES5 的 Array.isArray 方法
  _.isArray = nativeIsArray || function (obj) {
    return toString.call(obj) == '[object Array]';
  };

  _.isNaN = function (obj) {
    return _.isNumber(obj) && isNaN(obj);
  };

  // 判断输入的参数是不是一个对象
  _.isObject = function (obj) {
    var type = typeof obj;
    // typeof null 也是 object，!!null 返回false
    return type === 'function' || type === 'object' && !!obj;
  };

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
