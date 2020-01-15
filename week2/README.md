# Object Oriented Javascript

2020.1.15 week 2<br>
CodeSpitz 86<br>
MVVM 시스템 만들기

## 1.MVVM
microsoft wpf에서 기원

## 1.1 MVC
Model, View, Controller<br>
### 1.1.1 case 1
**View <- Controller -> Model**<br>
**View -> Model** <br>
모델은 비지니스 도메인, 뷰에 의해서 변경되는 건 좋지 않다.<br>
변화율이 굉장히 다른데 둘이 의존성이 있는 상태

서버에서 주로 쓰는 모델.<br>
클라이언트에선 View와 Model이 굉장히 밀접한 관계를 갖게 되어 문제가 발생함.

### 1.1.2 case 2
제왕적 컨트롤러 mvc 모델<br>
**View <-> Controller <-> Model**<br>

뷰와 모델의 변화를 컨트롤러가 모두 흡수해야하는 상황.<br>
컨트롤러 유지 보수가 굉장히 힘듬.

## 1.2 MVP
**View, getter, setter <-> Presenter <-> Model**<br>
뷰에 대한 모든 속성에 대해 getter, setter를 만들어 인터페이스 처럼 간주되게 만듬. 프레젠터가 모델을 전달할 필요 없이 구체적인 뷰에 getter, setter를 통해 컨트롤.<br>
**view는 model을 알 수 없음**
> view의 모든 기능을 getter, setter로 wrapping 해야함<br>
> 비주얼 베이직, 안드로이드 앱, mfc 등이 사용<br>
> view가 그림을 그리는 권한을 갖고 있지 않음<br>
> mvc에서 전환이 용이<br>
> 작은 규모에는 적절하지 않음

## 1.3 MVVM
**View <- Binder ->(observe) -> ViewModel <-> Model**<br>
- ViewModel - View를 대신하는 순수한 구조체
- **`Binder`** 없이는 MVVM이 성립할 수 없음
- ViewModel의 변화, 혹은 View의 변화에 자동으로 반응하기 위해선 Binder가 필수
- Binder는 View와 ViewModel의 의존성을 제거함
- <u>**`ViewModel`은 `View`를 모름**</u>
- 양방향, 단방향, observe를 어느쪽으로 거는지
  - ex) amber, angular 양방향, android 택일
#### MVVM의 목적은 ViewModel이 View를 모르게 하는데 있다.
금일 강의에선 observe 대신 ViewModel이 binder call 사용

## 2. TypeCheck
```js
const type = (target, type) => {
  if (typeof type == 'string') {
    if (typeof target != type) throw `invalid type ${target} : ${type}`;
  } else if (!(target instanceof type)) throw `invalid type ${target} : ${type}`;
  return target;
}
// 제일 좋은 방법은 throw를 던지는 것.
// 추후에 실제 prod 시에 부드럽게 변경

type(12, 'number');
type('abc', 'string');
type([1,2,3], Array);
type(new Set, Set);
type(document.body, HTMLElement);
```
> `===` 보다 `==`이 더 빠르다.<br>
> 언어를 잘 모르니 lint에 맞춰서 그냥 써

```js
const test = (arr, _ = type(arr, Array)) => {
  console.log(arr);
};

test([1,2,3]); // [1,2,3]
test(123); // Uncaught invalid type 123 : function Array() { [native code] }
```
> js의 함수 처리 방식은 뒤의 인자가 앞의 인자를 알고 있음

```js
const test2 = (a, b, c, _0 = type(a, 'string'), _1 = type(b, 'number'), _2 = type(c, 'boolean')) => {
  console.log(a, b, c);
}

test2('abc', 123, true);
```

위와 같은 방식으로 강타입 언어처럼 함수를 콜하는 순간 kill 할 수 있음.

## 3. View hook & bind
```html
<section id="target" data-viewmodel="wrapper">
  <h2 data-viewmodel="title"></h2>
  <section data-viewmodel="contents"></section>
</section>
```
w3c 스펙에 따라 data- 속성이 붙은 경우 validatior를 다 통과 하게 되어있음
- 해당 코드에 data-viewmodel이 view의 hook임.
- binder가 ViewModel을 bind
- ViewModel에 hook과 매칭되는 속성이 있음

### 3.1 Role Design
```
[ViewModel] <- [ Binder ]  <-  [ Scanner ] -> [ HTMLElement ] 
              [ BinderItem ]        |
                        <-----------⌋       
```
1) Vue에서 Template을 스캔하는 방식 (Template 방식)
2) React에서 자기 View를 만들어내버리는 방식 (Component 방식)

뷰모델을 통해 뷰를 그려주는 역할<br>
바인더에 하드코딩을 하게 되면 곤란함<br>
뷰를 스캔하는 여파가 바인더에 영향을 끼치기 때문에<br>
HTMLElement를 변화하기 어려워짐<br>
그래서 Scanner를 중간에 사용함 (변화율 컨트롤)<br>
변화율이 높은 것과 변화율이 낮은 부분과 직접 연결되어있는 경우, 낮은 쪽의 안정성이 떨어짐.<br><br>
**KEYWORD - 원인에 따른 `변화율`**<br>
`변화율을 흡수하다` 라는 표현을 사용

### 3.2 ViewModel
```js
const ViewModel = class {
  static #private = Symbol();
  static get(data) {
    return new ViewModel(this.#private, data);
  }
  styles = {}; attributes = {}; properties = {}; events = {};
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
> attributes, properties의 구분은 dom에서 매우 중요함<br>
> 추후 조사해서 기입해넣을 것
> MVVM은 뷰를 그리는 부분이 binder에 집중되어있기 때문에 제어역전을 쉽게 이룰 수 있음.

### 3.3 Binder
```js
const BinderItem = class {
  el; viewModel;
  constructor(el, viewModel, _0 = type(el, HTMLElement), _1 = type(viewmodel, 'string')) {
    this.el = el;
    this.viewmodel = viewmodel;
    Object.freeze(this);
  }
}
// js로도 충분히 코드의 의도를 표현할 수 있다.
// 최대한 많이 표현하라.
```

> js 겁나 어려움. 매년 스펙이 바뀜.. <br>
> hot한 언어의 가장 난해한(좋아보이는) 부분들만 가져옴<br>
> 더 이상 최신 스펙의 자바스크립트 책이 안나오고 있음.

Element는 확정이지만 key는 확정이 아님.

```html
<section id="target" data-viewmodel="wrapper">
  <h2 data-viewmodel="title"></h2>
  <section data-viewmodel="contents"></section>
</section>
```

```js
new BinderItem(section, 'wrapper');
new BinderItem(h2, 'title');
new BinderItem(section2, 'contents2');
```

```js
const Binder = class {
  #items = new Set;
  add(v, _ = type(v, BinderItem)){ this.#items.add(v); }
  render(viewmodel, _ = type(viewmodel, ViewModel)) {
    this.#items.forEach(item => {
      const vm = type(viewmodel[item.viewmodel], ViewModel), el = item.el;
      Object.entries(vm.styles).forEach(([k, v]) => el.styles[k] = v);
      Object.entries(vm.attributes).forEach(([k, v]) => el.setAttribute(k, v));
      Object.entries(vm.properties).forEach(([k, v]) => el[k] = v);
      Object.entries(vm.events).forEach(([k, v]) => el['on' + k] => v.call(el, e, viewmodel));
    })
  }
}
// 동적언어의 스킬을 적극적으로 활용하자.
// 타입 검사를 확실히 하면, 뒤에서도 완전무결함을 유지할 수 있음
// 프로그래밍의 어려운 점은 구멍이 하나만 있어도 뚫릴 수 있음
```

> 객체의 컨테이너 Set을 사용하자. <br>
> Identifier Context -> Set / Value Context -> Array<br>
> 중복 객체가 들어가는 것은 문제가 있음<br>
> [3,3,3]은 의미가 있지만 [a,a,a]는 의미가 없다.

### 3.4 Scanner
```js
const Scanner = class {
  scan(el, _ = type(el, HTMLElement)) {
    const binder = new Binder;
    this.checkItem(binder, el); 
    const stack = [el.firstElementChild];
    let target;
    // 동적 계획법 - stack machine / red, black 균형 트리 루트와 유사
    while(target = stack.pop()) {
      this.checkItem(binder, target);
      if(target.firstElementChild) stack.push(target.firstElementChild);
      if(target.nextElementSibling) stack.push(target.nextElementSibling);
    }
    return binder;
  }

  checkItem(binder, el) {
    const vm = el.getAttribute('data-viewmodel');
    if (vm) binder.add(new BinderItem(el, vm));
  }
}
```

### 3.5 Client
```html
<section id="target" data-viewmodel="wrapper">
  <h2 data-viewmodel="title"></h2>
  <section data-viewmodel="contents"></section>
</section>
```

```js
const viewmodel = ViewModel.get({
  wrapper: ViewModel.get({
    styles: {
      width: 50%,
      background: '#ffa',
      cursor: 'pointer'
    }
  }),
  title: ViewModel.get({
    properties: {
      innerHTML: 'Title'
    }
  }),
  contents: ViewModel.get({
    properties: {
      innerHTML: 'Contents'
    }
  })
});

const scanner = new Scanner;
const binder = scanner.scan(document.querySelector('#target'));
binder.render(viewmodel);
```

VM은 View를 모른다.<br>
순수하게 In-Memory 객체다.<br>
ex) React-native

View를 그리는 모든 로직에 대해 Binder의 render 함수가 제어역전을 이뤄냄.

### 3.5.1 Extends Client
```js
// Model Render라고 부름
const viewmodel = ViewModel.get({
  isStop: false,
  changeContents() {
    this.wrapper.styles.background = 'rgb(122,222,222)';
    this.contents.properties.innerHTML = Math.random();
    // binder.render(viewmodel); // 변화가 한번만 일어남
  },
  wrapper: ViewModel.get({
    styles: {
      width: '50%'
    },
    events: {
      click(e, vm) {
        vm.isStop = true;
      }
    }
  })
})

const f = _ => {
  viewmodel.changeContents();
  binder.render(viewmodel);
  if(!viewmodel.isStop) requestAnimationFrame(f);
};

requestAnimationFrame(f);
// 부하가 많이 걸릴거 같지만 브라우져는 이미 97%의 메모리를 render하는데 사용하고 있다.
```

View를 조작하는 코드를 전부 제거했기 때문에, View를 조작하는 코드에 에러가 없어진다.<br>
-> Binder의 Render가 점점 강해짐.<br>
-> Binder가 안정화됨<br>

의존성 생명주기, 변화주기, 변화원인, 변화율
