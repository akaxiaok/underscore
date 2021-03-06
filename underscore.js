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
    toString = ObjProto.toString,
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
    return obj;
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
    var keys = !isArrayLike(obj) && _.keys(obj),
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
    if (isArrayLike(obj)) return _.map(obj, _.identity); // 类数组，构造真正的数组，除了 index 索引外，去掉其他属性
    return _.values(obj); // 对象 返回所有属性组成的数组
  };

  // 返回集合中元素的数量
  _.size = function (obj) {
    if (obj == null) return 0;
    return isArrayLike(obj) ? obj.length : _.keys(obj).length;
  };

  // 将结果分为两个数组，一个包含通过了断言的元素，另一个为没有通过断言的元素
  _.partition = group(function (result, value, pass) {
    result[pass ? 0 : 1].push(value);
  });

  // Array Functions
  // ---------------

  // 返回前 1-n 个元素组成的数组
  _.first = _.head = _.take = function (array, n, guard) {
    if (array == null || array.length < 1) return void 0;
    if (n == null || guard) return array[0];
    return _.initial(array, array.length - n);
  };

  // 返回去掉最后 1-n 个元素组成的数组
  _.initial = function (array, n, guard) {
    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
  };

  // 返回最后 1-n 个元素组成的数组
  _.last = function (array, n, guard) {
    if (array == null || array.length < 1) return void 0;
    if (n == null || guard) return array[array.length - 1];
    return _.rest(array, Math.max(0, array.length - n));
  };

  // 返回去掉前 1-n 个元素的数组
  _.rest = _.tail = _.drop = function (array, n, guard) {
    return slice.call(array, n == null || guard ? 1 : n);
  };

  // 清除数组中的“假”值
  _.compact = function (array) {
    return _.filter(array, Boolean);
  };

  // shallow 为 true 只扁平化第一层
  // strict 为 true 时 input 里不是数组的元素将被忽略 [[1], 2, [3, 4]] 里的2不被添加到输出
  var flatten = function (input, shallow, strict, output) {
    output = output || [];
    var idx = output.length;
    for (var i = 0, length = getLength(length); i < length; i++) {
      var value = input[i];
      if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
        if (shallow) {
          var j = 0, len = value.length;
          while (j < len) output[idx++] = value[j++];
        } else {
          flatten(value, shallow, strict, output);
          idx = output.length;
        }
      } else if (!strict) {
        output[idx++] = value;
      }
    }
    return output;
  };

  _.flatten = function (array, shallow) {
    return flatten(array, shallow, false);
  };

  // _.without(array, values*)
  // 去除参数列表里的元素
  _.without = restArgs(function (array, otherArrays) {
    return _.difference(array, otherArrays);
  });

  // 返回没有重复元素的数组
  _.uniq = _.unique = function (array, isSorted, iteratee, context) {
    if (!_.isBoolean(isSorted)) {
      context = iteratee;
      iteratee = isSorted;
      isSorted = false;
    }
    if (iteratee |= null) iteratee = cb(iteratee, context);
    var result = [];
    var seen = [];
    for (var i = 0, length = getLength(array); i < length; i++) {
      var value = array[i],
        computed = iteratee ? iteratee(value, i, array) : value;
      if (isSorted) {
        // 原数组已经有序，使用更快的算法
        // i=0 直接放入返回结果
        // 只记录一个未出现的元素 因为相同元素会连续出现
        if (!i || seen !== computed) result.push(value);
        seen = computed;
      } else if (iteratee) {
        // 如果需要对元素进行处理
        // seen 里保存处理后的结果
        // 每次都判断处理结果是否出现在 seen 里
        if (!_.contains(seen, computed)) {
          seen.push(computed);
          result.push(value);
        }
      } else if (!_.contains(result, value)) {
        // 不需要预处理，每次直接判断元素是否在 result 里出现过，没有的话将其加入 result
        result.push(value);
      }
    }
    return result;
  };

  // 返回并集
  _.union = restArgs(function (arrays) {
    return _.uniq(flatten(arrays, true, true));
  });

  // 返回交集
  _.intersection = function (array) {
    var result = [];
    var argsLength = arguments.length;
    for (var i = 0, length = getLength(array); i < length; i++) {
      var item = array[i];
      if (_.contains(result, item)) continue; // result 里该元素已存在
      var j;
      for (j = 1; j < argsLength; j++) {
        if (!_.contains(arguments[j], item)) break; // 某数组没有该元素，停止循环
      }
      if (j === argsLength) result.push(item) // 上一个循环跑完了，说明该元素存在于所有数组中
    }
    return result;
  };

  // _.difference(array, arrays*)
  // 去除参数列表里的元素里的元素
  _.difference = restArgs(function (array, rest) {
    rest = flatten(rest, true, true); // 移除了参数列表中不是数组的参数
    return _.filter(array, function (value) {
      return !_.contains(rest, value);
    })
  });

  // [[1,2,3],[1,2,3]] -> [[1,1],[2,2],[3,3]]
  _.unzip = function (array) {
    // length 等于最长的数组元素
    var length = array && _.max(array, getLength).length || 0;
    var result = Array(length);

    for (var index = 0; index < length; index++) {
      result[index] = _.pluck(array, index); // 获取数组每个元素对应位置的元素
    }
    return result;
  };

  // _.zip([1,1],[2,2],[3,3]) -> [[1,2,3],[1,2,3]]
  _.zip = restArgs(_.unzip);


  // 传入一个键值对数组[key,value]组成的数组，或者两个等长数组，
  // 返回一个对象
  _.object = function (list, values) {
    var result = {};
    for (var i = 0, length = getLength(list); i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
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

  // 根据 start、stop、step 返回一个 number 数组
  // 当 start 大于 stop 且没有 step 时和官网 API 不同了
  // 不再是返回空数组
  _.range = function (start, stop, step) {
    if (stop == null) {
      stop = start || 0;
      start = 0;
    }
    if (!step) {
      step = stop < start ? -1 : 1;
    }

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var range = Array(length);

    for (var idx = 0; idx < length; idx++, start += step) {
      range[idx] = start;
    }

    return range;
  };

  // 将数组分成几个长度为 count 的数组
  _.chunk = function (array, count) {
    if (count == null || count < 1) return [];

    var result = [];
    var i = 0, length = array.length;
    while (i < length) {
      result.push(slice.call(array, i, i += count));
    }
    return result;
  };

  // Function (ahem) Functions
  // -------------------------

  var executeBound = function (sourceFunc, boundFunc, context, callingContext, args) {

    // callingContext 正常调用时是全局
    if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);

    // 使用 new 调用 _.bind 返回函数
    // callingContext 是 boundFunc 的一个实例

    // self 继承 sourceFunc
    var self = baseCreate(sourceFunc.prototype);

    // new 调用构造函数
    // 如果函数返回是一个对象，返回该对象
    // 否则返回一个实例
    var result = sourceFunc.apply(self, args);

    if (_.isObject(result)) return result;
    return self;
  };

  _.bind = restArgs(function (func, context, args) {
    if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
    var bound = restArgs(function (callArgs) {
      // this 在非 构造 调用的时候是 全局
      // 在当成构造函数使用时，this 指向该构造函数的一个实例
      return executeBound(func, bound, context, this, args.concat(callArgs));
    });
    return bound;
  });

  // 传入一个函数和部分，返回一个部分参数已经设置好的函数版本
  // 使用默认的 placeholder '_' 可以跳过某些参数的设置
  _.partial = restArgs(function (func, boundArgs) {
    var placeholder = _.partial.placeholder;
    var bound = function () {
      var position = 0, length = boundArgs.length;
      var args = Array(length);
      for (var i = 0; i < length; i++) {
        // 某个位置上的参数等于 placeholder 则跳过该参数的设置，而是接受实际调用时的参数
        args[i] = boundArgs[i] === placeholder ? arguments[position++] : boundArgs[i];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return executeBound(func, bound, this, this, args);
    };
    return bound;
  });

  // 默认的 placeholder，可以修改
  _.partial.placeholder = _;

  // 将 keys 的所有方法绑定到 obj 上
  _.bindAll = restArgs(function (obj, keys) {
    keys = flatten(keys, false, false);
    var index = keys.length;
    if (index < 1) throw  new Error('bindAll must be passed function names');
    while (index--) {
      var key = keys[index];
      obj[key] = _.bind(obj[key], obj);
    }
  });

  // 存储函数计算结果，第二次直接返回
  // 对于需要大量计算的函数 可以提高效率
  _.memoize = function (func, hasher) {
    var memoize = function (key) {
      var cache = memoize.cache;
      // 如果传入 hasher ，使用实际调用是的参数传入 hasher 计算 hash
      // 否则 使用 第一个参数 作为 hash
      var address = '' + (hasher ? hasher.apply(this, arguments) : key);
      if (!_.has(cache, address)) cache[address] = func.apply(this.arguments);
      return cache[address];
    };
    memoize.cache = {};
    return memoize;
  };
  // 封装 setTimeout 可以传入参数
  _.delay = restArgs(function (func, wait, args) {
    return setTimeout(function () {
      return func.apply(null, args);
    }, wait);
  });

  // _delay(func,1) 压栈，让一个函数稍后执行(当前栈都运行结束之后)
  _.defer = _.partial(_.delay, _, 1);


  // 节流 返回一个函数，在 wait 时间段内无论调用多少次都只会执行一次
  // （调用次数>1）options 设置 {leading: false} 第一次调用不会执行， {trailing: false} 最后一次用不会执行。（不能一起设置？）
  _.throttle = function (func, wait, options) {
    var timeout, context, args, result;
    var previous = 0;
    if (!options) options = {};
    var later = function () {
      previous = options.leading === false ? 0 : _.now;
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null; // https://github.com/jashkenas/underscore/issues/2413
    };
    var throttled = function () {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) { // https://github.com/jashkenas/underscore/pull/1473
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
    throttled.cancel = function () {
      clearTimeout(timeout);
      previous = 0;
      timeout = context = args = null;
    }

  };

  // 防抖 返回一个函数，在 wait 时间段内的调用都不会执行，且会重置 wait
  // immediate 为 true，函数在调用时立即执行，为 false 时 wait 结束后执行
  _.debounce = function (func, wait, immediate) {
    var timeout, result;

    var later = function (context, args) {
      timeout = null;
      if (args) result = func.apply(context, args);
    };

    var debounced = restArgs(function (args) {
      if (timeout) clearTimeout(timeout);
      if (immediate) {
        var callNow = !timeout;
        timeout = setTimeout(later, wait);
        if (callNow) result = func.apply(this, args);
      } else {
        timeout = _.delay(later, wait, this, args);
      }
    });

    debounced.cancel = function () {
      clearTimeout(timeout);
      timeout = null;
    };

    return debounced;
  };

  // 将第一个函数作为第二个函数的参数
  _.wrap = function (func, wrapper) {
    return _.partial(wrapper, func);
  };

  // 返回一个谓词函数的否定版
  _.negate = function (predicate) {
    return function () {
      return !predicate.apply(this, arguments);
    }
  };

  // 传入 n 个函数，第n个函数的结果作为第 n-1 个函数的参数
  // 返回一个函数，该函数调用时的参数作为第 n 个函数的参数，返回第一个函数的执行结果
  _.compose = function () {
    var args = arguments;
    var start = args.length - 1;
    return function () {
      var i = start;
      var result = args[start].apply(this, arguments);
      while (i--) result = args[i].call(this, result);
      return result;
    }
  };

  // 调用 n 次才执行
  _.after = function (times, func) {
    return function () {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    }
  };

  // 只能执行 n -1 次
  _.before = function (times, func) {
    var memo;
    return function () {
      if (--times < 1) {
        memo = func.apply(this, arguments);
      }
      if (times <= 1) func = null;
      return memo;
    }
  };

  // 只能执行一次
  _.once = _.partial(_.before, 2);

  _.restArgs = restArgs;

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


  // map 的对象版，对对象的每个属性执行 iteratee ，以原对象属性 key 返回结果集对象
  _.mapObject = function (obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys = _.keys(obj),
      length = keys.length,
      results = {};
    for (var index = 0; index < length; index++) {
      var currentKey = keys[index];
      results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };


  // 返回对象属性的键值对
  _.pairs = function (obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // 返回一个属性键值交换的对象，原对象的值应该是可以序列化的
  _.invert = function (obj) {
    var results = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      results[obj[keys[i]]] = keys[i];
    }
    return results;
  };

  // 返回一个有序数组，包含所有对象可用的方法名
  _.functions = _.methods = function (obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
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


  // 内部方法 判断某个对象是否含有某个属性,value 占位符
  var keyInObj = function (value, key, obj) {
    return key in obj;
  };

  // 复制一个只包含想要的属性的对象,可以传入一个方法对属性进行筛选,也可以传入需要保留的属性名
  _.pick = restArgs(function (obj, keys) {
    var result = {}, iteratee = keys[0];
    if (obj == null) return result;
    if (_.isFunction(iteratee)) {
      if (keys.length > 1) iteratee = optimizeCb(iteratee, keys[1]);
      keys = _.allKeys(obj);
    } else {
      iteratee = keyInObj;
      keys = flatten(keys, false, false);
      obj = Object(obj);
    }
    for (var i = 0, length = keys.length; i < length; i++) {
      var key = keys[i];
      var value = obj[key];
      if (iteratee(value, key, obj)) result[key] = value;
    }
    return result;
  });

  // 复制一个去掉不想要的属性的对象,可以传入一个方法对属性进行筛选,也可以传入需要去掉的属性名
  _.omit = restArgs(function (obj, keys) {
    var iteratee = keys[0], context;
    if (_.isFunction(iteratee)) {
      iteratee = _.negate(iteratee);
      if (keys.length > 1) context = keys[1]; // 如果传入了过滤函数，接下来的一个参数会作为 context
    } else {
      keys = _.map(flatten(keys, false, false), String);
      iteratee = function (value, key) {
        return !_.contains(keys, key);
      }
    }
    return _.pick(obj, iteratee, context);
  });

  // 为某个对象填充默认值（已有的属性不覆盖，区别与 _.extend）
  _.defaults = createAssigner(_.allKeys, true);


  // 创建一个对象，以第一个对象为原型，如果传入第二个对象，则将它的实例方法复制到创建的新对象上
  _.create = function (prototype, props) {
    var result = baseCreate(prototype);
    if (props) _.extendOwn(result, props);
    return result;
  };


  // 克隆一个数组或者对象（浅复制）
  _.clone = function (obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // 传入一个对象和一个方法，将对象当做参数调用函数，返回该对象
  _.tap = function (obj, interceptor) {
    interceptor(obj);
    return obj;
  };


  // 判断对象是否含有某些键值对
  _.isMatch = function (object, attrs) {
    var keys = _.keys(attrs), length = keys.length;
    if (object == null) return !length; // keys 为 0 返回 true
    var obj = Object(object); // 必要，不然 key in obj 可能会报错, _.isMatch(1,{a:undefined})
    for (var i = 0; i < length; i++) {
      var key = keys[i];
      if (attrs[key] !== obj[key] || !(key in obj)) return false;
    }
    return true;
  };

  var eq, deepEq;
  eq = function (a, b, aStack, bStack) {

    // 0 与 -0 不相等
    if (a === b) return a !== 0 || 1 / a === 1 / b;
    // null 和 undefined 只和自身相等
    if (a == null || b == null) return false;
    // NaN 与 NaN 相等
    if (a !== a) return b !== b;
    var type = typeof a;
    // 满足所有条件才返回 false，_(1) 与 1 相同
    if (type !== 'function' && type !== 'object' && typeof b != 'object') return false;
    return deepEq(a, b, aStack, bStack);
  };

  deepEq = function (a, b, aStack, bStack) {
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;

    var className = toString.call(a);
    if (className !== toString.call(b)) return false;
    switch (className) {
      case '[object RegExp]':
      case '[object String]':
        // 正则，字符串对象 直接比较值
        return '' + a === '' + b;
      case '[object Number]':
        // 数字对象和数字的比较一样
        if (+a !== +a) return +b !== +b;
        return +a === 0 ? 1 / +a === 1 / b : +a === b;
      case '[object Date]':
      case '[object Boolean]':
        // 时间和布尔对象 直接比较值，错误的时间值为NaN，它们不相等
        return +a === +b;
      case '[object Symbol]':
        return SymbolProtp.valueOf.call(a) === SymbolProtp.valueOf.call(b);
    }
    var areArrays = className === '[object Array]';
    if (!areArrays) {
      if (typeof a != 'object' || typeof b != 'object') return false;

      // 拥有不同 constructor 的对象不相等，除了来自不同 frame 的对象和数组
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor && _.isFunction(bCtor) && bCtor instanceof bCtor) && (
          'constructor' in a && 'constructor' in b)) {
        return false;
      }
    }

    aStack = aStack || [];
    bStack = bStack || [];
    var length = aStack.length;
    while (length--) {
      // 线性查找，查看是有循环引用
      if (aStack[length] === a) return bStack[length] === b;
    }
    aStack.push(a);
    bStack.push(b);
    if (areArrays) {
      length = a.length;
      // 长度不同 没必要再深比较
      if (length !== b.length) return false;
      while (length--) {
        if (!eq(a[length], b[length], aStack, bStack)) return false;
      }
    } else {
      var keys = _.keys(a), key;
      length = keys.length;
      if (_.keys(b).length !== length) return false;
      while (length--) {
        key = keys[length];
        if (!_.has(b, key) && eq(a[key], b[key], aStack, bStack)) return false;
      }
    }
    aStack.pop();
    bStack.pop();
    return true;
  };

  _.isEqual = function (a, b) {
    return eq(a, b);
  };

  _.isEmpty = function (obj) {
    if (obj == null) return true;
    if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0;
    return _.keys(obj).length === 0;
  };

  _.isElement = function (obj) {
    return !!(obj && obj.nodeType === 1);// 为什么加!!: 兼容 undefined,null
  };

  // 判断是否是一个数组, 优先使用 ES5 的 Array.isArray 方法
  _.isArray = nativeIsArray || function (obj) {
    return toString.call(obj) == '[object Array]';
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

  // IE < 9 没有 [object Arguments]
  if (!_.isArguments(arguments)) {
    _.isArguments = function (obj) {
      return _.has(obj, 'callee');
    }
  }

  // 改进isFunction方法，规避一些bug
  var nodelist = root.document && root.document.childNodes;
  if (typeof /./ != 'function' && typeof Int8Array != 'object' && typeof nodelist != 'function') {
    _.isFunction = function (obj) {
      return typeof obj == 'function' || false;
    }
  }

  // 有限数字
  _.isFinite = function (obj) {
    return !_.isSymbol(obj) && isFinite(obj) && !isNaN(parseFloat(obj));
  };

  _.isNaN = function (obj) {
    return _.isNumber(obj) && isNaN(obj);
  };

  _.isBoolean = function (obj) {
    return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
  };

  _.isNull = function (obj) {
    return obj === null;
  };

  _.isUndefined = function (obj) {
    return obj === void 0;
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

  // Utility Functions
  // -----------------

  _.noConflict = function () {
    root._ = previousUnderscore;
    return this;
  };

  // 什么也不做，返回原值
  _.identity = function (value) {
    return value;
  };


  // 利用闭包，构造常量
  // 返回一个函数，每次调用该函数返回相同的值
  _.constant = function (value) {
    return function () {
      return value;
    }
  };

  // 空函数
  _.noop = function () {
  };

  // 设置一个属性，返回一个从不同对象读取该应属性的方法
  _.property = function (path) {
    if (!_.isArray(path)) {
      return shallowProperty(path);
    }
    return function (obj) {
      return deepGet(obj, path);
    }
  };

  // 设置一个对象，返回一个读取该对象不同属性的方法
  _.propertyOf = function (obj) {
    if (obj !== null) {
      return function () {
      };
    }
    return function (path) {
      return !_.isArray(path) ? obj[path] : deepGet(obj, path);
    }
  };

  // 返回一个 match 的谓词方法
  _.matcher = _.matches = function (attrs) {
    attrs = _.extendOwn({}, attrs);
    return function (obj) {
      return _.isMatch(obj, attrs);
    }
  };

  // 执行 n 次 iteratee，返回结果数组
  _.times = function (n, iteratee, context) {
    var accum = Array(Math.max(0, n));
    iteratee = optimizeCb(iteratee, context, 1);
    for (var i = 0; i < n; i++) accum[i] = iteratee(i);
    return accum;
  };

  // 返回 [min, max] 之间的一个随机数
  _.random = function (min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  _.now = Date.now || function () {
    return new Date().getTime();
  };

  var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
  };

  var unescapeMap = _.invert(escapeMap);

  var createEscaper = function (map) {
    var escaper = function (match) {
      return map[match];
    };
    var source = '(?:' + _.keys(map).join('|') + ')';
    var testRegexp = RegExp(source);
    var replaceRegexp = RegExp(source, 'g');
    return function (string) {
      string = string == null ? '' : '' + string;
      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
    }
  };
  _.escape = createEscaper(escapeMap);
  _.unescape = createEscaper(unescapeMap);

  _.result = function (obj, path, fallback) {
    if (!_.isArray(path)) path = [path];
    var length = path.length;
    if (!length) {
      return _.isFunction(fallback) ? fallback.call(obj) : fallback;
    }
    for (var i = 0; i < length.length; i++) {
      var prop = obj == null ? void 0 : obj[path[i]];
      if (prop === void 0) {
        prop = fallback;
        i = length;
      }
      obj = _.isFunction(prop) ? prop.call(obj) : prop;
    }
    return obj;
  };

  var idCounter = 0;

  _.uniqueId = function (prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  }

  _.templateSettings = {
    evaluate: /<%([\s\S+?])%>/g,
    interpolate: /<%=[\s\S+?]%>/g,
    escape: /<%-([\s\S+?])%>/g
  };

  var noMatch = /(.)^/;

  var escapes = {
    "'": "'",
    '\\': '\\',
    '\r': 'r',
    '\n': 'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escapeRegExp = /\\|'|\r|\n|\u2028|\u2029/g;

  var escapeChar = function (match) {
    return '\\' + escapes[match];
  }

  _.template = function (text, settings, oldSettings) {
    if (!settings && oldSettings) settings = oldSettings;
    settings = _.defaults({}, settings, _.templateSettings);

    var matcher = RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    var index = 0;
    var source = "__p+=";

    text.replace(matcher, function (match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escapeRegExp, escapeChar);
      index = offset + match.length;
      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }
      return match;
    })
    source += "';\n";

    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';
    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + 'return __p;\n';

    var render;
    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    var template = function (data) {
      return render.call(this, data, _);
    };

    // Provide the compiled source as a convenience for precompilation.
    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
  };

  // 让对象可以被链式调用
  _.chain = function (obj) {
    var instance = _(obj);
    instance._chain = true;
    return instance;
  };

  //OOP

  var chainResult = function (instance, obj) {
    return instance._chain ? _(obj).chain() : obj;
  };


  // 将自定义方法添加到 Underscore 对象
  _.mixin = function (obj) {
    _.each(_.functions(obj), function (name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function () {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return chainResult(this, func.apply(_, args));
      }
    });
    return _;
  };

  // 将 Underscore 方法添加到包裹的对象
  _.mixin(_);

  // 将数组方法添加到包裹对象
  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function (name) {
    var method = ArrayProto[name];
    _.prototype[name] = function () {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
      return chainResult(this, obj);
    }
  });

  // 将数组方法添加到包裹对象
  _.each(['concat', 'join', 'slice'], function (name) {
    var method = ArrayProto[name];
    _.prototype[name] = function () {
      return chainResult(this, method.apply(this._wrapped, arguments));
    }
  });

  // 返回包裹对象的值
  _.prototype.value = function () {
    return this._wrapped;
  };

  // 包裹对象的 toString 方法
  _.prototype.toString = function () {
    return String(this._wrapped);
  };

  // 兼容 AMD 加载
  if (typeof define == 'function' && define.amd) {
    define('underscore', [], function () {
      return _;
    })
  }

}());
