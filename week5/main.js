const type = (target, type)=>{
    if(typeof type == "string"){
        if(typeof target != type) throw `invaild type ${target} : ${type}`;
    }else if(!(target instanceof type)) throw `invaild type ${target} : ${type}`;
    return target;
};
const err =v=>{throw v;};
const ViewModelValue = class{
    subKey; cat; k; v;
    constructor(subKey, cat, k, v){
        this.subKey = subKey;
        this.cat = cat;
        this.k = k;
        this.v = v;
        Object.freeze(this);
    }
};
const ViewModelListener = class{
    viewmodelUpdated(target, updated){throw "override";}
};
const ViewModelSubject = class extends ViewModelListener{
    static #subjects = new Set;
    static #inited = false;
    static _notify(){
        const f =_=>{
            this.#subjects.forEach(vm=>{
                if(vm.#info.size){
                    vm.notify();
                    vm.clear();
                }
            });
            if(this.#inited) requestAnimationFrame(f);
        };
        requestAnimationFrame(f);
    }
    static _watch(vm, _=type(vm, ViewModelListener)){
        this.#subjects.add(vm);
        if(!this.#inited){
            this.#inited = true;
            this._notify();
        }
    }
    static _unwatch(vm, _=type(vm, ViewModelListener)){
        this.#subjects.delete(vm);
        if(!this.#subjects.size) this.#inited = false;
    }
    #info = new Set; #listeners = new Set;
    add(v, _=type(v, ViewModelValue)){this.#info.add(v);}
    clear(){this.#info.clear();}
    addListener(v, _=type(v, ViewModelListener)){
        this.#listeners.add(v);
        ViewModelSubject._watch(this);
    }
    removeListener(v, _=type(v, ViewModelListener)){
        this.#listeners.delete(v);
        if(!this.#listeners.size) ViewModelSubject._unwatch(this);
    }
    notify(){this.#listeners.forEach(v=>v.viewmodelUpdated(this._notifyTarget, this.#info));}
    get _notifyTarget(){throw "override!";}
};
const ViewModel = class extends ViewModelSubject{
    static KEY = Symbol();
    static get(data){return new ViewModel(data);}
    #subKey = ""; get subKey(){return this.#subKey;}
    #parent = null; get parent(){return this.#parent;}
    _setParent(parent, subKey){
        this.#parent = type(parent, ViewModel);
        this.#subKey = subKey;
        this.addListener(parent);
    }
    get _notifyTarget(){return this;}
    define(target, k, v){
        if(v && typeof v == "object" && !(v instanceof ViewModel)){
            if(v instanceof Array) {
                target[k] = [];
                target[k][ViewModel.KEY] = target[ViewModel.KEY] + "." + k;
                v.forEach((v, i) => this.define(target[k], i, v));
            }else{
                target[k] = {[ViewModel.KEY]:target[ViewModel.KEY] + "." + k};
                Object.entries(v).forEach(([ik, iv]) => this.define(target[k], ik, iv));
            }
            Object.defineProperty(target[k], "subKey", {
                get:_=>target.subKey
            });
        }else{
            if(v instanceof ViewModel) v._setParent(this, k);
            Object.defineProperties(target, {
                [k]:{
                    enumerable: true,
                    get: _=>v,
                    set: newV=>{
                        v = newV;
                        this.add(new ViewModelValue(target.subKey, target[ViewModel.KEY], k, v));
                    }
                }
            });
        }
    }
    constructor(data, _=type(data, "object")){
        super();
        this[ViewModel.KEY] = "root";
        this[ViewModel.VM] = this;
        Object.entries(data).forEach(([k, v])=>this.define(this, k, v));
        Object.seal(this);
    }
    viewmodelUpdated(vm, updated){updated.forEach(v=>this.add(v));}
};
const Visitor = class {
    visit(action, target, _0=type(action, "function")) {
        throw "override"
    }
};
const DomVisitor = class extends Visitor{
    visit(action, target, _0=type(action, "function"), _1=type(target, HTMLElement)) {
        const stack = [];
        let curr = target.firstElementChild;
        if(!curr) return;
        do {
            action(curr);
            if (curr.firstElementChild) stack.push(curr.firstElementChild);
            if (curr.nextElementSibling) stack.push(curr.nextElementSibling);
        } while (curr = stack.pop());
    }
};
const Scanner = class {
    #visitor;
    constructor(visitor, _ = type(visitor, Visitor)) {
        this.#visitor = visitor;
    }
    visit(f, target){
        this.#visitor.visit(f, target);
    }
    scan(target) {
        throw "override"
    }
};
const DomScanner = class extends Scanner{
    static #templates = new Map;
    static get(k){return this.#templates.get(k);}
    constructor(visitor, _=type(visitor, DomVisitor)) {
        super(visitor);
    }
    scan(target, _ = type(target, HTMLElement)){
        const binder = new Binder, f = el=>{
            const template = el.getAttribute("data-template");
            if(template){
                el.removeAttribute("data-template");
                DomScanner.#templates.set(template, el);
                el.parentElement.removeChild(el);
            }else {
                const vm = el.getAttribute("data-viewmodel");
                if (vm) {
                    el.removeAttribute("data-viewmodel");
                    binder.add(new BinderItem(el, vm));
                }
            }
        };
        f(target);
        this.visit(f, target);
        return binder;
    }
};
const Processor = class{
    cat;
    constructor(cat){
        this.cat = cat;
        Object.freeze(this);
    }
    process(vm, el, k, v, _0=type(vm, ViewModel), _1=type(el, HTMLElement), _2=type(k, "string")) {
        this._process(vm, el, k, v);
    }
    _process(vm, el, k, v){throw "override";}
};
const Binder = class extends ViewModelListener{
    #items = new Set; #processors = {};
    add(v, _ = type(v, BinderItem)){this.#items.add(v);}
    viewmodelUpdated(target, updated, _=type(target, ViewModel)){
        const items = {};
        this.#items.forEach(item=>{
            items[item.viewmodel] = [
                type(target[item.viewmodel], ViewModel),
                item.el
            ];
        });
        updated.forEach(v=>{
            if(!items[v.subKey]) return;
            const [vm, el] = items[v.subKey], processor = this.#processors[v.cat.split(".").pop()];
            if(!el || !processor) return;
            processor.process(vm, el, v.k, v.v);
        });
    }
    addProcessor(v, _0=type(v, Processor)){
        this.#processors[v.cat] = v;
    }
    watch(viewmodel, _ = type(viewmodel, ViewModel)){
        viewmodel.addListener(this);
        this.render(viewmodel);
    }
    unwatch(viewmodel, _ = type(viewmodel, ViewModel)){
        viewmodel.removeListener(this);
    }
    render(viewmodel, _ = type(viewmodel, ViewModel)){
        const processores = Object.entries(this.#processors);
        this.#items.forEach(item=>{
            const vm = type(viewmodel[item.viewmodel], ViewModel), el = item.el;
            processores.forEach(([pk, processor])=>{
                if(vm[pk]) Object.entries(vm[pk]).forEach(([k, v])=>{
                    processor.process(vm, el, k, v)
                });
            });
        });
    }
};
const BinderItem = class{
    el; viewmodel;
    constructor(el, viewmodel, _0 = type(el, HTMLElement), _1 = type(viewmodel, "string")){
        this.el = el;
        this.viewmodel = viewmodel;
        Object.freeze(this);
    }
};
const setDomProcessor = (_=>{
    const visitor = new DomVisitor;
    const scanner = new DomScanner(visitor);
    const baseProcessors = [
        new (class extends Processor{
            _process(vm, el, k, v){el.style[k] = v;}
        })("styles"),
        new (class extends Processor{
            _process(vm, el, k, v){el.setAttribute(k, v);}
        })("attributes"),
        new (class extends Processor{
            _process(vm, el, k, v){el[k] = v;}
        })("properties"),
        new (class extends Processor{
            _process(vm, el, k, v){el["on" + k] =e=>v.call(el, e, vm);}
        })("events"),
        new (class extends Processor{
            _process(vm, el, k, v){
                const {name = err("no name"), data = err("no data")} = vm.template;
                const template = DomScanner.get(name) || err("no template:" + name);
                if(!(data instanceof Array)) err("invaild data:" + data);
                Object.freeze(data);
                visitor.visit(el=>{
                    if(el.binder){
                        const [binder, vm] = el.binder;
                        binder.unwatch(vm);
                        delete el.binder;
                    }
                }, el);
                el.innerHTML = "";
                data.forEach((vm, i)=>{
                    if(!(vm instanceof ViewModel)) err(`invalid Viewmodel:${i} - ${vm}`);
                    const child = template.cloneNode(true);
                    const binder = setProcessor(scanner.scan(child));
                    el.binders = [binder, vm];
                    binder.watch(vm);
                    el.appendChild(child);
                });
            }
        })("template")
    ];
    const setProcessor = (binder, _=type(binder, Binder))=>{
        baseProcessors.forEach(v=>binder.addProcessor(v));
        return binder;
    };
    return setProcessor;
})();
const scanner = new DomScanner(new DomVisitor);
const binder = setDomProcessor(scanner.scan(document.body));
const viewmodel = ViewModel.get({
    isStop:false,
    changeContents(){
        this.wrapper.styles.background = `rgb(${parseInt(Math.random()*150) + 100},${parseInt(Math.random()*150) + 100},${parseInt(Math.random()*150) + 100})`;
        this.contents.properties.innerHTML = Math.random().toString(16).replace(".", "");
        this.list.template.data.forEach(({item:{styles, properties}})=>{
            properties.innerHTML = Math.random().toString(16).replace(".", "");
            styles.background = `rgb(${parseInt(Math.random()*150) + 100},${parseInt(Math.random()*150) + 100},${parseInt(Math.random()*150) + 100})`;
        });
    },
    wrapper:ViewModel.get({
        styles:{
            width:"50%",
            background:"#ffa",
            cursor:"pointer"
        },
        events:{
            click(e, vm){
                vm.parent.isStop = true;
            }
        }
    }),
    title:ViewModel.get({
        properties:{
            innerHTML:"Title"
        }
    }),
    contents:ViewModel.get({
        properties:{
            innerHTML:"Contents"
        }
    }),
    list:ViewModel.get({
        template:{
            name:"listItem",
            data:"1,2,3,4,5,6".split(",").map(v=>ViewModel.get({
                item:ViewModel.get({
                    styles:{background:"#fff"},
                    properties:{innerHTML:"item " + v}
                })
            }))
        }
    })
});
binder.watch(viewmodel);
const f =_=>{
    viewmodel.changeContents();
    if(!viewmodel.isStop) requestAnimationFrame(f);
};
requestAnimationFrame(f);
//viewmodel.changeContents();
