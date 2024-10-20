import SubhutiCst from './SubhutiCst.ts'

export default class SubhutiLChaining<T = SubhutiCst> {
  private matchSuccess = false
  private curCst: T

  constructor(curCst?: T) {
    if (curCst) {
      this.matchSuccess = true
      this.curCst = curCst
    }
  }

  match(fun: (curCst: T) => SubhutiLChaining): SubhutiLChaining<T> {
    if (this.matchSuccess) {
      fun(this.curCst)
    }
    return this
  }

  noMatch(fun: () => void): SubhutiLChaining<T> {
    if (!this.matchSuccess) {
      fun()
    }
    return this
  }
}
