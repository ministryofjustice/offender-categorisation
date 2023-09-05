import { dbKeyConvertor, FormDbJson } from './db-key-convertor'

export const dbSeeder = (formJson: FormDbJson[]) =>
  formJson.map(dbKeyConvertor).forEach(rowData => cy.task('insertFormTableDbRow', rowData))

export default dbSeeder
