import AlienCst from "../alien/AlienCst";
export default class MappingCst extends AlienCst {
    mappingCst?: AlienCst;
    constructor(mappingCst: AlienCst) {
        super(mappingCst);
        this.mappingCst = null;
    }
}
