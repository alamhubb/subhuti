function testFun(target: any) {
    return function (){
        console.log(this[target.name].prototype)
        console.log(target.prototype)
        return target()
    }
}

export default class TestA {
    @testFun
    test() {
    }
}
const t = new TestA()

t.test()
