# Object Oriented Javascript

2020.1.29 week 4<br>
CodeSpitz 86<br>
추상 레이어, 권한 분리, Visitor 패턴

oop는 덩어리를 깎아나가는 과정에 가깝다.<br>
덩어리져 있는 코드를 클래스로 깎아낸다.<br>
그 기준을 `역할`로 둔다.

> 역할 = 책임 + 권한 

## 1. ISP (인터페이스 분리 원칙)
인터페이스는 역할을 의미함.<br>
역할 별로 코드를 분리함.<br>

지난 주 작성한 ViewModel 파일을 살펴보자.
```js
const ViewModel = class extends ViewModelListener{
  // code....
  // ViewModel이 해당 메서드를 가지고 있는게 맞을까? 
  addListener(v, _=type(v, ViewModelListener)){
      this.#listeners.add(v);
  }
  removeListener(v, _=type(v, ViewModelListener)){
      this.#listeners.delete(v);
  }
  notify(){
      this.#listeners.forEach(v=>v.viewmodelUpdated(this.#isUpdated));
  }
};
```
해당 코드는 Observer의 Subject 역할이다.<br>
*메서드를 분리하기 위해선 해당 메서드에 의존적인 상태도 같이 분리해야한다.*<br>
*즉, 역할 별로 필드를 섞어 쓰지 않도록 잘 설계해야한다.*


```js
// 해당 코드도 viewModel의 목적과는 어울리지 않음
static #subjects = new Set;
  static #inited = false;
  static notify(vm){
      this.#subjects.add(vm);
      if(this.#inited) return;
      this.#inited = true;
      const f =_=>{
          this.#subjects.forEach(vm=>{
             if(vm.#isUpdated.size){
                 vm.notify();
                 vm.#isUpdated.clear();
             }
          });
          requestAnimationFrame(f);
      };
      requestAnimationFrame(f);
  }
```

> ### Soild 원칙
> 1. SRP
> 2. OCP
> 3. LSP
> 4. ISP

```js
// js는 다중 상속이 불가능하다. 다중 상속을 구현하기 위해 중첩으로 처리힌다.
const ViewModelSubject = class extends ViewModelListener {
    #info = new Set; #listeners = new Set;
    // 부모에게 위임
    add(v, _=type(v, ViewModelValue)){ this.#info.add(v);}
    claer(){this.#info.clear();}
    addListener(v, _=type(v, ViewModelListener)){
        this.#listeners.add(v);
        ViewModelSubject.watch(this);
    }
    removeListener(v, _=type(v, ViewModelListener)){
        this.#listeners.delete(v);
        if(!this.#listeners.size) ViewModelSubject.unwatch(this);
    }
    notify(){
        this.#listeners.forEach(v=>v.viewmodelUpdated(this.#isUpdated));
    }

    static #subjects = new Set;
    static #inited = false;
    static notify(vm){..}
    static watch(vm, _=type(vm, ViewModelListener)) {
        this.#subjects.add(vm);
        if(!this.#inited) {
            this.#inited = true;
            this.notify();
        }
    }
    static unwatch(vm,  _=type(vm, ViewModelListener)) {
        this.#subjects.delete(vm);
        if(!this.#subjects.size) this.#inited = false;
    }
}
```
역할과 작명이 맞는게 가장 중요하다.

## 2. 섬세한 권한 조정
js는 기본적으로 다 public이기 때문에, 권한 제한을 거는 것이 중요하다.<br>
java는 internal이 기본.

```js
const ViewModel = class extends ViewModelListener {
    static get(data) { return new ViewModel(data)};
    styles = {}; attributes = {}; properties = {}; events = {};
    subKey = ""; parent = null;
    
    // readonly 속성 구현
    get subkey(){return this.#subkey;}

    // parent 읽기 private
    get parent(){return this.#parent;}
    
    // 인자를 두개 줘야하기 때문에 setter를 사용하지 않음.
    setParent(parent, subKey) {
        this.#parent = type(parent, ViewModel);
        this.#subKey = subKey;
        this.addListener(paernt);
    }
}
```
> 코드에서 꼭 표현해줘야할 부분이 `transaction`임.<br>
`transaction`을 함수로 표현함<br>
위의 `setParent` 함수가 그와 같은 역할을 함<br>

```js
// notify 하거나 isUpdated set을 직접 사용할 필요가 없어짐
constructor(data, _=type(data, "object")){
    super();
    Object.entries(data).forEach(([k, v])=>{
        if("styles,attributes,properties".includes(k)) {
            if (!v || typeof v != "object") throw `invalid object k:${k}, v:${v}`;
            this[k] = ViewModel.define(this, k, v);
        }else{
            Object.defineProperty(this, k, {
                enumerable:true,
                get:_=>v,
                set:newV=>{
                    v = newV;
                    this.add(new ViewModelValue(this.subKey, "", k, v));
                }
            });
            if(v instanceof ViewModel) obj.setParent(this, cat)
        }
    });
    Object.seal(this);
}
viewmodelUpdated(updated){
    updated.forEach(v=>this.add(v));
}
```
`transaction`을 분리하고, 해당 `transaction`만을 사용해서 구현하는 것이 중요.

## 3. Visitor
```js
const Scanner = class{
    scan(el, _ = type(el, HTMLElement)){
        const binder = new Binder;
        this.checkItem(binder, el);
        const stack = [el.firstElementChild];
        let target;
        while(target = stack.pop()){
            this.checkItem(binder, target);
            if(target.firstElementChild) stack.push(target.firstElementChild);
            if(target.nextElementSibling) stack.push(target.nextElementSibling);
        }
        return binder;
    }
    checkItem(binder, el){
        // 변화율이 높은 부분
        const vm = el.getAttribute("data-viewmodel");
        if(vm) binder.add(new BinderItem(el, vm));
    }
};
```
Binder에 scan을 만들지 않는 이유는 html과 바인딩하는 값 즉, data-viewmodel 값의 변화율이 높기 때문에 분리함. *스캐너가 존재하는 이유*<br>

### 그렇다면 dom loop는 누구의 identity인가?
Binder? Scanner?<br>
Binder - ViewModel을 받아서 그림을 그리는 객체<br>
그러나 dom loop와 checkItem은 불가분의 관계.<br>
=> 결론 - dom loop를 위임한다.

```js
// care taker - visitor
// abstract visitor pattern
const Visitor = class {
    visit(action, target, _0=type(action, 'function')) {
        throw 'override'
    }
}

// concrete visitor pattern
const DomVisitor = class extends Visitor {
    // 다른 언어에선 T, 제네릭으로 표현됨
    visit(action, target, _0=type(action, 'function'), _1=type(target, HTMLElement)) {
        const stack = [];
        let curr = el.firstElementChild;
        do {
            action(curr);
            if(curr.firstElementChild) stack.push(curr.firstElementChild);
            if(curr.nextElementSibling) stack.push(curr.nextElementSibling);
        } while (curr = stack.pop());
    }
}
```
제어를 외부에 위임함. 상호작용이 일어남. 템플릿 메서드의 훅과 같은 역할을 수행함.<br>
care taker와 visitor는 밀접한 연관이 있게 됨.

```js
const Scanner = class {
    #visitor;
    constructor(visitor, _=type(visitor, DomVisitor)) {
        this.#visitor = visitor;
    }
    scan(target, _ = type(target, HTMLElement)) {
        const binder = new Binder, f = el => {
            const vm = el.getAttribute('data-viewmodel');
            if(vm) binder.add(new BinderItem(el, vm));
        };
        f(target);
        this.#visitor.visit(f, target);
        return binder;
    }
}
```
설계를 보는 눈을 키우는게 어려운 일임.<br>
소프트웨어에서의 설계는 `코드의 재배치`다. `객체를 재배치`하는 것이 아님.<br>
코드를 느낄 수 있어야한다.<br>
*변화율이 일치되는 코드를 같은 레벨에 배치하는 것이 중요.*

## 4. 추상계층 불일치
*계약 - 의존성*
객체 간 의존성 설정은 계층관계를 보고 설정해야한다.<br>
기준 `추상계층`. 이 클래스의 추상 클래스를 왜 만들었는지를 이해하는 것이 중요.<br>

### DomVisitor를 만들기 전에 왜 Visitor를 먼저 만들었을까?
*추상 클래스는 의존성이 없다.*<br>
순수한 메모리 객체냐 의존성 있는 메모리 객체냐?<br>

> 추상계층 불일치의 예
> ex) 자식 클래스를 받아놓고 사용할 때는 부모 클래스의 메서드를 활용함. override 때문에 발생.
> dom 전용인 scanner를 두개의 계층으로 나뉘어진 visitor를 사용하려고 하니 추상 계층 불일치가 발생한 것.
> 계층 개수를 맞춰야함 - 1개의 층으로 만들던가, 2개의 층으로 나누던가.

```js
// 추상화. native 지식 제거
const Scanner = class {
    #visitor;
    constructor(visitor, _ = type(visitor, Visitor)) {
        this.#visitor = visitor;
    }
    
    // 부모에서 위임
    visit(f, target) {this.#visitor.visit(f, target);}
    scan(target){throw 'override'}
}

// 구상화
const DomScanner = class extends Scanner {
    constructor(visitor, _=type(visitor, DomVisitor)) {
        // 리스코프 치환
        super(visitor);
    }

    scan(target, _ = type(target, HTMLElement)) {
        const binder = new Binder, f = el => {
            const vm = el.getAttribute('data-viewmodel');
            if(vm) binder.add(new BinderItem(el, vm));
        };
        f(target);
        this.visit(f, target);
        return binder;
    }
}
```
연역 --(추상)-> 귀납 --(구상)-> 연역

> 마틴 파울러 - 엔터프라이즈 패턴
> *도메인 패턴* - 기능적인 부분과 도메인적인 부분을 나눠서 서로 협력하게 만들어야, 도메인적인 부분만 교체 가능하다.

위의 코드에서 dom이 `domain`이다.<br>
추상화를 통해서 domain과 기능을 분리한다.

#### 얻어낸 것 - 코드를 고치지 않고, 코드를 추가하면 기능을 만들 수 있도록 만들어냄. 기존 코드의 회귀 테스트가 필요 없어짐.
이것이 객체지향을 사용하는 이유다!
OCP - 수정하지 않고 확장한다.

solid 원칙을 잘지켜서 좋은 설계를 얻는게 아니라, 좋은 설계를 하면 부수적으로 solid 원칙이 달성된다.

늦은 초기화나 동적으로 사용할 수 있게 된다. (DIP)


```js
// const scanner = new Scanner;
const scanner = new DomScanner(new DomVisitor);
```

## 5. 설계 종합
```
좋은 코드의 단위는 인간의 사고 범위로 코드를 쪼개놓은 것.
항상 이벤트 객체가 가장 무겁다.
(ViewModelValue - 의존성이 크기 때문에 수정하기 어려움)
그러나 단방향 의존성만 있기 때문에 잘된 설계다.

ViewModelListener      →                 ← 
↑
ViewModelSubject  →     ViewModelValue   ←    Binder
↑
ViewModel   →                            ← 
```
의존성은 필연적으로 발생할 수 밖에 없음.<br>
그것을 단방향으로 만드는 것이 목표.

```
BinderItem
↑
Binder     ←      Scanner     →    Visitor
↓                    ↑                ↑
Processor      [DomScanner]  --- [DomVisitor]
↑                   
[ConcreteProcessor]

--- (숨겨진 의존성)
[] (client에서 작성하게 될 코드)
```
Simplex, Multiplex<br>
선이 많이 모일 수록 의존성이 크다.<br>

결과적으로 MVVM은 ViewModel, ConcreteProcessor, DomScanner, DomVisitor만 구현하면 어느 플랫폼에서든 사용할 수 있는 패턴이다. (가상화된 렌더링 시스템)<br>

*Observer 패턴의 비용은 결코 싸지 않다.*
특수한 패턴을 분리하기 위해서 Visitor 패턴을 사용한다.
> 특정한 도메인 지식이 필요한 경우, 분리한다.<br>
그러면 어떤 시스템이 와도 재사용 가능한 코드가 된다.


JSON renderer를 만들어보자.
찾아볼 키워드 - 꼬리물기 최적화
---

### To be continued.. 추상팩토리 패턴과 커맨드 패턴
