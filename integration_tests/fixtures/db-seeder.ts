import { dbKeyConvertor, FormDbJson } from './db-key-convertor'
import { LiteCategoryDbRow } from '../db/queries'

export const dbSeeder = (formJson: FormDbJson[]) =>
  formJson.map(dbKeyConvertor).forEach(rowData => cy.task('insertFormTableDbRow', rowData))

export const dbSeederLiteCategory = (liteCategoryJson: LiteCategoryDbRow[]) =>
  liteCategoryJson.forEach(rowData => cy.task('insertLiteCategoryTableDbRow', rowData))

export default dbSeeder
