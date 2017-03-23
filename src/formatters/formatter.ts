import { IRuleFailureJson } from '../rule'


export type formatter = (failures: IRuleFailureJson[]) => string