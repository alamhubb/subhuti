import SubhutiCst from './SubhutiCst.ts'

export default class SubhutiLChaining<T = SubhutiCst> {
  private matchSuccess = false
  private _curCst: T

  get curCst(): T {
    return this._curCst;
  }

  constructor(curCst?: T) {
    if (curCst) {
      this.matchSuccess = true
      this._curCst = curCst
    }
  }

  match(fun: (curCst: T) => SubhutiLChaining): SubhutiLChaining<T> {
    if (this.matchSuccess) {
      fun(this._curCst)
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
