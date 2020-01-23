# Object Oriented Javascript

2020.1.22 week 3<br>
CodeSpitz 86<br>
Strategy, Observer, Template Method, Composite Pattern

## 1. Strategy
직역하면 전술, 전략이지만, 고유명사다.<br>
가장 비슷한 의미를 가진 말은 `domain`, `knowledge`, `broad-algorithm`에 가깝다.<br>
추상적인 부분에서 범용적으로 정의한다.

지난 주 작성한 코드를 다시 살펴보자 //
```js
// week2 Structure & Control
const Binder = class {
  #items = new Set;
  add(v, _ = type(v, BinderItem)){ this.#items.add(v); }
  render(viewmodel, _ = type(viewmodel, ViewModel)) {
    this.#items.forEach(item => {
      // 미리 알고 있는 자료 구조로 루프를 돌고 있음
      // viewModel의 구조에 의존성이 강한 구조
      const vm = type(viewmodel[item.viewmodel], ViewModel), el = item.el;
      Object.entries(vm.styles).forEach(([k, v]) => el.styles[k] = v);
      Object.entries(vm.attributes).forEach(([k, v]) => el.setAttribute(k, v));
      Object.entries(vm.properties).forEach(([k, v]) => el[k] = v);
      Object.entries(vm.events).forEach(([k, v]) => el['on' + k] => v.call(el, e, viewmodel));
    })
  }
}
```

**Strategy에 해당하는 부분**
```js
el.styles[k] = v
el.setAttribute(k, v)
el[k] = v
el['on' + k] => v.call(el, e, viewmodel));
```
상태 - property, 행위 - method

특정한 데이터 - mapping 하는 알고리즘 필요<br>
흔한 코드에서 전략을 어떻게 분리하느냐?<br>
=> `Composition`<br>
=> code를 `객체`로 전환한다.<br>
=> Interface와 class를 도출한다.

Code - (type) - Object
Dependency
Dependency Injection

> oop의 의존성이 발생하는 이유 ?
의존성은 위임이 아닌 strategy를 외부 객체의 도움으로 해결하려고 하기 때문, strategy를 객체로 변환했기 때문에 해당 객체에 대해 의존성이 생김

결과적으로 객체 내부에서 객체를 생성하지 않고 외부에서 주입받기 때문.<br>
해당 현상을 DI라고 부른다.

---
### Template Method Pattern

다양한 구상화로 부터 추상화가 되는 일반성을 도출해야함.<br>
위 코드는 `el`, `k`, `v`를 공통으로 사용하고 있음

```js
// 추상 클래스를 가정하고 있음. 그냥 쓰면 throw
const Processor = class {
  category;
  constructor (category) {
    this.category = category;
    Object.freeze(this);
  }
  // template method
  process(vm, el, k, v, _0 = type(vm, ViewModel), _1 = type(vm, HTMLElement), _2 = type(k, "string")) {
    this._process(vm, el, k, v);
  }

  // hook
  _process(vm, el, k, v) { throw "override"; }
}
```

```js
// 구상 인스턴스의 예 
new (class extends Processor {
  _process(vm, el, k, v) {el.style[k] = v;}
})("styles")

new (class extends Processor {
  _process(vm, el, k, v) {el.setAttribute(k, v);}
})("attributes")
```
`template method`, `hook`<br>
외부에는 process가 template method지만 내부에서는 자식으로 injection된 method에 의존하고 있다. 

`algorithm`은 `structure`와 거의 항상 관련이 있다.<br>
`익명 상속 클래스` 작성 시 1회만 만들고 다시는 사용할 수 없게 함

객체 망을 구성하는 **객체 간의 관계**는 사실 이것밖에 없다. 
1. field 
2. method 
3. 자식

```js
// Processor를 외부에서 주입받음
const Binder = class {
  // 값을 외부에 노출할 때는 조심해서 사용해야함.
  // 중복을 막기 위해 객체를 사용.
  #items = new Set, #processors = {};
  add(v, _ = type(v, BinderItem)){ this.#items.add(v); }
  addProcessor(v, _0=type(v, Processor)) {
    this.#processors[v.category] = v;
  }
  render(viewmodel, _ = type(viewmodel, ViewModel)) {
    const processores = Object.entries(this.#processors);
    this.#items.forEach(item => {
      const vm = type(viewmodel[item.viewmodel], ViewModel), el = item.el;
      processores.forEach(([pk, processor]) => {
        Object.entries(vm[pk]).forEach(([k, v]) => {
          // 객체 사이의 의존성, 계약. category과 process를 사용할 수 있게 됨.
          // 역으로 보면 processor를 사용해서만 작성해야함
          // 이를 알고리즘의 일반화, 추상화라고 부른다.
          processor.process(vm, el, k, v);
        })
      })
    })
  }
}
```
`Generic Algorithm`<br>
구조 + 알고리즘 => <br>
구조 | 알고리즘 => <br>
알고리즘 => 형으로 => <br>
형을 다시 재주입 => <br>
해당 형에 맞게 알고리즘 일반화<br>

복잡한 알고리즘을 객체(형)으로 빼고, 이를 외부에서 주입해서, 내부를 일반화한다.<br>
**알고리즘 일반화는 어려움.** <br>
안정화 시키려면 심플해야한다. 복잡할 수록 안정화하기 어렵다.<br>
약속하고 있는 프로토콜이 적을 수록 좋음.<br>
초기 설계를 잘 해야함. <br>

>인터페이스의 교환만으로 코드를 작성해야한다.<br>
아는 것만으로 부족하다.<br>
될 때까지 짜라.<br>
최소 10번..

### 전략 패턴의 4단계
1. 구조, 전략 분리
2. 전략의 공통점을 찾는다.,
3. 전략과 상태의 관계를 찾는다.
4. 도출된 형을 기준으로 알고리즘을 고친다.

```js
const binder = scanner.scan(document.querySelector('#target'));

// Dependency Injection
binder.addProcessor(new (class extends Processor {
  _process(vm, el, k, v) {el.style[k] = v;}
})("styles"));

// Dependency Injection
binder.addProcessor(new (class extends Processor {
  _process(vm, el, k, v) {el.setAttribute(k, v);}
})("attributes"));
```

`Binder` -> `Processor`<br>
Binder가 Processor에 의존한다. **단방향 의존성**<br>
=> `Dependency Injection` 발생

## 2. Observer
```
# Model View ViewModel
View <- Binder -(observe)-> ViewModel <-> Model
               <-(notify)--
```

컴퓨터 세계의 observer는 감시 당하는 사람이 힘들다.<br>
사실 감시당하는 것이 아닌 바뀌면 분류해서 알려줘야하기 때문<br>
> Observer의 대상을 subject라고 부름

### 결론 - `Recognize Property Change`
1. `defineProperty`
2. `Proxy` (babel을 사용할 수 없음)

```js
const ViewModelListener = class {
  viewmodelUpdated(updated) { throw "override" }
};

// 기존 viewModel
const ViewModel = class {
  static #private = Symbol();
  static get(data) {
    return new ViewModel(this.#private, data);
  }
  styles = {}; attributes = {}; properties = {}; events = {};
  #isUpdated = new Set; #listeners = new Set;
  addListener(v, _= type(v, ViewModelListener)) {
    this.#listeners.add(v);
  }
  removeListener(v, _= type(v, ViewModelListener)) {
    this.#listeners.delete(v);
  }
  notify() {
    this.#listeners.forEach(v => v.viewmodelUpdated(this.#isUpdated));
  }
  constructor(checker, data) {
    if (checker != ViewModel.#private) throw 'use ViewModel.get()!';
    Object.entries(data).forEach(([k, v]) =>  {
      switch(k) {
        case 'style': this.styles = v; break;
        case 'attributes': this.attributes = v; break;
        case 'properties': this.properties = v; break;
        case 'events': this.events = v; break;
        default: this[k] = v; // custom key
      }
    });
    Object.seal(this); // 값은 변화할 수 있지만 키는 추가할 수 없도록 처리
  }
}
```

subject의 최소 조건
1. addlistener
2. removeListener
3. notify

> 중복은 고치는게 아니라 발견되는 것. 자신의 수준에 맞게 발견한다. - 캔트백

```js
constructor(checker, data, _type(data, 'object')) {
  super();
  Object.entries(data).forEach(([k, obj]) => {
    if ('styles, attributees, properties'.includes(k)) {
      this.[k] = Object.defineProperties(obj, 
        Object.entries(obj).reduce((r, [k, v]) => {
          r[k] = {
            enumerable: true,
            get: _ => v,
            set: newV => {
              v = newV;
              vm.#isUpdated.add(new ViewModelValue('', k, v));
            }
          };
          return r;
        }, {})
      );
    } else {
      ...
    }
  });
}

const ViewModelValue = class {
  cat; k; v;
  constructor(cat, k, v) {
    this.cat = cat;
    this.k = k;
    this.v = v;
    Object.freeze(this);
  }
}
```

## 3. Composite
다중 계층의 문제. 다중 노드가 전개된 트리를 얼마나 빠르게 뽑는가<br>
복잡한 구조를 위임을 반복하여 취합함.

**Composition의 문제** <br>

현실에선 ViewModel안에 ViewModel이 들어감.<br>
inner ViewModel이 변화할 경우는 어떻게 대처할 것인가.<br>
binder는 가장 외부의 ViewModel과만 의존성을 가짐.<br>
Sub의 ViewModel의 변화는 어떻게 알려줄 것인가?

#### 객체 지향에선 해당 문제를 동적 위임으로 해결한다.

```js
  } else {
    // 부모 viewModel이 자식 viewModel의 Observer가 되야함.
    if (v instanceof ViewModel) {
      
    }
  }
```
viewModel이자 Observer 역할을 함.

```js
const ViewModel = class extends ViewModelListener {
  .....
  subkey = ''; parent = null;
  constructor(checker, data, _type=(data, 'object')) {
    super();
    if ('styles, attributes, properties'.includes(k)) {
      ....
    } else {
      Object.defineProperty(this, k, {
        enumerable: true,
        get: _ => v,
        set: newV => {
          v = newV;
          this.#isUpdated.add(
            new ViewModelValue(this.subKey, "", k, v)
          );
        }
      });
      if (v instanceof ViewModel) {
        v.parent = this; // backbind
        v.subKey = k;
        v.addListener(this);
      }
    }
    ViewModel.notify(this);
    Object.seal(this);
  }
  viewmodelUpdated(updated) {
    updated.forEach(v => this.#isUpdated.add(v));
  }
};

// Observer가 받는 Info 객체 - notify 했을 때 observer가 받는 객체
const ViewModelValue = class {
  subKey; cat; k; v;
  constructor(subKey, cat, k, v) {
    this.subKey = subKey;
    this.cat = cat;
    this.k = k;
    this.v = v;
    Object.freeze(this);
  }
}
```
Info 객체가 충분한 정보를 제공하지 않으면, 원본 객체에 대한 의존성이 필연적으로 발생함.<br>
밸런스를 조정하는걸 디자인이라고 함. 좋은 디자인 결정을 내리는 것이 중요.

```js
const ViewModel = class extends ViewModelListener {
  static #subjects = new Set;
  static #inited = false;
  static notify(vm) {
    this.#subjects.add(vm);
    if(this.#inited) return;
    this.#inited = true;
    const f = _=> {
      this.#subjects.forEach(vm => {
        if (vm.#isUpdated.size) {
          vm.notify();
          vm.#isUpdated.clear();
        }
      });
      requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  }
  ....
}
```

## 4. Observer

```js
// Processor를 외부에서 주입받음
const Binder = class extends ViewModelListener {
  // 값을 외부에 노출할 때는 조심해서 사용해야함.
  // 중복을 막기 위해 객체를 사용.
  #items = new Set, #processors = {};
  viewmodelUpdated(updated) {
    const items = {};
    this.#items.forEach(item => {
      items[item.viewmodel] = [
        type(viewmodel[item.viewmodel], VIewModel),
        item.el
      ];
    });
    updated.forEach(v => {
      if (!items[v.subKey]) return;
      const [vm, el] = items[v.subKey], processor = this.#proceessors[v.cat];
      if (!el || !processor) return;
      processor.process(vm, el, v.k, v.v);
    })
  }

  add(v, _ = type(v, BinderItem)){ this.#items.add(v); }
  addProcessor(v, _0=type(v, Processor)) {..}
  render(viewmodel, _ = type(viewmodel, ViewModel)) {..},
  watch(viewmodel, _ = type(viewmodel, ViewModel)){
    viewmodel.addListener()
  }
  unwatch(){}
}
```

메모리와 시간은 반비례<br>
두 군데서 주입 받는 형태를 비지터 패턴이라고 부름.

## 5. Client

```js
const binder = scanner.scan(document.querySelector('#target'));

// Dependency Injection
binder.addProcessor(new (class extends Processor {
  _process(vm, el, k, v) {el.style[k] = v;}
})("styles"));

// Dependency Injection
binder.addProcessor(new (class extends Processor {
  _process(vm, el, k, v) {el.setAttribute(k, v);}
})("attributes"));

const viewmodel = ViewModel.get({})
vm.parent.isStop = true;

binder.watch(viewmodel);
const f = _ => {
  viewmodel.changeContents(f);
  if (!viewmodel.isStop) requestAnimationFrame(f);
}
```

